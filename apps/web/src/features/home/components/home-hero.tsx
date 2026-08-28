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
  Clock,
  QrCode,
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
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10 lg:p-12 shadow-xs space-y-8">
      {/* Centered Minimalist Hero Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        {/* Trust Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-1 text-xs font-semibold text-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>250+ Cụm sân hoạt động trực tuyến tại HN &amp; TP.HCM</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
          Đặt Sân Thể Thao &amp; <span className="text-primary">Ghép Kèo Nhanh</span>
        </h1>

        {/* Concise, Professional Subtitle */}
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Tra cứu lịch trống thời gian thực, giữ chỗ an toàn 10 phút chống trùng ca và quét mã QR check-in 1 giây tại quầy.
        </p>

        {/* Core Value Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/70 border border-border text-xs font-semibold text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>100% Chống trùng ca</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/70 border border-border text-xs font-semibold text-foreground">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Khóa slot 10 phút</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/70 border border-border text-xs font-semibold text-foreground">
            <Users className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Chia quỹ tự động</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/70 border border-border text-xs font-semibold text-foreground">
            <QrCode className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Check-in QR 1 giây</span>
          </div>
        </div>
      </div>

      {/* Floating Instant Search Hub Form */}
      <div className="max-w-4xl mx-auto space-y-4 bg-secondary/40 border border-border p-4 sm:p-6 rounded-2xl shadow-xs">
        {/* Sport Selector Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {sports.map((s) => {
            const isActive = (!selectedSport && !s.type) || selectedSport === s.type;
            return (
              <button
                key={s.type}
                type="button"
                onClick={() => setSelectedSport(s.type)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-[0.98]',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-secondary border border-border',
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

          {/* Khu vực */}
          <div className="space-y-1 text-left">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Khu vực
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="Hà Nội">Hà Nội (140+ Cụm sân)</option>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh (110+ Cụm sân)</option>
            </select>
          </div>

          {/* Chọn ngày */}
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

          {/* Nút tìm kiếm */}
          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full h-10 gap-2 text-xs font-bold shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Compass className="h-4 w-4" />
              <span>Tìm kiếm sân ngay</span>
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
