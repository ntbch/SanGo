import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { useNotificationsStore } from '../store/notifications-store';
import { NotificationItem } from '../components/notification-item';
import { NotificationHeader } from '../components/notification-header';
import { NotificationStatsCards } from '../components/notification-stats-cards';
import { NotificationFilterToolbar } from '../components/notification-filter-toolbar';
import { NotificationEmptyState } from '../components/notification-empty-state';

export function NotificationsPage(): React.ReactElement {
  const {
    notifications,
    loading,
    fetchNotifications,
    error,
    total,
    page,
    pageSize,
    filterType,
    filterUnreadOnly,
    setFilterType,
    setFilterUnreadOnly,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    unreadCount,
  } = useNotificationsStore();

  const [searchQuery, setSearchQuery] = React.useState('');

  // Dữ liệu thật từ BE — tải hộp thư khi mở trang, refresh khi quay lại.
  React.useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const count = unreadCount();
  const totalCount = total;
  const bookingCount = notifications.filter((n) => n.type === 'BOOKING').length;
  const matchCount = notifications.filter((n) => n.type === 'MATCH' || n.type === 'TOURNAMENT').length;
  const walletCount = notifications.filter((n) => n.type === 'WALLET').length;

  const filtered = notifications.filter((item) => {
    if (filterUnreadOnly && item.isRead) return false;
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.message.toLowerCase().includes(q) || item.type.toLowerCase().includes(q);
    }
    return true;
  });

  const handleResetFilters = () => {
    setFilterType('ALL');
    setFilterUnreadOnly(false);
    setSearchQuery('');
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 space-y-8 min-h-screen bg-background">
      <NotificationHeader
        unreadCount={count}
        totalCount={totalCount}
        onMarkAllAsRead={markAllAsRead}
        onClearAll={clearAll}
      />

      <NotificationStatsCards
        unreadCount={count}
        bookingCount={bookingCount}
        matchCount={matchCount}
        walletCount={walletCount}
      />

      <Card className="border border-border/80 bg-card overflow-hidden">
        <NotificationFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          filterUnreadOnly={filterUnreadOnly}
          onFilterUnreadOnlyChange={setFilterUnreadOnly}
          unreadCount={count}
          onResetFilters={handleResetFilters}
        />

        {error && (
          <div role="alert" className="p-4 text-sm text-destructive">
            {error}
            <button type="button" onClick={() => void fetchNotifications()} className="ml-2 underline">Thử lại</button>
          </div>
        )}
        <CardContent className="p-4 sm:p-6 space-y-3">
          {loading && notifications.length === 0 ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-secondary/60 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <NotificationEmptyState
              isFiltered={filterType !== 'ALL' || filterUnreadOnly || searchQuery.trim() !== ''}
              onResetFilters={handleResetFilters}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <NotificationItem
                  key={item.id}
                  notification={item}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  compact={false}
                />
              ))}
            </div>
          )}
          {page * pageSize < total && (
            <div className="pt-4 text-center">
              <p className="mb-2 text-xs text-muted-foreground">Đã tải {notifications.length}/{total} thông báo. Bộ lọc và tìm kiếm áp dụng cho phần đã tải.</p>
              <button
                type="button"
                disabled={loading}
                onClick={() => void fetchNotifications(true)}
                className="min-h-11 rounded-lg border border-border px-4 text-sm hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              >
                {loading ? 'Đang tải...' : 'Tải thêm thông báo'}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
