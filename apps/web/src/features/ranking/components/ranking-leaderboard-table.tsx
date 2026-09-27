import React from 'react';
import { Card } from '../../../components/ui/card';
import { EmptyState } from '../../../components/feedback';
import { ClubRankingItem, AthleteRankingItem } from '../api/ranking-api';
import { cn } from '../../../lib/utils';

interface RankingLeaderboardTableProps {
  type: 'CLUBS' | 'ATHLETES';
  clubRankings?: ClubRankingItem[];
  athleteRankings?: AthleteRankingItem[];
  onResetFilters?: () => void;
}

export function RankingLeaderboardTable({
  type,
  clubRankings = [],
  athleteRankings = [],
  onResetFilters,
}: RankingLeaderboardTableProps): React.ReactElement {
  if (type === 'CLUBS') {
    return (
      <Card
        id="tabpanel-clubs"
        role="tabpanel"
        aria-labelledby="tab-clubs"
        className="p-6 border border-border/60 bg-card shadow-xs space-y-4 rounded-3xl overflow-x-auto no-scrollbar"
      >
        <div className="pb-3 border-b border-border/60">
          <h3 className="text-base font-black text-foreground">Bảng Tổng Sắp Câu Lạc Bộ</h3>
          <p className="text-xs text-muted-foreground">Tính điểm theo hệ số ELO thể thao đối kháng.</p>
        </div>

        {clubRankings.length === 0 ? (
          <EmptyState
            title="Chưa có dữ liệu bảng xếp hạng"
            description="Hiện tại chưa có câu lạc bộ nào phù hợp. Hãy thử chọn môn thể thao khác."
            actionLabel="Đặt lại bộ lọc"
            onAction={onResetFilters}
            className="border-border/60 my-2"
          />
        ) : (
          <div className="min-w-[650px]">
            <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-muted-foreground uppercase pb-2.5 border-b border-border/60">
              <span className="col-span-1 text-center">Hạng</span>
              <span className="col-span-6">Câu Lạc Bộ</span>
              <span className="col-span-2 text-center">Thắng - Hòa - Thua</span>
              <span className="col-span-1 text-center">Tỷ Lệ</span>
              <span className="col-span-2 text-right">Điểm ELO</span>
            </div>

            <div className="divide-y divide-border/60">
              {clubRankings.map((c) => (
                <div
                  key={c.teamId}
                  className="grid grid-cols-12 gap-2 items-center py-3.5 text-xs hover:bg-secondary/40 transition-colors rounded-xl px-1"
                >
                  <div className="col-span-1 text-center">
                    <span
                      className={cn(
                        'inline-flex h-6 px-1.5 items-center justify-center rounded-md font-mono-num font-bold text-xs tabular-nums',
                        c.rank === 1
                          ? 'bg-primary/10 text-primary border border-primary/30 font-black'
                          : c.rank === 2 || c.rank === 3
                            ? 'bg-secondary text-foreground font-bold border border-border/60'
                            : 'text-muted-foreground',
                      )}
                    >
                      #{String(c.rank).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="col-span-6 flex items-center gap-2.5 truncate">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 font-mono-num">
                      {c.teamName.charAt(0)}
                    </div>
                    <span className="font-bold text-foreground truncate">{c.teamName}</span>
                  </div>


                  <span className="col-span-2 text-center font-mono-num text-xs tabular-nums text-muted-foreground">
                    {c.wins} - {c.draws} - {c.losses}
                  </span>

                  <span className="col-span-1 text-center font-mono-num font-bold text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                    {c.winRate}%
                  </span>

                  <span className="col-span-2 text-right font-mono-num font-black text-primary text-sm tabular-nums">
                    {c.eloScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card
      id="tabpanel-athletes"
      role="tabpanel"
      aria-labelledby="tab-athletes"
      className="p-6 border border-border/60 bg-card shadow-xs space-y-4 rounded-3xl overflow-x-auto no-scrollbar"
    >
      <div className="pb-3 border-b border-border/60">
        <h3 className="text-base font-black text-foreground">Bảng Vàng Vận Động Viên Phong Trào</h3>
        <p className="text-xs text-muted-foreground">Vinh danh cá nhân theo điểm Uy tín, số trận và danh hiệu.</p>
      </div>

      {athleteRankings.length === 0 ? (
        <EmptyState
          title="Chưa có dữ liệu bảng xếp hạng"
          description="Hiện tại chưa có vận động viên nào phù hợp. Hãy thử chọn môn thể thao khác."
          actionLabel="Đặt lại bộ lọc"
          onAction={onResetFilters}
          className="border-border/60 my-2"
        />
      ) : (
        <div className="min-w-[650px]">
          <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-muted-foreground uppercase pb-2.5 border-b border-border/60">
            <span className="col-span-1 text-center">Hạng</span>
            <span className="col-span-6">Vận Động Viên</span>
            <span className="col-span-2 text-center">Danh Hiệu</span>
            <span className="col-span-1 text-center">Số Trận</span>
            <span className="col-span-2 text-right">Điểm Uy Tín</span>
          </div>

          <div className="divide-y divide-border/60">
            {athleteRankings.map((a) => (
              <div
                key={a.userId}
                className="grid grid-cols-12 gap-2 items-center py-3.5 text-xs hover:bg-secondary/40 transition-colors rounded-xl px-1"
              >
                <div className="col-span-1 text-center">
                  <span
                    className={cn(
                      'inline-flex h-6 px-1.5 items-center justify-center rounded-md font-mono-num font-bold text-xs tabular-nums',
                      a.rank === 1
                        ? 'bg-primary/10 text-primary border border-primary/30 font-black'
                        : a.rank === 2 || a.rank === 3
                          ? 'bg-secondary text-foreground font-bold border border-border/60'
                          : 'text-muted-foreground',
                    )}
                  >
                    #{String(a.rank).padStart(2, '0')}
                  </span>
                </div>

                <div className="col-span-6 flex items-center gap-2.5 truncate">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 font-mono-num">
                    {a.fullName.charAt(0)}
                  </div>
                  <span className="font-bold text-foreground truncate">{a.fullName}</span>
                </div>


                <span className="col-span-2 text-center text-xs font-semibold text-muted-foreground truncate">
                  {a.fairPlayBadge}
                </span>

                <span className="col-span-1 text-center font-mono-num text-xs tabular-nums text-muted-foreground">
                  {a.matchesPlayed}
                </span>

                <span className="col-span-2 text-right font-mono-num font-black text-primary text-sm tabular-nums">
                  {a.reputationScore} / 100
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
