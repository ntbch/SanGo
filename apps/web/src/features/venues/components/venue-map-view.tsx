import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VenueItem } from '../api/venues-api';
import { Button } from '../../../components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, Star, ArrowRight, X } from 'lucide-react';
import { formatVND } from '../../../lib/utils';

// Hook theo dõi trạng thái Dark mode từ <html> class
function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

// Cache DivIcon để tránh tạo lại DOM icon mỗi lần re-render
const priceIconCache = new Map<string, L.DivIcon>();

function getOrCreatePriceIcon(priceFrom?: number, isSelected = false, isDark = false): L.DivIcon {
  const priceText = priceFrom ? `${Math.round(priceFrom / 1000)}k` : 'Sân';
  const key = `${priceText}_${isSelected ? 'active' : 'normal'}_${isDark ? 'dark' : 'light'}`;

  if (priceIconCache.has(key)) {
    return priceIconCache.get(key)!;
  }

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group transition-transform duration-150 ${
      isSelected ? 'scale-110 z-50 ring-2 ring-amber-400/80 rounded-full' : 'hover:scale-105'
    }">
      <div class="px-2.5 py-1 rounded-full text-xs font-black shadow-md border ${
        isSelected
          ? 'bg-amber-400 text-black border-amber-300 shadow-amber-950/40'
          : isDark
          ? 'bg-emerald-500 text-slate-950 border-emerald-300/80 shadow-black/60 hover:bg-emerald-400 font-bold'
          : 'bg-emerald-600 text-white border-emerald-400/60 shadow-emerald-950/40 hover:bg-emerald-500'
      }">
        ${priceText}
      </div>
      <div class="absolute -bottom-1 w-2 h-2 rotate-45 ${
        isSelected
          ? 'bg-amber-400 border-r border-b border-amber-300'
          : isDark
          ? 'bg-emerald-500 border-r border-b border-emerald-300/80'
          : 'bg-emerald-600 border-r border-b border-emerald-400/60'
      }"></div>
    </div>
  `;

  const icon = L.divIcon({
    html,
    className: 'custom-price-marker',
    iconSize: [48, 28],
    iconAnchor: [24, 28],
  });

  priceIconCache.set(key, icon);
  return icon;
}

// Bắt sự kiện drag/zoom từ người dùng (Debounce và chống re-render loop tuyệt đối)
function MapEventsHandler({
  onBoundsChange,
}: {
  onBoundsChange: (bbox: string) => void;
}) {
  const onBoundsChangeRef = React.useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBboxRef = React.useRef<string>('');

  const reportBounds = React.useCallback((mapInstance: L.Map) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const bounds = mapInstance.getBounds();
      const minLat = bounds.getSouth().toFixed(4);
      const minLng = bounds.getWest().toFixed(4);
      const maxLat = bounds.getNorth().toFixed(4);
      const maxLng = bounds.getEast().toFixed(4);
      const newBbox = `${minLat},${minLng},${maxLat},${maxLng}`;

      if (newBbox !== lastBboxRef.current) {
        lastBboxRef.current = newBbox;
        onBoundsChangeRef.current(newBbox);
      }
    }, 400);
  }, []);

  const map = useMapEvents({
    dragend: () => reportBounds(map),
    zoomend: () => reportBounds(map),
  });

  React.useEffect(() => {
    reportBounds(map);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [map, reportBounds]);

  return null;
}

// Controller kích hoạt invalidateSize khi map mount hoặc container resize
function MapInitController() {
  const map = useMap();
  React.useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Controller xử lý flyTo: Chỉ kích hoạt đúng 1 lần khi đổi sân được chọn
function MapFlyToController({
  venueId,
  lat,
  lng,
}: {
  venueId?: string;
  lat?: number;
  lng?: number;
}) {
  const map = useMap();
  const lastFlyIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (venueId && lat !== undefined && lng !== undefined) {
      if (lastFlyIdRef.current !== venueId) {
        lastFlyIdRef.current = venueId;
        map.flyTo([lat, lng], 15, {
          duration: 0.5,
          animate: true,
        });
      }
    } else {
      lastFlyIdRef.current = null;
    }
  }, [venueId, lat, lng, map]);

  return null;
}

// Component Marker Memoized tránh re-render thừa
const VenueMarker = React.memo(function VenueMarker({
  venue,
  isSelected,
  isDark,
  onClick,
}: {
  venue: VenueItem;
  isSelected: boolean;
  isDark: boolean;
  onClick: (venue: VenueItem) => void;
}) {
  const icon = React.useMemo(
    () => getOrCreatePriceIcon(venue.priceFrom ?? undefined, isSelected, isDark),
    [venue.priceFrom, isSelected, isDark],
  );

  return (
    <Marker
      position={[venue.lat, venue.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(venue),
      }}
    />
  );
});

export interface VenueMapViewProps {
  venues: VenueItem[];
  onBoundsChange: (bbox: string) => void;
  center?: [number, number];
  zoom?: number;
}

export type GoogleMapLayerType = 'google-street' | 'google-satellite' | 'google-terrain';

const GOOGLE_TILES: Record<
  GoogleMapLayerType,
  { name: string; url: string; subdomains: string[]; attribution: string; maxZoom: number }
> = {
  'google-street': {
    name: 'Google Maps',
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20,
  },
  'google-satellite': {
    name: 'Vệ Tinh',
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps Satellite',
    maxZoom: 20,
  },
  'google-terrain': {
    name: 'Địa Hình',
    url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps Terrain',
    maxZoom: 20,
  },
};

export const VenueMapView = React.memo(function VenueMapView({
  venues,
  onBoundsChange,
  center = [21.028511, 105.854444], // Mặc định Hà Nội
  zoom = 13,
}: VenueMapViewProps): React.ReactElement {
  const isDarkMode = useIsDarkMode();
  const [selectedVenue, setSelectedVenue] = React.useState<VenueItem | null>(null);
  const [layerType, setLayerType] = React.useState<GoogleMapLayerType>('google-street');

  const handleMarkerClick = React.useCallback((venue: VenueItem) => {
    setSelectedVenue((prev) => (prev?.id === venue.id ? prev : venue));
  }, []);

  const handleClosePopup = React.useCallback(() => {
    setSelectedVenue(null);
  }, []);

  const currentTile = GOOGLE_TILES[layerType];
  const isSatellite = layerType === 'google-satellite';

  return (
    <div className={`relative h-full w-full overflow-hidden bg-background ${isSatellite ? 'is-satellite-map' : 'is-street-map'}`}>
      {/* Map Layer Mode Switcher */}
      <div className="absolute top-3 right-3 z-20 flex items-center bg-card p-1 rounded-xl border border-border/80 shadow-md gap-1 text-xs">
        {(['google-street', 'google-satellite', 'google-terrain'] as GoogleMapLayerType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setLayerType(t)}
            className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer ${
              layerType === t
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            {GOOGLE_TILES[t].name}
          </button>
        ))}
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full z-10"
        scrollWheelZoom={true}
      >
        <TileLayer
          key={`${layerType}_${isDarkMode ? 'dark' : 'light'}`}
          attribution={currentTile.attribution}
          url={currentTile.url}
          subdomains={currentTile.subdomains}
          maxZoom={currentTile.maxZoom}
        />

        <MapInitController />
        <MapEventsHandler onBoundsChange={onBoundsChange} />
        <MapFlyToController
          venueId={selectedVenue?.id}
          lat={selectedVenue?.lat}
          lng={selectedVenue?.lng}
        />

        {/* Danh sách điểm ghim memoized */}
        {venues.map((venue) => (
          <VenueMarker
            key={venue.id}
            venue={venue}
            isSelected={selectedVenue?.id === venue.id}
            isDark={isDarkMode}
            onClick={handleMarkerClick}
          />
        ))}

        {/* Popup neo trên đỉnh ghim khi sân được chọn */}
        {selectedVenue && (
          <Popup
            key={selectedVenue.id}
            position={[selectedVenue.lat, selectedVenue.lng]}
            offset={[0, -24]}
            autoPan={false}
            closeButton={false}
            closeOnClick={false}
          >
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-72 sm:w-80 rounded-2xl overflow-hidden border border-border/90 bg-card shadow-2xl p-0 animate-in fade-in duration-150"
            >
              {/* 16:9 Image Header */}
              <div className="relative aspect-[16/9] w-full bg-muted overflow-hidden">
                <img
                  src={
                    selectedVenue.images?.[0] && !selectedVenue.images[0].includes('unsplash')
                      ? selectedVenue.images[0]
                      : '/mock-football.svg'
                  }
                  alt={selectedVenue.name}
                  onError={(e) => {
                    e.currentTarget.src = '/mock-football.svg';
                  }}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/45" />

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleClosePopup}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Status Pill */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Đang mở cửa</span>
                </div>

                {/* Rating */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-md text-[11px] font-bold text-amber-400 border border-white/10">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{selectedVenue.avgRating ? Number(selectedVenue.avgRating).toFixed(1) : '5.0'}</span>
                </div>
              </div>

              {/* Popup Info Content */}
              <div className="p-3.5 space-y-2.5">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground line-clamp-1">
                    {selectedVenue.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                    <span>{selectedVenue.address}, {selectedVenue.district}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div>
                    <span className="text-[9px] text-muted-foreground block font-medium">Giá từ</span>
                    <span className="font-mono-num font-extrabold text-xs text-primary">
                      {selectedVenue.priceFrom ? formatVND(selectedVenue.priceFrom) : '250.000 đ'}
                    </span>
                  </div>
                  <Link to={`/venues/${selectedVenue.slug || selectedVenue.id}`}>
                    <Button size="sm" className="h-7 text-xs font-bold gap-1 px-3 shadow-xs">
                      <span>Xem sân</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Popup>
        )}
      </MapContainer>
    </div>
  );
});
