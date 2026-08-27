import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from './sidebar';

export function DashboardLayout(): React.ReactElement {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-muted/15">
        <div className="w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
