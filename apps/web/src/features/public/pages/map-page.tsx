import { useState, useMemo, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Crosshair,
  Loader2,
  MapPin,
  Search,
  X,
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
  usePageMeta('Bản đồ sân thể thao', 'Khám phá tất cả các cụm sân thể thao trên bản đồ tương tác vệ tinh & giao thông trực quan.');
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
      return mapQuery.data.items;
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
        if (!item.sportTypes?.includes(sportFilter)) return false;
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

  return (
    <div className="relative -mt-8 flex h-[calc(100vh-5rem)] w-full flex-col overflow-hidden">
      {/* Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl border border-border/80 bg-background/95 p-2 shadow-xl backdrop-blur-md">
          <div className="relative min-w-[200px] sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm tên sân hoặc địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 rounded-xl text-xs bg-background"
            />
          </div>

          <div className="hidden sm:flex items-center gap-1">
            {[
              { id: '', label: 'Tất cả môn' },
              { id: 'FOOTBALL5', label: 'Bóng đá' },
              { id: 'BADMINTON', label: 'Cầu lông' },
              { id: 'PICKLEBALL', label: 'Pickleball' },
              { id: 'TENNIS', label: 'Tennis' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSportFilter(s.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  sportFilter === s.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLocateMe}
            disabled={locating}
            className="rounded-xl h-10 font-semibold gap-1.5 text-xs"
          >
            {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4 text-primary" />}
            <span>Gần tôi</span>
          </Button>
        </div>

        <div className="pointer-events-auto hidden md:flex items-center gap-1.5 rounded-full border border-border/60 bg-background/90 px-4 py-2 text-xs font-bold text-foreground shadow-md backdrop-blur-md">
          <MapPin className="size-3.5 text-primary" />
          <span>{filteredItems.length} cụm sân trên bản đồ</span>
        </div>
      </div>

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

      {selectedVenue ? (
        <div className="absolute bottom-6 left-4 right-4 z-20 mx-auto max-w-md pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-2xl backdrop-blur-lg">
            <button
              type="button"
              onClick={() => setSelectedVenue(undefined)}
              className="absolute top-3 right-3 z-10 flex size-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-foreground"
              aria-label="Đóng card"
            >
              <X className="size-4" />
            </button>

            <div className="flex gap-4">
              <div className="relative aspect-square size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
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
                  <Badge className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5">
                    {distanceToSelected}
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col justify-between min-w-0">
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground line-clamp-1 leading-tight">
                    {selectedVenue.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {selectedVenue.address}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Giá từ</span>
                    <span className="font-mono font-extrabold text-primary text-sm">
                      {selectedVenue.priceFrom ? formatVnd(selectedVenue.priceFrom) : 'Liên hệ'}
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    <Button asChild size="sm" className="rounded-xl font-bold text-xs h-8 px-3">
                      <Link to={`/venues/${selectedVenue.slug || selectedVenue.id}/book`}>
                        <Calendar className="mr-1 size-3.5" /> Đặt sân
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-xl text-xs h-8 px-2.5">
                      <Link to={`/venues/${selectedVenue.slug || selectedVenue.id}`}>Chi tiết</Link>
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
