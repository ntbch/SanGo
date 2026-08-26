/**
 * Trang Quản lý người dùng (t7) — dành cho ADMIN:
 * tìm kiếm debounce, lọc vai trò/trạng thái, bảng phân trang và khoá/mở khoá
 * tài khoản qua PATCH /admin/users/:id/status (hộp xác nhận + toast lỗi
 * CANNOT_LOCK_SELF/CANNOT_LOCK_ADMIN). Ẩn nút khoá với chính mình và mọi ADMIN.
 */
import { Ban, CircleCheck, Search } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

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
import { useAuthStore } from '../../../lib/auth/auth-store';
import { useAdminUsers, useSetUserStatus } from '../queries';
import type { AdminUserItem, AdminUserRole, AdminUserStatus } from '../types';
import { formatReviewDate } from '../../public/format';

const PAGE_SIZE = 10;
/** Độ trễ debounce ô tìm kiếm (ms) — tránh gọi API mỗi phím gõ. */
const SEARCH_DEBOUNCE_MS = 300;

const ROLE_META: Record<AdminUserRole, { label: string; variant: BadgeProps['variant'] }> = {
  CUSTOMER: { label: 'Khách hàng', variant: 'secondary' },
  OWNER: { label: 'Chủ sân', variant: 'success' },
  ADMIN: { label: 'Quản trị', variant: 'warning' },
};

const STATUS_META: Record<AdminUserStatus, { label: string; variant: BadgeProps['variant'] }> = {
  ACTIVE: { label: 'Đang hoạt động', variant: 'success' },
  LOCKED: { label: 'Đã khoá', variant: 'destructive' },
};

