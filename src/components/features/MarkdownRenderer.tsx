import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Headings
                    h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-[--color-text-primary] mt-6 mb-4 first:mt-0">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-xl font-semibold text-[--color-text-primary] mt-5 mb-3">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-lg font-semibold text-[--color-text-primary] mt-4 mb-2">
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-base font-semibold text-[--color-text-primary] mt-3 mb-2">
                            {children}
                        </h4>
                    ),

                    // Paragraphs
                    p: ({ children }) => (
                        <p className="text-[--color-text-primary] leading-relaxed mb-4 last:mb-0">
                            {children}
                        </p>
                    ),

                    // Lists
                    ul: ({ children }) => (
                        <ul className="list-disc list-outside ml-5 mb-4 space-y-1.5 text-[--color-text-primary]">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-outside ml-5 mb-4 space-y-1.5 text-[--color-text-primary]">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="leading-relaxed">{children}</li>
                    ),

                    // Code
                    code: ({ className, children }) => {
                        const isInline = !className;
                        if (isInline) {
                            return (
                                <code className="px-1.5 py-0.5 bg-[--color-accent-soft] text-[--color-accent] rounded text-sm font-mono">
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code className="block p-4 bg-[--color-background] border border-[--color-border] rounded-[--radius-md] overflow-x-auto font-mono text-sm">
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children }) => (
                        <pre className="mb-4 overflow-hidden rounded-[--radius-md]">
                            {children}
                        </pre>
                    ),

                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[--color-accent] hover:underline"
                        >
                            {children}
                        </a>
                    ),

                    // Blockquote
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-[--color-accent] pl-4 py-1 my-4 bg-[--color-accent-soft] rounded-r-[--radius-md]">
                            {children}
                        </blockquote>
                    ),

                    // Horizontal rule
                    hr: () => (
                        <hr className="my-6 border-[--color-border]" />
                    ),

                    // Tables
                    table: ({ children }) => (
                        <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border border-[--color-border] rounded-[--radius-md]">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-[--color-accent-soft]">{children}</thead>
                    ),
                    th: ({ children }) => (
                        <th className="px-4 py-2 text-left text-sm font-semibold text-[--color-text-primary] border-b border-[--color-border]">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-4 py-2 text-sm text-[--color-text-primary] border-b border-[--color-border]">
                            {children}
                        </td>
                    ),

                    // Strong and emphasis
                    strong: ({ children }) => (
                        <strong className="font-semibold text-[--color-text-primary]">{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic">{children}</em>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
