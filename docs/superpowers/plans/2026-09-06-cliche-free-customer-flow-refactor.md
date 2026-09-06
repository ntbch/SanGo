# Customer Core Flow Cliché-Free Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor toàn bộ luồng khách hàng cốt lõi (Customer Core Flow: `/venues`, `/venues/:slug`, `/checkout/hold/:holdId`, `/bookings`) theo chuẩn nghiêm ngặt của `cliche-free-frontend` (loại bỏ 20 pattern AI-slop, tăng mật độ dữ liệu, thiết kế phẳng typographic, phân cấp bất đối xứng 60/40, và chuẩn hóa 4 states).

**Architecture:** 
- Xây dựng module feedback trạng thái dùng chung (`EmptyState`, `ErrorState`) và các skeleton mô phỏng đúng hình khối thực tế.
- Chuyển `/venues` sang bố cục Split-View 60/40 với thẻ sân hàng ngang (`VenueCard`), hiển thị giờ/giá `tabular-nums` và badge thể thao phẳng.
- Hợp nhất ma trận đặt sân (`SlotMatrix`) trực tiếp vào trang chi tiết cụm sân `/venues/:slug` với thanh quyết toán `VenueBookingSidebar` cố định bên phải; điều hướng tự động từ `/venues/:slug/book` về `/venues/:slug#booking`.
- Chuẩn hóa màn giữ chỗ `/checkout/hold/:holdId` với đồng hồ số dứt khoát (`JetBrains Mono`, không nhấp nháy chuyển động) và hóa đơn thanh toán cố định.
- Tái cấu trúc `TicketCard` trên `/bookings` thành thẻ Athletic Passbook phẳng hai mặt tương phản cao, mã QR sắc nét.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, TypeScript, @tanstack/react-query, Lucide React, Vitest, Testing Library.

**Spec:** Quyết định thiết kế qua Grilling Rounds 1-3 ghi nhận tại phiên hội thoại ngày 2026-09-06 và bộ luật `/cliche-free-frontend`.

## Global Constraints

- **0 Gradient / 0 Glassmorphism:** Cấm tuyệt đối `bg-gradient-to-*`, `bg-clip-text`, `backdrop-blur`. Toàn bộ bề mặt dùng semantic token `bg-card`, `border-border`, `bg-secondary/40`.
- **0 Animation rung giật / mờ ảo:** Cấm `animate-pulse` trên timer, cấm `hover:opacity-*`. Mọi tương tác dùng `transition-colors`, `active:scale-[0.98]`.
- **100% Số liệu là Tabular/Mono:** Cự ly, giá tiền VND, khung giờ bắt buộc dùng font `JetBrains Mono` (`font-mono-num`) hoặc `tabular-nums`.
- **Typography & Scale:** Font UI duy nhất là `Plus Jakarta Sans`. Heading text-only không chứa icon trang trí; icon ngân sách ≤2/khối.
- **Quy tắc 4 Trạng thái:** Mọi danh sách phải có Skeleton đồng dạng khi loading, Empty state 3 dòng (tên + lý do + hướng xử lý + CTA), Error state có nút thử lại.

---

## File Structure Map

