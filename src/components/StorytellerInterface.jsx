import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, Globe, ArrowLeft, Loader, Settings, Sparkles } from 'lucide-react';
import SettingsModal from './SettingsModal';
import { streamAudio, ELEVENLABS_VOICES } from '../utils/elevenLabsService';
import { analyzeTextForCharacters } from '../utils/llmService';
import { getVoiceIdForSpeaker } from '../utils/voiceManager';

const StorytellerInterface = ({ text, onBack, speech }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [language, setLanguage] = useState('en');
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

    // Data Structure: [{ text: "...", speaker: "narrator" }, ...]
    const [segments, setSegments] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLoadingVoices, setIsLoadingVoices] = useState(true);

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('elevenlabs_api_key') || '');
    const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [useElevenLabs, setUseElevenLabs] = useState(JSON.parse(localStorage.getItem('use_elevenlabs') || 'false'));
    const [useSmartVoices, setUseSmartVoices] = useState(JSON.parse(localStorage.getItem('use_smart_voices') || 'false'));

    // Audio Ref
    const audioRef = useRef(new Audio());
    const currentUtteranceRef = useRef(null);
    const isPlayingRef = useRef(false);

    // Persist Settings
    useEffect(() => {
        localStorage.setItem('elevenlabs_api_key', apiKey);
        localStorage.setItem('gemini_api_key', geminiKey);
        localStorage.setItem('use_elevenlabs', JSON.stringify(useElevenLabs));
        localStorage.setItem('use_smart_voices', JSON.stringify(useSmartVoices));
    }, [apiKey, geminiKey, useElevenLabs, useSmartVoices]);

    // Initial Text Processing
    useEffect(() => {
        if (text) {
            if (useSmartVoices && geminiKey) {
                // Smart Mode: Analyze text
                performSmartAnalysis(text);
            } else {
                // Standard Mode: Simple split
                const splitText = text.replace(/([.!?])\s+(?=[A-Z])/g, "$1|").split("|");
                const simpleSegments = splitText.map(t => ({ text: t, speaker: 'narrator' }));
                setSegments(simpleSegments);
            }
        }
    }, [text, useSmartVoices, geminiKey]);

    const performSmartAnalysis = async (inputText) => {
        setIsAnalyzing(true);
        // For prototype, we analyze the first chunk (e.g., 5000 chars) to avoid timeouts
        // In production, this would be streaming or chunked
        const chunk = inputText.slice(0, 5000);
        try {
            const analyzedSegments = await analyzeTextForCharacters(chunk, geminiKey);
            setSegments(analyzedSegments);
        } catch (err) {
            console.error("Analysis Failed", err);
            // Fallback
            const splitText = inputText.replace(/([.!?])\s+(?=[A-Z])/g, "$1|").split("|");
            setSegments(splitText.map(t => ({ text: t, speaker: 'narrator' })));
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Check Web Voices
    useEffect(() => {
        const checkVoices = () => {
            if (speech.voices.length > 0) setIsLoadingVoices(false);
            else setTimeout(checkVoices, 500);
        };
        checkVoices();
    }, [speech]);

    // Audio End Handler
    useEffect(() => {
        const handleAudioEnd = () => {
            if (isPlayingRef.current) handleNextSegment();
        };
        audioRef.current.addEventListener('ended', handleAudioEnd);
        return () => audioRef.current.removeEventListener('ended', handleAudioEnd);
    }, []);

    const handleNextSegment = () => {
        setCurrentSentenceIndex(prev => {
            const next = prev + 1;
            if (next >= segments.length) {
                setIsPlaying(false);
                isPlayingRef.current = false;
            }
            return next;
        });
    };

    const speakCurrentSegment = async () => {
        if (currentSentenceIndex >= segments.length) {
            setIsPlaying(false);
            isPlayingRef.current = false;
            return;
        }

        const segment = segments[currentSentenceIndex];
        if (!segment || !segment.text || !segment.text.trim()) {
            handleNextSegment();
            return;
        }

        if (useElevenLabs && apiKey) {
            try {
                // Determine Voice ID
                let voiceId;
                if (useSmartVoices) {
                    voiceId = getVoiceIdForSpeaker(segment.speaker);
                } else {
                    voiceId = ELEVENLABS_VOICES[language];
                }

                const audioSrc = await streamAudio(segment.text, apiKey, voiceId);
                audioRef.current.src = audioSrc;
                audioRef.current.play();
            } catch (err) {
                console.error("ElevenLabs Error:", err);
                // Fallback to local
                speakLocal(segment.text);
            }
        } else {
            speakLocal(segment.text);
        }
    };

    const speakLocal = (textToSpeak) => {
        speech.cancel();
        const utterance = speech.speak(textToSpeak, language);
        currentUtteranceRef.current = utterance;
        utterance.onend = () => {
            if (isPlayingRef.current) handleNextSegment();
        };
        speech.resume();
    };

    // Playback Effect
    useEffect(() => {
        if (isPlaying) {
            isPlayingRef.current = true;
            const segment = segments[currentSentenceIndex];

            if (useElevenLabs) {
                if (audioRef.current.paused) speakCurrentSegment();
            } else {
                if (!speech.isSpeaking() || currentUtteranceRef.current?.text !== segment?.text) {
                    speakCurrentSegment();
                }
            }
        } else {
            isPlayingRef.current = false;
            speech.pause();
            audioRef.current.pause();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, currentSentenceIndex, useElevenLabs, segments]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'hi' : 'en');
        // Logic to restart current segment with new lang if playing...
    };

    const reset = () => {
        speech.cancel();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentSentenceIndex(0);
        setIsPlaying(false);
    };

    const handleBack = () => {
        speech.cancel();
        audioRef.current.pause();
        onBack();
    };

    return (
        <div className="interface-container">
            <div className="top-bar glass-panel">
                <button className="icon-btn" onClick={handleBack} title="Upload new file">
                    <ArrowLeft size={24} />
                </button>
                <h3 className="title">Storyteller Bot {useSmartVoices && <span className="beta-tag">AI BETA</span>}</h3>
                <div className="status-indicator">
                    <button className="icon-btn" onClick={() => setIsSettingsOpen(true)} title="Settings">
                        <Settings size={22} className={isLoadingVoices ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="content-area glass-panel">
                {isAnalyzing ? (
                    <div className="loading-state">
                        <Sparkles size={48} className="animate-pulse" color="#c084fc" />
                        <p>Analyze characters in your story...</p>
                    </div>
                ) : (
                    <div className="text-display">
                        {segments.map((seg, idx) => (
                            <span
                                key={idx}
                                className={`
                            ${idx === currentSentenceIndex ? 'active-sentence' : 'inactive-sentence'}
                            ${useSmartVoices ? 'speaker-' + seg.speaker : ''}
                        `}
                                title={useSmartVoices ? `Speaker: ${seg.speaker}` : ''}
                            >
                                {seg.text + " "}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="controls-bar glass-panel">
                <button className="control-btn" onClick={toggleLanguage} title="Switch Language">
                    <Globe size={20} />
                    <span>{language.toUpperCase()}</span>
                </button>

                <button className="control-btn big-play" onClick={togglePlay} disabled={isAnalyzing}>
                    {isPlaying ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
                </button>

                <button className="control-btn" onClick={reset} title="Restart">
                    <RotateCcw size={20} />
                </button>
            </div>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                apiKey={apiKey}
                setApiKey={setApiKey}
                geminiKey={geminiKey}
                setGeminiKey={setGeminiKey}
                useElevenLabs={useElevenLabs}
                setUseElevenLabs={setUseElevenLabs}
                useSmartVoices={useSmartVoices}
                setUseSmartVoices={setUseSmartVoices}
            />

            <style>{`
        .interface-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 2rem;
            gap: 1.5rem;
            max-width: 800px;
            width: 100%;
            margin: 0 auto;
            height: 100vh;
        }

        .top-bar {
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .content-area {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
            font-size: 1.1rem;
            line-height: 1.8;
            color: var(--text-secondary);
            position: relative;
        }
        
        .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 1rem;
            color: #c084fc;
        }

        .active-sentence {
            color: var(--text-primary);
            background: rgba(88, 166, 255, 0.1);
            box-shadow: 0 0 10px rgba(88, 166, 255, 0.1);
            border-radius: 4px;
            padding: 2px 4px;
            transition: all 0.3s ease;
        }
        
        /* Speaker Highlights (Subtle hints) */
        .speaker-man { border-bottom: 2px solid rgba(56, 189, 248, 0.3); }
        .speaker-woman { border-bottom: 2px solid rgba(244, 114, 182, 0.3); }
        .speaker-child { border-bottom: 2px solid rgba(250, 204, 21, 0.3); }
        .speaker-old_man { border-bottom: 2px dashed rgba(148, 163, 184, 0.5); }

        .controls-bar {
            padding: 1.5rem;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2rem;
        }

        .control-btn {
            color: var(--text-primary);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            transition: transform 0.2s, color 0.2s;
        }
        
        .control-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .control-btn:hover:not(:disabled) {
            color: var(--accent-primary);
            transform: scale(1.1);
        }

        .big-play {
             background: var(--accent-primary);
             color: white !important;
             width: 64px;
             height: 64px;
             border-radius: 50%;
             justify-content: center;
             box-shadow: 0 0 20px var(--accent-glow);
        }
        
        .big-play:hover:not(:disabled) {
            transform: scale(1.05) translateY(-2px);
            box-shadow: 0 0 30px var(--accent-glow);
        }

        .title {
            font-weight: 600;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .beta-tag {
            font-size: 0.7rem;
            background: #c084fc;
            color: #fff;
            padding: 2px 6px;
            border-radius: 4px;
        }
      `}</style>
        </div>
    );
};

export default StorytellerInterface;
