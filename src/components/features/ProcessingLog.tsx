import { useEffect, useRef } from 'react';
import { Card } from '../ui';
import type { LogEntry } from '../../types';

interface ProcessingLogProps {
    logs: LogEntry[];
    className?: string;
}

export function ProcessingLog({ logs, className = '' }: ProcessingLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs are added
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (logs.length === 0) return null;

    const getLogIcon = (type: LogEntry['type']) => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✗';
            case 'processing':
                return '◌';
            default:
                return '→';
        }
    };

    const getLogStyles = (type: LogEntry['type']) => {
        switch (type) {
            case 'success':
                return 'text-[--color-success]';
            case 'error':
                return 'text-[--color-error]';
            case 'processing':
                return 'text-[--color-accent] animate-pulse-subtle';
            default:
                return 'text-[--color-text-secondary]';
        }
    };

    return (
        <Card
            variant="outlined"
            padding="none"
            className={`overflow-hidden ${className}`}
        >
            <div className="px-4 py-2.5 border-b border-[--color-border] bg-[--color-surface]">
                <h3 className="text-sm font-medium text-[--color-text-primary] flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-[--color-accent] animate-pulse" />
                    Processing Log
                </h3>
            </div>
            <div
                ref={scrollRef}
                className="max-h-48 overflow-y-auto p-4 font-mono text-sm bg-[--color-background]"
            >
                {logs.map((log) => (
                    <div
                        key={log.id}
                        className={`flex items-start gap-2 mb-2 last:mb-0 ${getLogStyles(log.type)}`}
                    >
                        <span className="flex-shrink-0 w-4 text-center">
                            {getLogIcon(log.type)}
                        </span>
                        <span className="text-[--color-text-tertiary] flex-shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            })}
                        </span>
                        <span className="flex-1">{log.message}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}
