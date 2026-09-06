import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import { SportType } from '../../../lib/constants';
import { listOpenMatchesApi, OpenMatch } from '../../matches/api/matches-api';
import { Search, ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

function formatCost(vnd: number): string {
  if (!Number.isFinite(vnd)) return '-';
  return `${vnd.toLocaleString('vi-VN')}đ`;
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function OpenMatchRow({ match }: { match: OpenMatch }): React.ReactElement {
  const missing = Math.max(match.totalSlots - match.filledSlots, 0);
  return (
    <li className="py-3 border-b border-border/40 last:border-0 last:pb-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-mono-num font-bold text-muted-foreground uppercase tracking-wider">
            {formatDay(match.date)} · {match.startTime}–{match.endTime}
          </div>
          <div className="text-xs font-bold text-foreground truncate mt-1">{match.title}</div>
          <div className="text-[11px] text-muted-foreground truncate mt-0.5">{match.venueName}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono-num text-xs font-bold text-foreground">{formatCost(match.costPerPerson)}</div>
          <div className="text-[10px] text-muted-foreground mt-1">Thiếu {missing} người</div>
        </div>
      </div>
    </li>
  );
}

export function HomeHero(): React.ReactElement {
  const [selectedSport, setSelectedSport] = React.useState<string>('');
  const [city, setCity] = React.useState<string>('Hà Nội');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const navigate = useNavigate();

  const { data: matches, isLoading } = useQuery({
    queryKey: ['hero-open-matches'],
    queryFn: () => listOpenMatchesApi(),
    staleTime: 60_000,
  });
  const openMatches = (matches ?? []).slice(0, 3);

  const sports = [
    { type: '', label: 'Tất cả môn' },
    { type: SportType.FOOTBALL5, label: 'Bóng đá 5 & 7' },
    { type: SportType.PICKLEBALL, label: 'Pickleball' },
    { type: SportType.BADMINTON, label: 'Cầu lông' },
    { type: SportType.TENNIS, label: 'Tennis' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedSport) params.set('sportType', selectedSport);
    if (city) params.set('city', city);
    if (searchQuery) params.set('q', searchQuery);
    navigate(`/venues?${params.toString()}`);
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* Left: headline + search (7/12) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="space-y-3.5">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.15] max-w-xl">
            Đặt Sân Thể Thao &amp; Ghép Kèo Nhanh
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            250+ Cụm sân hoạt động trực tuyến tại Hà Nội và TP. Hồ Chí Minh, khóa chỗ 10 phút chống trùng ca và nhận mã QR check-in ngay tại quầy.
          </p>
        </div>

        {/* Search hub */}
        <form
          onSubmit={handleSearch}
          className="space-y-4 bg-secondary/50 border border-border p-4 sm:p-5 rounded-xl shadow-xs"
        >
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {sports.map((s) => {
              const isActive = (!selectedSport && !s.type) || selectedSport === s.type;
              return (
                <button
                  key={s.type}
                  type="button"
                  onClick={() => setSelectedSport(s.type)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer active:scale-[0.98]',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-card text-muted-foreground hover:text-foreground hover:bg-secondary border border-border',
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Tên sân / Địa điểm
              </label>
              <Input
                placeholder="VD: Ngọc Khánh, Cầu Giấy, Thảo Điền..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefixIcon={<Search className="h-4 w-4 text-muted-foreground" />}
                className="h-10 text-xs bg-card border-input text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Khu vực
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="Hà Nội">Hà Nội (140+ cụm sân)</option>
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh (110+ cụm sân)</option>
              </select>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Khung giờ &amp; Ngày
              </label>
              <select
                defaultValue="today"
                className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="today">Hôm nay (Tìm slot trống)</option>
                <option value="tomorrow">Ngày mai</option>
                <option value="weekend">Cuối tuần này</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full h-10 text-xs font-bold shadow-xs active:scale-[0.98] cursor-pointer"
              >
                Tìm kiếm sân ngay
              </Button>
            </div>
          </div>
        </form>

        {/* Stat strip: mono numerals, meta separators */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          <span>
            <span className="font-mono-num font-bold text-foreground">250+</span> cụm sân trực tuyến
          </span>
          <span aria-hidden className="text-border select-none">·</span>
          <span>
            <span className="font-mono-num font-bold text-foreground">10 phút</span> giữ chỗ chống trùng ca
          </span>
          <span aria-hidden className="text-border select-none">·</span>
          <span>
            <span className="font-mono-num font-bold text-foreground">QR</span> check-in tại quầy
          </span>
        </div>
      </div>

      {/* Right: live open matches panel (5/12) — real data */}
      <aside className="lg:col-span-5 rounded-2xl border border-border bg-card shadow-xs p-5 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <h2 className="text-sm font-bold text-foreground">Kèo ghép đang mở</h2>
          <Link
            to="/matches"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Xem tất cả
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="pt-1">
          {isLoading ? (
            <ul className="divide-y divide-border/40">
              {[0, 1, 2].map((i) => (
                <li key={i} className="py-3 first:pt-0 last:pb-0">
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-3.5 w-3/4 mb-1.5" />
                  <Skeleton className="h-3 w-1/2" />
                </li>
              ))}
            </ul>
          ) : openMatches.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Chưa có kèo nào đang tìm đối thủ.
              </p>
              <Link to="/matches" className="inline-block text-xs font-bold text-primary hover:underline">
                Mở trung tâm ghép trận
              </Link>
            </div>
          ) : (
            <ul>
              {openMatches.map((match) => (
                <OpenMatchRow key={match.id} match={match} />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </section>
  );
}
