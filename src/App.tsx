import { useState } from 'react';
import { Header } from './components/layout/Header';
import { InputSection } from './components/features/InputSection';
import { ProcessingLog } from './components/features/ProcessingLog';
import { useAnalysis } from './hooks/useAnalysis';
import type { AnalysisTypeKey } from './types';
import { ANALYSIS_TYPES } from './config/analysisTypes';

type AppView = 'input' | 'analyzing' | 'results';

function App() {
  const [view, setView] = useState<AppView>('input');
  const { session, logs, isLoading, startAnalysis, reset } = useAnalysis();

  const handleAnalyze = async (url: string, types: AnalysisTypeKey[]) => {
    setView('analyzing');
    await startAnalysis(url, types);
    setView('results');
  };

  const handleBackToInput = () => {
    reset();
    setView('input');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

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
                {session?.status === 'completed' || (session?.results && session.results.length > 0) ? (
                  <div className="space-y-6">
                    {/* View mode switcher placeholder */}
                    <div className="flex gap-2 p-1 bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] w-fit">
                      <button className="px-4 py-2 text-sm font-medium rounded-[--radius-md] bg-[--color-accent] text-white">
                        Rich Text
                      </button>
                      <button
                        className="px-4 py-2 text-sm font-medium rounded-[--radius-md] text-[--color-text-tertiary] hover:text-[--color-text-secondary]"
                        disabled
                        title="Coming soon"
                      >
                        Mind Map
                      </button>
                      <button
                        className="px-4 py-2 text-sm font-medium rounded-[--radius-md] text-[--color-text-tertiary] hover:text-[--color-text-secondary]"
                        disabled
                        title="Coming soon"
                      >
                        JSON
                      </button>
                    </div>

                    {/* Results */}
                    {session.results.map((result) => (
                      <div
                        key={result.type}
                        className="bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] overflow-hidden"
                      >
                        <div className="px-5 py-4 border-b border-[--color-border] bg-[--color-accent-soft]">
                          <h3 className="font-semibold text-[--color-text-primary] flex items-center gap-2">
                            <span>{ANALYSIS_TYPES[result.type].icon}</span>
                            {ANALYSIS_TYPES[result.type].label}
                          </h3>
                        </div>
                        <div className="p-5">
                          <div className="prose prose-sm max-w-none text-[--color-text-primary]">
                            {result.content ? (
                              <div className="whitespace-pre-wrap">
                                {result.content}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-[--color-text-tertiary]">
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Analyzing...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
    </div>
  );
}

export default App;
