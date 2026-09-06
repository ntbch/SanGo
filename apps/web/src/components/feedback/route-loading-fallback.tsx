import React from 'react';

export function RouteLoadingFallback(): React.ReactElement {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4 p-8 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center shadow-lg animate-pulse">
          <span className="font-black text-primary text-base tracking-tight">SG</span>
        </div>
        <div className="absolute -inset-2 rounded-3xl border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-xs font-bold text-foreground tracking-wide">Đang tải trang...</p>
        <p className="text-[10px] text-muted-foreground">SanGo Sports Hub</p>
      </div>
    </div>
  );
}
