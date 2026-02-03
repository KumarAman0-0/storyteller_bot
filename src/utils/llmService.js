/**
 * LLM Service for Character Analysis
 * Uses Google Gemini API to identify speaker types in text.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export const analyzeTextForCharacters = async (text, apiKey) => {
    if (!apiKey) throw new Error('Gemini API Key is missing');

    const prompt = `
    Analyze the following story text. Break it down into segments based on who is speaking.
    For each segment, identify the speaker type from this list: 'narrator', 'man', 'woman', 'child', 'old_man', 'old_woman'.
    If the text is just descriptive/narration, use 'narrator'.
    If it's dialogue, infer the gender/age from context if possible, otherwise default to 'man' or 'woman' based on names/pronouns.
    
    Return ONLY a raw JSON array (no markdown formatting) with this structure:
    [
      { "text": "The exact text segment...", "speaker": "narrator" },
      { "text": "Hello there!", "speaker": "woman" }
    ]

    Text to analyze:
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
