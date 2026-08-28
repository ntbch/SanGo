import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVenuesMapApi } from '../api/venues-api';
import { VenueMapView } from '../components/venue-map-view';
import { MapPin } from 'lucide-react';

export function MapPage(): React.ReactElement {
  const [bbox, setBbox] = React.useState<string>('20.95,105.75,21.10,105.95'); // Mặc định Hà Nội
  const [sportType, setSportType] = React.useState<string>('');
  const [search, setSearch] = React.useState<string>('');

  const { data } = useQuery({
    queryKey: ['venues-map', bbox, sportType, search],
    queryFn: () => getVenuesMapApi({ bbox, sportType: sportType || undefined, q: search || undefined }),
    enabled: Boolean(bbox),
  });

  const handleBoundsChange = React.useCallback((newBbox: string) => {
    setBbox((prev) => (prev === newBbox ? prev : newBbox));
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] w-full relative flex flex-col">
      {/* Top Map Action Strip */}
      <div className="z-20 bg-card/90 backdrop-blur-md border-b border-border/80 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-bold text-foreground">Bản Đồ Cụm Sân</h1>
          <span className="text-xs font-mono-num text-muted-foreground">
            ({data?.items?.length || 0} sân hiển thị)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sportType}
            onChange={(e) => setSportType(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background/80 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Tất cả môn</option>
            <option value="FOOTBALL5">Bóng đá</option>
            <option value="PICKLEBALL">Pickleball</option>
            <option value="BADMINTON">Cầu lông</option>
            <option value="TENNIS">Tennis</option>
          </select>

          <input
            type="text"
            placeholder="Tìm tên sân..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-36 sm:w-48 rounded-lg border border-input bg-background/80 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Map Canvas Component */}
      <div className="flex-1 w-full relative">
        <VenueMapView
          venues={data?.items || []}
          onBoundsChange={handleBoundsChange}
        />
      </div>
    </div>
  );
}
