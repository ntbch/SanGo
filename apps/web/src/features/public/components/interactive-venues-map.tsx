/**
 * F5 Map nâng cao: Bản đồ tương tác Leaflet kèm Ghim giá tức thì (Price Pins),
 * debounce viewport bounding box khi di chuyển/zoom và preview popup đặt sân.
 */
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { Calendar, MapPin } from 'lucide-react';
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router-dom';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { formatVnd } from '../format';
import type { MapVenueItem } from '../types';

export interface InteractiveVenuesMapProps {
  items: MapVenueItem[];
  selectedVenueId?: string;
  hoveredVenueId?: string;
  onBoundsChange: (bbox: string) => void;
  onSelectVenue?: (venue: MapVenueItem) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  className?: string;
}

/** Format giá rút gọn hiển thị trên ghim bản đồ (ví dụ: '120k', '120k - 200k', '—'). */
export function formatPinPrice(priceFrom: number | null, priceTo: number | null): string {
  if (priceFrom === null || priceFrom === undefined) return 'Xem giá';
  const toK = (val: number): string => {
    const k = Math.round(val / 1000);
    return `${k}k`;
  };
  if (priceTo !== null && priceTo !== undefined && priceTo > priceFrom) {
    return `${toK(priceFrom)} - ${toK(priceTo)}`;
  }
  return toK(priceFrom);
}

/** Tạo HTML divIcon cho ghim hiển thị giá tiền nổi bật trên nền xanh brand. */
function createPricePinIcon(label: string, isSelected: boolean, isHovered: boolean): L.DivIcon {
  const activeClass = isSelected
    ? 'bg-primary text-primary-foreground ring-4 ring-primary/30 scale-110 z-50 shadow-xl'
    : isHovered
      ? 'bg-primary/95 text-primary-foreground ring-2 ring-primary/40 scale-105 z-40 shadow-lg'
      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md';

  const html = `
    <div class="relative flex items-center justify-center transition-all duration-200 cursor-pointer">
      <div class="px-2.5 py-1 rounded-full font-bold text-xs whitespace-nowrap border-2 border-white ${activeClass}">
        ${label}
      </div>
      <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r-2 border-b-2 border-white ${isSelected || isHovered ? 'bg-primary' : 'bg-emerald-600'}"></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-price-pin',
    html,
    iconSize: [80, 32],
    iconAnchor: [40, 32],
    popupAnchor: [0, -32],
  });
}

/** Hook lắng nghe di chuyển / zoom của bản đồ kèm debounce 300ms. */
function ViewportTracker({ onBoundsChange }: { onBoundsChange: (bbox: string) => void }): null {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const emitBounds = (map: L.Map) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      // Format đúng chuẩn BE: minLat,minLng,maxLat,maxLng
      const minLat = Number(sw.lat.toFixed(6));
      const minLng = Number(sw.lng.toFixed(6));
      const maxLat = Number(ne.lat.toFixed(6));
      const maxLng = Number(ne.lng.toFixed(6));
      const bbox = `${minLat},${minLng},${maxLat},${maxLng}`;
      onBoundsChange(bbox);
    }, 300);
  };

  const map = useMapEvents({
    moveend: () => emitBounds(map),
    zoomend: () => emitBounds(map),
  });

  // Bắn toạ độ lần đầu khi map load
  useEffect(() => {
    emitBounds(map);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [map]);

  return null;
}

/** Điều khiển flyTo khi chọn một venue cụ thể. */
function MapFlyController({ target }: { target?: [number, number] }): null {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 15, { duration: 1 });
    }
  }, [target, map]);
  return null;
}

export function InteractiveVenuesMap({
  items,
  selectedVenueId,
  hoveredVenueId,
  onBoundsChange,
  onSelectVenue,
  initialCenter = [21.0285, 105.8542], // Hà Nội center
  initialZoom = 12,
  className = 'size-full min-h-[450px]',
}: InteractiveVenuesMapProps): ReactElement {
  const selectedVenue = useMemo(
    () => items.find((v) => v.id === selectedVenueId),
    [items, selectedVenueId],
  );

  const flyTarget =
    selectedVenue?.lat && selectedVenue?.lng
      ? ([selectedVenue.lat, selectedVenue.lng] as [number, number])
      : undefined;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border/60 shadow-inner ${className}`}
    >
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom
        className="size-full z-0"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ViewportTracker onBoundsChange={onBoundsChange} />
        <MapFlyController target={flyTarget} />

        {items.map((venue) => {
          if (!venue.lat || !venue.lng) return null;
          const isSelected = venue.id === selectedVenueId;
          const isHovered = venue.id === hoveredVenueId;
          const pinLabel = formatPinPrice(venue.priceFrom, venue.priceTo);
          const icon = createPricePinIcon(pinLabel, isSelected, isHovered);

          const imgCover =
            venue.images && venue.images.length > 0
              ? venue.images[0]
              : 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=400&q=80';

          return (
            <Marker
              key={venue.id}
              position={[venue.lat, venue.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectVenue?.(venue),
              }}
            >
              <Popup className="custom-venue-popup" minWidth={260} maxWidth={320}>
                <div className="space-y-2 p-1 text-foreground">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
                    <img
                      src={imgCover}
                      alt={venue.name}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                    {venue.depositPercent ? (
                      <Badge className="absolute top-2 right-2 bg-black/60 text-white backdrop-blur-xs text-[10px]">
                        Cọc {venue.depositPercent}%
                      </Badge>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-sm leading-tight text-primary line-clamp-1">
                      {venue.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 line-clamp-1">
                      <MapPin className="size-3 shrink-0" />
                      {venue.address}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Giá từ</span>
                      <span className="font-bold text-primary text-sm font-score">
                        {venue.priceFrom ? formatVnd(venue.priceFrom) : 'Liên hệ'}
                      </span>
                    </div>
                    <Button asChild size="sm" className="h-8 rounded-lg text-xs font-bold gap-1">
                      <Link to={`/venues/${venue.slug || venue.id}`}>
                        <Calendar className="size-3.5" /> Đặt sân
                      </Link>
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
