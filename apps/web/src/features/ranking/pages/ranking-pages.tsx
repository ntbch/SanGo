import React from 'react';
import { Card } from '../../../components/ui/card';
import {
  Trophy,
  Award,
  Crown,
  Users,
} from 'lucide-react';
import {
  getClubRankingsApi,
  getAthleteRankingsApi,
  type ClubRankingItem,
  type AthleteRankingItem,
} from '../api/ranking-api';
import { CITIES } from '../../../lib/constants';
import { cn } from '../../../lib/utils';

export type RankingTab = 'CLUBS' | 'ATHLETES';

export function RankingPage(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<RankingTab>('CLUBS');
  const [sportFilter, setSportFilter] = React.useState('ALL');
  const [cityFilter, setCityFilter] = React.useState('ALL');
  const [clubRankings, setClubRankings] = React.useState<ClubRankingItem[]>([]);
  const [athleteRankings, setAthleteRankings] = React.useState<AthleteRankingItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchRankings = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [clubs, athletes] = await Promise.all([
        getClubRankingsApi({ sportType: sportFilter, city: cityFilter }),
        getAthleteRankingsApi({ sportType: sportFilter, city: cityFilter }),
      ]);
      setClubRankings(clubs);
      setAthleteRankings(athletes);
    } finally {
      setIsLoading(false);
    }
  }, [sportFilter, cityFilter]);

  React.useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const sportsList = [
    { id: 'ALL', label: 'Tất Cả Môn' },
    { id: 'FOOTBALL', label: 'Bóng Đá' },
    { id: 'PICKLEBALL', label: 'Pickleball' },
    { id: 'BADMINTON', label: 'Cầu Lông' },
    { id: 'TENNIS', label: 'Tennis' },
  ];

  const top3Clubs = clubRankings.slice(0, 3);
  const top3Athletes = athleteRankings.slice(0, 3);

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
            <Trophy className="h-4 w-4" />
            <span>Hệ Thống Xếp Hạng & Bảng Vàng</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Bảng Xếp Hạng Thể Thao SanGo
          </h1>
          <p className="text-xs text-muted-foreground">
            Vinh danh các câu lạc bộ xuất sắc và vận động viên phong trào có điểm uy tín cao nhất tại Hà Nội & TP. Hồ Chí Minh.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
        {/* Sport Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          {sportsList.map((sp) => {
            const isSelected = sportFilter === sp.id;
            return (
              <button
                type="button"
                key={sp.id}
                onClick={() => setSportFilter(sp.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground',
                )}
              >
                {sp.label}
              </button>
            );
          })}
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2">
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer shadow-xs"
          >
            <option value="ALL">Tất cả Thành phố</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border/60 gap-4 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          aria-label="Bảng Xếp Hạng Câu Lạc Bộ"
          onClick={() => setActiveTab('CLUBS')}
          className={cn(
            'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
            activeTab === 'CLUBS'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <Users className="h-4 w-4" />
          <span>Bảng Xếp Hạng Câu Lạc Bộ (Club ELO)</span>
        </button>

        <button
          type="button"
          aria-label="Bảng Vàng Vận Động Viên"
          onClick={() => setActiveTab('ATHLETES')}
          className={cn(
            'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
            activeTab === 'ATHLETES'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <Award className="h-4 w-4" />
          <span>Bảng Vàng Vận Động Viên (MVP & Uy Tín)</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-8 text-center space-y-4 animate-pulse">
              <div className="h-12 w-12 rounded-2xl bg-muted mx-auto" />
              <div className="h-4 w-1/2 bg-muted rounded mx-auto" />
              <div className="h-10 bg-muted rounded-xl" />
            </Card>
          ))}
        </div>
      ) : activeTab === 'CLUBS' ? (
        <div className="space-y-8">
          {/* Top 3 Podium Cards */}
          {top3Clubs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
              {/* Rank 2 - Silver */}
              {top3Clubs[1] && (
                <Card className="order-2 md:order-1 p-6 border border-slate-400/40 bg-gradient-to-b from-slate-400/10 to-card text-center space-y-4 rounded-3xl shadow-lg">
                  <div className="h-12 w-12 rounded-2xl bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center font-black text-xl mx-auto shadow-md">
                    2
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-foreground truncate">{top3Clubs[1].teamName}</h3>
                    <p className="text-xs text-muted-foreground">{top3Clubs[1].city} · {top3Clubs[1].sportType}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Điểm ELO</span>
                    <span className="font-mono-num font-black text-lg text-foreground">{top3Clubs[1].eloScore}</span>
                  </div>
                </Card>
              )}

              {/* Rank 1 - Gold Champion */}
              {top3Clubs[0] && (
                <Card className="order-1 md:order-2 p-8 border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-card text-center space-y-4 rounded-3xl shadow-2xl relative md:-translate-y-4">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Crown className="h-3.5 w-3.5" />
                    <span>Hạng 1 Toàn Bảng</span>
                  </div>
                  <div className="h-16 w-16 rounded-3xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-3xl mx-auto shadow-lg shadow-amber-500/30">
                    1
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-foreground truncate">{top3Clubs[0].teamName}</h3>
                    <p className="text-xs text-muted-foreground">{top3Clubs[0].city} · {top3Clubs[0].sportType}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30">
                    <span className="text-[10px] text-amber-500 uppercase font-bold block">Điểm ELO Vô Địch</span>
                    <span className="font-mono-num font-black text-2xl text-amber-500">{top3Clubs[0].eloScore}</span>
                  </div>
                </Card>
              )}

              {/* Rank 3 - Bronze */}
              {top3Clubs[2] && (
                <Card className="order-3 p-6 border border-amber-700/40 bg-gradient-to-b from-amber-700/10 to-card text-center space-y-4 rounded-3xl shadow-lg">
                  <div className="h-12 w-12 rounded-2xl bg-amber-700/80 text-amber-100 flex items-center justify-center font-black text-xl mx-auto shadow-md">
                    3
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-foreground truncate">{top3Clubs[2].teamName}</h3>
                    <p className="text-xs text-muted-foreground">{top3Clubs[2].city} · {top3Clubs[2].sportType}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Điểm ELO</span>
                    <span className="font-mono-num font-black text-lg text-foreground">{top3Clubs[2].eloScore}</span>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Full Rankings Table */}
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
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top 3 Athletes Podium */}
          {top3Athletes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
              {/* Rank 2 */}
              {top3Athletes[1] && (
                <Card className="order-2 md:order-1 p-6 border border-slate-400/40 bg-gradient-to-b from-slate-400/10 to-card text-center space-y-4 rounded-3xl shadow-lg">
                  <div className="h-12 w-12 rounded-2xl bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center font-black text-xl mx-auto shadow-md">
                    2
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-foreground truncate">{top3Athletes[1].fullName}</h3>
                    <p className="text-xs text-muted-foreground">{top3Athletes[1].city} · {top3Athletes[1].fairPlayBadge}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Điểm Uy Tín</span>
                    <span className="font-mono-num font-black text-lg text-primary">{top3Athletes[1].reputationScore}/100</span>
                  </div>
                </Card>
              )}

              {/* Rank 1 */}
              {top3Athletes[0] && (
                <Card className="order-1 md:order-2 p-8 border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-card text-center space-y-4 rounded-3xl shadow-2xl relative md:-translate-y-4">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Award className="h-3.5 w-3.5" />
                    <span>Vận Động Viên Tiêu Biểu</span>
                  </div>
                  <div className="h-16 w-16 rounded-3xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-3xl mx-auto shadow-lg shadow-amber-500/30">
                    1
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-foreground truncate">{top3Athletes[0].fullName}</h3>
                    <p className="text-xs text-muted-foreground">{top3Athletes[0].city} · {top3Athletes[0].fairPlayBadge}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30">
                    <span className="text-[10px] text-amber-500 uppercase font-bold block">Điểm Uy Tín Tuyệt Đối</span>
                    <span className="font-mono-num font-black text-2xl text-amber-500">
                      {top3Athletes[0].reputationScore} / 100
                    </span>
                  </div>
                </Card>
              )}

              {/* Rank 3 */}
              {top3Athletes[2] && (
                <Card className="order-3 p-6 border border-amber-700/40 bg-gradient-to-b from-amber-700/10 to-card text-center space-y-4 rounded-3xl shadow-lg">
                  <div className="h-12 w-12 rounded-2xl bg-amber-700/80 text-amber-100 flex items-center justify-center font-black text-xl mx-auto shadow-md">
                    3
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-foreground truncate">{top3Athletes[2].fullName}</h3>
                    <p className="text-xs text-muted-foreground">{top3Athletes[2].city} · {top3Athletes[2].fairPlayBadge}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Điểm Uy Tín</span>
                    <span className="font-mono-num font-black text-lg text-primary">{top3Athletes[2].reputationScore}/100</span>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Full Athletes Table */}
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
        </div>
      )}
    </div>
  );
}
