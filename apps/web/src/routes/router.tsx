import { UserRole } from '@sango/shared';
import { useEffect, useRef, type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute, GuestRoute } from '../components/auth/guards';
import { DashboardLayout } from '../components/layout/dashboard-layout';
import {
  BookingCalendarPageMeta,
  PageMeta,
  VenueDetailPageMeta,
} from '../components/layout/page-meta';
import { PublicLayout } from '../components/layout/public-layout';
import { Toaster } from '../components/ui/toaster';
import { ForgotPasswordPage } from '../features/auth/pages/forgot-password-page';
import { LoginPage } from '../features/auth/pages/login-page';
import { RegisterPage } from '../features/auth/pages/register-page';
import { ResetPasswordPage } from '../features/auth/pages/reset-password-page';
import { restoreSession } from '../features/auth/api';
import { ProfilePage } from '../features/profile/pages/profile-page';
import { VenueDetailPage } from '../features/public/pages/venue-detail-page';
import { MatchesPage } from '../features/matches/pages/matches-page';
import { AiChatWidget } from '../features/ai/components/ai-chat-widget';
import { VenuesPage } from '../features/public/pages/venues-page';
import { MapPage } from '../features/public/pages/map-page';
import { AdminBookingsPage } from '../features/admin/pages/admin-bookings-page';
import { AdminStatsPage } from '../features/admin/pages/admin-stats-page';
import { AdminUsersPage } from '../features/admin/pages/admin-users-page';
import { AdminVenuesPage } from '../features/admin/pages/admin-venues-page';
import { ApprovalQueuePage } from '../features/admin/pages/approval-queue-page';
import { BookingCalendarPage } from '../features/booking/pages/booking-calendar-page';
import { CheckoutHoldPage } from '../features/booking/pages/checkout-hold-page';
import { MyCustomerBookingsPage } from '../features/booking/pages/my-bookings-page';
import { PaymentResultPage } from '../features/booking/pages/payment-result-page';
import { WalletPage } from '../features/wallet/pages/wallet-page';
import { NotificationsPage } from '../features/notifications/pages/notifications-page';
import { MyTeamsPage } from '../features/teams/pages/my-teams-page';
import { CreateTeamPage } from '../features/teams/pages/create-team-page';
import { TeamDetailPage } from '../features/teams/pages/team-detail-page';
import { TeamJoinPage } from '../features/teams/pages/team-join-page';
import { RankingPage } from '../features/reputation/pages/ranking-page';
import { TournamentsPage } from '../features/tournaments/pages/tournaments-page';
import { TournamentDetailPage } from '../features/tournaments/pages/tournament-detail-page';
import { MyVenuesPage } from '../features/owner/pages/my-venues-page';
import { OwnerBookingsPage } from '../features/owner/pages/owner-bookings-page';
import { StatisticsPage } from '../features/owner/pages/statistics-page';
import { OwnerVouchersPage } from '../features/owner/pages/owner-vouchers-page';
import { VenueServicesPage } from '../features/owner/pages/venue-services-page';
import { useAuthStore } from '../lib/auth/auth-store';

import { DashboardPage } from '../pages/dashboard-page';
import { HomePage } from '../pages/home-page';
import { AboutPage } from '../pages/about-page';
import { PartnerPage } from '../pages/partner-page';
import { NotFoundPage } from '../pages/not-found-page';

function useSessionBootstrap(): void {
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    if (!useAuthStore.getState().user) {
      void restoreSession().then((session) => {
        if (session) useAuthStore.getState().setSession(session.user, session.accessToken);
      });
    }
  }, []);
}

