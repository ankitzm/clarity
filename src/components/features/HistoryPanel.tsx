import { Card, Button } from '../ui';
import { ANALYSIS_TYPES } from '../../config/analysisTypes';
import type { HistoryItem } from '../../types';

interface HistoryPanelProps {
    history: HistoryItem[];
    isOpen: boolean;
    onClose: () => void;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onClear: () => void;
}

export function HistoryPanel({
    history,
    isOpen,
    onClose,
    onSelect,
    onDelete,
    onClear
}: HistoryPanelProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="
        fixed right-0 top-0 bottom-0 w-full max-w-md
        bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-2xl
        z-50 animate-slide-in-right
        flex flex-col
      ">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[--color-border]">
                    <h2 className="text-lg font-semibold text-[--color-text-primary]">
                        History
                    </h2>
                    <div className="flex items-center gap-2">
                        {history.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClear}
                                className="text-[--color-error] hover:bg-[--color-error-soft]"
                            >
                                Clear All
                            </Button>
                        )}
                        <button
                            onClick={onClose}
                            className="
                p-2 rounded-[--radius-md]
                text-[--color-text-secondary]
                hover:bg-[--color-accent-soft] hover:text-[--color-accent]
                transition-colors duration-[--transition-fast]
              "
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {history.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">📭</div>
                            <h3 className="text-lg font-medium text-[--color-text-primary] mb-2">
                                No history yet
                            </h3>
                            <p className="text-sm text-[--color-text-secondary]">
                                Your analysis history will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((item) => (
                                <Card
                                    key={item.id}
                                    variant="outlined"
                                    padding="none"
                                    className="hover:border-[--color-accent] transition-colors cursor-pointer group"
                                >
                                    <button
                                        onClick={() => onSelect(item.id)}
                                        className="w-full text-left p-4"
                                    >
                                        <h4 className="font-medium text-[--color-text-primary] line-clamp-1 mb-1 group-hover:text-[--color-accent]">
                                            {item.title}
                                        </h4>
                                        <p className="text-sm text-[--color-text-tertiary] line-clamp-2 mb-2">
                                            {item.preview}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-1">
                                                {item.analysisTypes.slice(0, 3).map((type) => (
                                                    <span key={type} className="text-xs" title={ANALYSIS_TYPES[type].label}>
                                                        {ANALYSIS_TYPES[type].icon}
                                                    </span>
                                                ))}
                                                {item.analysisTypes.length > 3 && (
                                                    <span className="text-xs text-[--color-text-tertiary]">
                                                        +{item.analysisTypes.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-[--color-text-tertiary]">
                                                {formatDate(item.createdAt)}
                                            </span>
                                        </div>
                                    </button>
                                    <div className="px-4 pb-3 flex justify-end">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(item.id);
                                            }}
                                            className="
                        text-xs text-[--color-text-tertiary]
                        hover:text-[--color-error]
                        transition-colors
                      "
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}
