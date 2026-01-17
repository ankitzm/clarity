import { Card } from '../ui';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ANALYSIS_TYPES } from '../../config/analysisTypes';
import type { AnalysisResult, ViewMode } from '../../types';

interface OutputViewProps {
    results: AnalysisResult[];
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export function OutputView({ results, viewMode, onViewModeChange }: OutputViewProps) {
    if (results.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* View mode switcher */}
            <div className="flex gap-1 p-1 bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] w-fit">
                <button
                    onClick={() => onViewModeChange('text')}
                    className={`
            px-4 py-2 text-sm font-medium rounded-[--radius-md]
            transition-all duration-[--transition-fast]
            ${viewMode === 'text'
                            ? 'bg-[--color-accent] text-white'
                            : 'text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-accent-soft]'
                        }
          `}
                >
                    Rich Text
                </button>
                <button
                    onClick={() => onViewModeChange('mindmap')}
                    className={`
            px-4 py-2 text-sm font-medium rounded-[--radius-md]
            transition-all duration-[--transition-fast]
            ${viewMode === 'mindmap'
                            ? 'bg-[--color-accent] text-white'
                            : 'text-[--color-text-tertiary] cursor-not-allowed'
                        }
          `}
                    disabled
                    title="Coming soon"
                >
                    Mind Map
                </button>
                <button
                    onClick={() => onViewModeChange('json')}
                    className={`
            px-4 py-2 text-sm font-medium rounded-[--radius-md]
            transition-all duration-[--transition-fast]
            ${viewMode === 'json'
                            ? 'bg-[--color-accent] text-white'
                            : 'text-[--color-text-tertiary] cursor-not-allowed'
                        }
          `}
                    disabled
                    title="Coming soon"
                >
                    JSON
                </button>
            </div>

            {/* Results */}
            {viewMode === 'text' && (
                <div className="space-y-6">
                    {results.map((result) => (
                        <Card
                            key={result.type}
                            variant="default"
                            padding="none"
                            className="overflow-hidden"
                        >
                            <div className="px-5 py-4 border-b border-[--color-border] bg-[--color-accent-soft]">
                                <h3 className="font-semibold text-[--color-text-primary] flex items-center gap-2">
                                    <span>{ANALYSIS_TYPES[result.type].icon}</span>
                                    {ANALYSIS_TYPES[result.type].label}
                                </h3>
                                <p className="text-sm text-[--color-text-secondary] mt-0.5">
                                    {ANALYSIS_TYPES[result.type].description}
                                </p>
                            </div>
                            <div className="p-5">
                                {result.content ? (
                                    <MarkdownRenderer content={result.content} />
                                ) : (
                                    <div className="flex items-center gap-2 text-[--color-text-tertiary]">
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Analyzing...
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {viewMode === 'mindmap' && (
                <Card variant="outlined" padding="lg" className="text-center">
                    <div className="text-4xl mb-4">🗺️</div>
                    <h3 className="text-lg font-semibold text-[--color-text-primary] mb-2">
                        Mind Map View
                    </h3>
                    <p className="text-[--color-text-secondary]">
                        Coming soon! This feature will visualize your conversation as an interactive graph.
                    </p>
                </Card>
            )}

            {viewMode === 'json' && (
                <Card variant="outlined" padding="lg" className="text-center">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-lg font-semibold text-[--color-text-primary] mb-2">
                        JSON Export
                    </h3>
                    <p className="text-[--color-text-secondary]">
                        Coming soon! Export your analysis as structured JSON for use with other AI tools.
                    </p>
                </Card>
            )}
        </div>
    );
}
