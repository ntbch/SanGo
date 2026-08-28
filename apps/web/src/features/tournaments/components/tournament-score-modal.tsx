import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { TournamentMatch } from '../api/tournaments-api';

interface TournamentScoreModalProps {
  match: TournamentMatch | null;
  onClose: () => void;
  homeScore: string;
  onHomeScoreChange: (score: string) => void;
  awayScore: string;
  onAwayScoreChange: (score: string) => void;
  isUpdatingScore: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function TournamentScoreModal({
  match,
  onClose,
  homeScore,
  onHomeScoreChange,
  awayScore,
  onAwayScoreChange,
  isUpdatingScore,
  onSubmit,
}: TournamentScoreModalProps): React.ReactElement | null {
  if (!match) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <h3 className="text-sm font-black text-foreground">Cập Nhật Tỷ Số Trận Đấu</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="space-y-1">
              <label className="font-bold text-foreground block truncate">{match.homeTeam?.name}</label>
              <Input
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => onHomeScoreChange(e.target.value)}
                className="text-center font-mono-num text-base font-black h-10"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-foreground block truncate">{match.awayTeam?.name}</label>
              <Input
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => onAwayScoreChange(e.target.value)}
                className="text-center font-mono-num text-base font-black h-10"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isUpdatingScore}
              size="sm"
              className="font-bold cursor-pointer"
            >
              {isUpdatingScore ? 'Đang lưu...' : 'Lưu Tỷ Số'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
