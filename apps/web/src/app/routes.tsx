import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../components/layout/public-layout';
import { DashboardLayout } from '../components/layout/dashboard-layout';
import { ProtectedRoute, GuestRoute } from '../components/auth/guards';
import { UserRole } from '../lib/constants';
import { useAuthStore } from '../lib/auth-store';

// Feature Pages
import { HomePage } from '../features/home/pages/home-page';
import { VenuesPage, VenueDetailPage, MapPage } from '../features/venues/pages/venues-pages';
import {
  BookingCalendarPage,
  CheckoutHoldPage,
  PaymentResultPage,
  MyBookingsPage,
} from '../features/booking/pages/booking-pages';
import { WalletPage } from '../features/wallet/pages/wallet-page';
import { TeamsPage, TeamDetailPage } from '../features/teams/pages/teams-pages';
import { MatchesPage, MatchDetailPage } from '../features/matches/pages/matches-pages';
import { TournamentsPage, TournamentDetailPage } from '../features/tournaments/pages/tournaments-pages';
import { RankingPage } from '../features/ranking/pages/ranking-pages';
import { NotificationsPage } from '../features/notifications/pages/notifications-page';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ProfilePage,
} from '../features/auth/pages/auth-pages';
import { AboutPage, PartnerPage } from '../features/static/pages/static-pages';
import {
  OwnerVenuesPage,
  OwnerBookingsPage,
  OwnerPricingPage,
  OwnerServicesPage,
  OwnerAnalyticsPage,
} from '../features/owner/pages/owner-pages';
import {
  AdminStatsPage,
  AdminVenuesPage,
  AdminUsersPage,
  AdminBookingsPage,
} from '../features/admin/pages/admin-pages';

function NotFoundPage() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
      <p className="text-4xl font-extrabold text-primary font-mono-num">404</p>
      <h1 className="text-2xl font-bold text-foreground">Không tìm thấy trang</h1>
      <p className="text-sm text-muted-foreground">Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển.</p>
    </div>
  );
}

export function AppRoutes(): React.ReactElement {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  React.useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <Routes>
      {/* 1. Public Layout Routes */}
      <Route element={<PublicLayout />}>
        {/* Public Views for Guests & All Users (Không bao giờ bị văng khi reload) */}
        <Route index element={<HomePage />} />
        <Route path="venues" element={<VenuesPage />} />
        <Route path="venues/:slug" element={<VenueDetailPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route path="matches/:id" element={<MatchDetailPage />} />
        <Route path="tournaments" element={<TournamentsPage />} />
        <Route path="tournaments/:id" element={<TournamentDetailPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="teams/:id" element={<TeamDetailPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="partner" element={<PartnerPage />} />

        {/* Guest Only Routes */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Authenticated Customer Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="venues/:slug/book" element={<BookingCalendarPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="bookings" element={<MyBookingsPage />} />
          <Route path="bookings/hold/:holdId" element={<CheckoutHoldPage />} />
          <Route path="checkout/hold/:holdId" element={<CheckoutHoldPage />} />
          <Route path="bookings/payment-result" element={<PaymentResultPage />} />
          <Route path="payment/result" element={<PaymentResultPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 2. Owner & Admin Dashboard Layout */}
      <Route path="dashboard" element={<ProtectedRoute allowedRoles={[UserRole.OWNER, UserRole.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="owner/venues" replace />} />
          <Route path="owner/venues" element={<OwnerVenuesPage />} />
          <Route path="owner/bookings" element={<OwnerBookingsPage />} />
          <Route path="owner/pricing" element={<OwnerPricingPage />} />
          <Route path="owner/services" element={<OwnerServicesPage />} />
          <Route path="owner/analytics" element={<OwnerAnalyticsPage />} />
          <Route path="admin/stats" element={<AdminStatsPage />} />
          <Route path="admin/venues" element={<AdminVenuesPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/bookings" element={<AdminBookingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
