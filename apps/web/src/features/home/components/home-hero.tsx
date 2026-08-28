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
  Users,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export function HomeHero(): React.ReactElement {
  const [selectedSport, setSelectedSport] = React.useState<string>('');
  const [city, setCity] = React.useState<string>('Hà Nội');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const navigate = useNavigate();

  const sports = [
    { type: '', label: 'Tất cả môn', icon: Flame },
    { type: SportType.FOOTBALL5, label: 'Bóng đá 5 & 7', icon: Activity },
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
    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-emerald-950/25 via-card to-background p-6 sm:p-10 lg:p-12 space-y-6 shadow-xs">
      {/* Background Stadium Floodlight Glow */}
      <div className="absolute top-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 -z-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          {/* Live Online Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>250+ Cụm sân hoạt động trực tuyến • Khóa slot chống trùng 100%</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.1] text-balance">
            Đặt Sân Thể Thao &amp; <span className="text-primary">Ghép Kèo Nhanh</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
            Nền tảng đặt sân theo thời gian thực và kết nối cộng đồng thể thao phong trào tại Hà Nội &amp; TP. Hồ Chí Minh. Giữ chỗ 10 phút, chia tiền quỹ trận và check-in vé QR 1 giây.
          </p>
        </div>

        {/* Live Sports Activity Card */}
        <div className="w-full lg:w-auto flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between lg:justify-start gap-3 px-3.5 py-2 rounded-2xl bg-card/90 border border-border/80 shadow-xs backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-foreground">Hoạt động trực tiếp:</span>
            </div>
            <span className="text-muted-foreground font-mono-num text-[11px]">Sân 7A Cầu Giấy vừa chốt ca 19:30</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/80 border border-border/60">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="text-[11px] font-medium text-foreground">Giữ slot 10:00 an toàn</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/80 border border-border/60">
              <Users className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-[11px] font-medium text-foreground">Chia tiền quỹ 5v5 / 7v7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Instant Search Hub */}
      <div className="space-y-3.5 bg-card/95 border border-border/90 p-4 sm:p-5 rounded-2xl shadow-md backdrop-blur-md">
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
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-[0.98]',
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
              Tên sân / Địa điểm
            </label>
            <Input
              placeholder="VD: Sân Ngọc Khánh, Cầu Giấy, Thảo Điền..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefixIcon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="h-10 text-xs bg-background/90"
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
              className="flex h-10 w-full rounded-xl border border-input bg-background/90 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="Hà Nội">Hà Nội</option>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
            </select>
          </div>

          {/* Chọn ngày */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Khung giờ & Ngày
            </label>
            <select
              defaultValue="today"
              className="flex h-10 w-full rounded-xl border border-input bg-background/90 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="today">Hôm nay (Tìm slot trống)</option>
              <option value="tomorrow">Ngày mai</option>
              <option value="weekend">Cuối tuần này</option>
            </select>
          </div>

          {/* Nút tìm kiếm */}
          <div className="flex items-end">
            <Button type="submit" className="w-full h-10 gap-2 text-xs font-bold shadow-xs active:scale-[0.98]">
              <Compass className="h-4 w-4" />
              <span>Tìm kiếm sân ngay</span>
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
