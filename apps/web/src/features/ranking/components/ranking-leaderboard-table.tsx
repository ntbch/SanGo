import React from 'react';
import { Card } from '../../../components/ui/card';
import { ClubRankingItem, AthleteRankingItem } from '../api/ranking-api';
import { cn } from '../../../lib/utils';

interface RankingLeaderboardTableProps {
  type: 'CLUBS' | 'ATHLETES';
  clubRankings?: ClubRankingItem[];
  athleteRankings?: AthleteRankingItem[];
}

export function RankingLeaderboardTable({
  type,
  clubRankings = [],
  athleteRankings = [],
}: RankingLeaderboardTableProps): React.ReactElement {
  if (type === 'CLUBS') {
    return (
      <Card className="p-6 border border-border/80 bg-card shadow-md space-y-4 overflow-x-auto no-scrollbar">
        <div className="pb-3 border-b border-border/50">
          <h3 className="text-base font-black text-foreground">Bảng Tổng Sắp Câu Lạc Bộ</h3>
          <p className="text-xs text-muted-foreground">Tính điểm theo chuẩn hệ số ELO thể thao quốc tế.</p>
        </div>

        <div className="min-w-[650px]">
          <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-muted-foreground uppercase pb-2 border-b border-border/40">
            <span className="col-span-1 text-center">Hạng</span>
            <span className="col-span-4">Câu Lạc Bộ</span>
            <span className="col-span-2 text-center">Khu Vực</span>
            <span className="col-span-2 text-center">Thắng - Hòa - Thua</span>
            <span className="col-span-1 text-center">Tỷ Lệ</span>
            <span className="col-span-2 text-right">Điểm ELO</span>
          </div>

          <div className="divide-y divide-border/40">
            {clubRankings.map((c) => (
              <div key={c.teamId} className="grid grid-cols-12 gap-2 items-center py-3.5 text-xs">
                <div className="col-span-1 text-center">
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-lg font-black text-xs font-mono-num',
                      c.rank === 1
                        ? 'bg-amber-500 text-slate-950'
                        : c.rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : c.rank === 3
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-secondary text-muted-foreground',
                    )}
                  >
                    {c.rank}
                  </span>
                </div>

                <div className="col-span-4 flex items-center gap-2.5 truncate">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                    {c.teamName.charAt(0)}
                  </div>
                  <span className="font-bold text-foreground truncate">{c.teamName}</span>
                </div>

                <span className="col-span-2 text-center text-muted-foreground text-[11px] truncate">
                  {c.city}
                </span>

                <span className="col-span-2 text-center font-mono-num text-muted-foreground">
                  {c.wins} - {c.draws} - {c.losses}
                </span>

                <span className="col-span-1 text-center font-mono-num font-bold text-emerald-500">
                  {c.winRate}%
                </span>

                <span className="col-span-2 text-right font-mono-num font-black text-primary text-sm">
                  {c.eloScore}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-4 overflow-x-auto no-scrollbar">
      <div className="pb-3 border-b border-border/50">
        <h3 className="text-base font-black text-foreground">Bảng Vàng Vận Động Viên Phong Trào</h3>
        <p className="text-xs text-muted-foreground">Đánh giá dựa trên Điểm Uy Tín, số trận tham gia và giải đấu.</p>
      </div>

      <div className="min-w-[650px]">
        <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-muted-foreground uppercase pb-2 border-b border-border/40">
          <span className="col-span-1 text-center">Hạng</span>
          <span className="col-span-4">Vận Động Viên</span>
          <span className="col-span-2 text-center">Khu Vực</span>
          <span className="col-span-2 text-center">Danh Hiệu</span>
          <span className="col-span-1 text-center">Số Trận</span>
          <span className="col-span-2 text-right">Điểm Uy Tín</span>
        </div>

        <div className="divide-y divide-border/40">
          {athleteRankings.map((a) => (
            <div key={a.userId} className="grid grid-cols-12 gap-2 items-center py-3.5 text-xs">
              <div className="col-span-1 text-center">
                <span
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-lg font-black text-xs font-mono-num',
                    a.rank === 1
                      ? 'bg-amber-500 text-slate-950'
                      : a.rank === 2
                      ? 'bg-slate-300 text-slate-900'
                      : a.rank === 3
                      ? 'bg-amber-700 text-amber-100'
                      : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {a.rank}
                </span>
              </div>

              <div className="col-span-4 flex items-center gap-2.5 truncate">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                  {a.fullName.charAt(0)}
                </div>
                <span className="font-bold text-foreground truncate">{a.fullName}</span>
              </div>

              <span className="col-span-2 text-center text-muted-foreground text-[11px] truncate">
                {a.city}
              </span>

              <span className="col-span-2 text-center text-[11px] font-bold text-amber-500 truncate">
                {a.fairPlayBadge}
              </span>

              <span className="col-span-1 text-center font-mono-num text-muted-foreground">
                {a.matchesPlayed}
              </span>

              <span className="col-span-2 text-right font-mono-num font-black text-primary text-sm">
                {a.reputationScore} / 100
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
