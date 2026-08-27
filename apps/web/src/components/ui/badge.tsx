import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground border border-border/60',
        primary: 'bg-primary/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
        available: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
        peak: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold',
        holding: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30',
        booked: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20 line-through',
        maintenance: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30',
        destructive: 'bg-destructive/15 text-destructive border border-destructive/30',
        outline: 'text-foreground border border-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): React.ReactElement {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
