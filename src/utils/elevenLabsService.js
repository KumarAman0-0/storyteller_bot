/**
 * ElevenLabs API Service
 */

const BASE_URL = 'https://api.elevenlabs.io/v1';

// Default Voice IDs (Can be changed by user preferences later if we add that)
// English: "Rachel" (American, clear) - 21m00Tcm4TlvDq8ikWAM
// Hindi: "Aditi" (Indian, soft) - Assuming we use a multi-lingual model, 
// we will use a specific voice known for good multi-lingual support like "Sarah" or "Rachel" with model_id 'eleven_multilingual_v2'
// Actually "Fin" is a popular male voice, "Rachel" is female.
// For Hindi, we need to ensure we use valid Model ID: 'eleven_multilingual_v2'

export const ELEVENLABS_VOICES = {
    en: '21m00Tcm4TlvDq8ikWAM', // Rachel
    hi: 'EXAVITQu4vr4xnSDxMaL', // Sarah (often good for general narration) - or we can stick to one voice that switches accents well
};

export const streamAudio = async (text, apiKey, voiceId) => {
    if (!apiKey) throw new Error('API Key is missing');

    const modelId = 'eleven_multilingual_v2'; // Supports both English and Hindi well

    const response = await fetch(`${BASE_URL}/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
        },
        body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Failed to fetch audio from ElevenLabs');
    }

    // Get audio blob
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};
