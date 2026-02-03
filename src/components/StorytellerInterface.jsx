import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, RotateCcw, Globe, ArrowLeft, Settings, Sparkles, Music, ImageIcon, Download, Share2 } from 'lucide-react';
import SettingsModal from './SettingsModal';
import { streamAudio, ELEVENLABS_VOICES } from '../utils/elevenLabsService';
import { analyzeTextForCharacters } from '../utils/llmService';
import { getVoiceIdForSpeaker } from '../utils/voiceManager';
import { soundManager } from '../utils/soundManager';
import { generateImage } from '../utils/imageService';
import { audioExporter } from '../utils/audioExportService';

const StorytellerInterface = ({ text, onBack, speech }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [language, setLanguage] = useState('en');
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

    // Data Structure: [{ text: "...", speaker: "narrator", mood: "neutral", visual_summary: "..." }, ...]
    const [segments, setSegments] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLoadingVoices, setIsLoadingVoices] = useState(true);

    // Feature State
    const [currentImageUrl, setCurrentImageUrl] = useState(null);
    const lastImagePrompt = useRef('');
    const [hasExportableAudio, setHasExportableAudio] = useState(false);

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

    // Scroll Ref
    const activeSentenceRef = useRef(null);
    const textContainerRef = useRef(null);

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
                performSmartAnalysis(text);
            } else {
                const splitText = text.replace(/([.!?])\s+(?=[A-Z])/g, "$1|").split("|");
                const simpleSegments = splitText.map(t => ({ text: t, speaker: 'narrator', mood: 'neutral' }));
                setSegments(simpleSegments);
            }
        }

        // Reset services on unmount or new text
        return () => {
            soundManager.stop();
            audioExporter.reset();
        };
    }, [text, useSmartVoices, geminiKey]);

    const performSmartAnalysis = async (inputText) => {
        setIsAnalyzing(true);
        const chunk = inputText.slice(0, 5000);
        try {
            const analyzedSegments = await analyzeTextForCharacters(chunk, geminiKey);
            setSegments(analyzedSegments);
        } catch (err) {
            console.error("Analysis Failed", err);
            const splitText = inputText.replace(/([.!?])\s+(?=[A-Z])/g, "$1|").split("|");
            setSegments(splitText.map(t => ({ text: t, speaker: 'narrator' })));
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Scroll to active sentence
    useEffect(() => {
        if (activeSentenceRef.current && textContainerRef.current) {
            activeSentenceRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [currentSentenceIndex]);

    // Check Web Voices & Preload Images
    useEffect(() => {
        const checkVoices = () => {
            if (speech.voices.length > 0) setIsLoadingVoices(false);
            else setTimeout(checkVoices, 500);
        };
        checkVoices();
    }, [speech]);

    // Feature Orchestrator (Sound & Image)
    useEffect(() => {
        const segment = segments[currentSentenceIndex];
        if (!segment) return;

        // 1. Soundscapes
        if (useSmartVoices && segment.mood) {
            soundManager.playMood(segment.mood);
        } else if (!useSmartVoices) {
            soundManager.stop();
        }

        // 2. Illustrations (Debounced)
        if (useSmartVoices && segment.visual_summary && segment.visual_summary !== lastImagePrompt.current) {
            lastImagePrompt.current = segment.visual_summary;
            generateImage(segment.visual_summary).then(url => {
                if (url) setCurrentImageUrl(url);
            });
        }
    }, [currentSentenceIndex, segments, useSmartVoices]);

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
                soundManager.stop();
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
                let voiceId;
                if (useSmartVoices) {
                    voiceId = getVoiceIdForSpeaker(segment.speaker);
                } else {
                    voiceId = ELEVENLABS_VOICES[language];
                }

                const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': apiKey
                    },
                    body: JSON.stringify({
                        text: segment.text,
                        model_id: language === 'hi' ? 'eleven_multilingual_v2' : 'eleven_monolingual_v1',
                        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
                    })
                });

                if (!response.ok) throw new Error("API call failed");

                const blob = await response.blob();

                audioExporter.addChunk(blob);
                setHasExportableAudio(true);

                const audioSrc = URL.createObjectURL(blob);
                audioRef.current.src = audioSrc;
                audioRef.current.play();

            } catch (err) {
                console.error("ElevenLabs Error:", err);
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
            if (currentSentenceIndex >= segments.length || currentSentenceIndex === 0) {
                soundManager.stop();
            }
        }
    }, [isPlaying, currentSentenceIndex, useElevenLabs, segments]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'hi' : 'en');
    };

    const handleDownload = () => {
        audioExporter.exportFile('my_story.mp3');
    };

    const reset = () => {
        speech.cancel();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentSentenceIndex(0);
        setIsPlaying(false);
        soundManager.stop();
        audioExporter.reset();
        setHasExportableAudio(false);
    };

    const handleBack = () => {
        speech.cancel();
        audioRef.current.pause();
        soundManager.stop();
        onBack();
    };

    return (
        <div className="interface-container animate-fade-in">
            {/* Header */}
            <header className="top-bar">
                <button className="icon-btn glass-hover" onClick={handleBack} title="Back">
                    <ArrowLeft size={20} />
                </button>

                <div className="center-info">
                    <h1 className="title text-gradient">Storyteller</h1>
                    {useSmartVoices && <span className="beta-badge">AI ENHANCED</span>}
                </div>

                <div className="actions">
                    {segments[currentSentenceIndex]?.mood && useSmartVoices && (
                        <div className="mood-pill animate-fade-in" key={segments[currentSentenceIndex].mood}>
                            <Music size={12} />
                            <span>{segments[currentSentenceIndex].mood.toUpperCase()}</span>
                        </div>
                    )}
                    <button className="icon-btn glass-hover" onClick={() => setIsSettingsOpen(true)}>
                        <Settings size={20} className={isLoadingVoices ? "animate-spin" : ""} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-layout">
                {/* Illustration Area */}
                <div className={`illustration-panel glass-panel ${currentImageUrl ? 'active' : ''}`}>
                    {currentImageUrl && useSmartVoices && !isAnalyzing ? (
                        <>
                            <img src={currentImageUrl} alt="Scene" className="scene-image" />
                            <div className="image-overlay">
                                <ImageIcon size={14} />
                                <span>Generated Scene</span>
                            </div>
                        </>
                    ) : (
                        <div className="placeholder-art">
                            {isAnalyzing ? (
                                <div className="analyzing-pulse">
                                    <Sparkles size={40} className="text-gradient" />
                                    <p>Dreaming up the story world...</p>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <ImageIcon size={40} style={{ opacity: 0.3 }} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Text Area */}
                <div className="text-container glass-panel" ref={textContainerRef}>
                    {isAnalyzing ? (
                        <div className="loading-state">
                            <Loader size={32} className="animate-spin" />
                            <p>Analyzing text...</p>
                        </div>
                    ) : (
                        <div className="story-text">
                            {segments.map((seg, idx) => (
                                <span
                                    key={idx}
                                    ref={idx === currentSentenceIndex ? activeSentenceRef : null}
                                    className={`
                                sentence-span
                                ${idx === currentSentenceIndex ? 'active' : ''}
                                ${idx < currentSentenceIndex ? 'read' : ''}
                                ${useSmartVoices ? 'speaker-' + seg.speaker : ''}
                            `}
                                >
                                    {seg.text + " "}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Controls */}
            <footer className="controls-bar glass-panel">
                <div className="controls-left">
                    <button className="control-btn" onClick={toggleLanguage} title="Language">
                        <Globe size={18} />
                        <span className="btn-label">{language.toUpperCase()}</span>
                    </button>
                </div>

                <div className="controls-center">
                    <button className="control-btn secondary" onClick={reset} title="Restart">
                        <RotateCcw size={20} />
                    </button>

                    <button className="play-btn" onClick={togglePlay} disabled={isAnalyzing}>
                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>
                </div>

                <div className="controls-right">
                    {hasExportableAudio && (
                        <button className="control-btn accent" onClick={handleDownload} title="Download">
                            <Download size={18} />
                        </button>
                    )}
                </div>
            </footer>

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
            display: flex;
            flex-direction: column;
            height: 100vh;
            max-width: 1000px;
            margin: 0 auto;
            padding: 1.5rem;
            gap: 1.5rem;
        }

        /* Header */
        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 0.5rem;
        }

        .center-info {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .title {
            font-family: var(--font-heading);
            font-size: 1.75rem;
            margin: 0;
            letter-spacing: -0.5px;
        }

        .beta-badge {
            font-size: 0.65rem;
            letter-spacing: 2px;
            background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
            padding: 2px 8px;
            border-radius: 10px;
            font-weight: 700;
            margin-top: -2px;
        }

        .actions {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .mood-pill {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.75rem;
            background: rgba(255,255,255,0.08);
            padding: 6px 12px;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.1);
            color: var(--accent-tertiary);
            font-weight: 600;
        }

        /* Main Layout */
        .main-layout {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            min-height: 0; /* Important for flex scrolling */
        }

        /* Illustration */
        .illustration-panel {
            height: 280px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            background: rgba(0,0,0,0.3);
            transition: all 0.5s ease;
        }

        .scene-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            animation: fadeIn 1.5s ease;
        }

        .image-overlay {
            position: absolute;
            bottom: 15px;
            right: 15px;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px);
            padding: 6px 12px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.75rem;
            font-weight: 500;
            border: 1px solid rgba(255,255,255,0.1);
        }

        .placeholder-art {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            opacity: 0.6;
        }
        
        .analyzing-pulse {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            animation: pulse 2s infinite;
        }

        /* Text Area */
        .text-container {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
            position: relative;
            /* Scroll padding */
            scroll-behavior: smooth;
        }

        .story-text {
            font-size: 1.25rem;
            line-height: 2;
            color: var(--text-secondary);
            max-width: 800px;
            margin: 0 auto;
        }

        .sentence-span {
            transition: all 0.3s ease;
            padding: 2px 0;
            border-radius: 4px;
        }

        .sentence-span.active {
            color: var(--text-primary);
            background: rgba(139, 92, 246, 0.15);
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
            font-weight: 500;
        }

        .sentence-span.read {
            opacity: 0.7;
        }

        /* Speaker Colors */
        .speaker-man.active { border-bottom: 2px solid #60a5fa; }
        .speaker-woman.active { border-bottom: 2px solid #f472b6; }
        .speaker-child.active { border-bottom: 2px solid #facc15; }
        .speaker-narrator.active { border-bottom: none; }

        /* Controls Footer */
        .controls-bar {
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .controls-center {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }

        .control-btn {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            transition: all 0.2s;
        }
        
        .control-btn:hover {
            background: rgba(255,255,255,0.05);
            color: var(--text-primary);
        }

        .control-btn.accent {
            color: var(--accent-secondary);
        }
        
        .control-btn.accent:hover {
            background: rgba(236, 72, 153, 0.1);
            transform: translateY(-2px);
        }

        .btn-label {
            font-size: 0.65rem;
            font-weight: 700;
            margin-top: 2px;
        }

        .play-btn {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary));
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 25px -5px var(--accent-glow);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .play-btn:hover {
            transform: scale(1.1) translateY(-2px);
            box-shadow: 0 15px 35px -5px var(--accent-glow);
        }
        
        .play-btn:active {
            transform: scale(0.95);
        }
        
        .play-btn:disabled {
            opacity: 0.5;
            filter: grayscale(1);
            cursor: not-allowed;
        }

        .glass-hover:hover {
            background: rgba(255,255,255,0.1);
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }

        @media (max-width: 768px) {
            .interface-container { padding: 1rem; gap: 1rem; }
            .illustration-panel { height: 200px; }
            .story-text { font-size: 1.1rem; }
            .play-btn { width: 60px; height: 60px; }
            .controls-bar { padding: 1rem; }
        }
      `}</style>
        </div>
    );
};

export default StorytellerInterface;
