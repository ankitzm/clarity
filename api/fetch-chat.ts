import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ConversationResponse {
    success: boolean;
    conversation?: {
        id: string;
        title: string;
        messages: Message[];
        url: string;
        fetchedAt: string;
    };
    error?: string;
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
): Promise<VercelResponse> {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        } as ConversationResponse);
    }

    const { url } = req.body;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'URL is required'
        } as ConversationResponse);
    }

    // Validate URL format
    const shareIdMatch = url.match(/chatgpt\.com\/share\/([a-zA-Z0-9-]+)/);
    if (!shareIdMatch) {
        return res.status(400).json({
            success: false,
            error: 'Invalid ChatGPT share link format'
        } as ConversationResponse);
    }

    const shareId = shareIdMatch[1];

    try {
        // Fetch the ChatGPT share page
        const response = await fetch(`https://chatgpt.com/share/${shareId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversation not found. The share link may be invalid or expired.'
                } as ConversationResponse);
            }
            throw new Error(`HTTP error: ${response.status}`);
        }

        const html = await response.text();

        // Try to extract __NEXT_DATA__ JSON
        let conversationData: { title: string; messages: Message[] } | null = null;

        // Method 1: Look for __NEXT_DATA__ script tag
        const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (nextDataMatch) {
            try {
                const nextData = JSON.parse(nextDataMatch[1]);
                const serverResponse = nextData?.props?.pageProps?.serverResponse;

                if (serverResponse?.data) {
                    const data = serverResponse.data;
                    conversationData = {
                        title: data.title || 'Untitled Conversation',
                        messages: extractMessages(data),
                    };
                }
            } catch (e) {
                console.error('Failed to parse __NEXT_DATA__:', e);
            }
        }

        // Method 2: Look for serverResponse in scripts (fallback)
        if (!conversationData) {
            const serverResponseMatch = html.match(/"serverResponse"\s*:\s*(\{[\s\S]*?\})\s*,\s*"(?:isError|__N)/);
            if (serverResponseMatch) {
                try {
                    const serverResponse = JSON.parse(serverResponseMatch[1]);
                    if (serverResponse?.data) {
                        conversationData = {
                            title: serverResponse.data.title || 'Untitled Conversation',
                            messages: extractMessages(serverResponse.data),
                        };
                    }
                } catch (e) {
                    console.error('Failed to parse serverResponse:', e);
                }
            }
        }

        // Method 3: Try to extract from any JSON-like structure with messages
        if (!conversationData) {
            const messagesMatch = html.match(/"mapping"\s*:\s*(\{[\s\S]*?\})\s*,\s*"moderation/);
            if (messagesMatch) {
                try {
                    const mapping = JSON.parse(messagesMatch[1]);
                    conversationData = {
                        title: 'Shared Conversation',
                        messages: extractMessagesFromMapping(mapping),
                    };
                } catch (e) {
                    console.error('Failed to parse mapping:', e);
                }
            }
        }

        if (!conversationData || conversationData.messages.length === 0) {
            return res.status(422).json({
                success: false,
                error: 'Could not extract conversation data. The page structure may have changed.'
            } as ConversationResponse);
        }

        return res.status(200).json({
            success: true,
            conversation: {
                id: shareId,
                title: conversationData.title,
                messages: conversationData.messages,
                url: url,
                fetchedAt: new Date().toISOString(),
            },
        } as ConversationResponse);

    } catch (error) {
        console.error('Error fetching conversation:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch conversation. Please try again.'
        } as ConversationResponse);
    }
}

// Extract messages from ChatGPT data structure
function extractMessages(data: Record<string, unknown>): Message[] {
    const messages: Message[] = [];

    // The mapping contains all message nodes
    const mapping = data.mapping as Record<string, {
        message?: {
            author?: { role?: string };
            content?: { parts?: string[] };
        };
        children?: string[];
    }> | undefined;

    if (!mapping) return messages;

    // Find the conversation path
    const visited = new Set<string>();
    const queue: string[] = [];

    // Find root node (one without a parent message)
    for (const [id, node] of Object.entries(mapping)) {
        if (node.message?.author?.role === 'system') {
            if (node.children) {
                queue.push(...node.children);
            }
            visited.add(id);
            break;
        }
    }

    // If no system message found, try to find the first node
    if (queue.length === 0) {
        for (const [id, node] of Object.entries(mapping)) {
            if (!node.message && node.children) {
                queue.push(...node.children);
                visited.add(id);
                break;
            }
        }
    }

    // BFS through the conversation
    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        const node = mapping[nodeId];
        if (!node) continue;

        const message = node.message;
        if (message?.author?.role && message?.content?.parts) {
            const role = message.author.role;
            const content = message.content.parts.join('\n').trim();

            if ((role === 'user' || role === 'assistant') && content) {
                messages.push({ role, content });
            }
        }

        if (node.children) {
            queue.push(...node.children);
        }
    }

    return messages;
}

// Fallback: Extract messages from mapping directly
function extractMessagesFromMapping(mapping: Record<string, unknown>): Message[] {
    const messages: Message[] = [];

    for (const value of Object.values(mapping)) {
        const node = value as {
            message?: {
                author?: { role?: string };
                content?: { parts?: string[] };
            };
        };

        if (node.message?.author?.role && node.message?.content?.parts) {
            const role = node.message.author.role;
            const content = node.message.content.parts.join('\n').trim();

            if ((role === 'user' || role === 'assistant') && content) {
                messages.push({ role: role as 'user' | 'assistant', content });
            }
        }
    }

    return messages;
}
