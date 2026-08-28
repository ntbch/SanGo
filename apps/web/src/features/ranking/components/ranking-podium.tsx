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
        {/* Rank 2 - Silver */}
        {top3[1] && (
          <Card className="order-2 md:order-1 p-6 border border-slate-400/40 bg-gradient-to-b from-slate-400/10 to-card text-center space-y-4 rounded-3xl shadow-lg">
            <div className="h-12 w-12 rounded-2xl bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center font-black text-xl mx-auto shadow-md">
              2
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-foreground truncate">{top3[1].teamName}</h3>
              <p className="text-xs text-muted-foreground">{top3[1].city} · {top3[1].sportType}</p>
            </div>
            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Điểm ELO</span>
              <span className="font-mono-num font-black text-lg text-foreground">{top3[1].eloScore}</span>
            </div>
          </Card>
        )}

        {/* Rank 1 - Gold Champion */}
        {top3[0] && (
          <Card className="order-1 md:order-2 p-8 border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-card text-center space-y-4 rounded-3xl shadow-2xl relative md:-translate-y-4">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
              <Crown className="h-3.5 w-3.5" />
              <span>Hạng 1 Toàn Bảng</span>
            </div>
            <div className="h-16 w-16 rounded-3xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-3xl mx-auto shadow-lg shadow-amber-500/30">
              1
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground truncate">{top3[0].teamName}</h3>
              <p className="text-xs text-muted-foreground">{top3[0].city} · {top3[0].sportType}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30">
              <span className="text-[10px] text-amber-500 uppercase font-bold block">Điểm ELO Vô Địch</span>
              <span className="font-mono-num font-black text-2xl text-amber-500">{top3[0].eloScore}</span>
            </div>
          </Card>
        )}

        {/* Rank 3 - Bronze */}
        {top3[2] && (
          <Card className="order-3 p-6 border border-amber-700/40 bg-gradient-to-b from-amber-700/10 to-card text-center space-y-4 rounded-3xl shadow-lg">
            <div className="h-12 w-12 rounded-2xl bg-amber-700/80 text-amber-100 flex items-center justify-center font-black text-xl mx-auto shadow-md">
              3
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-foreground truncate">{top3[2].teamName}</h3>
              <p className="text-xs text-muted-foreground">{top3[2].city} · {top3[2].sportType}</p>
            </div>
            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Điểm ELO</span>
              <span className="font-mono-num font-black text-lg text-foreground">{top3[2].eloScore}</span>
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
        <Card className="order-2 md:order-1 p-6 border border-slate-400/40 bg-gradient-to-b from-slate-400/10 to-card text-center space-y-4 rounded-3xl shadow-lg">
          <div className="h-12 w-12 rounded-2xl bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center font-black text-xl mx-auto shadow-md">
            2
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-foreground truncate">{top3[1].fullName}</h3>
            <p className="text-xs text-muted-foreground">{top3[1].city} · {top3[1].fairPlayBadge}</p>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Điểm Uy Tín</span>
            <span className="font-mono-num font-black text-lg text-primary">{top3[1].reputationScore}/100</span>
          </div>
        </Card>
      )}

      {/* Rank 1 */}
      {top3[0] && (
        <Card className="order-1 md:order-2 p-8 border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-card text-center space-y-4 rounded-3xl shadow-2xl relative md:-translate-y-4">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
            <Award className="h-3.5 w-3.5" />
            <span>Vận Động Viên Tiêu Biểu</span>
          </div>
          <div className="h-16 w-16 rounded-3xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-3xl mx-auto shadow-lg shadow-amber-500/30">
            1
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-foreground truncate">{top3[0].fullName}</h3>
            <p className="text-xs text-muted-foreground">{top3[0].city} · {top3[0].fairPlayBadge}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30">
            <span className="text-[10px] text-amber-500 uppercase font-bold block">Điểm Uy Tín Tuyệt Đối</span>
            <span className="font-mono-num font-black text-2xl text-amber-500">
              {top3[0].reputationScore} / 100
            </span>
          </div>
        </Card>
      )}

      {/* Rank 3 */}
      {top3[2] && (
        <Card className="order-3 p-6 border border-amber-700/40 bg-gradient-to-b from-amber-700/10 to-card text-center space-y-4 rounded-3xl shadow-lg">
          <div className="h-12 w-12 rounded-2xl bg-amber-700/80 text-amber-100 flex items-center justify-center font-black text-xl mx-auto shadow-md">
            3
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-foreground truncate">{top3[2].fullName}</h3>
            <p className="text-xs text-muted-foreground">{top3[2].city} · {top3[2].fairPlayBadge}</p>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Điểm Uy Tín</span>
            <span className="font-mono-num font-black text-lg text-primary">{top3[2].reputationScore}/100</span>
          </div>
        </Card>
      )}
    </div>
  );
}
