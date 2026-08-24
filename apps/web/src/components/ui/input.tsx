import { forwardRef, type ComponentPropsWithoutRef, type ReactElement } from 'react';

import { cn } from '../../lib/utils';

export type InputProps = ComponentPropsWithoutRef<'input'>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref): ReactElement => (
    <input
      ref={ref}
      type={type}
      data-testid="input"
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
