import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface AnalyzeRequest {
    conversation: Message[];
    analysisType: string;
    conversationTitle?: string;
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
): Promise<VercelResponse> {
    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { conversation, analysisType, conversationTitle } = req.body as AnalyzeRequest;

    if (!conversation || !Array.isArray(conversation) || !analysisType) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    // Format conversation for analysis
    const formattedConversation = conversation
        .map((msg) => `[${msg.role.toUpperCase()}]: ${msg.content}`)
        .join('\n\n');

    // Get prompt based on analysis type
    const prompt = getAnalysisPrompt(analysisType, formattedConversation, conversationTitle);

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://clarity-app.vercel.app',
                'X-Title': 'Clarity - ChatGPT Analyzer',
            },
            body: JSON.stringify({
                model: 'stepfun/step-3.5-flash:free',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert analyst helping users understand their ChatGPT conversations. Provide clear, structured, and insightful analysis. Use markdown formatting for better readability.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('OpenRouter error:', error);
            return res.status(response.status).json({
                error: 'Failed to get AI analysis'
            });
        }

        // Stream the response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            return res.status(500).json({ error: 'Failed to read response' });
        }

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        res.write('data: [DONE]\n\n');
                        break;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }

        return res.end();

    } catch (error) {
        console.error('Analysis error:', error);
        return res.status(500).json({ error: 'Analysis failed' });
    }
}

function getAnalysisPrompt(type: string, conversation: string, title?: string): string {
    const titleContext = title ? ` titled "${title}"` : '';

    const prompts: Record<string, string> = {
        summary: `Analyze this ChatGPT conversation${titleContext} and provide a comprehensive summary.

Include:
- Main topic(s) discussed
- Key points covered
- Important conclusions or outcomes
- Brief overview of the conversation flow

Keep it concise but informative.

CONVERSATION:
${conversation}`,

        sentiment: `Analyze the emotional tone and sentiment of this ChatGPT conversation${titleContext}.

Include:
- Overall sentiment (positive/negative/neutral)
- Emotional progression throughout the conversation
- User's apparent mood or concerns
- Any frustrations or satisfactions expressed
- Tone of the assistant's responses

CONVERSATION:
${conversation}`,

        insights: `Extract the most valuable insights from this ChatGPT conversation${titleContext}.

Focus on:
- Key learnings and takeaways
- Novel ideas or perspectives discovered
- Important facts or information revealed
- Aha moments or breakthroughs
- Practical knowledge gained

Present as bullet points with clear explanations.

CONVERSATION:
${conversation}`,

        actions: `Identify all action items and tasks from this ChatGPT conversation${titleContext}.

Extract:
- Specific tasks mentioned
- Follow-up actions needed
- Recommendations to implement
- Decisions requiring action
- Next steps discussed

Format as a clear, actionable checklist.

CONVERSATION:
${conversation}`,

        qna: `Convert this ChatGPT conversation${titleContext} into a structured Q&A format.

Create:
- Clear, standalone questions
- Comprehensive answers
- Group related Q&As together
- Highlight the most important exchanges

Make each Q&A pair self-contained and useful.

CONVERSATION:
${conversation}`,

        learn: `Analyze this ChatGPT conversation${titleContext} from an educational perspective.

Identify:
- Concepts explained or explored
- Learning moments and explanations
- Topics that could be studied further
- Skills or knowledge demonstrated
- Educational value of the conversation

Format as study notes or learning points.

CONVERSATION:
${conversation}`,

        decisions: `Analyze the decision-making aspects of this ChatGPT conversation${titleContext}.

Extract:
- Key decisions discussed
- Options or alternatives considered
- Pros and cons mentioned
- Final choices made
- Reasoning behind decisions
- Pending decisions requiring more thought

CONVERSATION:
${conversation}`,

        topics: `Identify and categorize all topics discussed in this ChatGPT conversation${titleContext}.

Provide:
- Main themes and categories
- Sub-topics under each theme
- How topics relate to each other
- Topic coverage depth (brief mention vs. deep dive)
- Suggested related topics for exploration

CONVERSATION:
${conversation}`,
    };

    return prompts[type] || prompts.summary;
}
