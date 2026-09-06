import React from 'react';
import { Crown, Award } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { ClubRankingItem, AthleteRankingItem } from '../api/ranking-api';

interface RankingPodiumProps {
  type: 'CLUBS' | 'ATHLETES';
  clubs?: ClubRankingItem[];
  athletes?: AthleteRankingItem[];
}

export function RankingPodium({ type, clubs = [], athletes = [] }: RankingPodiumProps): React.ReactElement | null {
  if (type === 'CLUBS') {
    const top3 = clubs.slice(0, 3);
    if (top3.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
        {/* Rank 2 */}
        {top3[1] && (
          <Card className="order-2 md:order-1 p-6 border border-border/60 bg-card text-center space-y-4 rounded-3xl shadow-xs">
            <div className="h-12 w-12 rounded-xl bg-secondary text-foreground flex items-center justify-center font-mono-num font-black text-xl mx-auto border border-border/60">
              2
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-foreground truncate">{top3[1].teamName}</h3>
              <p className="text-xs text-muted-foreground">{top3[1].city} · {top3[1].sportType}</p>
            </div>
            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Điểm ELO</span>
              <span className="font-mono-num font-black text-lg text-foreground tabular-nums">{top3[1].eloScore}</span>
            </div>
          </Card>
        )}

        {/* Rank 1 - Top elevated */}
        {top3[0] && (
          <Card className="order-1 md:order-2 p-6 sm:p-8 border-2 border-primary/60 bg-card text-center space-y-4 rounded-3xl shadow-sm relative md:-translate-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-mono-num font-bold uppercase tracking-wider">
              <Crown className="h-3.5 w-3.5" />
              <span>Hạng 1 Toàn Bảng</span>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-mono-num font-black text-3xl mx-auto shadow-xs">
              1
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground truncate">{top3[0].teamName}</h3>
              <p className="text-xs text-muted-foreground">{top3[0].city} · {top3[0].sportType}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Điểm ELO Vô Địch</span>
              <span className="font-mono-num font-black text-2xl text-primary tabular-nums">{top3[0].eloScore}</span>
            </div>
          </Card>
        )}

        {/* Rank 3 */}
        {top3[2] && (
          <Card className="order-3 p-6 border border-border/60 bg-card text-center space-y-4 rounded-3xl shadow-xs">
            <div className="h-12 w-12 rounded-xl bg-secondary text-foreground flex items-center justify-center font-mono-num font-black text-xl mx-auto border border-border/60">
              3
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-foreground truncate">{top3[2].teamName}</h3>
              <p className="text-xs text-muted-foreground">{top3[2].city} · {top3[2].sportType}</p>
            </div>
            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Điểm ELO</span>
              <span className="font-mono-num font-black text-lg text-foreground tabular-nums">{top3[2].eloScore}</span>
            </div>
          </Card>
        )}
      </div>
    );
  }

  const top3 = athletes.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
      {/* Rank 2 */}
      {top3[1] && (
        <Card className="order-2 md:order-1 p-6 border border-border/60 bg-card text-center space-y-4 rounded-3xl shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-secondary text-foreground flex items-center justify-center font-mono-num font-black text-xl mx-auto border border-border/60">
            2
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-foreground truncate">{top3[1].fullName}</h3>
            <p className="text-xs text-muted-foreground">{top3[1].city} · {top3[1].fairPlayBadge}</p>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Điểm Uy Tín</span>
            <span className="font-mono-num font-black text-lg text-foreground tabular-nums">{top3[1].reputationScore} / 100</span>
          </div>
        </Card>
      )}

      {/* Rank 1 - Top elevated */}
      {top3[0] && (
        <Card className="order-1 md:order-2 p-6 sm:p-8 border-2 border-primary/60 bg-card text-center space-y-4 rounded-3xl shadow-sm relative md:-translate-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-mono-num font-bold uppercase tracking-wider">
            <Award className="h-3.5 w-3.5" />
            <span>Vận Động Viên Tiêu Biểu</span>
          </div>
          <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-mono-num font-black text-3xl mx-auto shadow-xs">
            1
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-foreground truncate">{top3[0].fullName}</h3>
            <p className="text-xs text-muted-foreground">{top3[0].city} · {top3[0].fairPlayBadge}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Điểm Uy Tín Tuyệt Đối</span>
            <span className="font-mono-num font-black text-2xl text-primary tabular-nums">
              {top3[0].reputationScore} / 100
            </span>
          </div>
        </Card>
      )}

      {/* Rank 3 */}
      {top3[2] && (
        <Card className="order-3 p-6 border border-border/60 bg-card text-center space-y-4 rounded-3xl shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-secondary text-foreground flex items-center justify-center font-mono-num font-black text-xl mx-auto border border-border/60">
            3
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-foreground truncate">{top3[2].fullName}</h3>
            <p className="text-xs text-muted-foreground">{top3[2].city} · {top3[2].fairPlayBadge}</p>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Điểm Uy Tín</span>
            <span className="font-mono-num font-black text-lg text-foreground tabular-nums">{top3[2].reputationScore} / 100</span>
          </div>
        </Card>
      )}
    </div>
  );
}
