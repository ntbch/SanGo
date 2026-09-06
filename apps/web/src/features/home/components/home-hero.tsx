import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { SportType } from '../../../lib/constants';
import { Search } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function HomeHero(): React.ReactElement {
  const [selectedSport, setSelectedSport] = React.useState<string>('');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const navigate = useNavigate();

  const sports = [
    { type: '', label: 'Tất cả' },
    { type: SportType.FOOTBALL5, label: 'Bóng đá 5 & 7' },
    { type: SportType.PICKLEBALL, label: 'Pickleball' },
    { type: SportType.BADMINTON, label: 'Cầu lông' },
    { type: SportType.TENNIS, label: 'Tennis' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedSport) params.set('sportType', selectedSport);
    if (searchQuery) params.set('q', searchQuery);
    navigate(`/venues?${params.toString()}`);
  };

  return (
    <section className="w-full max-w-4xl mx-auto text-center py-6 sm:py-12 space-y-6 sm:space-y-8">
      {/* 1. Main Headline & Subtitle */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
          Đặt Sân Thể Thao &amp; Ghép Kèo Nhanh
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          250+ Cụm sân hoạt động trực tuyến tại Hà Nội và TP. Hồ Chí Minh, khóa chỗ 10 phút chống trùng ca và nhận mã QR check-in ngay tại quầy.
        </p>
      </div>

      {/* 2. Centered Unified Search Bar Form */}
      <div className="max-w-2xl mx-auto space-y-4">
        <form
          onSubmit={handleSearch}
          className="relative flex items-center bg-card border border-border/80 rounded-2xl shadow-sm p-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all"
        >
          <div className="pl-3.5 pr-2 text-muted-foreground shrink-0">
            <Search className="h-5 w-5" />
          </div>
          <Input
            placeholder="VD: Ngọc Khánh, Cầu Giấy, Thảo Điền..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 sm:h-12 border-0 bg-transparent shadow-none text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
          />
          <Button
            type="submit"
            size="default"
            aria-label="Tìm kiếm sân ngay"
            className="h-10 sm:h-11 px-5 sm:px-6 rounded-xl text-xs sm:text-sm font-bold shadow-xs active:scale-[0.98] shrink-0 cursor-pointer"
          >
            Tìm kiếm sân ngay
          </Button>
        </form>

        {/* 3. Quick Sports Selector Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {sports.map((s) => {
            const isActive = (!selectedSport && !s.type) || selectedSport === s.type;
            return (
              <button
                key={s.type || 'all'}
                type="button"
                onClick={() => setSelectedSport(s.type)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 cursor-pointer active:scale-[0.98] border',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/60 border-border',
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Trust Metric Strip */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span>
          <strong className="font-mono-num font-bold text-foreground">250+</strong> cụm sân trực tuyến
        </span>
        <span aria-hidden className="text-border select-none">·</span>
        <span>
          <strong className="font-mono-num font-bold text-foreground">10 phút</strong> giữ chỗ chống trùng ca
        </span>
        <span aria-hidden className="text-border select-none">·</span>
        <span>
          <strong className="font-mono-num font-bold text-foreground">QR</strong> check-in tại quầy
        </span>
      </div>
    </section>
  );
}
