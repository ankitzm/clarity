import { useState, useCallback } from 'react';
import { Button, Input, Card, Chip } from '../ui';
import { ANALYSIS_TYPES, ANALYSIS_TYPE_KEYS } from '../../config/analysisTypes';
import { validateChatGPTLink } from '../../services/chatgptParser';
import type { AnalysisTypeKey } from '../../types';

interface InputSectionProps {
    onAnalyze: (url: string, types: AnalysisTypeKey[]) => void;
    isLoading?: boolean;
}

export function InputSection({ onAnalyze, isLoading = false }: InputSectionProps) {
    const [url, setUrl] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<AnalysisTypeKey[]>(['summary', 'insights', 'actions']);
    const [error, setError] = useState<string | undefined>();
    const [showManualInput, setShowManualInput] = useState(false);

    const toggleType = useCallback((type: AnalysisTypeKey) => {
        setSelectedTypes((prev) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type]
        );
    }, []);

    const handleSubmit = useCallback(() => {
        // Validate URL
        const validation = validateChatGPTLink(url);
        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        // Validate selection
        if (selectedTypes.length === 0) {
            setError('Please select at least one analysis type');
            return;
        }

        setError(undefined);
        onAnalyze(url, selectedTypes);
    }, [url, selectedTypes, onAnalyze]);

    const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
        if (error) setError(undefined);
    }, [error]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isLoading) {
            handleSubmit();
        }
    }, [handleSubmit, isLoading]);

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
                    Paste a ChatGPT share link and let AI analyze your conversation for insights, summaries, and more.
                </p>
            </div>

            {/* Input Card */}
            <Card variant="elevated" padding="lg" className="mb-6">
                {!showManualInput ? (
                    <Input
                        placeholder="Paste ChatGPT share link (chatgpt.com/share/...)"
                        value={url}
                        onChange={handleUrlChange}
                        onKeyDown={handleKeyDown}
                        error={error}
                        disabled={isLoading}
                        className="mb-4"
                    />
                ) : (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-[--color-text-primary] mb-1.5">
                            Paste conversation text
                        </label>
                        <textarea
                            placeholder="Paste your ChatGPT conversation here..."
                            className="
                w-full h-40 px-4 py-3
                bg-[--color-surface] text-[--color-text-primary]
                border border-[--color-border] rounded-[--radius-md]
                placeholder:text-[--color-text-tertiary]
                transition-all duration-[--transition-fast]
                focus:outline-none focus:ring-2 focus:ring-[--color-accent] focus:border-transparent
                resize-none
              "
                            disabled={isLoading}
                        />
                    </div>
                )}

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
                    disabled={selectedTypes.length === 0 || isLoading}
                    isLoading={isLoading}
                    onClick={handleSubmit}
                >
                    {isLoading ? 'Analyzing...' : 'Analyze Conversation'}
                </Button>
            </Card>

            {/* Toggle manual input */}
            <p className="text-center text-sm text-[--color-text-tertiary]">
                💡 Don't have a link?{' '}
                <button
                    className="text-[--color-accent] hover:underline focus:outline-none"
                    onClick={() => setShowManualInput(!showManualInput)}
                >
                    {showManualInput ? 'Use share link instead' : 'Paste conversation text directly'}
                </button>
            </p>
        </div>
    );
}
