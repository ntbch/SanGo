import React from 'react';
import { Card } from '../../../components/ui/card';

export function RankingSkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-8 text-center space-y-4 animate-pulse">
          <div className="h-12 w-12 rounded-2xl bg-muted mx-auto" />
          <div className="h-4 w-1/2 bg-muted rounded mx-auto" />
          <div className="h-10 bg-muted rounded-xl" />
        </Card>
      ))}
    </div>
  );
}
