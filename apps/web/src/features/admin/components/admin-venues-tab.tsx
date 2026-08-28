import React from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Users,
  Mail,
  Phone,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { formatMinutesToTime, cn } from '../../../lib/utils';
import * as adminApi from '../api/admin-api';
import { SportType, VenueStatus } from '@sango/shared';

const SPORT_TYPE_LABELS: Record<SportType, string> = {
  FOOTBALL5: 'Bóng đá 5',
  FOOTBALL7: 'Bóng đá 7',
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
};

const VENUE_STATUS_BADGES: Record<VenueStatus, { label: string; variant: 'available' | 'peak' | 'destructive' | 'outline' }> = {
  APPROVED: { label: 'Đã duyệt', variant: 'available' },
  PENDING: { label: 'Chờ duyệt', variant: 'peak' },
  REJECTED: { label: 'Bị từ chối', variant: 'destructive' },
  SUSPENDED: { label: 'Tạm treo', variant: 'outline' },
};

export function AdminVenuesTab(): React.ReactElement {
  const [venues, setVenues] = React.useState<adminApi.AdminVenueListItem[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<VenueStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [selectedVenueDetail, setSelectedVenueDetail] = React.useState<adminApi.AdminVenueDetail | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = React.useState(false);
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [rejectVenueId, setRejectVenueId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchVenues = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAdminVenues({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        q: searchQuery.trim() || undefined,
        page,
        limit: 15,
      });
      setVenues(res.items);
      setTotalPages(res.pages);
    } catch (err) {
      console.error('Failed to load admin venues:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, page]);

  React.useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleInspect = async (id: string) => {
    try {
      const detail = await adminApi.getAdminVenueDetail(id);
      setSelectedVenueDetail(detail);
      setInspectModalOpen(true);
    } catch (err) {
      console.error('Failed to get venue detail:', err);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await adminApi.approveVenue(id);
      setInspectModalOpen(false);
      await fetchVenues();
    } catch (err) {
      console.error('Approve venue failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (id: string) => {
    setRejectVenueId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectVenueId || rejectReason.trim().length < 4) return;
    setActionLoading(true);
    try {
      await adminApi.rejectVenue(rejectVenueId, rejectReason.trim());
      setRejectModalOpen(false);
      setInspectModalOpen(false);
      await fetchVenues();
    } catch (err) {
      console.error('Reject venue failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: VenueStatus) => {
    const nextStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
    setActionLoading(true);
    try {
      await adminApi.updateVenueStatus(id, nextStatus);
      await fetchVenues();
    } catch (err) {
      console.error('Update venue status failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" /> Hàng Chờ &amp; Xét Duyệt Cụm Sân
          </h1>
          <p className="text-xs text-muted-foreground">
            Kiểm tra hồ sơ pháp lý, danh sách sân con và phê duyệt cụm sân lên sàn tìm kiếm.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchVenues}
          disabled={loading}
          className="gap-2 text-xs font-bold self-start sm:self-auto"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Làm mới
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 space-y-4">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const).map((s) => {
              const label =
                s === 'ALL'
                  ? 'Tất Cả'
                  : s === 'PENDING'
                  ? '⏳ Chờ Duyệt'
                  : s === 'APPROVED'
                  ? '✅ Đã Duyệt'
                  : s === 'REJECTED'
                  ? '❌ Bị Từ Chối'
                  : '⏸️ Tạm Treo';
              const isActive = statusFilter === s;
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => {
                    setStatusFilter(s as VenueStatus | 'ALL');
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo tên cụm sân, địa chỉ..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-secondary/50 border border-border/80 text-xs font-medium text-foreground focus:outline-hidden focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Venues Table */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/50 border-b border-border/80 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 pl-4">Cụm Sân</th>
                  <th className="p-3.5">Chủ Sân</th>
                  <th className="p-3.5">Khu Vực</th>
                  <th className="p-3.5">Quy Mô</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5 pr-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium text-foreground">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                      Đang tải danh sách cụm sân...
                    </td>
                  </tr>
                ) : venues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Không tìm thấy cụm sân nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  venues.map((v) => {
                    const badge = VENUE_STATUS_BADGES[v.status] || { label: v.status, variant: 'outline' };
                    return (
                      <tr key={v.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-3.5 pl-4">
                          <div className="font-bold text-foreground text-sm">{v.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-xs">{v.address}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold">{v.owner.fullName}</div>
                          <div className="text-[10px] text-muted-foreground">{v.owner.email}</div>
                        </td>
                        <td className="p-3.5">
                          <div>{v.district}</div>
                          <div className="text-[10px] text-muted-foreground">{v.city}</div>
                        </td>
                        <td className="p-3.5">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {v._count?.courts || 0} sân con
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          <Badge variant={badge.variant} className="text-[10px]">
                            {badge.label}
                          </Badge>
                        </td>
                        <td className="p-3.5 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleInspect(v.id)}
                              className="h-8 px-2.5 text-xs font-bold gap-1 text-primary hover:text-primary"
                              title="Soi hồ sơ chi tiết"
                            >
                              <Eye className="h-3.5 w-3.5" /> Xem
                            </Button>

                            {v.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApprove(v.id)}
                                  disabled={actionLoading}
                                  className="h-8 px-2.5 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenReject(v.id)}
                                  disabled={actionLoading}
                                  className="h-8 px-2.5 text-xs font-bold gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Từ chối
                                </Button>
                              </>
                            )}

                            {v.status === 'APPROVED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(v.id, v.status)}
                                disabled={actionLoading}
                                className="h-8 px-2 text-xs font-bold gap-1 text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
                                title="Treo sân"
                              >
                                Treo sân
                              </Button>
                            )}

                            {v.status === 'SUSPENDED' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleToggleStatus(v.id, v.status)}
                                disabled={actionLoading}
                                className="h-8 px-2 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                title="Kích hoạt lại"
                              >
                                Mở lại
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
              <span>Trang {page} / {totalPages}</span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-7 px-2.5 text-xs font-bold"
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 px-2.5 text-xs font-bold"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspect Venue Detail Modal */}
      <Dialog open={inspectModalOpen} onOpenChange={setInspectModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedVenueDetail && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant={VENUE_STATUS_BADGES[selectedVenueDetail.status]?.variant || 'outline'}>
                    {VENUE_STATUS_BADGES[selectedVenueDetail.status]?.label || selectedVenueDetail.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Mã: {selectedVenueDetail.id.slice(0, 8)}</span>
                </div>
                <DialogTitle className="text-xl font-bold">{selectedVenueDetail.name}</DialogTitle>
                <DialogDescription className="text-xs">{selectedVenueDetail.address}, {selectedVenueDetail.district}, {selectedVenueDetail.city}</DialogDescription>
              </DialogHeader>

              {/* Owner Info Box */}
              <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/80 space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Hồ Sơ Chủ Cụm Sân</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-bold text-foreground">{selectedVenueDetail.owner.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{selectedVenueDetail.owner.email}</span>
                  </div>
                  {selectedVenueDetail.owner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedVenueDetail.owner.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Mở cửa: {formatMinutesToTime(selectedVenueDetail.openMinute)} - {formatMinutesToTime(selectedVenueDetail.closeMinute)} (Cọc {selectedVenueDetail.depositPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Reject reason history */}
              {selectedVenueDetail.rejectReason && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Lý do từ chối trước đó:</p>
                    <p>{selectedVenueDetail.rejectReason}</p>
                  </div>
                </div>
              )}

              {/* Courts List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">
                  Danh Sách Sân Con ({selectedVenueDetail.courts.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedVenueDetail.courts.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-foreground">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{SPORT_TYPE_LABELS[c.sportType]}</p>
                      </div>
                      <Badge variant={c.isMaintenance ? 'destructive' : 'available'} className="text-[9px]">
                        {c.isMaintenance ? 'Bảo trì' : 'Sẵn sàng'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                <Button variant="ghost" size="sm" onClick={() => setInspectModalOpen(false)}>
                  Đóng
                </Button>
                <div className="flex items-center gap-2">
                  {selectedVenueDetail.status === 'PENDING' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReject(selectedVenueDetail.id)}
                        disabled={actionLoading}
                        className="text-xs font-bold text-destructive border-destructive/40"
                      >
                        Từ Chối Hồ Sơ
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(selectedVenueDetail.id)}
                        disabled={actionLoading}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Phê Duyệt Sân
                      </Button>
                    </>
                  )}
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Venue Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" /> Từ Chối Hồ Sơ Cụm Sân
            </DialogTitle>
            <DialogDescription className="text-xs">
              Vui lòng nêu rõ lý do từ chối để chủ sân biết cần chỉnh sửa hoặc bổ sung giấy tờ gì.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-bold text-foreground block">
              Lý do từ chối <span className="text-destructive">*</span> (tối thiểu 4 ký tự)
            </label>
            <textarea
              rows={3}
              placeholder="VD: Thiếu hình ảnh thực tế sân, số điện thoại chủ sân không liên lạc được..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border/80 text-xs text-foreground focus:outline-hidden focus:border-destructive"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRejectModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={rejectReason.trim().length < 4 || actionLoading}
              onClick={handleConfirmReject}
              className="font-bold text-xs"
            >
              {actionLoading ? 'Đang xử lý...' : 'Xác Nhận Từ Chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
