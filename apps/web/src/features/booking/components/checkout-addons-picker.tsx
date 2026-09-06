import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../../components/ui/card';
import {
  listPublicVenueServicesApi,
  type VenueServiceItem,
} from '../../venues/api/venue-services-api';
import { formatVND } from '../../../lib/utils';
import { Coffee, Plus, Minus, PackageCheck, Loader2 } from 'lucide-react';

interface CheckoutAddOnsPickerProps {
  venueId: string;
  selectedItems: { serviceId: string; quantity: number }[];
  onChange: (items: { serviceId: string; quantity: number }[]) => void;
  disabled?: boolean;
}

export function CheckoutAddOnsPicker({
  venueId,
  selectedItems,
  onChange,
  disabled = false,
}: CheckoutAddOnsPickerProps): React.ReactElement | null {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['public-venue-services', venueId],
    queryFn: () => listPublicVenueServicesApi(venueId),
    enabled: Boolean(venueId),
  });

  const activeServices = services.filter((s) => s.isActive);

  // Local state for smooth UI without roundtrip latency
  const [localQuantities, setLocalQuantities] = React.useState<Record<string, number>>({});
  const [isDebouncing, setIsDebouncing] = React.useState(false);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync prop changes from outside when not debouncing
  React.useEffect(() => {
    if (!isDebouncing) {
      const map: Record<string, number> = {};
      for (const item of selectedItems) {
        map[item.serviceId] = item.quantity;
      }
      setLocalQuantities(map);
    }
  }, [selectedItems, isDebouncing]);

  const handleSetQuantity = (serviceId: string, qty: number) => {
    const nextQty = Math.max(0, qty);
    const updated = { ...localQuantities, [serviceId]: nextQty };
    setLocalQuantities(updated);
    setIsDebouncing(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const items = Object.entries(updated)
        .filter(([_, q]) => q > 0)
        .map(([sId, quantity]) => ({ serviceId: sId, quantity }));
      onChange(items);
      setIsDebouncing(false);
    }, 400);
  };

  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="p-5 border border-border/80 bg-card space-y-3 animate-pulse">
        <div className="h-4 w-40 bg-secondary rounded" />
        <div className="h-14 w-full bg-secondary/60 rounded-xl" />
      </Card>
    );
  }

  if (activeServices.length === 0) {
    return null;
  }

  const selectedCount = Object.values(localQuantities).reduce((acc, q) => acc + q, 0);

  return (
    <Card className="p-5 border border-border/80 bg-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
          <Coffee className="h-4 w-4" />
          <span>Dịch Vụ &amp; Tiện Ích Đi Kèm Tại Sân</span>
          {isDebouncing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        {selectedCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
            <PackageCheck className="h-3.5 w-3.5" />
            Đã chọn {selectedCount} món
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Chọn nước uống, thuê bóng/vợt để được sân chuẩn bị sẵn trước giờ đá. Thanh toán cùng lúc đặt sân.
      </p>

      <div className="space-y-2.5">
        {activeServices.map((service: VenueServiceItem) => {
          const qty = localQuantities[service.id] || 0;
          return (
            <div
              key={service.id}
              className="p-3 rounded-2xl bg-secondary/40 border border-border/60 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
            >
              <div className="space-y-0.5 min-w-0">
                <span className="text-xs font-bold text-foreground block truncate">
                  {service.name}
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-mono-num font-bold text-primary">
                    {formatVND(service.unitPriceVnd)}
                  </span>
                  <span className="text-muted-foreground">/ {service.unit}</span>
                </div>
              </div>

              {/* Stepper */}
              <div className="flex items-center gap-2 bg-background border border-border p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  disabled={disabled || qty <= 0}
                  onClick={() => handleSetQuantity(service.id, qty - 1)}
                  className="h-6 w-6 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-primary/20 hover:text-primary transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-mono-num font-black text-xs w-6 text-center text-foreground">
                  {qty}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSetQuantity(service.id, qty + 1)}
                  className="h-6 w-6 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-primary/20 hover:text-primary transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
