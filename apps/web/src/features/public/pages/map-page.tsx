import { useState, useMemo, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Calendar,
  ChevronRight,
  Crosshair,
  Disc,
  Flame,
  Loader2,
  Search,
  X,
  Zap,
} from 'lucide-react';
import { usePageMeta } from '../../../lib/seo';
import { InteractiveVenuesMap } from '../components/interactive-venues-map';
import { useVenues, useVenuesMap } from '../queries';
import type { MapVenueItem } from '../types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { formatVnd } from '../format';
import { calculateHaversineDistanceKm, formatDistance } from '@sango/shared';
import { useToast } from '../../../components/ui/use-toast';

export function MapPage(): ReactElement {
  usePageMeta(
    'Bản đồ sân thể thao',
    'Khám phá tất cả các cụm sân thể thao trên bản đồ tương tác vệ tinh & giao thông trực quan.',
  );
  const { toast } = useToast();

  const [bbox, setBbox] = useState<string>('');
  const [sportFilter, setSportFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVenue, setSelectedVenue] = useState<MapVenueItem | undefined>(undefined);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const mapQuery = useVenuesMap(bbox ? { bbox, sportType: sportFilter || undefined } : null);
  const allVenuesQuery = useVenues({ page: 1 });

  const mapItems: MapVenueItem[] = useMemo(() => {
    if (mapQuery.data?.items && mapQuery.data.items.length > 0) {
      return mapQuery.data.items.map((item) => ({
        ...item,
        sportTypes: item.sportTypes ?? item.availableSports ?? [],
        availableSports: item.availableSports ?? item.sportTypes ?? [],
      }));
    }
    const fallbackList = allVenuesQuery.data?.items ?? [];
    return fallbackList
      .filter((v) => v.lat && v.lng)
      .map((v) => {
        const prices = (v.courts ?? []).map((c) => c.defaultPricePerSlot).filter(Boolean);
        const minPrice = prices.length > 0 ? Math.min(...prices) : null;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
        const sports = Array.from(new Set((v.courts ?? []).map((c) => c.sportType)));
        return {
          id: v.id,
          name: v.name,
          slug: v.slug,
          address: v.address,
          city: v.city,
          district: v.district,
          lat: v.lat,
          lng: v.lng,
          images: v.images ?? [],
          amenities: v.amenities ?? [],
          depositPercent: v.depositPercent ?? 30,
          openMinute: v.openMinute ?? 360,
          closeMinute: v.closeMinute ?? 1380,
          totalCourts: v.courts?.length ?? 0,
          priceFrom: minPrice,
          priceTo: maxPrice,
          availableSports: sports,
          sportTypes: sports,
          courts: v.courts ?? [],
        };
      });
  }, [mapQuery.data, allVenuesQuery.data]);

  const filteredItems = useMemo(() => {
    return mapItems.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchAddr = item.address.toLowerCase().includes(q);
        if (!matchName && !matchAddr) return false;
      }
      if (sportFilter) {
        const sports = item.availableSports ?? item.sportTypes ?? [];
        if (sportFilter === 'FOOTBALL') {
          if (!sports.some((s) => s === 'FOOTBALL5' || s === 'FOOTBALL7')) return false;
        } else if (sportFilter === 'FOOTBALL5') {
          if (!sports.includes('FOOTBALL5')) return false;
        } else if (sportFilter === 'FOOTBALL7') {
          if (!sports.includes('FOOTBALL7')) return false;
        } else if (!sports.includes(sportFilter)) {
          return false;
        }
      }
      return true;
    });
  }, [mapItems, searchQuery, sportFilter]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Trình duyệt không hỗ trợ GPS',
        description: 'Vui lòng sử dụng trình duyệt hiện đại hơn để tìm vị trí.',
      });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast({
          title: 'Đã xác định vị trí của bạn',
          description: 'Bản đồ đang hiển thị các sân xung quanh bạn.',
        });
      },
      () => {
        setLocating(false);
        toast({
          variant: 'destructive',
          title: 'Không thể lấy vị trí',
          description: 'Vui lòng cho phép quyền truy cập vị trí trong cài đặt trình duyệt.',
        });
      },
      { timeout: 10000 },
    );
  };

  const distanceToSelected = useMemo(() => {
    if (!userCoords || !selectedVenue?.lat || !selectedVenue?.lng) return null;
    const km = calculateHaversineDistanceKm(
      userCoords.lat,
      userCoords.lng,
      selectedVenue.lat,
      selectedVenue.lng,
    );
    return formatDistance(km);
  }, [userCoords, selectedVenue]);

  const isFootballActive = sportFilter.startsWith('FOOTBALL');

  return (
    <div className="relative -mt-8 flex h-[calc(100vh-5rem)] w-full flex-col overflow-hidden">
      {/* Top Floating Glassmorphism Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl border border-border/80 bg-background/90 p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300">
          {/* Ô Tìm kiếm với nút Xoá nhanh */}
          <div className="relative min-w-[180px] sm:min-w-[240px]">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Tìm tên sân hoặc địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-7 rounded-xl text-xs bg-muted/30 border-transparent focus:bg-background focus:border-input transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Xoá tìm kiếm"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="hidden sm:block h-5 w-px bg-border/80" />

          {/* Nhóm nút chọn Môn thể thao (Dàn ngang mượt mà khi bấm Bóng đá) */}
          <div className="hidden sm:flex items-center gap-1">
            {/* Nút Tất cả môn */}
            <button
              type="button"
              onClick={() => setSportFilter('')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                sportFilter === ''
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold scale-[1.02]'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              Tất cả môn
            </button>

            {/* Khối Bóng đá mở rộng ngang */}
            <div
              className={`inline-flex items-center rounded-xl transition-all duration-300 ${
                isFootballActive ? 'bg-primary/10 p-0.5 ring-1 ring-primary/30' : 'bg-transparent'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (isFootballActive && sportFilter === 'FOOTBALL') {
                    setSportFilter('');
                  } else {
                    setSportFilter('FOOTBALL');
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                  isFootballActive
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <Activity className="size-3.5" />
                <span>Bóng đá</span>
              </button>

              {/* Sub-options Sân 5 & Sân 7 dàn sang ngang */}
              {isFootballActive ? (
                <div className="flex items-center gap-0.5 px-1 animate-in fade-in slide-in-from-left-3 duration-200">
                  <button
                    type="button"
                    onClick={() => setSportFilter('FOOTBALL')}
                    className={`rounded-md px-2 py-0.5 text-[11px] transition-all ${
                      sportFilter === 'FOOTBALL'
                        ? 'bg-background text-foreground font-bold shadow-xs ring-1 ring-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setSportFilter('FOOTBALL5')}
                    className={`rounded-md px-2 py-0.5 text-[11px] transition-all ${
                      sportFilter === 'FOOTBALL5'
                        ? 'bg-background text-foreground font-bold shadow-xs ring-1 ring-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                    }`}
                  >
                    Sân 5
                  </button>
                  <button
                    type="button"
                    onClick={() => setSportFilter('FOOTBALL7')}
                    className={`rounded-md px-2 py-0.5 text-[11px] transition-all ${
                      sportFilter === 'FOOTBALL7'
                        ? 'bg-background text-foreground font-bold shadow-xs ring-1 ring-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                    }`}
                  >
                    Sân 7
                  </button>
                </div>
              ) : null}
            </div>

            {/* Cầu lông */}
            <button
              type="button"
              onClick={() => setSportFilter(sportFilter === 'BADMINTON' ? '' : 'BADMINTON')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                sportFilter === 'BADMINTON'
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold scale-[1.02]'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              <Zap className="size-3.5" />
              <span>Cầu lông</span>
            </button>

            {/* Pickleball */}
            <button
              type="button"
              onClick={() => setSportFilter(sportFilter === 'PICKLEBALL' ? '' : 'PICKLEBALL')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                sportFilter === 'PICKLEBALL'
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold scale-[1.02]'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              <Disc className="size-3.5" />
              <span>Pickleball</span>
            </button>

            {/* Tennis */}
            <button
              type="button"
              onClick={() => setSportFilter(sportFilter === 'TENNIS' ? '' : 'TENNIS')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                sportFilter === 'TENNIS'
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold scale-[1.02]'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              <Flame className="size-3.5" />
              <span>Tennis</span>
            </button>
          </div>

          <div className="h-5 w-px bg-border/80" />

          {/* Nút GPS Gần tôi */}
          <Button
            type="button"
            variant={userCoords ? 'default' : 'ghost'}
            size="sm"
            onClick={handleLocateMe}
            disabled={locating}
            className={`rounded-xl h-9 px-3 font-semibold gap-1.5 text-xs transition-all ${
              userCoords
                ? 'shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            {locating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Crosshair
                className={`size-3.5 ${userCoords ? 'text-primary-foreground' : 'text-primary'}`}
              />
            )}
            <span className="hidden sm:inline">Gần tôi</span>
          </Button>
        </div>

        {/* Chip hiển thị số lượng sân */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 rounded-2xl border border-border/80 bg-background/90 px-3.5 py-2 text-xs font-bold text-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{filteredItems.length} cụm sân</span>
        </div>
      </div>

      {/* Main Google Maps Leaflet Layer */}
      <div className="size-full">
        <InteractiveVenuesMap
          items={filteredItems}
          selectedVenueId={selectedVenue?.id}
          onBoundsChange={(newBbox) => setBbox(newBbox)}
          onSelectVenue={(v) => setSelectedVenue(v)}
          initialCenter={userCoords ? [userCoords.lat, userCoords.lng] : [21.0285, 105.8542]}
          initialZoom={userCoords ? 14 : 12}
          className="size-full rounded-none border-none"
        />
      </div>

      {/* Bottom Popup Card khi chọn một sân trên bản đồ */}
      {selectedVenue ? (
        <div className="absolute bottom-6 left-4 right-4 z-20 mx-auto max-w-md pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="relative overflow-hidden rounded-2xl border border-border/90 bg-card/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
            <button
              type="button"
              onClick={() => setSelectedVenue(undefined)}
              className="absolute top-3 right-3 z-10 flex size-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background shadow-xs transition-colors"
              aria-label="Đóng card"
            >
              <X className="size-4" />
            </button>

            <div className="flex gap-4">
              <div className="relative aspect-square size-24 shrink-0 overflow-hidden rounded-xl bg-muted shadow-inner">
                <img
                  src={
                    selectedVenue.images && selectedVenue.images.length > 0
                      ? selectedVenue.images[0]
                      : 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={selectedVenue.name}
                  className="size-full object-cover"
                />
                {distanceToSelected ? (
                  <Badge className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 border-none">
                    {distanceToSelected}
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col justify-between min-w-0 pr-6">
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground line-clamp-1 leading-snug">
                    {selectedVenue.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {selectedVenue.address}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Giá từ</span>
                    <span className="font-mono font-extrabold text-primary text-sm tracking-tight">
                      {selectedVenue.priceFrom ? formatVnd(selectedVenue.priceFrom) : 'Liên hệ'}
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    <Button asChild size="sm" className="rounded-xl font-bold text-xs h-8 px-3 shadow-xs">
                      <Link to={`/venues/${selectedVenue.slug || selectedVenue.id}/book`}>
                        <Calendar className="mr-1 size-3.5" /> Đặt sân
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-xl text-xs h-8 px-2.5">
                      <Link to={`/venues/${selectedVenue.slug || selectedVenue.id}`}>
                        Chi tiết <ChevronRight className="ml-0.5 size-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
