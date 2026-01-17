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
          rounded-full
          transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
          active:scale-[0.97]
          ${selected
                        ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20'
                        : 'bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:ring-indigo-500/30 hover:text-indigo-600'
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
