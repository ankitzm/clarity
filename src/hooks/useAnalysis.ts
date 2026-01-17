import { useState, useCallback, useRef } from 'react';
import type {
    AnalysisTypeKey,
    LogEntry,
    AnalysisResult,
    AnalysisSession
} from '../types';
import { ANALYSIS_TYPES } from '../config/analysisTypes';

interface UseAnalysisReturn {
    session: AnalysisSession | null;
    logs: LogEntry[];
    isLoading: boolean;
    startAnalysis: (input: string, types: AnalysisTypeKey[]) => Promise<void>;
    reset: () => void;
}

export function useAnalysis(): UseAnalysisReturn {
    const [session, setSession] = useState<AnalysisSession | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const addLog = useCallback((type: LogEntry['type'], message: string) => {
        const log: LogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type,
            message,
        };
        setLogs((prev) => [...prev, log]);
        return log;
    }, []);

    const updateLog = useCallback((id: string, updates: Partial<LogEntry>) => {
        setLogs((prev) =>
            prev.map((log) =>
                log.id === id ? { ...log, ...updates } : log
            )
        );
    }, []);

    const parseConversation = useCallback((text: string) => {
        // Try to extract messages from the text
        const messages: { role: 'user' | 'assistant'; content: string }[] = [];

        // Split by common patterns
        const lines = text.split('\n');
        let currentRole: 'user' | 'assistant' | null = null;
        let currentContent: string[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Check for role indicators
            const userMatch = trimmedLine.match(/^(You|User|Human|Me)[:：]/i);
            const assistantMatch = trimmedLine.match(/^(ChatGPT|Assistant|AI|GPT|Claude)[:：]/i);

            if (userMatch) {
                if (currentRole && currentContent.length > 0) {
                    messages.push({ role: currentRole, content: currentContent.join('\n').trim() });
                }
                currentRole = 'user';
                currentContent = [trimmedLine.slice(userMatch[0].length).trim()];
            } else if (assistantMatch) {
                if (currentRole && currentContent.length > 0) {
                    messages.push({ role: currentRole, content: currentContent.join('\n').trim() });
                }
                currentRole = 'assistant';
                currentContent = [trimmedLine.slice(assistantMatch[0].length).trim()];
            } else if (currentRole && trimmedLine) {
                currentContent.push(trimmedLine);
            }
        }

        if (currentRole && currentContent.length > 0) {
            messages.push({ role: currentRole, content: currentContent.join('\n').trim() });
        }

        if (messages.length === 0) {
            return {
                parsed: false,
                rawText: text,
                messages: [],
            };
        }

        return {
            parsed: true,
            rawText: text,
            messages,
        };
    }, []);

    const analyzeWithStreaming = useCallback(async (
        conversationText: string,
        analysisType: AnalysisTypeKey,
        signal: AbortSignal
    ): Promise<string> => {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationText,
                analysisType,
            }),
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Analysis request failed');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let content = '';

        if (!reader) {
            throw new Error('Failed to read response stream');
        }

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') break;

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.content) {
                            content += parsed.content;
                            setSession((prev) => {
                                if (!prev) return prev;
                                const existingResult = prev.results.find((r) => r.type === analysisType);
                                if (existingResult) {
                                    return {
                                        ...prev,
                                        results: prev.results.map((r) =>
                                            r.type === analysisType ? { ...r, content } : r
                                        ),
                                    };
                                }
                                return {
                                    ...prev,
                                    results: [
                                        ...prev.results,
                                        { type: analysisType, content, completedAt: '' },
                                    ],
                                };
                            });
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }

        return content;
    }, []);

    const fetchConversation = useCallback(async (url: string, signal: AbortSignal) => {
        const response = await fetch('/api/fetch-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch conversation');
        }

        return response.json();
    }, []);

    const startAnalysis = useCallback(async (input: string, types: AnalysisTypeKey[]) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setLogs([]);
        setSession(null);

        try {
            let conversationData;
            let conversationText = input;
            const signal = abortControllerRef.current.signal;

            // Check if input is a URL
            const isUrl = input.includes('chatgpt.com/share/') || input.includes('https://');

            if (isUrl) {
                addLog('info', 'Fetching conversation from ChatGPT...');
                const result = await fetchConversation(input, signal);

                if (!result.success || !result.conversation) {
                    throw new Error(result.error || 'Failed to load conversation');
                }

                conversationData = result.conversation;
                if (conversationData.rawText) {
                    conversationText = conversationData.rawText;
                } else {
                    conversationText = conversationData.messages
                        .map((m: any) => `${m.role === 'user' ? 'You' : 'ChatGPT'}: ${m.content}`)
                        .join('\n\n');
                }
                addLog('success', `Fetched "${conversationData.title}" (${conversationText.length} chars)`);
            } else {
                addLog('info', 'Processing provided text...');
            }

            const parsed = parseConversation(conversationText);
            const title = conversationData?.title || (parsed.messages.length > 0
                ? parsed.messages[0].content.slice(0, 50) + '...'
                : 'Conversation Analysis');

            const newSession: AnalysisSession = {
                id: crypto.randomUUID(),
                conversation: {
                    id: conversationData?.id || crypto.randomUUID(),
                    title,
                    messages: parsed.messages,
                    url: conversationData?.url || '',
                    fetchedAt: new Date().toISOString(),
                },
                selectedTypes: types,
                results: [],
                status: 'analyzing',
                createdAt: new Date().toISOString(),
            };
            setSession(newSession);

            if (parsed.parsed) {
                addLog('success', `Parsed ${parsed.messages.length} messages from conversation`);
            } else {
                addLog('info', 'Processing as raw text (no structured messages detected)');
            }

            const results: AnalysisResult[] = [];

            for (const type of types) {
                if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

                const typeLabel = ANALYSIS_TYPES[type].label;
                const analyzeLogId = addLog('processing', `Analyzing: ${typeLabel}...`).id;

                try {
                    const content = await analyzeWithStreaming(
                        conversationText,
                        type,
                        signal
                    );

                    results.push({
                        type,
                        content,
                        completedAt: new Date().toISOString(),
                    });

                    updateLog(analyzeLogId, {
                        type: 'success',
                        message: `${typeLabel} analysis complete`
                    });

                    setSession((prev) => prev ? {
                        ...prev,
                        results: prev.results.map((r) =>
                            r.type === type ? { ...r, completedAt: new Date().toISOString() } : r
                        ),
                    } : null);

                } catch (error) {
                    if ((error as Error).name === 'AbortError') {
                        updateLog(analyzeLogId, {
                            type: 'error',
                            message: `${typeLabel} analysis cancelled`
                        });
                        throw error;
                    }
                    updateLog(analyzeLogId, {
                        type: 'error',
                        message: `${typeLabel}: ${(error as Error).message}`
                    });
                    console.error(`Analysis error for ${type}:`, error);
                }
            }

            addLog('success', 'All analyses complete!');

            setSession((prev) => prev ? {
                ...prev,
                status: 'completed',
                completedAt: new Date().toISOString(),
            } : null);

        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                addLog('info', 'Analysis cancelled');
            } else {
                addLog('error', (error as Error).message || 'Analysis failed');
                setSession((prev) => prev ? {
                    ...prev,
                    status: 'error',
                    error: (error as Error).message,
                } : null);
            }
        } finally {
            setIsLoading(false);
        }
    }, [addLog, updateLog, parseConversation, analyzeWithStreaming, fetchConversation]);

    const reset = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setSession(null);
        setLogs([]);
        setIsLoading(false);
    }, []);

    return {
        session,
        logs,
        isLoading,
        startAnalysis,
        reset,
    };
}
