import { useState, useCallback, useRef } from 'react';
import type {
    AnalysisTypeKey,
    LogEntry,
    Conversation,
    AnalysisResult,
    AnalysisSession
} from '../types';
import { ANALYSIS_TYPES } from '../config/analysisTypes';

interface UseAnalysisReturn {
    session: AnalysisSession | null;
    logs: LogEntry[];
    isLoading: boolean;
    startAnalysis: (url: string, types: AnalysisTypeKey[]) => Promise<void>;
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

    const fetchConversation = useCallback(async (url: string): Promise<Conversation | null> => {
        const response = await fetch('/api/fetch-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch conversation');
        }

        return data.conversation;
    }, []);

    const analyzeWithStreaming = useCallback(async (
        conversation: Conversation,
        analysisType: AnalysisTypeKey,
        signal: AbortSignal
    ): Promise<string> => {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversation: conversation.messages,
                analysisType,
                conversationTitle: conversation.title,
            }),
            signal,
        });

        if (!response.ok) {
            throw new Error('Analysis request failed');
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
                            // Update session with streaming content
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

    const startAnalysis = useCallback(async (url: string, types: AnalysisTypeKey[]) => {
        // Abort any previous analysis
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setLogs([]);
        setSession(null);

        const newSession: AnalysisSession = {
            id: crypto.randomUUID(),
            conversation: {
                id: '',
                title: '',
                messages: [],
                url,
                fetchedAt: '',
            },
            selectedTypes: types,
            results: [],
            status: 'fetching',
            createdAt: new Date().toISOString(),
        };
        setSession(newSession);

        try {
            // Step 1: Fetch conversation
            addLog('info', 'Starting analysis...');
            const fetchLogId = addLog('processing', 'Fetching conversation from ChatGPT...').id;

            const conversation = await fetchConversation(url);

            if (!conversation) {
                throw new Error('Failed to fetch conversation');
            }

            updateLog(fetchLogId, { type: 'success', message: 'Conversation fetched successfully' });
            addLog('info', `Found ${conversation.messages.length} messages: "${conversation.title}"`);

            setSession((prev) => prev ? {
                ...prev,
                conversation,
                status: 'analyzing',
            } : null);

            // Step 2: Run each analysis type
            const results: AnalysisResult[] = [];

            for (const type of types) {
                const typeLabel = ANALYSIS_TYPES[type].label;
                const analyzeLogId = addLog('processing', `Analyzing: ${typeLabel}...`).id;

                try {
                    const content = await analyzeWithStreaming(
                        conversation,
                        type,
                        abortControllerRef.current.signal
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

                    // Update session with final result
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
                        message: `${typeLabel} analysis failed`
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
    }, [addLog, updateLog, fetchConversation, analyzeWithStreaming]);

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
