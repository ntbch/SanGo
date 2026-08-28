import React from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Lock,
  Unlock,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';
import { useAuthStore } from '../../../lib/auth-store';
import { cn } from '../../../lib/utils';
import * as adminApi from '../api/admin-api';
import { UserRole, UserStatus } from '@sango/shared';

export function AdminUsersTab(): React.ReactElement {
  const { user: currentAdmin } = useAuthStore();
  const [users, setUsers] = React.useState<adminApi.AdminUserListItem[]>([]);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<UserStatus | 'ALL'>('ALL');
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAdminUsers({
        search: search.trim() || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        pageSize: 15,
      });
      setUsers(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleUserStatus = async (targetUser: adminApi.AdminUserListItem) => {
    if (targetUser.id === currentAdmin?.id) {
      alert('Không thể tự khóa tài khoản chính mình!');
      return;
    }
    if (targetUser.role === UserRole.ADMIN && targetUser.status === UserStatus.ACTIVE) {
      alert('Không thể khóa tài khoản của quản trị viên khác!');
      return;
    }

    const nextStatus = targetUser.status === UserStatus.ACTIVE ? UserStatus.LOCKED : UserStatus.ACTIVE;
    setActionLoading(true);
    try {
      await adminApi.updateUserStatus(targetUser.id, nextStatus);
      await fetchUsers();
    } catch (err) {
      console.error('Update user status failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Quản Trị Người Dùng &amp; Phân Quyền
          </h1>
          <p className="text-xs text-muted-foreground">
            Danh bạ toàn bộ tài khoản khách hàng, chủ sân và quản trị viên trên toàn hệ thống ({total} tài khoản).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="gap-2 text-xs font-bold self-start sm:self-auto">
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Làm mới
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, email, SĐT..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-xs font-medium text-foreground focus:outline-hidden focus:border-primary"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | 'ALL');
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-xs font-medium text-foreground focus:outline-hidden focus:border-primary"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value={UserRole.CUSTOMER}>Người chơi (CUSTOMER)</option>
              <option value={UserRole.OWNER}>Chủ sân (OWNER)</option>
              <option value={UserRole.ADMIN}>Quản trị viên (ADMIN)</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as UserStatus | 'ALL');
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-xs font-medium text-foreground focus:outline-hidden focus:border-primary"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value={UserStatus.ACTIVE}>Đang hoạt động (ACTIVE)</option>
              <option value={UserStatus.LOCKED}>Đã bị khóa (LOCKED)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/50 border-b border-border/80 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 pl-4">Người Dùng</th>
                  <th className="p-3.5">Liên Hệ</th>
                  <th className="p-3.5">Vai Trò</th>
                  <th className="p-3.5">Lịch Sử Đặt</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5 pr-4 text-right">Khóa / Mở Khóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium text-foreground">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                      Đang tải danh sách người dùng...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Không tìm thấy người dùng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === currentAdmin?.id;
                    const isOtherAdmin = u.role === UserRole.ADMIN && !isSelf;
                    return (
                      <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-3.5 pl-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {u.fullName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-foreground flex items-center gap-1.5">
                                {u.fullName}
                                {isSelf && <span className="text-[9px] text-primary font-mono">(Bạn)</span>}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">Tham gia: {new Date(u.createdAt).toLocaleDateString('vi-VN')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="text-foreground">{u.email}</div>
                          <div className="text-[10px] text-muted-foreground">{u.phone || 'Chưa cập nhật SĐT'}</div>
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant={
                              u.role === UserRole.ADMIN
                                ? 'peak'
                                : u.role === UserRole.OWNER
                                ? 'available'
                                : 'outline'
                            }
                            className="text-[9px] font-bold"
                          >
                            {u.role === UserRole.ADMIN ? 'ADMIN' : u.role === UserRole.OWNER ? 'OWNER' : 'CUSTOMER'}
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-bold">{u.bookingCount}</span> đơn đặt
                        </td>
                        <td className="p-3.5">
                          <Badge variant={u.status === UserStatus.ACTIVE ? 'available' : 'destructive'} className="text-[9px]">
                            {u.status === UserStatus.ACTIVE ? 'Hoạt động' : 'Đã khóa'}
                          </Badge>
                        </td>
                        <td className="p-3.5 pr-4 text-right">
                          <Button
                            variant={u.status === UserStatus.ACTIVE ? 'outline' : 'default'}
                            size="sm"
                            disabled={isSelf || (isOtherAdmin && u.status === UserStatus.ACTIVE) || actionLoading}
                            onClick={() => handleToggleUserStatus(u)}
                            className={cn(
                              'h-7 px-2 text-xs font-bold gap-1',
                              u.status === UserStatus.ACTIVE
                                ? 'text-destructive border-destructive/40 hover:bg-destructive/10'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white',
                            )}
                            title={isSelf ? 'Không thể tự khóa chính mình' : isOtherAdmin ? 'Không thể khóa Admin khác' : ''}
                          >
                            {u.status === UserStatus.ACTIVE ? (
                              <>
                                <Lock className="h-3 w-3" /> Khóa
                              </>
                            ) : (
                              <>
                                <Unlock className="h-3 w-3" /> Mở khóa
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
