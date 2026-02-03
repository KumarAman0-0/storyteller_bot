/**
 * Image Service
 * Generates illustration URLs based on text prompts.
 * Uses Pollinations.ai (Free, No API Key required)
 */

export const generateImage = async (prompt) => {
    if (!prompt) return null;

    // Clean prompt for URL
    const encodedPrompt = encodeURIComponent(prompt.slice(0, 100)); // Limit length
    const seed = Math.floor(Math.random() * 10000);

    // Pollinations URL format directly returns an image
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=600&nologo=true`;

    // We don't even need to fetch, just return the URL for the <img> tag
    // But let's verify it works or do a quick preload if we wanted
    return imageUrl;
};
