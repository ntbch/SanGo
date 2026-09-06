import React from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-border bg-card',
        className,
      )}
    >
      <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              size="sm"
              className="font-semibold transition-colors active:scale-[0.98]"
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSecondaryAction}
              className="font-semibold transition-colors active:scale-[0.98]"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
