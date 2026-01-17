import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 3001;

// Analyze conversation
app.post('/api/analyze', async (req, res) => {
    const { conversationText, analysisType } = req.body;

    if (!conversationText || !analysisType) {
        return res.status(400).json({ error: 'Missing conversationText or analysisType' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error('OPENROUTER_API_KEY not set in .env.local');
        return res.status(500).json({
            error: 'API key not configured. Add OPENROUTER_API_KEY to .env.local'
        });
    }

    const prompt = getAnalysisPrompt(analysisType, conversationText);

    try {
        console.log(`\n📊 Analyzing: ${analysisType}`);
        console.log(`   Text length: ${conversationText.length} chars`);
        console.log(`   API Key: ${apiKey.slice(0, 20)}...`);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'Clarity',
            },
            body: JSON.stringify({
                model: 'xiaomi/mimo-v2-flash:free',
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
            const errorText = await response.text();
            console.error('OpenRouter error:', response.status, errorText);

            let errorMessage = `API error: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error?.message || errorMessage;
            } catch (e) { }

            if (response.status === 401) {
                errorMessage = 'API key invalid or account issue. Go to openrouter.ai to check your account.';
            }

            return res.status(response.status).json({ error: errorMessage });
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        console.log('   Streaming response...');

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
                        console.log('   ✅ Complete');
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

        res.end();

    } catch (error) {
        console.error('Analysis error:', error);
        return res.status(500).json({ error: 'Analysis failed: ' + error.message });
    }
});

function getAnalysisPrompt(type, conversation) {
    const prompts = {
        summary: `Analyze this ChatGPT conversation and provide a comprehensive summary.

Include:
- Main topic(s) discussed
- Key points covered
- Important conclusions or outcomes
- Brief overview of the conversation flow

Keep it concise but informative.

CONVERSATION:
${conversation}`,

        sentiment: `Analyze the emotional tone and sentiment of this ChatGPT conversation.

Include:
- Overall sentiment (positive/negative/neutral)
- Emotional progression throughout the conversation
- User's apparent mood or concerns
- Any frustrations or satisfactions expressed
- Tone of the assistant's responses

CONVERSATION:
${conversation}`,

        insights: `Extract the most valuable insights from this ChatGPT conversation.

Focus on:
- Key learnings and takeaways
- Novel ideas or perspectives discovered
- Important facts or information revealed
- Aha moments or breakthroughs
- Practical knowledge gained

Present as bullet points with clear explanations.

CONVERSATION:
${conversation}`,

        actions: `Identify all action items and tasks from this ChatGPT conversation.

Extract:
- Specific tasks mentioned
- Follow-up actions needed
- Recommendations to implement
- Decisions requiring action
- Next steps discussed

Format as a clear, actionable checklist.

CONVERSATION:
${conversation}`,

        qna: `Convert this ChatGPT conversation into a structured Q&A format.

Create:
- Clear, standalone questions
- Comprehensive answers
- Group related Q&As together
- Highlight the most important exchanges

Make each Q&A pair self-contained and useful.

CONVERSATION:
${conversation}`,

        learn: `Analyze this ChatGPT conversation from an educational perspective.

Identify:
- Concepts explained or explored
- Learning moments and explanations
- Topics that could be studied further
- Skills or knowledge demonstrated
- Educational value of the conversation

Format as study notes or learning points.

CONVERSATION:
${conversation}`,

        decisions: `Analyze the decision-making aspects of this ChatGPT conversation.

Extract:
- Key decisions discussed
- Options or alternatives considered
- Pros and cons mentioned
- Final choices made
- Reasoning behind decisions
- Pending decisions requiring more thought

CONVERSATION:
${conversation}`,

        topics: `Identify and categorize all topics discussed in this ChatGPT conversation.

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

app.listen(PORT, () => {
    console.log(`
🚀 Clarity API Server running at http://localhost:${PORT}
   
   Endpoints:
   - POST /api/analyze

   Make sure OPENROUTER_API_KEY is set in .env.local
`);
});
