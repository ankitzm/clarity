import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 3001;

// Find Chrome executable
function getChromePath() {
    const paths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        // Local chromium package path on Mac
        './node_modules/chromium/lib/chromium/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
        process.env.CHROME_PATH,
    ].filter(Boolean);

    for (const p of paths) {
        try {
            // Check if path exists
            execSync(`test -f "${p}"`);
            console.log(`🔍 Found Chrome/Chromium at: ${p}`);
            return p;
        } catch { }
    }
    return null;
}

// Fetch ChatGPT conversation from share link
app.post('/api/fetch-chat', async (req, res) => {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const shareIdMatch = url.match(/chatgpt\.com\/share\/([a-zA-Z0-9-]+)/);
    if (!shareIdMatch) {
        return res.status(400).json({
            success: false,
            error: 'Invalid ChatGPT share link format. Expected: chatgpt.com/share/...'
        });
    }

    const shareId = shareIdMatch[1];
    const shareUrl = `https://chatgpt.com/share/${shareId}`;

    console.log(`\n🔗 Fetching: ${shareUrl}`);

    const chromePath = getChromePath();
    if (!chromePath) {
        return res.status(500).json({
            success: false,
            error: 'Chrome not found. Please install Google Chrome.'
        });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: chromePath,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate and wait for content
        await page.goto(shareUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for the conversation to load
        await page.waitForSelector('[data-message-author-role]', { timeout: 15000 }).catch(() => { });

        // Extract conversation data
        const conversationData = await page.evaluate(() => {
            // Try to get title
            const titleEl = document.querySelector('h1') || document.querySelector('title');
            const title = titleEl?.textContent?.trim() || 'Untitled Conversation';

            // Get messages
            const messages = [];
            const messageElements = document.querySelectorAll('[data-message-author-role]');

            messageElements.forEach(el => {
                const role = el.getAttribute('data-message-author-role');
                const contentEl = el.querySelector('.markdown') || el.querySelector('.whitespace-pre-wrap') || el;
                const content = contentEl?.textContent?.trim() || '';

                if (content && (role === 'user' || role === 'assistant')) {
                    messages.push({ role, content });
                }
            });

            // Fallback: try to find messages in any format
            if (messages.length === 0) {
                const allText = document.body.innerText;
                return { title, messages: [], rawText: allText };
            }

            return { title, messages };
        });

        await browser.close();

        if (conversationData.messages.length === 0 && !conversationData.rawText) {
            return res.status(422).json({
                success: false,
                error: 'Could not extract messages. The page may not have loaded correctly.'
            });
        }

        console.log(`   ✅ Found ${conversationData.messages.length} messages`);

        return res.json({
            success: true,
            conversation: {
                id: shareId,
                title: conversationData.title,
                messages: conversationData.messages,
                rawText: conversationData.rawText,
                url: shareUrl,
                fetchedAt: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Fetch error:', error.message);
        if (browser) await browser.close();

        return res.status(500).json({
            success: false,
            error: `Failed to fetch: ${error.message}`
        });
    }
});

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
                        content: 'You are an expert analyst. Provide clear, structured analysis using markdown formatting.',
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
                errorMessage = 'API key invalid. Check your OpenRouter account.';
            }

            return res.status(response.status).json({ error: errorMessage });
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        console.log('   Streaming...');

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
                    } catch (e) { }
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
        summary: `Provide a comprehensive summary of this conversation.

Include:
- Main topic(s) discussed
- Key points covered  
- Important conclusions
- Brief overview of the flow

CONVERSATION:
${conversation}`,

        sentiment: `Analyze the emotional tone and sentiment.

Include:
- Overall sentiment (positive/negative/neutral)
- Emotional progression
- User's mood or concerns
- Frustrations or satisfactions expressed

CONVERSATION:
${conversation}`,

        insights: `Extract the most valuable insights.

Focus on:
- Key learnings and takeaways
- Novel ideas discovered
- Important facts revealed
- Practical knowledge gained

Present as bullet points.

CONVERSATION:
${conversation}`,

        actions: `Identify all action items and tasks.

Extract:
- Specific tasks mentioned
- Follow-up actions needed
- Recommendations to implement
- Next steps discussed

Format as an actionable checklist.

CONVERSATION:
${conversation}`,

        qna: `Convert into a structured Q&A format.

Create:
- Clear, standalone questions
- Comprehensive answers
- Group related Q&As together

CONVERSATION:
${conversation}`,

        learn: `Analyze from an educational perspective.

Identify:
- Concepts explained
- Learning moments
- Topics to study further
- Educational value

Format as study notes.

CONVERSATION:
${conversation}`,

        decisions: `Analyze decision-making aspects.

Extract:
- Key decisions discussed
- Options considered
- Pros and cons mentioned
- Final choices made

CONVERSATION:
${conversation}`,

        topics: `Identify and categorize all topics.

Provide:
- Main themes
- Sub-topics under each
- How topics relate
- Coverage depth

CONVERSATION:
${conversation}`,
    };

    return prompts[type] || prompts.summary;
}

app.listen(PORT, () => {
    console.log(`
🚀 Clarity API Server running at http://localhost:${PORT}
   
   Endpoints:
   - POST /api/fetch-chat  (fetch from ChatGPT share link)
   - POST /api/analyze     (AI analysis)
`);
});
