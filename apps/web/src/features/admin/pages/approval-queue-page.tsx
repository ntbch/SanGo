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

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED';

const FILTER_LABELS: Record<StatusFilter, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
};

const STATUS_VARIANTS = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'destructive',
} as const;

/** Trang quản trị: hàng chờ duyệt cụm sân mới — Duyệt hoặc Từ chối (+lý do). */
export function ApprovalQueuePage(): ReactElement {
  const [filter, setFilter] = useState<StatusFilter>('PENDING');
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
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <ShieldCheck className="size-5 text-primary" aria-hidden /> Quản trị sân
        </h1>
        <p className="text-sm text-muted-foreground">
          Duyệt công khai cụm sân mới hoặc từ chối kèm lý do cho chủ sân sửa.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 rounded-lg bg-muted p-1">
          {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition',
                filter === key
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
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
          <Card key={venue.id}>
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
                  <Badge variant={STATUS_VARIANTS[venue.status]}>
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
                  <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
                    Lý do từ chối: {venue.rejectReason}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <Button
                  size="sm"
                  disabled={approveMutation.isPending}
                  onClick={() => approveMutation.mutate(venue.id)}
                >
                  <Check className="size-3.5" aria-hidden /> Duyệt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
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
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
