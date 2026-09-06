import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';

export interface SkeletonProps {
  className?: string;
}

export function VenueCardSkeleton({ className }: SkeletonProps = {}): React.ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-border bg-card',
        className,
      )}
    >
      <Skeleton className="w-full sm:w-56 aspect-[4/3] rounded-xl shrink-0" />
      <div className="flex-1 flex flex-col justify-between py-1 space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        </div>
        <div className="flex justify-between items-end pt-3 border-t border-border/60">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SlotMatrixSkeleton({ className }: SkeletonProps = {}): React.ReactElement {
  return (
    <div
      className={cn(
        'space-y-6 rounded-2xl border border-border bg-card p-6',
        className,
      )}
    >
      {/* Shift filter tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      {/* Time slots grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-xl border border-border bg-secondary/20 space-y-2"
          >
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TicketPassSkeleton({ className }: SkeletonProps = {}): React.ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row rounded-2xl border border-border bg-card overflow-hidden',
        className,
      )}
    >
      <div className="p-6 sm:w-2/3 space-y-4 border-b sm:border-b-0 sm:border-r border-border">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-8 w-44" />
        </div>
      </div>
      <div className="p-6 sm:w-1/3 flex flex-col items-center justify-center space-y-3 bg-secondary/20">
        <Skeleton className="h-28 w-28 rounded-lg" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
