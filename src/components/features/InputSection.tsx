import { useState, useCallback } from 'react';
import { Button, Card, Chip } from '../ui';
import { ANALYSIS_TYPES, ANALYSIS_TYPE_KEYS } from '../../config/analysisTypes';
import type { AnalysisTypeKey } from '../../types';

interface InputSectionProps {
    onAnalyze: (text: string, types: AnalysisTypeKey[]) => void;
    isLoading?: boolean;
}

export function InputSection({ onAnalyze, isLoading = false }: InputSectionProps) {
    const [conversationText, setConversationText] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<AnalysisTypeKey[]>(['summary', 'insights', 'actions']);
    const [error, setError] = useState<string | undefined>();

    const toggleType = useCallback((type: AnalysisTypeKey) => {
        setSelectedTypes((prev) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type]
        );
    }, []);

    const handleSubmit = useCallback(() => {
        // Validate text
        const trimmedText = conversationText.trim();
        if (!trimmedText) {
            setError('Please paste your ChatGPT conversation');
            return;
        }

        if (trimmedText.length < 50) {
            setError('The conversation seems too short. Please paste the full conversation.');
            return;
        }

        // Validate selection
        if (selectedTypes.length === 0) {
            setError('Please select at least one analysis type');
            return;
        }

        setError(undefined);
        onAnalyze(trimmedText, selectedTypes);
    }, [conversationText, selectedTypes, onAnalyze]);

    const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setConversationText(e.target.value);
        if (error) setError(undefined);
    }, [error]);

    return (
        <div className="w-full max-w-2xl animate-slide-up">
            {/* Hero */}
            <div className="text-center mb-10">
                <h1 className="text-4xl sm:text-5xl font-bold text-[--color-text-primary] mb-4 text-balance leading-tight">
                    Get Clarity from your
                    <span className="bg-gradient-to-r from-[--color-accent] to-purple-500 bg-clip-text text-transparent"> ChatGPT </span>
                    conversations
                </h1>
                <p className="text-lg text-[--color-text-secondary] max-w-lg mx-auto">
                    Paste your ChatGPT conversation and let AI analyze it for insights, summaries, and more.
                </p>
            </div>

            {/* Input Card */}
            <Card variant="elevated" padding="lg" className="mb-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-[--color-text-primary] mb-1.5">
                        Paste your conversation
                    </label>
                    <textarea
                        placeholder="Copy your ChatGPT conversation and paste it here...

Example:
You: How do I learn React?
ChatGPT: React is a JavaScript library for building user interfaces..."
                        value={conversationText}
                        onChange={handleTextChange}
                        className={`
              w-full h-48 px-4 py-3
              bg-[--color-surface] text-[--color-text-primary]
              border rounded-[--radius-md]
              placeholder:text-[--color-text-tertiary]
              transition-all duration-[--transition-fast]
              focus:outline-none focus:ring-2 focus:ring-[--color-accent] focus:border-transparent
              resize-none font-mono text-sm
              ${error
                                ? 'border-[--color-error] focus:ring-[--color-error]'
                                : 'border-[--color-border] hover:border-[--color-text-tertiary]'
                            }
            `}
                        disabled={isLoading}
                    />
                    {error && (
                        <p className="mt-1.5 text-sm text-[--color-error]">{error}</p>
                    )}
                    <p className="mt-2 text-xs text-[--color-text-tertiary]">
                        💡 Tip: Open your ChatGPT conversation, select all (Ctrl/Cmd+A), copy (Ctrl/Cmd+C), and paste here.
                    </p>
                </div>

                {/* Analysis Type Selection */}
                <div className="mb-5">
                    <label className="block text-sm font-medium text-[--color-text-primary] mb-3">
                        Select analysis types
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {ANALYSIS_TYPE_KEYS.map((key) => {
                            const type = ANALYSIS_TYPES[key];
                            return (
                                <Chip
                                    key={key}
                                    icon={type.icon}
                                    selected={selectedTypes.includes(key)}
                                    onClick={() => toggleType(key)}
                                    disabled={isLoading}
                                    title={type.description}
                                >
                                    {type.label}
                                </Chip>
                            );
                        })}
                    </div>
                    {selectedTypes.length === 0 && (
                        <p className="mt-2 text-sm text-[--color-warning]">
                            Select at least one analysis type
                        </p>
                    )}
                </div>

                <Button
                    size="lg"
                    className="w-full"
                    disabled={selectedTypes.length === 0 || !conversationText.trim() || isLoading}
                    isLoading={isLoading}
                    onClick={handleSubmit}
                >
                    {isLoading ? 'Analyzing...' : 'Analyze Conversation'}
                </Button>
            </Card>

            {/* Character count */}
            {conversationText && (
                <p className="text-center text-sm text-[--color-text-tertiary]">
                    {conversationText.length.toLocaleString()} characters
                </p>
            )}
        </div>
    );
}
