// ============================================
// CLARITY TYPE DEFINITIONS
// ============================================

// Analysis Types
export type AnalysisTypeKey =
    | 'summary'
    | 'sentiment'
    | 'insights'
    | 'actions'
    | 'qna'
    | 'learn'
    | 'decisions'
    | 'topics';

export interface AnalysisType {
    key: AnalysisTypeKey;
    label: string;
    icon: string;
    description: string;
}

// Conversation Types
export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    url: string;
    fetchedAt: string;
}

// Analysis Results
export interface AnalysisResult {
    type: AnalysisTypeKey;
    content: string;
    completedAt: string;
}

export interface AnalysisSession {
    id: string;
    conversation: Conversation;
    selectedTypes: AnalysisTypeKey[];
    results: AnalysisResult[];
    status: 'idle' | 'fetching' | 'analyzing' | 'completed' | 'error';
    error?: string;
    createdAt: string;
    completedAt?: string;
}

// Processing Log
export interface LogEntry {
    id: string;
    timestamp: string;
    type: 'info' | 'success' | 'error' | 'processing';
    message: string;
}

// History
export interface HistoryItem {
    id: string;
    title: string;
    url: string;
    analysisTypes: AnalysisTypeKey[];
    createdAt: string;
    preview: string;
}

// UI State
export type ViewMode = 'text' | 'mindmap' | 'json';

export type Theme = 'light' | 'dark';

// API Types
export interface FetchChatResponse {
    success: boolean;
    conversation?: Conversation;
    error?: string;
}

export interface AnalyzeResponse {
    success: boolean;
    content?: string;
    error?: string;
}
