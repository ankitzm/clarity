import { Header } from './components/layout/Header';
import { Card, Button, Input, Chip } from './components/ui';
import { ANALYSIS_TYPES, ANALYSIS_TYPE_KEYS } from './config/analysisTypes';
import { useState } from 'react';
import type { AnalysisTypeKey } from './types';

function App() {
  const [selectedTypes, setSelectedTypes] = useState<AnalysisTypeKey[]>(['summary', 'insights']);

  const toggleType = (type: AnalysisTypeKey) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl animate-fade-in">
          {/* Hero */}
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-[--color-text-primary] mb-4 text-balance">
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
            <Input
              placeholder="Paste ChatGPT share link (chatgpt.com/share/...)"
              className="mb-4"
            />

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
                    >
                      {type.label}
                    </Chip>
                  );
                })}
              </div>
            </div>

            <Button size="lg" className="w-full" disabled={selectedTypes.length === 0}>
              Analyze Conversation
            </Button>
          </Card>

          {/* Hint */}
          <p className="text-center text-sm text-[--color-text-tertiary]">
            💡 Don't have a link? You can also{' '}
            <button className="text-[--color-accent] hover:underline">
              paste conversation text directly
            </button>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-[--color-text-tertiary] border-t border-[--color-border]">
        <p>Built with care for clarity of thought ✨</p>
      </footer>
    </div>
  );
}

export default App;
