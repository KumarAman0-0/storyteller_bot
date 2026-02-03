/**
 * SoundManager
 * Handles ambient background sounds based on story mood.
 */

// Public domain / Open license sound assets (Google Sounds)
const SOUND_ASSETS = {
    neutral: null, // Silence
    happy: 'https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg',
    sad: 'https://actions.google.com/sounds/v1/weather/rain_heavy.ogg', // Rain feels sad/dramatic
    scary: 'https://actions.google.com/sounds/v1/horror/horror_ambience.ogg', // Eerie drone
    action: 'https://actions.google.com/sounds/v1/transportation/highway_heavy_traffic.ogg', // Fast paced/noise - placeholder for action
    nature: 'https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg',
};

class SoundManager {
    constructor() {
        this.currentMood = 'neutral';
        this.audio = new Audio();
        this.audio.loop = true;
        this.audio.volume = 0; // Start silent for fade in
        this.fadeInterval = null;
    }

    playMood(mood) {
        const targetMood = mood?.toLowerCase();

        // If mood is same or unknown (default to neutral), do nothing if already playing
        if (this.currentMood === targetMood) return;

        // If invalid mood, treat as 'neutral' (stop)
        const soundUrl = SOUND_ASSETS[targetMood];

        if (!soundUrl) {
            this.fadeOut(() => {
                this.audio.pause();
                this.currentMood = 'neutral';
            });
            return;
        }

        // Change track
        this.fadeOut(() => {
            this.audio.src = soundUrl;
            this.audio.play().catch(e => console.warn("Audio play failed (user interaction needed first):", e));
            this.currentMood = targetMood;
            this.fadeIn();
        });
    }

    stop() {
        this.fadeOut(() => {
            this.audio.pause();
            this.currentMood = 'neutral';
        });
    }

    // Smooth volume transitions
    fadeIn() {
        clearInterval(this.fadeInterval);
        this.fadeInterval = setInterval(() => {
            if (this.audio.volume < 0.3) { // Max ambient volume 30%
                this.audio.volume = Math.min(0.3, this.audio.volume + 0.02);
            } else {
                clearInterval(this.fadeInterval);
            }
        }, 100);
    }

    fadeOut(callback) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = setInterval(() => {
            if (this.audio.volume > 0.01) {
                this.audio.volume = Math.max(0, this.audio.volume - 0.02);
            } else {
                clearInterval(this.fadeInterval);
                this.audio.volume = 0;
                if (callback) callback();
            }
        }, 100); // Fast fade out
    }
}

export const soundManager = new SoundManager();
