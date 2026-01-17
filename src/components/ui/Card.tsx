import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', variant = 'default', padding = 'md', children, ...props }, ref) => {
        const variants = {
            default: 'bg-[--color-surface] border border-[--color-border]',
            elevated: 'bg-[--color-surface-elevated] shadow-[--shadow-md]',
            outlined: 'bg-transparent border border-[--color-border]',
        };

        const paddings = {
            none: '',
            sm: 'p-3',
            md: 'p-5',
            lg: 'p-8',
        };

        return (
            <div
                ref={ref}
                className={`
          rounded-[--radius-lg]
          transition-all duration-[--transition-fast]
          ${variants[variant]}
          ${paddings[padding]}
          ${className}
        `}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
