import { UserRole } from '@courthub/shared';
import { useEffect, useRef, type ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';

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
import { MyVenuesPage } from '../features/owner/pages/my-venues-page';
import { OwnerBookingsPage } from '../features/owner/pages/owner-bookings-page';
import { StatisticsPage } from '../features/owner/pages/statistics-page';
import { OwnerVouchersPage } from '../features/owner/pages/owner-vouchers-page';
import { useAuthStore } from '../lib/auth/auth-store';

import { DashboardPage } from '../pages/dashboard-page';
import { HomePage } from '../pages/home-page';

import { NotFoundPage } from '../pages/not-found-page';

/**
 * Khôi phục phiên sau F5: đổi cookie refresh httpOnly lấy access token mới
 * đúng MỘT lần khi app khởi động (đặc tả §7 — access token chỉ nằm trong memory).
 */
function useSessionBootstrap(): void {
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    void restoreSession().then((session) => {
      if (session) useAuthStore.getState().setSession(session.user, session.accessToken);
    });
  }, []);
}

/** Cây route toàn app — bọc trong Router ở tầng App để test dễ thay MemoryRouter. */
export function AppRoutes(): ReactElement {
  useSessionBootstrap();

  return (
    <>
      <Toaster />
      {/* Floating AI assistant — hiển thị toàn app (wireframe 08, §3.12) */}
      <AiChatWidget />
      <Routes>
        {/* Khu công khai — guest xem được; SEO title/meta riêng từng trang (P1-F1) */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route
            path="venues"
            element={
              <>
                <PageMeta
                  title="Tìm sân thể thao gần bạn"
                  description="Khám phá các cụm sân thể thao tại Hà Nội: lọc theo quận, môn chơi, giá và khoảng cách GPS rồi giữ chỗ online."
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
            path="matches"
            element={
              <>
                <PageMeta
                  title="Ghép trận mở"
                  description="Các đơn đặt sân đang công khai tìm người ghép — xem danh sách trận mở và tham gia ngay."
                />
                <MatchesPage />
              </>
            }
          />
          <Route path="thanh-toan/ket-qua" element={<PaymentResultPage />} />
        </Route>

        {/* Auth fullscreen (A5) — ngoài PublicLayout: không navbar/footer, AuthShell phủ viewport */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          {/* Quên/đặt lại mật khẩu (P1-F2): slug tiếng Việt là chính, giữ alias cũ. */}
          <Route path="quen-mat-khau" element={<ForgotPasswordPage />} />
          <Route path="dat-lai-mat-khau" element={<ResetPasswordPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Thanh toán checkout yêu cầu đăng nhập */}
        <Route
          path="/thanh-toan/checkout/:holdId"
          element={
            <ProtectedRoute>
              <CheckoutHoldPage />
            </ProtectedRoute>
          }
        />

        {/* Dashboard yêu cầu đăng nhập; route con giới hạn theo vai trò */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="my-bookings" element={<MyCustomerBookingsPage />} />
          {/* Hồ sơ cá nhân — mọi vai trò (P1-F2) */}
          <Route path="profile" element={<ProfilePage />} />
          {/* F6 Ví — mọi vai trò đăng nhập */}
          <Route path="wallet" element={<WalletPage />} />
          {/* F8 Trung tâm thông báo — mọi vai trò đăng nhập */}
          <Route path="notifications" element={<NotificationsPage />} />
          {/* F1 Teams — đội nhóm & sổ quỹ chia tiền (mọi vai trò) */}
          <Route path="teams" element={<MyTeamsPage />} />
          <Route path="teams/new" element={<CreateTeamPage />} />
          <Route path="teams/:teamId" element={<TeamDetailPage />} />
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
          {/* F3 Voucher — quản lý mã giảm của chủ sân */}
          <Route
            path="vouchers"
            element={
              <ProtectedRoute roles={[UserRole.OWNER]}>
                <OwnerVouchersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={[UserRole.ADMIN]}>
                <ApprovalQueuePage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* F6: /vi/wallet — đích redirect từ mock gateway nạp ví (wallets.service.redirect) */}
        <Route
          path="/vi/wallet"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<WalletPage />} />
        </Route>
        {/* F6: alias /wallet — một số luồng gateway trả về path ngắn hơn */}
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<WalletPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
