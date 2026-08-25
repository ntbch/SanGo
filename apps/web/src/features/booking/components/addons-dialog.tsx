/** Modal "Gọi thêm dịch vụ" (F4) — khách chọn nước/bóng/giày rồi thanh toán ADD_ON riêng. */
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Skeleton } from '../../../components/ui/skeleton';
import { useToast } from '../../../components/ui/use-toast';
import { cn } from '../../../lib/utils';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { formatVnd } from '../../public/format';
import { SERVICE_TYPE_LABELS_FALLBACK } from './service-type-labels';
import {
  useAddBookingAddOns,
  useBookingAddOns,
  useCheckoutBookingAddOns,
  useVenueServices,
} from '../queries';
import type { CustomerBooking } from '../types';

export function AddOnsDialog(options: {
  booking: CustomerBooking | undefined;
  onOpenChange: (open: boolean) => void;
}): ReactElement {
  const { booking, onOpenChange } = options;
  const { toast } = useToast();
  const open = Boolean(booking);

  const servicesQuery = useVenueServices(booking?.venueId);
  const addOnsQuery = useBookingAddOns(open ? booking?.id : undefined);
  const addMutation = useAddBookingAddOns(booking?.id ?? '');
  const checkoutMutation = useCheckoutBookingAddOns();

  /** Số lượng tạm chọn theo từng món — reset khi đổi đơn (bên cha gắn key). */
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const services = servicesQuery.data ?? [];
  const ordered = addOnsQuery.data?.items ?? [];
  const unpaidAmount = addOnsQuery.data?.unpaidAmount ?? 0;
  const selectedTotal = Object.entries(quantities).reduce((sum, [serviceId, qty]) => {
    const svc = services.find((s) => s.id === serviceId);
    return svc ? sum + qty * svc.price : sum;
  }, 0);
  const hasSelection = Object.values(quantities).some((qty) => qty > 0);

  function bump(serviceId: string, delta: number): void {
    setQuantities((prev) => {
      const next = Math.min(100, Math.max(0, (prev[serviceId] ?? 0) + delta));
      return { ...prev, [serviceId]: next };
    });
  }

  function handleAddToOrder(): void {
    if (!booking || !hasSelection) return;
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([serviceId, quantity]) => ({ serviceId, quantity }));
    addMutation.mutate(
      { items },
      {
        onSuccess: () => {
          toast({ title: 'Đã thêm dịch vụ vào đơn' });
          setQuantities({});
        },
        onError: (err) =>
          toast({
            variant: 'destructive',
            title: 'Thêm dịch vụ thất bại',
            description: friendlyApiMessage(err),
          }),
      },
    );
  }

  function handlePay(): void {
    if (!booking) return;
    checkoutMutation.mutate(booking.id, {
      onSuccess: (res) => {
        // Mock gateway hoặc VNPay sandbox — đều redirect như luồng checkout chính.
        window.location.href = res.paymentUrl;
      },
      onError: (err) =>
        toast({
          variant: 'destructive',
          title: 'Tạo lệnh thanh toán thất bại',
          description: friendlyApiMessage(err),
        }),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setQuantities({});
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gọi thêm dịch vụ · {booking?.code}</DialogTitle>
          <DialogDescription>
            Chọn nước uống, bóng hoặc đồ thuê kèm đơn — thanh toán riêng phần dịch vụ.
          </DialogDescription>
        </DialogHeader>

        {/* Phần đã đặt trước đó + số tiền còn nợ */}
        {addOnsQuery.isPending ? (
          <Skeleton className="h-14 w-full rounded-lg" />
        ) : ordered.length > 0 ? (
          <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/40 p-3 text-xs">
            <p className="font-semibold">Đã gọi trong đơn:</p>
            <ul className="space-y-0.5 text-muted-foreground">
              {ordered.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span>
                    {item.service?.name ?? 'Dịch vụ'} × {item.quantity}
                  </span>
                  <span className="font-score">{formatVnd(item.quantity * item.unitPrice)}</span>
                </li>
              ))}
            </ul>
            {unpaidAmount > 0 ? (
              <p className="border-t pt-1 font-semibold text-primary">
                Chưa thanh toán: <span className="font-score">{formatVnd(unpaidAmount)}</span>
              </p>
            ) : (
              <p className="border-t pt-1 text-muted-foreground">Đã thanh toán đủ dịch vụ.</p>
            )}
          </div>
        ) : null}

        {/* Menu đang mở bán */}
        {servicesQuery.isPending ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : servicesQuery.isError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {friendlyApiMessage(servicesQuery.error)}
          </p>
        ) : services.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Cụm sân này chưa mở bán dịch vụ nào.
          </p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {services.map((svc) => {
              const qty = quantities[svc.id] ?? 0;
              return (
                <li
                  key={svc.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2 transition-colors',
                    qty > 0 && 'border-primary/50 bg-primary/5',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{svc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {SERVICE_TYPE_LABELS_FALLBACK[svc.type] ?? svc.type} ·{' '}
                      <span className="font-score">{formatVnd(svc.price)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="size-7 p-0"
                      aria-label={'Bớt ' + svc.name}
                      disabled={qty === 0}
                      onClick={() => bump(svc.id, -1)}
                    >
                      <Minus className="size-3.5" aria-hidden />
                    </Button>
                    <span
                      className="w-6 text-center font-score text-sm font-bold"
                      aria-live="polite"
                    >
                      {qty}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="size-7 p-0"
                      aria-label={'Thêm ' + svc.name}
                      onClick={() => bump(svc.id, 1)}
                    >
                      <Plus className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            variant="secondary"
            disabled={!hasSelection || addMutation.isPending}
            onClick={handleAddToOrder}
          >
            {addMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : (
              <ShoppingBag className="mr-1 size-4" aria-hidden />
            )}
            Thêm vào đơn{selectedTotal > 0 ? ' · ' + formatVnd(selectedTotal) : ''}
          </Button>
          <Button disabled={unpaidAmount <= 0 || checkoutMutation.isPending} onClick={handlePay}>
            {checkoutMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : null}
            Thanh toán {unpaidAmount > 0 ? formatVnd(unpaidAmount) : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
