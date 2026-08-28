import React from 'react';
import { Trophy, PlusCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface TournamentHeaderProps {
  onCreateTournament: () => void;
}

export function TournamentHeader({ onCreateTournament }: TournamentHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
      <div>
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
          <Trophy className="h-4 w-4" />
          <span>Đấu Trường Thể Thao Phong Trào</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Giải Đấu &amp; Cup Vô Địch
        </h1>
        <p className="text-xs text-muted-foreground">
          Tham gia tranh tài tại các giải đấu phong trào quy mô lớn tại Hà Nội và TP. Hồ Chí Minh.
        </p>
      </div>

      <Button
        onClick={onCreateTournament}
        size="sm"
        className="font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20 self-start sm:self-auto cursor-pointer"
      >
        <PlusCircle className="h-4 w-4" />
        <span>Tạo Giải Đấu</span>
      </Button>
    </div>
  );
}
