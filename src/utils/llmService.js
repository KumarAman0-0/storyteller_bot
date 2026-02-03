/**
 * LLM Service for Character Analysis
 * Uses Google Gemini API to identify speaker types in text.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export const analyzeTextForCharacters = async (text, apiKey) => {
    if (!apiKey) throw new Error('Gemini API Key is missing');

    const prompt = `
    You are an expert Storyteller AI editor. Your job is to:
    1. CLEAN the text: Fix broken words (e.g. "Amaz- ing" -> "Amazing"), remove page numbers, headers, footers, and random OCR artifacts.
    2. CORRECT the text: Ensure sentences flow naturally.
    3. SEGMENT the text: Identify who is speaking, the MOOD, and a VISUAL DESCRIPTION.

    For each segment, return:
    - text: The cleaned text.
    - speaker: 'narrator', 'man', 'woman', 'child', 'old_man', 'old_woman'.
    - mood: 'neutral', 'happy', 'sad', 'scary', 'action', 'nature' (rain/forest).
    - visual_summary: A short, vivid description of the scene for an image generator (e.g., "A dark castle looming in the rain", "Two friends laughing in a sunny park").

    Return ONLY a raw JSON array (no markdown):
    [
      { "text": "The sun was shining.", "speaker": "narrator", "mood": "happy", "visual_summary": "Sunny green meadow with blue sky" }
    ]

    Raw Text to process:
    "${text}"
  `;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to analyze text with Gemini');
        }

        const data = await response.json();
        const resultText = data.candidates[0].content.parts[0].text;

        // Clean up markdown code blocks if present
        const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('LLM Analysis Error:', error);
        // Fallback: Return original text as narrator
        return [{ text: text, speaker: 'narrator' }];
    }
};