| File Path | Trách nhiệm chính |
|---|---|
| `apps/web/src/components/feedback/empty-state.tsx` | Component rỗng chuẩn 3 dòng + CTA button |
| `apps/web/src/components/feedback/error-state.tsx` | Component lỗi thân thiện người dùng + nút thử lại |
| `apps/web/src/components/feedback/layout-skeletons.tsx` | Skeletons đồng dạng cho Venue row card, Slot grid, Passbook ticket |
| `apps/web/src/features/venues/components/venue-card.tsx` | Thẻ sân hàng ngang (Horizontal Row Card), 4:3 image, tabular distance & price |
| `apps/web/src/features/venues/components/venue-results-view.tsx` | Khung hiển thị danh sách tích hợp split-view và toggle bản đồ |
| `apps/web/src/features/venues/pages/venues-page.tsx` | Trang danh sách cụm sân với bố cục Split-View 60/40 linh hoạt |
| `apps/web/src/features/venues/pages/venue-detail-page.tsx` | Trang chi tiết tích hợp thẳng ma trận đặt giờ và sidebar cố định |
| `apps/web/src/features/booking/pages/booking-calendar-page.tsx` | Điều hướng tương thích ngược về `/venues/:slug#booking` |
| `apps/web/src/features/booking/components/hold-timer.tsx` | Dải đếm ngược số phẳng, không nhấp nháy, viền cảnh báo khi < 2 phút |
| `apps/web/src/features/booking/pages/checkout-hold-page.tsx` | Trang thanh toán 60/40 phẳng với hóa đơn quyết toán cố định |
| `apps/web/src/features/booking/components/ticket-card.tsx` | Thẻ vé Athletic Passbook phẳng hai bề mặt tương phản cao |
| `apps/web/tests/ClicheFreeCoreFlow.test.tsx` | Test suite kiểm thử toàn diện các thành phần refactor |

---

### Task 1: Xây Dựng Centralized Feedback Module (Empty, Error, Layout Skeletons)

**Files:**
- Create: `apps/web/src/components/feedback/empty-state.tsx`
- Create: `apps/web/src/components/feedback/error-state.tsx`
- Create: `apps/web/src/components/feedback/layout-skeletons.tsx`
- Test: `apps/web/tests/FeedbackModule.test.tsx`

**Interfaces:**
- Consumes: `Button` từ `src/components/ui/button`
- Produces: 
  - `EmptyState({ title, description, actionLabel, onAction, secondaryActionLabel, onSecondaryAction })`
  - `ErrorState({ title, message, onRetry })`
  - `VenueCardSkeleton()`, `SlotMatrixSkeleton()`, `TicketPassSkeleton()`

- [ ] **Step 1: Viết failing test cho FeedbackModule**

Tạo file `apps/web/tests/FeedbackModule.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from '../src/components/feedback/empty-state';
import { ErrorState } from '../src/components/feedback/error-state';

describe('Centralized Feedback Module', () => {
  it('renders EmptyState with 3-line formula and triggers action', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="Không tìm thấy cụm sân nào"
        description="Không có sân nào phù hợp với bộ lọc hiện tại. Hãy thử chọn môn thể thao khác hoặc nới rộng cự ly tìm kiếm."
        actionLabel="Đặt lại bộ lọc"
        onAction={handleAction}
      />
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Không tìm thấy cụm sân nào' })).toBeDefined();
    expect(screen.getByText(/Không có sân nào phù hợp/)).toBeDefined();
    const btn = screen.getByRole('button', { name: 'Đặt lại bộ lọc' });
    fireEvent.click(btn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders ErrorState with humanized text and retry button', () => {
    const handleRetry = vi.fn();
    render(
      <ErrorState
        title="Không thể tải danh sách sân"
        message="Hệ thống máy chủ đang bận xử lý hoặc kết nối mạng bị gián đoạn."
        onRetry={handleRetry}
      />
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Không thể tải danh sách sân' })).toBeDefined();
    const retryBtn = screen.getByRole('button', { name: 'Thử lại ngay' });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `pnpm --filter web test tests/FeedbackModule.test.tsx`
Expected: FAIL do chưa có file `empty-state.tsx` và `error-state.tsx`.

- [ ] **Step 3: Triển khai mã nguồn tối giản đạt chuẩn Cliché-Free**

Tạo `apps/web/src/components/feedback/empty-state.tsx`:
```tsx
import React from 'react';
import { Button } from '../ui/button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-border bg-card/60 ${className}`}
    >
      <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
        {description}
      </p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              size="sm"
              className="font-semibold transition-colors active:scale-[0.98]"
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSecondaryAction}
              className="font-semibold transition-colors active:scale-[0.98]"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

