import { ThemeToggle } from '../ui';

export function Header() {
    return (
        <header className="
      sticky top-0 z-50
      bg-[--color-background]/80 backdrop-blur-md
      border-b border-[--color-border]
    ">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="
            h-8 w-8 
            rounded-[--radius-md] 
            bg-gradient-to-br from-[--color-accent] to-purple-500
            flex items-center justify-center
            text-white font-bold text-sm
          ">
                        C
                    </div>
                    <span className="font-semibold text-[--color-text-primary] text-lg">
                        Clarity
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        className="
              inline-flex items-center gap-1.5
              h-9 px-3
              text-sm font-medium
              text-[--color-text-secondary]
              rounded-[--radius-md]
              hover:bg-[--color-accent-soft] hover:text-[--color-accent]
              transition-all duration-[--transition-fast]
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
                            <path d="M12 8v4l3 3" />
                            <circle cx="12" cy="12" r="10" />
                        </svg>
                        History
                    </button>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
