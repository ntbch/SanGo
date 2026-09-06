import React from 'react';
import { VenueItem } from '../api/venues-api';
import { Star, MapPin, ChevronLeft, ChevronRight, Share2, Navigation, Clock } from 'lucide-react';
import { formatMinutesToTime } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

export interface VenueGalleryProps {
  venue: VenueItem;
}

const DEFAULT_IMAGES = [
  '/mock-football.svg',
  '/mock-pickleball.svg',
  '/mock-badminton.svg',
  '/mock-tennis.svg',
];

export function VenueGallery({ venue }: VenueGalleryProps): React.ReactElement {
  const images =
    venue.images && venue.images.length > 0 && !venue.images[0].includes('unsplash')
      ? venue.images
      : DEFAULT_IMAGES;
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [copied, setCopied] = React.useState(false);

  const now = new Date();
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const openMin = typeof venue.openMinute === 'number' ? venue.openMinute : 360;
  const closeMin = typeof venue.closeMinute === 'number' ? venue.closeMinute : 1380;
  const isOpen = currentMinute >= openMin && currentMinute <= closeMin;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${venue.name} ${venue.address} ${venue.district} ${venue.city}`,
    )}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {venue.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span>{venue.address ? `${venue.address}, ` : ''}{venue.district}, {venue.city}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={openGoogleMaps}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Navigation className="h-3.5 w-3.5 text-primary" />
            <span>Chỉ đường</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>{copied ? 'Đã sao chép link' : 'Chia sẻ'}</span>
          </Button>
        </div>
      </div>

      {/* Main Image Banner Container */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-3xl overflow-hidden bg-muted border border-border/80 shadow-md group">
        <img
          src={images[activeIndex]}
          alt={`${venue.name} - Ảnh ${activeIndex + 1}`}
          className="h-full w-full object-cover transition-all duration-500"
        />
        <div className="absolute inset-0 bg-black/45 pointer-events-none" />

        {/* Prev / Next Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/75 text-white hover:bg-black/90 cursor-pointer z-20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/75 text-white hover:bg-black/90 cursor-pointer z-20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white border border-white/10">
              <span
                className={`h-2 w-2 rounded-full ${
                  isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span>{isOpen ? 'Đang mở cửa' : 'Đã đóng cửa'}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-zinc-300 border border-white/10 font-mono-num">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{formatMinutesToTime(openMin)} - {formatMinutesToTime(closeMin)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-black/75 px-3 py-1 rounded-xl text-xs font-bold text-amber-400 border border-white/10">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-mono-num">{venue.avgRating ? Number(venue.avgRating).toFixed(1) : '5.0'}</span>
            <span className="text-[10px] text-zinc-400 font-normal">({venue.reviewsCount ?? 24} đánh giá)</span>
          </div>
        </div>

        {/* Image Counter Badge */}
        <div className="absolute bottom-4 right-4 bg-black/75 px-3 py-1 rounded-xl text-xs font-mono-num font-semibold text-white border border-white/10">
          {activeIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails Strip */}
      {images.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative aspect-[16/10] w-20 sm:w-24 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                activeIndex === idx
                  ? 'border-primary ring-2 ring-primary/30 scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
