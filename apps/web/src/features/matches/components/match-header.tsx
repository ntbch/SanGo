import React from 'react';
import { Swords, PlusCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Link } from 'react-router-dom';

export function MatchHeader(): React.ReactElement {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
      <div>
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
          <Swords className="h-4 w-4" />
          <span>Sàn Ghép Trận Thể Thao</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Tìm Kèo Giao Hữu &amp; Tuyển Slot Lẻ
        </h1>
        <p className="text-xs text-muted-foreground">
          Tham gia các trận đấu đang mở tại Hà Nội, TP. Hồ Chí Minh hoặc tìm thêm đối thủ thi đấu thể thao phong trào.
        </p>
      </div>

      <Link to="/venues">
        <Button size="sm" className="font-bold text-xs gap-1.5 shadow-md cursor-pointer">
          <PlusCircle className="h-4 w-4" />
          <span>Tạo Kèo Mới</span>
        </Button>
      </Link>
    </div>
  );
}