Tạo `apps/web/src/components/feedback/error-state.tsx`:
```tsx
import React from 'react';
import { Button } from '../ui/button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  message = 'Không thể tải được dữ liệu vào lúc này. Vui lòng kiểm tra lại kết nối mạng.',
  onRetry,
  className = '',
}: ErrorStateProps): React.ReactElement {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-destructive/30 bg-destructive/5 ${className}`}
    >
      <h3 className="text-base sm:text-lg font-bold text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="font-semibold border-destructive/40 text-foreground hover:bg-destructive/10 transition-colors active:scale-[0.98]"
          >
            Thử lại ngay
          </Button>
        </div>
      )}
    </div>
  );
}
```

Tạo `apps/web/src/components/feedback/layout-skeletons.tsx`:
```tsx
import React from 'react';
import { Skeleton } from '../ui/skeleton';

export function VenueCardSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-border bg-card">
      <Skeleton className="w-full sm:w-56 aspect-[4/3] rounded-xl shrink-0" />
      <div className="flex-1 flex flex-col justify-between py-1 space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        </div>
        <div className="flex justify-between items-end pt-3 border-t border-border/60">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function TicketPassSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col sm:flex-row rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-6 sm:w-2/3 space-y-4 border-b sm:border-b-0 sm:border-r border-border">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-8 w-44" />
        </div>
      </div>
      <div className="p-6 sm:w-1/3 flex flex-col items-center justify-center space-y-3 bg-secondary/20">
        <Skeleton className="h-28 w-28 rounded-lg" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `pnpm --filter web test tests/FeedbackModule.test.tsx`
