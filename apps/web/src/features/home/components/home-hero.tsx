import React from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { SportType } from '../../../lib/constants';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  Zap,
  Flame,
  Activity,
  Trophy,
  Swords,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export function HomeHero(): React.ReactElement {
  const [selectedSport, setSelectedSport] = React.useState<string>('');
  const [city, setCity] = React.useState<string>('Hà Nội');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const navigate = useNavigate();

  const sports = [
    { type: '', label: 'Tất cả môn', icon: Flame },
    { type: SportType.FOOTBALL5, label: 'Bóng đá', icon: Activity },
    { type: SportType.PICKLEBALL, label: 'Pickleball', icon: Zap },
    { type: SportType.BADMINTON, label: 'Cầu lông', icon: Swords },
    { type: SportType.TENNIS, label: 'Tennis', icon: Trophy },
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
    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-emerald-950/20 via-card to-background p-6 sm:p-10 lg:p-14 space-y-6 shadow-xs">
      {/* Background Stadium Glow */}
      <div className="absolute top-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>250+ Cụm sân hoạt động trực tuyến</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Đặt Sân Thể Thao & Ghép Kèo Nhanh
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg">
            Hệ thống giữ chỗ thời gian thực, chống trùng lịch và kết nối cộng đồng thể thao tại Hà Nội & TP. Hồ Chí Minh.
          </p>
        </div>

        {/* Quick Trust Badges */}
        <div className="hidden lg:flex flex-col items-end gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/60">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Giữ chỗ 10 phút chống trùng</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/60">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>Xác nhận slot tức thì</span>
          </div>
        </div>
      </div>

      {/* Floating Instant Search Hub */}
      <div className="space-y-3 bg-card/90 border border-border/90 p-4 sm:p-5 rounded-2xl shadow-md backdrop-blur-md">
        {/* Sport Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {sports.map((s) => {
            const isActive = (!selectedSport && !s.type) || selectedSport === s.type;
            return (
              <button
                key={s.type}
                type="button"
                onClick={() => setSelectedSport(s.type)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs shadow-emerald-500/25'
                    : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/40',
                )}
              >
                <s.icon className="h-3.5 w-3.5" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Inputs Form */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Tên sân / Địa chỉ */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Tên sân / Địa chỉ
            </label>
            <Input
              placeholder="VD: Sân Ngọc Khánh, Cầu Giấy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefixIcon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="h-10 text-xs bg-background/80"
            />
          </div>

          {/* Khu vực */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Khu vực
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="Hà Nội">Hà Nội</option>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
            </select>
          </div>

          {/* Chọn ngày */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Thời gian
            </label>
            <select
              defaultValue="today"
              className="flex h-10 w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="today">Hôm nay</option>
              <option value="tomorrow">Ngày mai</option>
              <option value="weekend">Cuối tuần này</option>
            </select>
          </div>

          {/* Nút tìm kiếm */}
          <div className="flex items-end">
            <Button type="submit" className="w-full h-10 gap-2 text-xs font-bold shadow-xs">
              <Compass className="h-4 w-4" />
              <span>Tìm kiếm sân ngay</span>
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
