import React from 'react';
import { Card } from '../../../components/ui/card';

export function RankingSkeleton(): React.ReactElement {
  return (
    <div className="space-y-8 pt-4">
      {/* 1. Podium Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        {/* Rank 2 */}
        <Card className="order-2 md:order-1 p-6 text-center space-y-4 rounded-3xl animate-pulse">
          <div className="h-12 w-12 rounded-2xl bg-muted mx-auto" />
          <div className="space-y-1.5">
            <div className="h-4 w-3/5 bg-muted rounded mx-auto" />
            <div className="h-3 w-2/5 bg-muted rounded mx-auto" />
          </div>
          <div className="h-12 bg-muted/60 rounded-2xl" />
        </Card>

        {/* Rank 1 */}
        <Card className="order-1 md:order-2 p-8 text-center space-y-4 rounded-3xl border-2 border-primary/20 animate-pulse md:-translate-y-4">
          <div className="h-16 w-16 rounded-3xl bg-muted mx-auto" />
          <div className="space-y-1.5">
            <div className="h-5 w-4/5 bg-muted rounded mx-auto" />
            <div className="h-3 w-1/2 bg-muted rounded mx-auto" />
          </div>
          <div className="h-14 bg-muted/60 rounded-2xl" />
        </Card>

        {/* Rank 3 */}
        <Card className="order-3 p-6 text-center space-y-4 rounded-3xl animate-pulse">
          <div className="h-12 w-12 rounded-2xl bg-muted mx-auto" />
          <div className="space-y-1.5">
            <div className="h-4 w-3/5 bg-muted rounded mx-auto" />
            <div className="h-3 w-2/5 bg-muted rounded mx-auto" />
          </div>
          <div className="h-12 bg-muted/60 rounded-2xl" />
        </Card>
      </div>

      {/* 2. Leaderboard Table Skeleton */}
      <Card className="p-6 border border-border/80 bg-card shadow-sm space-y-4 rounded-3xl animate-pulse">
        <div className="space-y-1.5 pb-3 border-b border-border/50">
          <div className="h-5 w-48 bg-muted rounded" />
          <div className="h-3 w-72 bg-muted rounded" />
        </div>

        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-muted/40 rounded-2xl flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-lg bg-muted" />
                <div className="h-8 w-8 rounded-xl bg-muted" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