export function AppRoutes(): ReactElement {
  useSessionBootstrap();

  return (
    <>
      <Toaster />
      <AiChatWidget />
      <Routes>
        {/* Khu công khai + Customer routes (PublicLayout có header/footer) */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route
            path="venues"
            element={
              <>
                <PageMeta
                  title="Tìm sân thể thao gần bạn"
                  description="Khám phá các cụm sân thể thao: lọc theo quận, môn chơi, giá và khoảng cách GPS rồi giữ chỗ online."
                />
                <VenuesPage />
              </>
            }
          />
          <Route
            path="venues/:slug"
            element={
              <>
                <VenueDetailPageMeta />
                <VenueDetailPage />
              </>
            }
          />
          <Route
            path="venues/:slug/book"
            element={
              <>
                <BookingCalendarPageMeta />
                <BookingCalendarPage />
              </>
            }
          />
          <Route
            path="map"
            element={
              <>
                <PageMeta
                  title="Bản đồ sân thể thao"
                  description="Khám phá tất cả các cụm sân trên bản đồ tương tác trực quan."
                />
                <MapPage />
              </>
            }
          />
          <Route
            path="matches"
            element={
              <>
                <PageMeta
                  title="Ghép trận thể thao"
                  description="Các đơn đặt sân đang công khai tìm người ghép — xem danh sách trận mở và tham gia ngay."
                />
                <MatchesPage />
              </>
            }
          />
          <Route
            path="tournaments"
            element={
              <>
                <PageMeta
                  title="Giải đấu SanGo"
                  description="Các giải đấu thể thao loại trực tiếp — bảng đấu, kết quả và đội vô địch."
                />
                <TournamentsPage />
              </>
            }
          />
          <Route
            path="tournaments/:tournamentId"
            element={
              <>
                <PageMeta
                  title="Bảng đấu giải"
                  description="Bracket loại trực tiếp và kết quả các trận."
                />
                <TournamentDetailPage />
              </>
            }
          />
          <Route path="about" element={<AboutPage />} />
          <Route path="partner" element={<PartnerPage />} />
          <Route path="thanh-toan/ket-qua" element={<PaymentResultPage />} />

          {/* Customer clean URLs (yêu cầu đăng nhập, hiển thị trong PublicLayout) */}
          <Route
            path="bookings"
            element={
              <ProtectedRoute>
                <MyCustomerBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="wallet"
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="vi/wallet"
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="teams"
            element={
              <ProtectedRoute>
                <MyTeamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="teams/new"
            element={
              <ProtectedRoute>
                <CreateTeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="teams/join"
            element={
              <ProtectedRoute>
                <TeamJoinPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="teams/:teamId"
            element={
              <ProtectedRoute>
                <TeamDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="ranking"
            element={
              <ProtectedRoute>
                <RankingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Auth fullscreen (GuestRoute) */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="quen-mat-khau" element={<ForgotPasswordPage />} />
          <Route path="dat-lai-mat-khau" element={<ResetPasswordPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Thanh toán checkout */}
        <Route
          path="/thanh-toan/checkout/:holdId"
          element={
            <ProtectedRoute>
              <CheckoutHoldPage />
            </ProtectedRoute>
          }
        />

        {/* Legacy redirect aliases từ /dashboard/* cho CUSTOMER */}
        <Route path="/dashboard/my-bookings" element={<Navigate to="/bookings" replace />} />
        <Route path="/dashboard/wallet" element={<Navigate to="/wallet" replace />} />
        <Route path="/dashboard/notifications" element={<Navigate to="/notifications" replace />} />
        <Route path="/dashboard/teams" element={<Navigate to="/teams" replace />} />
        <Route path="/dashboard/teams/new" element={<Navigate to="/teams/new" replace />} />
        <Route path="/dashboard/teams/join" element={<Navigate to="/teams/join" replace />} />
        <Route path="/dashboard/teams/:teamId" element={<Navigate to="/teams" replace />} />
        <Route path="/dashboard/ranking" element={<Navigate to="/ranking" replace />} />
        <Route path="/dashboard/profile" element={<Navigate to="/profile" replace />} />

        {/* Dashboard dành riêng cho OWNER và ADMIN (DashboardLayout có sidebar quản trị) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={[UserRole.OWNER, UserRole.ADMIN]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          {/* Owner routes */}
          <Route
            path="manage"
            element={
              <ProtectedRoute roles={[UserRole.OWNER]}>
                <MyVenuesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="bookings"
            element={
              <ProtectedRoute roles={[UserRole.OWNER]}>
                <OwnerBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="statistics"
            element={
              <ProtectedRoute roles={[UserRole.OWNER]}>
                <StatisticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="vouchers"
            element={
              <ProtectedRoute roles={[UserRole.OWNER]}>
                <OwnerVouchersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="services"
            element={
              <ProtectedRoute roles={[UserRole.OWNER]}>
                <VenueServicesPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={[UserRole.ADMIN]}>
                <ApprovalQueuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin-stats"
            element={
              <ProtectedRoute roles={[UserRole.ADMIN]}>
                <AdminStatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin-users"
            element={
              <ProtectedRoute roles={[UserRole.ADMIN]}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin-venues"
            element={
              <ProtectedRoute roles={[UserRole.ADMIN]}>
                <AdminVenuesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin-bookings"
            element={
              <ProtectedRoute roles={[UserRole.ADMIN]}>
                <AdminBookingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