Expected: PASS (2 tests pass).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/feedback/ apps/web/tests/FeedbackModule.test.tsx
git commit -m "feat(ui): implement centralized feedback module with standardized empty, error, and skeletons"
```

---

### Task 2: Tái Cấu Trúc Bố Cục Danh Sách Sân & Thẻ Hàng Ngang (`/venues`)

**Files:**
- Modify: `apps/web/src/features/venues/components/venue-card.tsx`
- Modify: `apps/web/src/features/venues/components/venue-results-view.tsx`
- Modify: `apps/web/src/features/venues/pages/venues-page.tsx`
- Test: `apps/web/tests/VenuesFlow.test.tsx`

**Interfaces:**
- Consumes: `VenueItem` từ `../api/venues-api`, `EmptyState`, `ErrorState`, `VenueCardSkeleton` từ `src/components/feedback`
- Produces: `VenueCard({ venue })` dạng ngang, `VenuesPage` có chế độ Split-View 60/40 kèm nút toggle bản đồ.

- [ ] **Step 1: Viết test xác nhận bố cục hàng ngang và dữ liệu tabular**

Cập nhật hoặc bổ sung test case trong `apps/web/tests/VenuesFlow.test.tsx` kiểm tra:
- Thẻ `VenueCard` hiển thị cự ly và giá với class định dạng `font-mono-num` / `tabular-nums`.
- Có nút chuyển đổi hiển thị bản đồ (Map Toggle) trên `VenuesPage`.
- Khi không có dữ liệu, hiển thị `EmptyState` chuẩn 3 dòng.

- [ ] **Step 2: Chạy test để thấy trạng thái**

Run: `pnpm --filter web test tests/VenuesFlow.test.tsx`

- [ ] **Step 3: Triển khai `VenueCard` theo dạng hàng ngang Functional Density**

Trong `apps/web/src/features/venues/components/venue-card.tsx`:
- Cấu trúc: Ảnh tỉ lệ 4:3 bên trái (`w-full sm:w-56 shrink-0`), thông tin dày dặn bên phải.
- Loại bỏ toàn bộ badge trôi nổi trên ảnh. Thay bằng dải meta text-only phía dưới tiêu đề: Trạng thái mở cửa (`Đang mở cửa` / `Đã đóng cửa` đi kèm dấu chấm trạng thái), cự ly GPS (`font-mono-num font-bold`).
- Thể thao khả dụng: Dạng badge phẳng `bg-secondary text-secondary-foreground border border-border px-2 py-0.5 text-xs font-semibold`.
- Mức giá: Hiển thị nổi bật góc phải dưới dạng `font-mono-num font-extrabold text-base sm:text-lg text-foreground`.
- Nút CTA: `Button` kích thước `sm`, text `Xem lịch & đặt slot` kèm `active:scale-[0.98]`, không hiệu ứng hover mờ.

- [ ] **Step 4: Cập nhật `VenuesPage` với Split-View 60/40**

Trong `apps/web/src/features/venues/pages/venues-page.tsx`:
- Thêm state `showMap` (mặc định `true` trên desktop ≥ 1024px).
- Nút Toggle Map phẳng tại thanh tiêu đề: "Ẩn bản đồ" / "Xem bản đồ".
- Khi `showMap = true`: Cột trái 60% cuộn độc lập danh sách sân, cột phải 40% gắn `sticky top-20 h-[calc(100vh-6rem)]` nhúng bản đồ Leaflet.

- [ ] **Step 5: Chạy test xác nhận PASS**

Run: `pnpm --filter web test tests/VenuesFlow.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/venues/components/venue-card.tsx apps/web/src/features/venues/components/venue-results-view.tsx apps/web/src/features/venues/pages/venues-page.tsx apps/web/tests/VenuesFlow.test.tsx
git commit -m "feat(venues): refactor venues list to split-view 60/40 with high-density horizontal row cards"
```

---

### Task 3: Hợp Nhất Trang Chi Tiết Cụm Sân & Đặt Lịch (`/venues/:slug`)

**Files:**
- Modify: `apps/web/src/features/venues/pages/venue-detail-page.tsx`
- Modify: `apps/web/src/features/booking/pages/booking-calendar-page.tsx`
- Modify: `apps/web/src/app/routes.tsx`
- Test: `apps/web/tests/VenueDetailFlow.test.tsx`

**Interfaces:**
- Consumes: `SlotMatrix` từ `src/features/booking/components/slot-matrix`, `VenueBookingSidebar` từ `src/features/venues/components/venue-booking-sidebar`
- Produces: Trang chi tiết cụm sân tích hợp một cửa (One-stop venue booking experience).

- [ ] **Step 1: Viết test cho luồng hợp nhất và điều hướng tương thích**

Trong `apps/web/tests/VenueDetailFlow.test.tsx`:
- Kiểm tra `VenueDetailPage` hiển thị cả thông tin sân lẫn ma trận chọn slot `SlotMatrix`.
- Kiểm tra truy cập `/venues/:slug/book` sẽ điều hướng hoặc render trang chi tiết có phần chọn giờ.

- [ ] **Step 2: Chạy test để thấy kết quả hiện tại**

Run: `pnpm --filter web test tests/VenueDetailFlow.test.tsx`

- [ ] **Step 3: Nhúng trực tiếp `SlotMatrix` vào `VenueDetailPage`**

Trong `apps/web/src/features/venues/pages/venue-detail-page.tsx`:
- Bố cục 65/35 bất đối xứng:
  - Cột trái (65%): Gallery ảnh cơ sở vật chất $ightarrow$ Thông số sân & tiện ích $ightarrow$ Section `#booking` nhúng trực tiếp bộ chọn ngày `BookingDateSelector` và ma trận sân `SlotMatrix`.
  - Cột phải (35%): `VenueBookingSidebar` gắn `sticky top-20`, hiển thị danh sách slot đã nhấp chọn theo thời gian thực, tổng tạm tính, và nút CTA "Giữ chỗ 10 phút" chuyển tiếp sang checkout.
- Xử lý cuộn tự động: Nếu `window.location.hash === '#booking'`, kích hoạt `element.scrollIntoView({ behavior: 'smooth' })`.

- [ ] **Step 4: Cập nhật `booking-calendar-page.tsx` điều hướng về `/venues/:slug#booking`**

Trong `apps/web/src/features/booking/pages/booking-calendar-page.tsx`:
- Sử dụng `<Navigate to={`/venues/${slug}#booking`} replace />` để bảo toàn tính tương thích ngược cho mọi bookmark hoặc link cũ.

- [ ] **Step 5: Chạy test để xác nhận PASS**

