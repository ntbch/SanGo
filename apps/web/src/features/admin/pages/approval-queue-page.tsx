import { Check, ShieldCheck, X } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Skeleton } from '../../../components/ui/skeleton';

import { friendlyApiMessage } from '../../../lib/api/api-error';
import { cn } from '../../../lib/utils';
import { minutesToTime } from '../../owner/format';
import { useApproveVenue, useAdminVenues, useRejectVenue } from '../queries';
import type { AdminVenueItem } from '../types';

import { VenueStatus } from '@sango/shared';

type StatusFilter = VenueStatus;

const FILTER_LABELS: Record<VenueStatus, string> = {
  [VenueStatus.PENDING]: 'Chờ duyệt',
  [VenueStatus.APPROVED]: 'Đã duyệt',
  [VenueStatus.REJECTED]: 'Bị từ chối',
  [VenueStatus.SUSPENDED]: 'Tạm ngưng',
};

const STATUS_VARIANTS: Record<VenueStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  [VenueStatus.APPROVED]: 'success',
  [VenueStatus.PENDING]: 'warning',
  [VenueStatus.REJECTED]: 'destructive',
  [VenueStatus.SUSPENDED]: 'secondary',
};

/** Trang quản trị: hàng chờ duyệt cụm sân mới — Duyệt hoặc Từ chối (+lý do). */
export function ApprovalQueuePage(): ReactElement {
  const [filter, setFilter] = useState<StatusFilter>(VenueStatus.PENDING);
  const [q, setQ] = useState('');
  const [rejectTarget, setRejectTarget] = useState<AdminVenueItem | undefined>(undefined);
  const [reason, setReason] = useState('');

  const venuesQuery = useAdminVenues({ status: filter, q: q === '' ? undefined : q });
  const approveMutation = useApproveVenue();
  const rejectMutation = useRejectVenue();

  const items = venuesQuery.data?.items ?? [];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
          <ShieldCheck className="size-5 text-primary" aria-hidden /> Quản trị sân
        </h1>
        <p className="text-sm text-muted-foreground">
          Duyệt công khai cụm sân mới hoặc từ chối kèm lý do cho chủ sân sửa.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-1 rounded-full bg-muted p-1">
          {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm transition-colors',
                filter === key
                  ? 'bg-card font-semibold text-foreground shadow-xs'
                  : 'font-medium text-muted-foreground hover:text-foreground',
              )}
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>
        <Input
          placeholder="Tìm theo tên…"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          className="w-full max-w-xs sm:w-64"
          aria-label="Tìm cụm sân"
        />
      </div>

      {venuesQuery.isPending ? (
        <div className="space-y-3">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : null}
      {!venuesQuery.isPending && items.length === 0 ? (
        <p className="rounded-xl border border-dashed py-14 text-center text-sm text-muted-foreground">
          Không có cụm sân nào ở trạng thái này.
        </p>
      ) : null}

      <div className="space-y-3">
        {items.map((venue) => (
          <Card
            key={venue.id}
            className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow duration-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
          >
            <CardContent className="flex flex-wrap items-start gap-4 p-4">
              {venue.images[0] !== undefined ? (
                <img src={venue.images[0]} alt="" className="h-20 w-32 rounded-lg object-cover" />
              ) : (
                <div className="flex h-20 w-32 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-200 to-teal-200 text-2xl font-bold text-emerald-700/50 dark:from-emerald-900 dark:to-teal-900 dark:text-emerald-300/40">
                  {venue.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {venue.name}
                  <Badge
                    variant={STATUS_VARIANTS[venue.status]}
                    className="rounded-full px-2.5 py-1 font-score text-[10px] uppercase tracking-wide"
                  >
                    {FILTER_LABELS[venue.status]}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  {venue.address} · {minutesToTime(venue.openMinute)}–
                  {minutesToTime(venue.closeMinute)} · Cọc {venue.depositPercent ?? 30}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Tiện ích: {venue.amenities.length > 0 ? venue.amenities.join(' · ') : '—'}
                </p>
                {venue.rejectReason ? (
                  <p className="rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
                    Lý do từ chối: {venue.rejectReason}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <Button
                  size="sm"
                  className="rounded-lg font-bold"
                  disabled={approveMutation.isPending}
                  onClick={() => approveMutation.mutate(venue.id)}
                >
                  <Check className="size-3.5" aria-hidden /> Duyệt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setRejectTarget(venue);
                    setReason('');
                  }}
                >
                  <X className="size-3.5" aria-hidden /> Từ chối
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {approveMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {friendlyApiMessage(approveMutation.error)}
        </p>
      ) : null}

      <Dialog
        open={rejectTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(undefined);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Từ chối "{rejectTarget?.name}"</DialogTitle>
            <DialogDescription>
              Lý do sẽ hiển thị cho chủ sân để họ chỉnh sửa và gửi lại.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Lý do từ chối</Label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="vd: Ảnh chưa rõ mặt sân, vui lòng bổ sung tối thiểu 3 ảnh thật"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(undefined)}>
              Quay lại
            </Button>
            <Button
              variant="destructive"
              disabled={reason.trim().length < 5 || rejectMutation.isPending}
              onClick={() => {
                if (rejectTarget !== undefined)
                  rejectMutation.mutate(
                    { id: rejectTarget.id, reason: reason.trim() },
                    { onSuccess: () => setRejectTarget(undefined) },
                  );
              }}
            >
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
