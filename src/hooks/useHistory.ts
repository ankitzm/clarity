import { useCallback, useEffect, useState } from 'react';
import type { AnalysisSession, HistoryItem } from '../types';

const HISTORY_STORAGE_KEY = 'clarity-history';
const MAX_HISTORY_ITEMS = 50;

export function useHistory() {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Load history from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as HistoryItem[];
                setHistory(parsed);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }, []);

    // Save to localStorage whenever history changes
    const saveToStorage = useCallback((items: HistoryItem[]) => {
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }, []);

    // Add a new session to history
    const addToHistory = useCallback((session: AnalysisSession) => {
        if (!session.conversation || session.results.length === 0) return;

        const preview = session.results[0]?.content?.slice(0, 200) || '';

        const historyItem: HistoryItem = {
            id: session.id,
            title: session.conversation.title || 'Untitled Conversation',
            url: session.conversation.url,
            analysisTypes: session.selectedTypes,
            createdAt: session.createdAt,
            preview,
        };

        setHistory((prev) => {
            // Remove duplicate if exists
            const filtered = prev.filter((item) => item.id !== session.id);
            // Add new item at the beginning
            const updated = [historyItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    // Get full session data for a history item
    const getSession = useCallback((id: string): AnalysisSession | null => {
        try {
            const stored = localStorage.getItem(`clarity-session-${id}`);
            if (stored) {
                return JSON.parse(stored) as AnalysisSession;
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }
        return null;
    }, []);

    // Save full session data
    const saveSession = useCallback((session: AnalysisSession) => {
        try {
            localStorage.setItem(`clarity-session-${session.id}`, JSON.stringify(session));
            addToHistory(session);
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }, [addToHistory]);

    // Delete a history item
    const deleteFromHistory = useCallback((id: string) => {
        setHistory((prev) => {
            const updated = prev.filter((item) => item.id !== id);
            saveToStorage(updated);
            return updated;
        });
        // Also remove the full session
        try {
            localStorage.removeItem(`clarity-session-${id}`);
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    }, [saveToStorage]);

    // Clear all history
    const clearHistory = useCallback(() => {
        // Remove all session data
        history.forEach((item) => {
            try {
                localStorage.removeItem(`clarity-session-${item.id}`);
            } catch (error) {
                console.error('Failed to delete session:', error);
            }
        });
        setHistory([]);
        saveToStorage([]);
    }, [history, saveToStorage]);

    return {
        history,
        addToHistory,
        getSession,
        saveSession,
        deleteFromHistory,
        clearHistory,
    };
}
