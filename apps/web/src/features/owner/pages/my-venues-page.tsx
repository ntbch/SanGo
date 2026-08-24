import { MapPinned, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';

import { friendlyApiMessage } from '../../../lib/api/api-error';
import { cn } from '../../../lib/utils';
import { CourtsPanel } from '../components/courts-panel';
import { PricingEditor } from '../components/pricing-editor';
import { VenueFormDialog } from '../components/venue-form-dialog';
import {
  useCreateVenue,
  useDeleteVenue,
  useMyVenues,
  useUpdateVenue,
  useVenueCourts,
} from '../queries';
import type { VenueFormValues } from '../schemas';
import type { OwnerVenue } from '../types';

const STATUS_BADGES: Record<
  OwnerVenue['status'],
  { label: string; variant: 'success' | 'warning' | 'destructive' }
> = {
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
  PENDING: { label: 'Chờ duyệt', variant: 'warning' },
  REJECTED: { label: 'Bị từ chối', variant: 'destructive' },
};

/** Trang 'Sân của tôi': danh sách cụm sân + panel quản lý sân con & bảng giá. */
export function MyVenuesPage(): ReactElement {
  const venuesQuery = useMyVenues();
  const createMutation = useCreateVenue();
  const updateMutation = useUpdateVenue();
  const deleteMutation = useDeleteVenue();
  const [formOpen, setFormOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<OwnerVenue | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'courts' | 'pricing'>('courts');

  const items = venuesQuery.data?.items ?? [];
  const selected = items.find((venue) => venue.id === selectedId) ?? undefined;
  const courtsQuery = useVenueCourts(selected?.id);
  const courts = courtsQuery.data?.items ?? [];

  function venueToFormValues(venue: OwnerVenue): VenueFormValues {
    return {
      name: venue.name,
      address: venue.address,
      lat: venue.lat,
      lng: venue.lng,
      openHour: Math.floor(venue.openMinute / 60),
      closeHour: Math.ceil(venue.closeMinute / 60),
      depositPercent: venue.depositPercent ?? 30,
      images: venue.images,
      amenities: venue.amenities,
    };
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Sân của tôi</h1>
          <p className="text-sm text-muted-foreground">Quản lý cụm sân, sân con và bảng giá.</p>
        </div>
        <Button
          onClick={() => {
            setEditingVenue(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden /> Tạo cụm sân mới
        </Button>
      </header>

      {venuesQuery.isPending ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : null}
      {venuesQuery.isError ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {friendlyApiMessage(venuesQuery.error)}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_2fr]">
        <div className="space-y-3">
          {items.map((venue) => {
            const badge = STATUS_BADGES[venue.status];
            const isSelected = venue.id === selected?.id;
            return (
              <Card
                key={venue.id}
                className={isSelected ? 'border-primary ring-1 ring-primary' : ''}
              >
                <CardContent className="space-y-2 p-4">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setSelectedId(venue.id)}
                  >
                    <span className="flex items-center justify-between gap-2 font-semibold hover:text-primary">
                      {venue.name}
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </span>
                    <span className="mt-0.5 block line-clamp-1 text-xs text-muted-foreground">
                      {venue.address}
                    </span>
                  </button>
                  {venue.status === 'REJECTED' && venue.rejectReason ? (
                    <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                      Lý do từ chối: {venue.rejectReason}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingVenue(venue);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" aria-hidden /> Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm('Xoá cụm sân này?')) deleteMutation.mutate(venue.id);
                      }}
                    >
                      <Trash2 className="size-3.5" aria-hidden /> Xoá
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!venuesQuery.isPending && items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-14 text-center">
              <MapPinned className="size-8 text-muted-foreground/50" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Chưa có cụm sân nào — tạo ngay để bắt đầu kinh doanh.
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          {selected === undefined ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              Chọn một cụm sân để quản lý sân con và bảng giá.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex w-fit gap-1.5 rounded-lg bg-muted p-1">
                <button
                  type="button"
                  aria-pressed={activeTab === 'courts'}
                  onClick={() => setActiveTab('courts')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
                    activeTab === 'courts'
                      ? 'bg-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <MapPinned className="size-3.5" aria-hidden /> Sân con
                </button>
                <button
                  type="button"
                  aria-pressed={activeTab === 'pricing'}
                  onClick={() => setActiveTab('pricing')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
                    activeTab === 'pricing'
                      ? 'bg-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Tag className="size-3.5" aria-hidden /> Bảng giá
                </button>
              </div>
              {activeTab === 'courts' ? (
                <CourtsPanel venueId={selected.id} />
              ) : (
                <PricingEditor courts={courts} />
              )}
            </div>
          )}
        </div>
      </div>

      <VenueFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        venue={
          editingVenue === undefined
            ? undefined
            : { ...venueToFormValues(editingVenue), id: editingVenue.id }
        }
        submitting={createMutation.isPending || updateMutation.isPending}
        serverError={friendlyApiMessage(createMutation.error ?? updateMutation.error, '')}
        onSubmit={async (values) => {
          const payload = {
            ...values,
            openMinute: values.openHour * 60,
            closeMinute: values.closeHour * 60,
          };
          if (editingVenue === undefined) await createMutation.mutateAsync(payload);
          else await updateMutation.mutateAsync({ id: editingVenue.id, values: payload });
          setFormOpen(false);
          setEditingVenue(undefined);
        }}
      />
    </div>
  );
}
