import React from 'react';
import { cn } from '../../lib/utils';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'narrow' | 'default' | 'wide' | 'full';
  spacing?: 'compact' | 'default' | 'loose';
}

export function PageContainer({
  children,
  size = 'default',
  spacing = 'default',
  className,
  ...props
}: PageContainerProps): React.ReactElement {
  const sizeMap = {
    narrow: 'max-w-4xl',
    default: 'max-w-7xl',
    wide: 'max-w-8xl',
    full: 'max-w-none',
  };

  const spacingMap = {
    compact: 'py-4 sm:py-6 space-y-6',
    default: 'py-6 sm:py-10 space-y-8',
    loose: 'py-8 sm:py-14 space-y-10',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16',
        sizeMap[size],
        spacingMap[spacing],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
