import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Bell } from 'lucide-react';

export function NotificationsPage(): React.ReactElement {
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Thông Báo</h1>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm">
          Đang tải hộp thư thông báo...
        </CardContent>
      </Card>
    </div>
  );
}
