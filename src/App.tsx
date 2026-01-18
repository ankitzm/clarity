import { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { InputSection } from './components/features/InputSection';
import { ProcessingLog } from './components/features/ProcessingLog';
import { OutputView } from './components/features/OutputView';
import { HistoryPanel } from './components/features/HistoryPanel';
import { useAnalysis } from './hooks/useAnalysis';
import { useHistory } from './hooks/useHistory';
import type { AnalysisTypeKey, ViewMode } from './types';

type AppView = 'input' | 'analyzing' | 'results';

function App() {
  const [view, setView] = useState<AppView>('input');
  const [viewMode, setViewMode] = useState<ViewMode>('text');
  const [historyOpen, setHistoryOpen] = useState(false);

  const { session, logs, isLoading, startAnalysis, reset } = useAnalysis();
  const { history, saveSession, getSession, deleteFromHistory, clearHistory } = useHistory();

  // Save session when analysis completes
  useEffect(() => {
    if (session?.status === 'completed' && session.results.length > 0) {
      saveSession(session);
    }
  }, [session, saveSession]);

  const handleAnalyze = async (url: string, types: AnalysisTypeKey[]) => {
    setView('analyzing');
    await startAnalysis(url, types);
    setView('results');
  };

  const handleBackToInput = () => {
    reset();
    setView('input');
  };

  const handleHistorySelect = (id: string) => {
    const savedSession = getSession(id);
    if (savedSession) {
      // For now, just close the panel - in a future update we could restore the session
      setHistoryOpen(false);
      // TODO: Implement session restoration
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onHistoryClick={() => setHistoryOpen(true)} />

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        {view === 'input' && (
          <div className="flex-1 flex items-center justify-center w-full">
            <InputSection onAnalyze={handleAnalyze} isLoading={isLoading} />
          </div>
        )}

        {(view === 'analyzing' || view === 'results') && (
          <div className="w-full max-w-4xl animate-fade-in">
            {/* Back button */}
            <button
              onClick={handleBackToInput}
              className="
                inline-flex items-center gap-1.5 mb-6
                text-sm text-[--color-text-secondary]
                hover:text-[--color-accent]
                transition-colors duration-[--transition-fast]
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              New Analysis
            </button>

            {/* Two column layout on larger screens */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Processing Log */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <ProcessingLog logs={logs} />

                  {/* Session info */}
                  {session?.conversation?.title && (
                    <div className="mt-4 p-4 bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg]">
                      <h3 className="text-sm font-medium text-[--color-text-primary] mb-2">
                        Conversation
                      </h3>
                      <p className="text-sm text-[--color-text-secondary] line-clamp-2">
                        {session.conversation.title}
                      </p>
                      <p className="text-xs text-[--color-text-tertiary] mt-1">
                        {session.conversation.messages.length} messages
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right column - Results */}
              <div className="lg:col-span-2">
                {session?.results && session.results.length > 0 ? (
                  <OutputView
                    results={session.results}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    conversationTitle={session.conversation.title}
                  />
                ) : view === 'analyzing' ? (
                  <div className="bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] p-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 border-4 border-[--color-accent] border-t-transparent rounded-full animate-spin" />
                    <h2 className="text-lg font-semibold text-[--color-text-primary] mb-2">
                      Analyzing your conversation...
                    </h2>
                    <p className="text-[--color-text-secondary]">
                      This may take a moment depending on the conversation length.
                    </p>
                  </div>
                ) : session?.status === 'error' ? (
                  <div className="bg-[--color-error-soft] border border-[--color-error] rounded-[--radius-lg] p-8 text-center">
                    <div className="text-4xl mb-4">❌</div>
                    <h2 className="text-xl font-semibold text-[--color-text-primary] mb-2">
                      Analysis Failed
                    </h2>
                    <p className="text-[--color-text-secondary]">
                      {session.error || 'Something went wrong. Please try again.'}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-[--color-text-tertiary] border-t border-[--color-border]">
        <p>Built with care for clarity of thought ✨</p>
      </footer>

      {/* History Panel */}
      <HistoryPanel
        history={history}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={handleHistorySelect}
        onDelete={deleteFromHistory}
        onClear={clearHistory}
      />
    </div>
  );
}

export default App;
