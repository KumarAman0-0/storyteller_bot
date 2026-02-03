/**
 * Speech Engine Service
 * Wraps window.speechSynthesis for easier control
 */

class SpeechEngine {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.voiceMap = {
            en: null,
            hi: null
        };

        // Voices are loaded asynchronously
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = this.loadVoices.bind(this);
        }
        this.loadVoices();
    }

    loadVoices() {
        this.voices = this.synth.getVoices();

        // Prefer "Google" voices if available, or just matching lang codes
        this.voiceMap.en = this.voices.find(v => v.lang.startsWith('en-GB') || v.lang.startsWith('en-US')) || this.voices.find(v => v.lang.startsWith('en'));
        this.voiceMap.hi = this.voices.find(v => v.lang.startsWith('hi')) || this.voices.find(v => v.name.includes('Hindi'));

        console.log('Voices loaded:', this.voices.length);
        console.log('Selected EN:', this.voiceMap.en?.name);
        console.log('Selected HI:', this.voiceMap.hi?.name);
    }

    /**
     * Speak text in specified language
     * @param {string} text 
     * @param {'en'|'hi'} lang 
     * @param {number} rate 
     * @returns {SpeechSynthesisUtterance}
     */
    speak(text, lang = 'en', rate = 1.0) {
        this.cancel(); // Stop any current speech

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = this.voiceMap[lang];

        if (voice) {
            utterance.voice = voice;
        } else {
            // Fallback: set lang property so browser might pick default
            utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
        }

        utterance.rate = rate;
        this.synth.speak(utterance);

        return utterance;
    }

    pause() {
        this.synth.pause();
    }

    resume() {
        this.synth.resume();
    }

    cancel() {
        this.synth.cancel();
    }

    isSpeaking() {
        return this.synth.speaking;
    }
}

export const speechEngine = new SpeechEngine();
