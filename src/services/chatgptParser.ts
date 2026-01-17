// ChatGPT share link validation
const CHATGPT_SHARE_REGEX = /^https?:\/\/(www\.)?chatgpt\.com\/share\/[a-zA-Z0-9-]+$/;

export function validateChatGPTLink(url: string): { valid: boolean; error?: string } {
    if (!url.trim()) {
        return { valid: false, error: 'Please enter a ChatGPT share link' };
    }

    // Clean up the URL
    const cleanUrl = url.trim();

    // Check if it's a valid ChatGPT share link
    if (!CHATGPT_SHARE_REGEX.test(cleanUrl)) {
        // Check if it looks like a ChatGPT URL but wrong format
        if (cleanUrl.includes('chatgpt.com')) {
            if (cleanUrl.includes('/c/')) {
                return {
                    valid: false,
                    error: 'This looks like a regular chat link. Please use a share link (click Share → Copy Link)'
                };
            }
            return {
                valid: false,
                error: 'Invalid ChatGPT share link format. It should look like: chatgpt.com/share/...'
            };
        }

        return {
            valid: false,
            error: 'Please enter a valid ChatGPT share link (chatgpt.com/share/...)'
        };
    }

    return { valid: true };
}

export function extractShareId(url: string): string | null {
    const match = url.match(/chatgpt\.com\/share\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
}
