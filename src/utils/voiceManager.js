/**
 * Voice Manager
 * Maps speaker types to specific ElevenLabs Voice IDs.
 */

import { ELEVENLABS_VOICES } from './elevenLabsService';

// Expanded Voice Map
// Accessing these requires a configured API Key in elevenLabsService
// We will use known public voice IDs from ElevenLabs library for variety

export const SPEAKER_VOICEMAP = {
    narrator: ELEVENLABS_VOICES.en, // Default Rachel
    man: 'ErXwobaYiN019PkySvjV', // Antoni
    woman: 'EXAVITQu4vr4xnSDxMaL', // Sarah
    child: 'ThT5KcBeYPX3keUQqHPh', // Dorothy (Young female feel) - Note: standard voices might not have child, using a soft female
    old_man: 'N2lVSneC4wXShYt4x51m', // Marcus (Deep, authoritative)
    old_woman: 'MF3mGyEYCl7XYWbV9V6O', // Elli (Soft)
    // For Hindi, we rely on the Multilingual v2 model handling the accent via the same voice ID, 
    // or we could map specific Hindi voices if known.
    // For now, we reuse the English IDs because 'eleven_multilingual_v2' adapts them to Hindi.
};

export const getVoiceIdForSpeaker = (speakerType) => {
    const normalizedType = speakerType?.toLowerCase();
    return SPEAKER_VOICEMAP[normalizedType] || SPEAKER_VOICEMAP.narrator;
};
