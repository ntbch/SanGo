import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../components/layout/public-layout';
import { ProtectedRoute, GuestRoute } from '../components/auth/guards';
import { UserRole } from '../lib/constants';
import { useAuthStore } from '../lib/auth-store';
import { RouteLoadingFallback } from '../components/feedback/route-loading-fallback';

import { HomePage } from '../features/home/pages/home-page';

// Feature Pages - Lazy Loaded for route-level code-splitting
const VenuesPage = lazy(() => import('../features/venues/pages/venues-page').then((m) => ({ default: m.VenuesPage })));
const VenueDetailPage = lazy(() => import('../features/venues/pages/venue-detail-page').then((m) => ({ default: m.VenueDetailPage })));
const MapPage = lazy(() => import('../features/venues/pages/map-page').then((m) => ({ default: m.MapPage })));
const BookingCalendarPage = lazy(() => import('../features/booking/pages/booking-calendar-page').then((m) => ({ default: m.BookingCalendarPage })));
const CheckoutHoldPage = lazy(() => import('../features/booking/pages/checkout-hold-page').then((m) => ({ default: m.CheckoutHoldPage })));
const PaymentPendingPage = lazy(() => import('../features/booking/pages/payment-pending-page').then((m) => ({ default: m.PaymentPendingPage })));
const PaymentResultPage = lazy(() => import('../features/booking/pages/payment-result-page').then((m) => ({ default: m.PaymentResultPage })));
const MyBookingsPage = lazy(() => import('../features/booking/pages/my-bookings-page').then((m) => ({ default: m.MyBookingsPage })));
const WalletPage = lazy(() => import('../features/wallet/pages/wallet-page').then((m) => ({ default: m.WalletPage })));
const TeamsPage = lazy(() => import('../features/teams/pages/teams-page').then((m) => ({ default: m.TeamsPage })));
const TeamDetailPage = lazy(() => import('../features/teams/pages/team-detail-page').then((m) => ({ default: m.TeamDetailPage })));
const MatchesPage = lazy(() => import('../features/matches/pages/matches-page').then((m) => ({ default: m.MatchesPage })));
const MatchDetailPage = lazy(() => import('../features/matches/pages/match-detail-page').then((m) => ({ default: m.MatchDetailPage })));
const TournamentsPage = lazy(() => import('../features/tournaments/pages/tournaments-page').then((m) => ({ default: m.TournamentsPage })));
const TournamentDetailPage = lazy(() => import('../features/tournaments/pages/tournament-detail-page').then((m) => ({ default: m.TournamentDetailPage })));
const RankingPage = lazy(() => import('../features/ranking/pages/ranking-page').then((m) => ({ default: m.RankingPage })));
const NotificationsPage = lazy(() => import('../features/notifications/pages/notifications-page').then((m) => ({ default: m.NotificationsPage })));
const LoginPage = lazy(() => import('../features/auth/pages/login-page').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../features/auth/pages/register-page').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('../features/auth/pages/forgot-password-page').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('../features/auth/pages/reset-password-page').then((m) => ({ default: m.ResetPasswordPage })));
const ProfilePage = lazy(() => import('../features/auth/pages/profile-page').then((m) => ({ default: m.ProfilePage })));
const AboutPage = lazy(() => import('../features/static/pages/about-page').then((m) => ({ default: m.AboutPage })));
const PartnerPage = lazy(() => import('../features/static/pages/partner-page').then((m) => ({ default: m.PartnerPage })));
const OwnerDashboardPage = lazy(() => import('../features/dashboard/pages/owner-dashboard-page').then((m) => ({ default: m.OwnerDashboardPage })));
const AdminDashboardPage = lazy(() => import('../features/admin/pages/admin-dashboard-page').then((m) => ({ default: m.AdminDashboardPage })));

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
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* 1. Public Layout Routes */}
        <Route element={<PublicLayout />}>
          {/* Public Views for Guests & All Users */}
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
            <Route path="checkout/payment" element={<PaymentPendingPage />} />
            <Route path="bookings/payment-result" element={<PaymentResultPage />} />
            <Route path="payment/result" element={<PaymentResultPage />} />
            <Route path="thanh-toan/ket-qua" element={<PaymentResultPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* 2. Owner & Admin Dashboard Route */}
        <Route path="dashboard" element={<ProtectedRoute allowedRoles={[UserRole.OWNER, UserRole.ADMIN]} />}>
          <Route index element={<Navigate to="owner" replace />} />
          <Route path="owner" element={<OwnerDashboardPage />} />
          <Route path="owner/*" element={<Navigate to="/dashboard/owner" replace />} />

          {/* Admin Dashboard Hub */}
          <Route path="admin" element={<AdminDashboardPage />} />
          <Route path="admin/*" element={<AdminDashboardPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
