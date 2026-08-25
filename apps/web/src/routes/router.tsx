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
import { restoreSession } from '../features/auth/api';
import { VenueDetailPage } from '../features/public/pages/venue-detail-page';
import { MatchesPage } from '../features/matches/pages/matches-page';
import { AiChatWidget } from '../features/ai/components/ai-chat-widget';
import { VenuesPage } from '../features/public/pages/venues-page';
import { ApprovalQueuePage } from '../features/admin/pages/approval-queue-page';
import { BookingCalendarPage } from '../features/booking/pages/booking-calendar-page';
import { CheckoutHoldPage } from '../features/booking/pages/checkout-hold-page';
import { MyCustomerBookingsPage } from '../features/booking/pages/my-bookings-page';
import { PaymentResultPage } from '../features/booking/pages/payment-result-page';
import { MyVenuesPage } from '../features/owner/pages/my-venues-page';
import { OwnerBookingsPage } from '../features/owner/pages/owner-bookings-page';
import { StatisticsPage } from '../features/owner/pages/statistics-page';
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
          <Route element={<GuestRoute />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
          </Route>
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
            path="admin"
            element={
              <ProtectedRoute roles={[UserRole.ADMIN]}>
                <ApprovalQueuePage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
