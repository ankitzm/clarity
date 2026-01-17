import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    selected?: boolean;
    icon?: string;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
    ({ className = '', selected = false, icon, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                type="button"
                className={`
          inline-flex items-center gap-2
          h-9 px-3.5
          text-sm font-medium
          rounded-[--radius-full]
          border
          transition-all duration-[--transition-fast]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent] focus-visible:ring-offset-2
          active:scale-[0.97]
          ${selected
                        ? 'bg-[--color-accent] text-white border-transparent'
                        : 'bg-[--color-surface] text-[--color-text-secondary] border-[--color-border] hover:border-[--color-accent] hover:text-[--color-accent]'
                    }
          ${className}
        `}
                {...props}
            >
                {icon && <span className="text-base">{icon}</span>}
                {children}
            </button>
        );
    }
);

Chip.displayName = 'Chip';
