/**
 * Audio Export Service
 * Collects audio chunks (Blobs) and merges them into a single file for download.
 * Note: Real MP3 merging usually requires ffmpeg.wasm, but for browser compatibility
 * and simplicity, we will merge WAV/WebM blobs or simply concat them if the format allows.
 * For ElevenLabs MPEG, we can just concatenate the binary data.
 */

export class AudioExporter {
    constructor() {
        this.chunks = [];
    }

    addChunk(audioBlob) {
        if (audioBlob) {
            this.chunks.push(audioBlob);
        }
    }

    reset() {
        this.chunks = [];
    }

    hasAudio() {
        return this.chunks.length > 0;
    }

    exportFile(filename = 'story.mp3') {
        if (this.chunks.length === 0) return null;

        // ElevenLabs returns MP3, so usually safe to concat
        const blob = new Blob(this.chunks, { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        return url;
    }
}

export const audioExporter = new AudioExporter();
