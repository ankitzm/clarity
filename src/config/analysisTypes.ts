import type { AnalysisType, AnalysisTypeKey } from '../types';

export const ANALYSIS_TYPES: Record<AnalysisTypeKey, AnalysisType> = {
    summary: {
        key: 'summary',
        label: 'Summary',
        icon: '📝',
        description: 'Concise overview of the conversation',
    },
    sentiment: {
        key: 'sentiment',
        label: 'Sentiment',
        icon: '💭',
        description: 'Emotional tone and mood analysis',
    },
    insights: {
        key: 'insights',
        label: 'Key Insights',
        icon: '💡',
        description: 'Important takeaways and learnings',
    },
    actions: {
        key: 'actions',
        label: 'Action Items',
        icon: '✅',
        description: 'Extracted tasks and TODOs',
    },
    qna: {
        key: 'qna',
        label: 'Q&A Pairs',
        icon: '❓',
        description: 'Structured question-answer format',
    },
    learn: {
        key: 'learn',
        label: 'Learn Mode',
        icon: '📚',
        description: 'Educational points and concepts',
    },
    decisions: {
        key: 'decisions',
        label: 'Decisions',
        icon: '⚖️',
        description: 'Key choices and decisions discussed',
    },
    topics: {
        key: 'topics',
        label: 'Topics',
        icon: '🏷️',
        description: 'Main themes and categories',
    },
} as const;

export const ANALYSIS_TYPE_KEYS = Object.keys(ANALYSIS_TYPES) as AnalysisTypeKey[];

export const DEFAULT_SELECTED_TYPES: AnalysisTypeKey[] = ['summary', 'insights', 'actions'];
