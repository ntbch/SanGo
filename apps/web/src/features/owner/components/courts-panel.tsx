import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Wrench } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';

import { SportType, SPORT_TYPE_LABELS } from '@sango/shared';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { formatVnd } from '../../public/format';
import { useCreateCourt, useRemoveCourt, useUpdateCourt, useVenueCourts } from '../queries';
import { courtFormSchema, type CourtFormValues } from '../schemas';
import type { CourtRow } from '../types';

interface CourtsPanelProps {
  venueId: string;
}

/** Quản lý sân con của một cụm sân: thêm/sửa/xoá + bật/tắt bảo trì. */
export function CourtsPanel({ venueId }: CourtsPanelProps): ReactElement {
  const courtsQuery = useVenueCourts(venueId);
  const createMutation = useCreateCourt(venueId);
  const updateMutation = useUpdateCourt();
  const removeMutation = useRemoveCourt();
  const [editing, setEditing] = useState<CourtRow | 'new' | undefined>(undefined);

  const courts = courtsQuery.data?.items ?? [];

  function toggleMaintenance(court: CourtRow): void {
    updateMutation.mutate({
      courtId: court.id,
      patch: { status: court.status === 'MAINTENANCE' ? 'ACTIVE' : 'MAINTENANCE' },
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Sân con ({courts.length})</CardTitle>
        <Button size="sm" onClick={() => setEditing('new')}>
          Thêm sân con
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {courtsQuery.isPending ? <p className="text-sm text-muted-foreground">Đang tải…</p> : null}
        {!courtsQuery.isPending && courts.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            Cụm sân chưa có sân con nào.
          </p>
        ) : null}
        {courts.map((court) => (
          <div key={court.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium">
                {court.name}
                {court.status === 'MAINTENANCE' ? (
                  <Badge variant="warning">
                    <Wrench className="size-3" aria-hidden /> Bảo trì
                  </Badge>
                ) : (
                  <Badge variant="success">Đang hoạt động</Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {SPORT_TYPE_LABELS[court.sportType as SportType] ?? court.sportType} · slot{' '}
                {court.slotMinutes}′ · từ {formatVnd(court.defaultPricePerSlot)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleMaintenance(court)}
              disabled={updateMutation.isPending}
            >
              {court.status === 'MAINTENANCE' ? 'Bật lại' : 'Bảo trì'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(court)}>
              Sửa
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={removeMutation.isPending}
              onClick={() => {
                if (window.confirm(`Xoá sân con "${court.name}"?`)) removeMutation.mutate(court.id);
              }}
            >
              Xoá
            </Button>
          </div>
        ))}

        <CourtsDialog
          venueId={venueId}
          editing={editing}
          onClose={() => setEditing(undefined)}
          onSubmit={async (values) => {
            if (editing === 'new') await createMutation.mutateAsync(values);
            else if (editing !== undefined)
              await updateMutation.mutateAsync({ courtId: editing.id, patch: values });
            setEditing(undefined);
          }}
        />
      </CardContent>
    </Card>
  );
}

function CourtsDialog({
  venueId,
  editing,
  onClose,
  onSubmit,
}: {
  venueId: string;
  editing: CourtRow | 'new' | undefined;
  onClose: () => void;
  onSubmit: (values: CourtFormValues) => Promise<void>;
}): ReactElement {
  const isEdit = editing !== undefined && editing !== 'new';
  const form = useForm<CourtFormValues>({
    resolver: zodResolver(courtFormSchema),
    values:
      editing !== undefined && editing !== 'new'
        ? {
            name: editing.name,
            sportType: editing.sportType as CourtFormValues['sportType'],
            slotMinutes: editing.slotMinutes as 60 | 90,
            defaultPricePerSlot: editing.defaultPricePerSlot,
          }
        : {
            name: '',
            sportType: 'PICKLEBALL' as const,
            slotMinutes: 60 as const,
            defaultPricePerSlot: 100000,
          },
  });
  return (
    <Dialog
      open={editing !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Sửa sân con' : `Thêm sân con — venue ${venueId.slice(0, 8)}`}
          </DialogTitle>
        </DialogHeader>
        <form
          id="court-form"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
            form.reset();
          })}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="court-name">Tên sân con</Label>
            <Input id="court-name" {...form.register('name')} />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="court-sport">Loại sân</Label>
              <select
                id="court-sport"
                {...form.register('sportType')}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {(Object.values(SportType) as string[]).map((value) => (
                  <option key={value} value={value}>
                    {SPORT_TYPE_LABELS[value as SportType]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="court-slot">Slot (phút)</Label>
              <select
                id="court-slot"
                {...form.register('slotMinutes', { valueAsNumber: true })}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value={60}>60 phút</option>
                <option value={90}>90 phút</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="court-price">Giá mặc định / slot (VND)</Label>
            <Input
              id="court-price"
              type="number"
              min={1000}
              step={1000}
              {...form.register('defaultPricePerSlot')}
            />
            {form.formState.errors.defaultPricePerSlot ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.defaultPricePerSlot.message}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
