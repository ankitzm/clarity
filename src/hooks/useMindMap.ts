import { useState, useCallback } from 'react';
import type { AnalysisResult, MindMapData } from '../types';

interface UseMindMapReturn {
    mindMapData: MindMapData | null;
    isGenerating: boolean;
    error: string | null;
    generateMindMap: (results: AnalysisResult[], conversationTitle: string) => Promise<void>;
}

export function useMindMap(): UseMindMapReturn {
    const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateMindMap = useCallback(async (results: AnalysisResult[], conversationTitle: string) => {
        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch('/api/generate-mindmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    results,
                    conversationTitle,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to generate mind map');
            }

            const data = await response.json();

            if (!data.success || !data.mindMap) {
                throw new Error(data.error || 'Invalid mind map data received');
            }

            setMindMapData(data.mindMap);
        } catch (err) {
            const errorMessage = (err as Error).message || 'Failed to generate mind map';
            setError(errorMessage);
            console.error('Mind map generation error:', err);
        } finally {
            setIsGenerating(false);
        }
    }, []);

    return {
        mindMapData,
        isGenerating,
        error,
        generateMindMap,
    };
}
