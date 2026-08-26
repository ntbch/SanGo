/**
 * Trang Quản lý cụm sân (t8) — ADMIN xem TOÀN BỘ cụm sân theo 4 trạng thái
 * (PENDING/APPROVED/REJECTED/SUSPENDED): tìm kiếm + lọc + phân trang.
 * Hành động: APPROVED -> Tạm ngưng, SUSPENDED -> Kích hoạt lại qua
 * PATCH /admin/venues/:id/status {status} sau hộp xác nhận; PENDING chỉ Link
 * sang /dashboard/admin (không duyệt tại đây). SUSPENDED ẩn khỏi tìm kiếm
 * public nên mutation invalidate cả ['admin'] lẫn ['public'].
 */
import { Search } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { VenueStatus } from '@sango/shared';

import { Badge, type BadgeProps } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { toast } from '../../../components/ui/use-toast';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { formatReviewDate } from '../../public/format';
import { useAdminVenues, useSetVenueStatus } from '../queries';
import type { AdminVenueItem } from '../types';

const PAGE_SIZE = 10;
/** Độ trễ debounce ô tìm kiếm (ms). */
const SEARCH_DEBOUNCE_MS = 300;

/** Badge màu riêng cho từng trạng thái — SUSPENDED dùng tông slate theo spec. */
const STATUS_META: Record<
  VenueStatus,
  { label: string; variant: BadgeProps['variant']; className?: string }
> = {
  PENDING: { label: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
  REJECTED: { label: 'Từ chối', variant: 'destructive' },
  SUSPENDED: {
    label: 'Tạm ngừng',
    variant: 'secondary',
    className:
      'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
};

export function AdminVenuesPage(): ReactElement {
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | VenueStatus>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQ(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const venuesQuery = useAdminVenues({
    page,
    limit: PAGE_SIZE,
    q: q !== '' ? q : undefined,
    status: status !== '' ? status : undefined,
  });
  const statusMutation = useSetVenueStatus();

  const rows = venuesQuery.data?.items ?? [];
  const total = venuesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  /** Cụm sân đang mở hộp xác nhận Tạm ngưng/Kích hoạt lại. */
  const [confirmTarget, setConfirmTarget] = useState<
    { venue: AdminVenueItem; next: Extract<VenueStatus, 'APPROVED' | 'SUSPENDED'> } | undefined
  >(undefined);

  const submitStatusChange = (): void => {
    if (confirmTarget === undefined) return;
    const { venue, next } = confirmTarget;
    statusMutation.mutate(
      { id: venue.id, status: next },
      {
        onSuccess: () => {
          setConfirmTarget(undefined);
          toast({
            title:
              next === 'SUSPENDED'
                ? 'Đã tạm ngừng cụm sân ' + venue.name
                : 'Đã kích hoạt lại cụm sân ' + venue.name,
          });
        },
        onError: (error) => {
          // INVALID_STATUS_TRANSITION / VENUE_NOT_FOUND... hiển thị message server.
          toast({
            variant: 'destructive',
            title: 'Cập nhật trạng thái thất bại',
            description: friendlyApiMessage(error),
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Quản lý cụm sân</h1>
        <p className="text-sm text-muted-foreground">
          Toàn bộ cụm sân trên hệ thống — duyệt tại hàng chờ, tạm ngừng/kích hoạt tại đây.
        </p>
      </header>

      {/* Bộ lọc: search debounce + trạng thái */}
      <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <CardHeader className="pb-3">
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Tìm theo tên cụm sân.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm cụm sân…"
              aria-label="Tìm kiếm cụm sân"
              data-testid="admin-venues-search"
              className="pl-9"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="whitespace-nowrap text-muted-foreground">Trạng thái</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as '' | VenueStatus);
                setPage(1);
              }}
              data-testid="admin-filter-status"
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Tất cả</option>
              {(Object.keys(STATUS_META) as VenueStatus[]).map((key) => (
                <option key={key} value={key}>
                  {STATUS_META[key].label}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      {/* Bảng cụm sân */}
      <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <CardHeader className="pb-3">
          <CardTitle>Danh sách cụm sân</CardTitle>
          <CardDescription data-testid="admin-venues-total">
            Hiển thị {rangeStart}–{rangeEnd} trên tổng {total} cụm sân.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {venuesQuery.isPending ? (
            <div className="space-y-3" role="status" aria-label="Đang tải danh sách cụm sân">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : venuesQuery.isError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            >
              {friendlyApiMessage(venuesQuery.error)}
            </p>
          ) : rows.length === 0 ? (
            <p
              data-testid="admin-venues-empty"
              className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground"
            >
              Không tìm thấy cụm sân phù hợp bộ lọc.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table data-testid="admin-venues-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Chủ sân</TableHead>
                      <TableHead>Địa chỉ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((venue, index) => (
                      <TableRow key={venue.id} data-testid={'admin-venue-row-' + index}>
                        <TableCell className="font-medium">{venue.name}</TableCell>
                        <TableCell>{venue.owner?.fullName ?? '—'}</TableCell>
                        <TableCell className="max-w-[220px] truncate">{venue.address}</TableCell>
                        <TableCell>
                          <Badge
                            variant={STATUS_META[venue.status].variant}
                            className={STATUS_META[venue.status].className}
                          >
                            {STATUS_META[venue.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {venue.createdAt ? formatReviewDate(venue.createdAt) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {/* PENDING: không duyệt tại đây — chuyển sang hàng chờ */}
                          {venue.status === 'PENDING' ? (
                            <Link
                              to="/dashboard/admin"
                              data-testid={'admin-venue-review-' + index}
                              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                            >
                              Xét duyệt
                            </Link>
                          ) : venue.status === 'APPROVED' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setConfirmTarget({ venue, next: VenueStatus.SUSPENDED })
                              }
                              data-testid={'admin-venue-toggle-' + index}
                            >
                              Tạm ngưng
                            </Button>
                          ) : venue.status === 'SUSPENDED' ? (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() =>
                                setConfirmTarget({ venue, next: VenueStatus.APPROVED })
                              }
                              data-testid={'admin-venue-toggle-' + index}
                            >
                              Kích hoạt lại
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Phân trang items/total */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Trang {page}/{totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1 || venuesQuery.isFetching}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    data-testid="admin-venues-prev"
                  >
                    Trang trước
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages || venuesQuery.isFetching}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    data-testid="admin-venues-next"
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Hộp xác nhận Tạm ngưng / Kích hoạt lại */}
      <Dialog
        open={confirmTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(undefined);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.next === 'SUSPENDED'
                ? 'Tạm ngừng cụm sân?'
                : 'Kích hoạt lại cụm sân?'}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.next === 'SUSPENDED'
                ? 'Cụm sân sẽ bị ẨN khỏi tìm kiếm public và không nhận đặt sân mới.'
                : 'Cụm sân sẽ hiển thị trở lại và nhận đặt sân bình thường.'}{' '}
              {confirmTarget !== undefined ? '(' + confirmTarget.venue.name + ')' : ''}
            </DialogDescription>
          </DialogHeader>

          {statusMutation.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {friendlyApiMessage(statusMutation.error)}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(undefined)}>
              Huỷ
            </Button>
            <Button
              variant={confirmTarget?.next === 'SUSPENDED' ? 'destructive' : 'default'}
              disabled={statusMutation.isPending}
              onClick={submitStatusChange}
              data-testid="admin-venue-confirm-toggle"
            >
              {confirmTarget?.next === 'SUSPENDED' ? 'Xác nhận tạm ngừng' : 'Xác nhận kích hoạt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
