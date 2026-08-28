import React from 'react';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface TeamHeaderProps {
  onCreateTeam: () => void;
}

export function TeamHeader({ onCreateTeam }: TeamHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
      <div>
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
          <Users className="h-4 w-4" />
          <span>Phòng Đội Thể Thao</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Đội Nhóm Của Bạn
        </h1>
        <p className="text-xs text-muted-foreground">
          Quản lý thành viên, chia tiền sân tự động và quỹ đội minh bạch.
        </p>
      </div>

      <Button
        onClick={onCreateTeam}
        className="font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20 self-start sm:self-auto cursor-pointer"
      >
        <UserPlus className="h-4 w-4" />
        <span>Tạo Đội Mới</span>
      </Button>
    </div>
  );
}
