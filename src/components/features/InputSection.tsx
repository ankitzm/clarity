import { useState, useCallback } from 'react';
import { Button, Input, Card, Chip } from '../ui';
import { ANALYSIS_TYPES, ANALYSIS_TYPE_KEYS } from '../../config/analysisTypes';
import { validateChatGPTLink } from '../../services/chatgptParser';
import type { AnalysisTypeKey } from '../../types';

interface InputSectionProps {
    onAnalyze: (input: string, types: AnalysisTypeKey[]) => void;
    isLoading?: boolean;
}

export function InputSection({ onAnalyze, isLoading = false }: InputSectionProps) {
    const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
    const [url, setUrl] = useState('');
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
        let inputToAnalyze = '';

        if (inputMode === 'url') {
            const validation = validateChatGPTLink(url);
            if (!validation.valid) {
                setError(validation.error);
                return;
            }
            inputToAnalyze = url;
        } else {
            const trimmedText = conversationText.trim();
            if (!trimmedText) {
                setError('Please paste your ChatGPT conversation');
                return;
            }
            if (trimmedText.length < 50) {
                setError('The conversation seems too short. Please paste the full conversation.');
                return;
            }
            inputToAnalyze = trimmedText;
        }

        if (selectedTypes.length === 0) {
            setError('Please select at least one analysis type');
            return;
        }

        setError(undefined);
        onAnalyze(inputToAnalyze, selectedTypes);
    }, [url, conversationText, inputMode, selectedTypes, onAnalyze]);

    const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
        if (error) setError(undefined);
    }, [error]);

    const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setConversationText(e.target.value);
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
                    <span className="bg-gradient-to-r to-purple-500 from-black to-purple-500 bg-clip-text text-transparent"> ChatGPT </span>
                    conversations
                </h1>
                <p className="text-lg text-[--color-text-secondary] max-w-lg mx-auto">
                    Paste a ChatGPT share link or conversation text and let AI analyze it for insights, summaries, and more.
                </p>
            </div>

            {/* Input Card */}
            <Card variant="elevated" padding="lg" className="mb-6">
                {/* Input Mode Toggle */}
                <div className="flex justify-center mb-6">
                    <div className="bg-[--color-surface-hover] p-1 rounded-[--radius-md] inline-flex">
                        <button
                            onClick={() => { setInputMode('url'); setError(undefined); }}
                            className={`px-4 py-1.5 text-sm font-medium rounded-[--radius-sm] transition-all ${inputMode === 'url'
                                ? 'bg-[--color-surface] text-[--color-text-primary] shadow-sm'
                                : 'text-[--color-text-secondary] hover:text-[--color-text-primary]'
                                }`}
                        >
                            🔗 Share Link
                        </button>
                        <button
                            onClick={() => { setInputMode('text'); setError(undefined); }}
                            className={`px-4 py-1.5 text-sm font-medium rounded-[--radius-sm] transition-all ${inputMode === 'text'
                                ? 'bg-[--color-surface] text-[--color-text-primary] shadow-sm'
                                : 'text-[--color-text-secondary] hover:text-[--color-text-primary]'
                                }`}
                        >
                            📝 Paste Text
                        </button>
                    </div>
                </div>

                {inputMode === 'url' ? (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-[--color-text-primary] mb-1.5">
                            ChatGPT Share Link
                        </label>
                        <Input
                            placeholder="https://chatgpt.com/share/..."
                            value={url}
                            onChange={handleUrlChange}
                            onKeyDown={handleKeyDown}
                            error={error}
                            disabled={isLoading}
                            className="mb-1"
                        />
                        <p className="mt-2 text-xs text-[--color-text-tertiary]">
                            💡 Tip: Click "Share" in ChatGPT, then "Create Link" and copy it here.
                        </p>
                    </div>
                ) : (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-[--color-text-primary] mb-1.5">
                            Conversation Text
                        </label>
                        <textarea
                            placeholder="Paste your conversation here..."
                            value={conversationText}
                            onChange={handleTextChange}
                            className={`
                                w-full h-40 px-4 py-3
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
                    disabled={
                        (inputMode === 'url' ? !url : !conversationText.trim()) ||
                        selectedTypes.length === 0 ||
                        isLoading
                    }
                    isLoading={isLoading}
                    onClick={handleSubmit}
                >
                    {isLoading ? 'Analyzing...' : 'Analyze Conversation'}
                </Button>
            </Card>
        </div>
    );
}