Run: `pnpm --filter web test tests/VenueDetailFlow.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/venues/pages/venue-detail-page.tsx apps/web/src/features/booking/pages/booking-calendar-page.tsx apps/web/tests/VenueDetailFlow.test.tsx
git commit -m "feat(venues): unify venue details and interactive slot matrix booking into single page"
```

---

### Task 4: Làm Phẳng Giao Diện Giữ Chỗ & Thanh Toán (`/checkout/hold/:holdId`)

**Files:**
- Modify: `apps/web/src/features/booking/components/hold-timer.tsx`
- Modify: `apps/web/src/features/booking/pages/checkout-hold-page.tsx`
- Modify: `apps/web/src/features/booking/components/checkout-order-summary.tsx`
- Test: `apps/web/tests/BookingRecoveryAndPayment.test.tsx`

**Interfaces:**
- Consumes: `HoldTimerProps`, `CheckoutOrderSummaryProps`
- Produces: Thanh Hold Timer phẳng không rung giật, bố cục thanh toán 60/40 rõ ràng.

- [ ] **Step 1: Viết test kiểm tra dải đếm số không vi phạm animation**

Trong `apps/web/tests/BookingRecoveryAndPayment.test.tsx`:
- Kiểm tra `HoldTimer` hiển thị định dạng mm:ss bằng font tabular.
- Xác nhận không có class `animate-pulse` khi thời gian < 2 phút mà chuyển sang viền cảnh báo rõ rệt `border-destructive`.

- [ ] **Step 2: Chạy test để kiểm tra**

Run: `pnpm --filter web test tests/BookingRecoveryAndPayment.test.tsx`

- [ ] **Step 3: Tinh chỉnh `HoldTimer` theo chuẩn Cliché-Free**

Trong `apps/web/src/features/booking/components/hold-timer.tsx`:
- Xóa bỏ `animate-pulse` và màu raw `rose-500`.
- Sử dụng dải header strip phẳng: Nền `bg-secondary/40`, viền `border-border`.
- Khi khẩn cấp (`isUrgent`, < 120s): Nền `bg-destructive/10`, viền `border-destructive`, chữ `text-destructive`.
- Đồng hồ hiển thị thời gian: `font-mono-num font-black text-2xl tracking-tight`.

- [ ] **Step 4: Hoàn thiện bố cục 60/40 trang `CheckoutHoldPage`**

Trong `apps/web/src/features/booking/pages/checkout-hold-page.tsx`:
- Cột trái (60%): Thông tin suất sân đã giữ $ightarrow$ Bộ chọn dịch vụ thêm `CheckoutAddOnsPicker` $ightarrow$ Voucher $ightarrow$ Phương thức thanh toán `CheckoutPaymentMethods` dạng các thẻ phẳng lựa chọn trực quan.
- Cột phải (40%): `CheckoutOrderSummary` gắn `sticky top-20`, phân tách chi tiết từng dòng tiền sân, phụ trợ, giảm giá bằng số liệu `font-mono-num`.

- [ ] **Step 5: Chạy test để xác nhận PASS**

Run: `pnpm --filter web test tests/BookingRecoveryAndPayment.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/booking/components/hold-timer.tsx apps/web/src/features/booking/pages/checkout-hold-page.tsx apps/web/src/features/booking/components/checkout-order-summary.tsx apps/web/tests/BookingRecoveryAndPayment.test.tsx
git commit -m "feat(booking): redesign checkout hold page to flat 60/40 layout with calm digital countdown timer"
```

---

### Task 5: Thiết Kế Thẻ Athletic Passbook Cho Danh Sách Đặt Chỗ (`/bookings`)

**Files:**
- Modify: `apps/web/src/features/booking/components/ticket-card.tsx`
- Modify: `apps/web/src/features/booking/pages/my-bookings-page.tsx`
- Test: `apps/web/tests/BookingFlow.test.tsx`

**Interfaces:**
- Consumes: `BookingItem` từ `../api/booking-api`, `EmptyState`, `TicketPassSkeleton`
- Produces: `TicketCard` dạng Match Pass thể thao hai khối phẳng tương phản cao.

