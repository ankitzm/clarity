import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, hint, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-[--color-text-primary] mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`
            w-full h-12 px-4
            bg-[--color-surface] text-[--color-text-primary]
            border rounded-[--radius-md]
            placeholder:text-[--color-text-tertiary]
            transition-all duration-[--transition-fast]
            focus:outline-none focus:ring-2 focus:ring-[--color-accent] focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
                            ? 'border-[--color-error] focus:ring-[--color-error]'
                            : 'border-[--color-border] hover:border-[--color-text-tertiary]'
                        }
            ${className}
          `}
                    {...props}
                />
                {(error || hint) && (
                    <p className={`mt-1.5 text-sm ${error ? 'text-[--color-error]' : 'text-[--color-text-tertiary]'}`}>
                        {error || hint}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
