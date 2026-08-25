/** Trung tâm thông báo (F8) — lọc theo nhóm/chưa đọc, đánh dấu đã đọc, phân trang. */
import { Bell, CheckCheck, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { NotificationType } from '@courthub/shared';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { cn } from '../../../lib/utils';
import { formatRelativeTime } from '../format';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsCenter,
} from '../queries';
import { NOTIFICATION_TYPE_META } from '../type-meta';
import type { AppNotification } from '../types';

const PAGE_SIZE = 10;

/** Nhóm loại hiển thị thành chip lọc — BE chưa có param filter nên lọc trên trang hiện tại. */
type FilterKind =
  { kind: 'all' } | { kind: 'unread' } | { kind: 'group'; types: NotificationType[] };

const FILTER_GROUPS: Array<{ key: string; label: string; types: NotificationType[] }> = [
  {
    key: 'booking',
    label: 'Đặt sân',
    types: [
      NotificationType.BOOKING_CONFIRMED,
      NotificationType.BOOKING_CANCELLED,
      NotificationType.NEW_BOOKING_OWNER,
      NotificationType.REMINDER,
    ],
  },
  {
    key: 'money',
    label: 'Thanh toán & Ví',
    types: [NotificationType.PAYMENT_RECEIVED, NotificationType.WALLET],
  },
  { key: 'voucher', label: 'Voucher', types: [NotificationType.VOUCHER] },
  {
    key: 'match',
    label: 'Ghép trận',
    types: [NotificationType.MATCH_JOINED, NotificationType.MATCH_LEFT],
  },
  { key: 'team', label: 'Đội & Giải', types: [NotificationType.TEAM, NotificationType.TOURNAMENT] },
  { key: 'service', label: 'Dịch vụ', types: [NotificationType.SERVICE] },
];

function matchFilter(item: AppNotification, filter: FilterKind): boolean {
  if (filter.kind === 'all') return true;
  if (filter.kind === 'unread') return item.readAt === null;
  return filter.types.includes(item.type);
}

function CenterRow(options: {
  item: AppNotification;
  onOpen: (item: AppNotification) => void;
}): ReactElement {
  const { item, onOpen } = options;
  const meta = NOTIFICATION_TYPE_META[item.type];
  const unread = item.readAt === null;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        'flex w-full items-start gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none',
        unread && 'bg-primary/[0.04]',
      )}
    >
      <span className="mt-0.5 shrink-0" aria-hidden>
        <meta.Icon className={cn('size-5', meta.className)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {unread ? <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden /> : null}
          <span className={cn('block truncate text-sm', unread ? 'font-semibold' : 'font-medium')}>
            {item.title}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{item.body}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground/80">
          {formatRelativeTime(item.createdAt)}
        </span>
      </span>
    </button>
  );
}

export function NotificationsPage(): ReactElement {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterKind>({ kind: 'all' });

  const query = useNotificationsCenter(page);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = query.data?.items ?? [];
  const unreadCount = query.data?.unreadCount ?? 0;
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const visible = items.filter((item) => matchFilter(item, filter));

  function handleOpen(item: AppNotification): void {
    if (item.readAt === null) markRead.mutate(item.id);
    if (item.link !== null && item.link !== '') navigate(item.link);
  }

  const chipBase = 'rounded-full border px-3 py-1 text-xs font-semibold transition-colors';
  const chipOff = 'border-border/60 bg-muted/50 text-muted-foreground hover:bg-accent';
  const chipOn = 'border-primary bg-primary text-primary-foreground';

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Thông báo</h1>
          <p className="text-sm text-muted-foreground">Hộp thư hoạt động của bạn trên CourtHub.</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <Badge variant="secondary" data-testid="unread-badge">
              {unreadCount} chưa đọc
            </Badge>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="gap-1 rounded-lg font-semibold"
            disabled={markAllRead.isPending || unreadCount === 0}
            onClick={() => markAllRead.mutate()}
          >
            {markAllRead.isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <CheckCheck className="size-3.5" aria-hidden />
            )}
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
      </header>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc thông báo">
        <button
          type="button"
          className={cn(chipBase, filter.kind === 'all' ? chipOn : chipOff)}
          onClick={() => setFilter({ kind: 'all' })}
        >
          Tất cả
        </button>
        <button
          type="button"
          className={cn(chipBase, filter.kind === 'unread' ? chipOn : chipOff)}
          onClick={() => setFilter({ kind: 'unread' })}
        >
          Chưa đọc
        </button>
        {FILTER_GROUPS.map((group) => (
          <button
            key={group.key}
            type="button"
            className={cn(
              chipBase,
              filter.kind === 'group' && filter.types === group.types ? chipOn : chipOff,
            )}
            onClick={() => setFilter({ kind: 'group', types: group.types })}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* Danh sách */}
      <Card className="rounded-xl border-border/60 p-0">
        <CardContent className="p-0">
          {query.isPending ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : query.isError ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Không tải được thông báo. Thử lại sau ít phút.
            </p>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <Bell className="size-8 text-muted-foreground/40" aria-hidden />
              <p className="text-sm font-semibold">Không có thông báo nào trong mục này</p>
              <p className="text-xs text-muted-foreground">Chọn một bộ lọc khác để xem thêm.</p>
            </div>
          ) : (
            <div role="list" aria-label="Danh sách thông báo">
              {visible.map((item) => (
                <CenterRow key={item.id} item={item} onOpen={handleOpen} />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Trang {page}/{totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" aria-hidden /> Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Sau <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
