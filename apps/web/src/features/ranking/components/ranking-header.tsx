import React from 'react';
import { Trophy } from 'lucide-react';

export function RankingHeader(): React.ReactElement {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
      <div>
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
          <Trophy className="h-4 w-4" />
          <span>Hệ Thống Xếp Hạng &amp; Bảng Vàng</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Bảng Xếp Hạng Thể Thao SanGo
        </h1>
        <p className="text-xs text-muted-foreground">
          Vinh danh các câu lạc bộ xuất sắc và vận động viên phong trào có điểm uy tín cao nhất tại Hà Nội &amp; TP. Hồ Chí Minh.
        </p>
      </div>
    </div>
  );
}
