import React from 'react';
import { DashboardLayout, ADMIN_NAV_GROUPS } from '../../dashboard/layouts/dashboard-layout';
import * as adminApi from '../api/admin-api';
import { AdminStatsTab } from '../components/admin-stats-tab';
import { AdminVenuesTab } from '../components/admin-venues-tab';
import { AdminUsersTab } from '../components/admin-users-tab';
import { AdminBookingsTab } from '../components/admin-bookings-tab';
import { AdminTournamentsTab } from '../components/admin-tournaments-tab';
import { AdminCourtsTab } from '../components/admin-courts-tab';
import { AdminVouchersTab } from '../components/admin-vouchers-tab';
import { AdminPricingTab } from '../components/admin-pricing-tab';

export function AdminDashboardPage(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState('stats');
  const [stats, setStats] = React.useState<adminApi.AdminStatsResponse | null>(null);
  const [days, setDays] = React.useState(14);
  const [statsLoading, setStatsLoading] = React.useState(true);

  const fetchStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminApi.getAdminStats(days);
      setStats(res);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [days]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <DashboardLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      navGroups={ADMIN_NAV_GROUPS}
      dashboardTitle="SanGo"
      dashboardSubtitle="Tổng Quản Trị Hệ Thống"
      dashboardBadge="Admin"
      hideVenueSelector={true}
    >
      {activeTab === 'stats' && (
        <AdminStatsTab
          stats={stats}
          loading={statsLoading}
          days={days}
          onDaysChange={setDays}
          onSelectTab={setActiveTab}
        />
      )}
      {activeTab === 'venues' && <AdminVenuesTab />}
      {activeTab === 'users' && <AdminUsersTab />}
      {activeTab === 'bookings' && <AdminBookingsTab />}
      {activeTab === 'tournaments' && <AdminTournamentsTab />}
      {activeTab === 'courts' && <AdminCourtsTab />}
      {activeTab === 'vouchers' && <AdminVouchersTab />}
      {activeTab === 'pricing' && <AdminPricingTab />}
    </DashboardLayout>
  );
}