/** Ô chọn nhỏ dùng chung cho bộ lọc — native select cho nhẹ dependency. */
function FilterSelect(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}): ReactElement {
  const { label, value, onChange, testId, options } = props;
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="whitespace-nowrap text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        data-testid={testId}
        className="h-9 rounded-lg border border-input bg-background px-2 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdminUsersPage(): ReactElement {
  const currentUser = useAuthStore((state) => state.user);

  // Bộ lọc + phân trang
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'' | AdminUserRole>('');
  const [status, setStatus] = useState<'' | AdminUserStatus>('');
  const [page, setPage] = useState(1);

  // Debounce ô search: chỉ cập nhật q sau khi ngừng gõ SEARCH_DEBOUNCE_MS.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQ(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const usersQuery = useAdminUsers({
    page,
    limit: PAGE_SIZE,
    q: q !== '' ? q : undefined,
    role: role !== '' ? role : undefined,
    status: status !== '' ? status : undefined,
  });
  const statusMutation = useSetUserStatus();

  /** Hàng đợi khoá/mở khoá đang chờ xác nhận trong hộp thoại. */
  const [confirmTarget, setConfirmTarget] = useState<
    { user: AdminUserItem; next: AdminUserStatus } | undefined
  >(undefined);

  const rows = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  /** Nút khoá bị ẨN với chính tài khoản đăng nhập và với mọi user role ADMIN. */
  const canToggle = (user: AdminUserItem): boolean =>
    currentUser?.id !== user.id && user.role !== 'ADMIN';

  const submitStatusChange = (): void => {
    if (confirmTarget === undefined) return;
    const { user, next } = confirmTarget;
    statusMutation.mutate(
      { id: user.id, status: next },
      {
        onSuccess: () => {
          setConfirmTarget(undefined);
          toast({
            title:
              next === 'LOCKED'
                ? 'Đã khoá tài khoản ' + user.fullName
                : 'Đã mở khoá tài khoản ' + user.fullName,
          });
        },
        onError: (error) => {
          // CANNOT_LOCK_SELF / CANNOT_LOCK_ADMIN hiển thị nguyên văn qua map lỗi.
          toast({
            variant: 'destructive',
            title: next === 'LOCKED' ? 'Khoá tài khoản thất bại' : 'Mở khoá thất bại',
            description: friendlyApiMessage(error),
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Quản lý người dùng</h1>
        <p className="text-sm text-muted-foreground">
          Tìm kiếm, lọc và khoá/mở khoá tài khoản trên hệ thống SanGo.
        </p>
      </header>

      {/* Thanh công cụ: search debounce + lọc vai trò/trạng thái */}
      <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <CardHeader className="pb-3">
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Tìm theo tên, email hoặc số điện thoại.</CardDescription>
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
              placeholder="Tìm người dùng…"
              aria-label="Tìm kiếm người dùng"
              data-testid="admin-users-search"
              className="pl-9"
            />
          </div>
          <FilterSelect
            label="Vai trò"
            value={role}
            onChange={(value) => {
              setRole(value as '' | AdminUserRole);
              setPage(1);
            }}
            testId="admin-filter-role"
            options={[
              { value: '', label: 'Tất cả vai trò' },
              { value: 'CUSTOMER', label: 'Khách hàng' },
              { value: 'OWNER', label: 'Chủ sân' },
              { value: 'ADMIN', label: 'Quản trị' },
            ]}
          />
          <FilterSelect
            label="Trạng thái"
            value={status}
            onChange={(value) => {
              setStatus(value as '' | AdminUserStatus);
              setPage(1);
            }}
            testId="admin-filter-status"
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Đang hoạt động' },
              { value: 'LOCKED', label: 'Đã khoá' },
            ]}
          />
        </CardContent>
      </Card>

      {/* Bảng người dùng */}
      <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <CardHeader className="pb-3">
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription data-testid="admin-users-total">
            Hiển thị {rangeStart}–{rangeEnd} trên tổng {total} người dùng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersQuery.isPending ? (
            <div className="space-y-3" role="status" aria-label="Đang tải danh sách người dùng">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : usersQuery.isError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            >
              {friendlyApiMessage(usersQuery.error)}
            </p>
          ) : rows.length === 0 ? (
            <p
              data-testid="admin-users-empty"
              className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground"
            >
              Không tìm thấy người dùng phù hợp bộ lọc.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table data-testid="admin-users-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>SĐT</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Số đơn</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((user, index) => (
                      <TableRow key={user.id} data-testid={'admin-user-row-' + index}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={ROLE_META[user.role].variant}>
                            {ROLE_META[user.role].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_META[user.status].variant}>
                            {STATUS_META[user.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatReviewDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {user.bookingCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {canToggle(user) ? (
                            <Button
                              size="sm"
                              variant={user.status === 'ACTIVE' ? 'outline' : 'default'}
                              onClick={() =>
                                setConfirmTarget({
                                  user,
                                  next: user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE',
                                })
                              }
                              data-testid={'admin-user-toggle-' + index}
                            >
                              {user.status === 'ACTIVE' ? (
                                <>
                                  <Ban className="size-4" aria-hidden /> Khoá
                                </>
                              ) : (
                                <>
                                  <CircleCheck className="size-4" aria-hidden /> Mở khoá
                                </>
                              )}
                            </Button>
                          ) : (
                            <span
                              className="text-xs text-muted-foreground"
                              title="Không thể khoá chính mình hoặc tài khoản quản trị"
                            >
                              —
                            </span>
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
                    disabled={page <= 1 || usersQuery.isFetching}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    data-testid="admin-users-prev"
                  >
                    Trang trước
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages || usersQuery.isFetching}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    data-testid="admin-users-next"
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Hộp xác nhận khoá/mở khoá */}
      <Dialog
        open={confirmTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(undefined);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.next === 'LOCKED' ? 'Khoá tài khoản?' : 'Mở khoá tài khoản?'}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget === undefined
                ? ''
                : confirmTarget.next === 'LOCKED'
                  ? 'Người dùng sẽ không thể đăng nhập cho tới khi được mở khoá.'
                  : 'Người dùng có thể đăng nhập và đặt sân trở lại.'}{' '}
              {confirmTarget !== undefined
                ? '(' + confirmTarget.user.fullName + ' · ' + confirmTarget.user.email + ')'
                : ''}
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
              variant={confirmTarget?.next === 'LOCKED' ? 'destructive' : 'default'}
              disabled={statusMutation.isPending}
              onClick={submitStatusChange}
              data-testid="admin-user-confirm-toggle"
            >
              {confirmTarget?.next === 'LOCKED' ? 'Xác nhận khoá' : 'Xác nhận mở khoá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