- [ ] **Step 1: Viết test cho thẻ vé Athletic Passbook**

Trong `apps/web/tests/BookingFlow.test.tsx`:
- Kiểm tra `TicketCard` hiển thị rõ ràng mã vé, giờ thi đấu định dạng mono, mã QR trực tiếp và các nút hành động (chia sẻ bill / hủy đặt).
- Kiểm tra khi danh sách rỗng thì hiển thị `EmptyState` 3 dòng.

- [ ] **Step 2: Chạy test để kiểm tra**

Run: `pnpm --filter web test tests/BookingFlow.test.tsx`

- [ ] **Step 3: Triển khai `TicketCard` Athletic Passbook**

Trong `apps/web/src/features/booking/components/ticket-card.tsx`:
- Loại bỏ hiệu ứng đục lỗ cuống vé răng cưa cũ.
- Thiết kế dạng Passbook thể thao hai bề mặt:
  - Khối chính bên trái (65%): Nền `bg-card`, hiển thị môn thi đấu, tên cụm sân, sân số, ngày thi đấu và khung giờ chữ lớn `font-mono-num font-extrabold`, trạng thái (Đã xác nhận / Đang chờ / Đã hoàn thành / Đã hủy).
  - Khối phụ bên phải (35%): Nền `bg-secondary/50` tách biệt bởi đường kẻ `border-l border-border`, chứa mã QR sắc nét trên nền trắng, mã vé chữ hoa mono và nút bấm hành động dứt khoát.

- [ ] **Step 4: Áp dụng `EmptyState` & `TicketPassSkeleton` vào `MyBookingsPage`**

Trong `apps/web/src/features/booking/pages/my-bookings-page.tsx`:
- Khi loading: Render danh sách `TicketPassSkeleton`.
- Khi rỗng: Render `EmptyState` với copy chuẩn: "Chưa có lượt đặt sân nào" + "Bạn chưa có lịch thi đấu trong mục này. Hãy tìm sân gần bạn và chọn khung giờ phù hợp." + Nút CTA "Tìm sân ngay" điều hướng về `/venues`.
- Khi lỗi: Render `ErrorState` với nút "Tải lại danh sách".

- [ ] **Step 5: Chạy test xác nhận PASS**

Run: `pnpm --filter web test tests/BookingFlow.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/booking/components/ticket-card.tsx apps/web/src/features/booking/pages/my-bookings-page.tsx apps/web/tests/BookingFlow.test.tsx
git commit -m "feat(booking): implement athletic passbook ticket card and standardized states on my bookings page"
```

---

### Task 6: Chạy Cliché Self-Audit Grep & Kiểm Thử Hồi Quy Toàn Bộ Web

**Files:**
- Audit: Toàn bộ thư mục `apps/web/src`
- Test: Tất cả các file test trong `apps/web/tests`

- [ ] **Step 1: Chạy script kiểm tra vi phạm 20 pattern cấm**

Chạy bộ lệnh self-audit grep từ `cliche-free-frontend`:
```bash
cd apps/web/src
# 1. Gradient & glassmorphism
grep -rn "bg-gradient-to\|from-purple\|to-blue-500\|bg-clip-text\|backdrop-blur" --include="*.tsx" . | grep -vi test
# 2. Hover opacity
grep -rn "hover:opacity" --include="*.tsx" . | grep -vi test
# 3. Animate pulse on timer
grep -rn "animate-pulse" --include="hold-timer.tsx" .
```
Expected: 0 vi phạm trên các component thuộc phạm vi refactor.

- [ ] **Step 2: Chạy kiểm tra kiểu tĩnh (Typecheck)**

```bash
pnpm --filter web typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Chạy toàn bộ test suite của web**

```bash
pnpm --filter web test
```
Expected: 100% test files PASS.

- [ ] **Step 4: Commit hoàn tất refactor**

```bash
git commit --allow-empty -m "chore(ui): verify cliche-free frontend compliance and full regression pass for customer core flow"
```
