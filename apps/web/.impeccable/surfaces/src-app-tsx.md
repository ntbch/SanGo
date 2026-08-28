---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/app/routes.tsx","src/features/ranking/pages/ranking-page.tsx","src/features/matches/pages/matches-page.tsx","src/features/teams/pages/teams-page.tsx","src/features/booking/pages/booking-calendar-page.tsx","src/features/wallet/pages/wallet-page.tsx","src/features/venues/pages/venues-page.tsx"]
---

# Surface Brief: SanGo All Surfaces Architecture

<!-- map:primary apps/web/src/App.tsx -->
<!-- map:related apps/web/src/app/routes.tsx apps/web/src/features/ranking/pages/ranking-page.tsx apps/web/src/features/matches/pages/matches-page.tsx apps/web/src/features/teams/pages/teams-page.tsx apps/web/src/features/booking/pages/booking-calendar-page.tsx apps/web/src/features/wallet/pages/wallet-page.tsx apps/web/src/features/venues/pages/venues-page.tsx -->

## 1. Job and Audience

- **Khám phá & Đặt sân:** Người chơi thể thao & Đội trưởng tìm kiếm sân bóng/cầu lông/pickleball/tennis còn trống gần nhất theo định vị GPS, giữ chỗ 10 phút chống trùng lịch (Anti-double booking) và đặt cọc online.
- **Kèo ghép & Đội nhóm:** Vận động viên tự do tìm kèo thi đấu phong trào theo vị trí thiếu, tham gia đội, đóng quỹ đội và chia đều tiền sân (Split-bill) tự động.
- **Bảng xếp hạng & Danh dự:** Theo dõi thứ hạng ELO câu lạc bộ thể thao và điểm Uy tín / Fair-Play cá nhân.

## 2. Outcome and Proof

- **Tốc độ:** Quy trình đặt sân & giữ chỗ 10 phút hoàn tất dưới 60 giây trên thiết bị di động.
- **Độ tin cậy tuyệt đối:** Khóa hàng cơ sở dữ liệu (`SELECT ... FOR UPDATE`), đồng hồ đếm ngược 10 phút chính xác theo server timestamp, trợ lý AI truy vấn dữ liệu thật.

## 3. Selected Direction

- **Chủ đề thị giác:** **High-Energy Sport-Tech** (Năng động, hiện đại, đậm chất thể thao số).
- **Màu sắc & Ánh sáng:** Dark Mode đen xám sang trọng (`#090d16`), Light Mode sáng sạch (`#f8fafc`), màu nhấn Xanh Ngọc Emerald/Mint (`#10b981` / `#059669`) làm chủ đạo, Vàng kim Amber (`#f59e0b`) cho giải thưởng ELO & điểm Uy tín.
- **Kiểu số:** Font đơn khoảng (`font-mono-num`) bắt buộc cho toàn bộ số tiền (`₫`), đồng hồ đếm ngược, điểm số ELO, giờ thi đấu.
- **Bề mặt:** Thẻ kính mờ (`bg-card/90 backdrop-blur-md`), viền mảnh tinh tế (`border-border/70`), đổ bóng dạ quang (`shadow-emerald-500/10`).

## 4. Scope and Boundaries

- **Phạm vi bao phủ:** Toàn bộ 4 cụm trang chính:
  1. Discovery: `/`, `/venues`, `/map`, `/venues/:slug`
  2. Booking Lifecycle: `/venues/:slug/book`, `/checkout/hold/:id`, `/payment/result`, `/bookings`
  3. Community & Competition: `/matches`, `/matches/:id`, `/teams`, `/teams/:id`, `/ranking`, `/tournaments`
  4. Financials & Management: `/wallet`, `/profile`, `/dashboard/owner`, `/dashboard/admin`
- **Ranh giới:** Không dùng class màu cứng không ngữ nghĩa (`text-white`, `bg-slate-900` thiếu dark modifier).

## 5. States and Ranges

- **Slot Ma trận sân:** Trống, Đang giữ chỗ (vàng nhấp nháy), Đã đặt (gạch chéo mờ), Đang chọn (xanh ngọc).
- **Kèo ghép:** 2 đến 14 người, chỉ rõ vị trí đang tuyển (`7/10 · Cần 1 Thủ môn, 2 Tiền đạo`).
- **Hết hạn giữ chỗ:** Đếm ngược `09:59` → `00:00`, chuyển đỏ cam khi dưới 2 phút.
- **Loading & Empty:** Skeleton bám sát tỷ lệ thật, hình minh họa thể thao riêng biệt cho từng trạng thái rỗng.

## 6. Interaction and Layout

- **Chuẩn hóa khung chứa:** Sử dụng component `PageContainer` thống nhất trên toàn bộ trang.
- **Mobile Action:** Nút hành động chính ghim đáy màn hình (Sticky Bottom Bar) trên di động.
- **Hiệu ứng vi mô:** Phản hồi chạm nảy nhẹ (`active:scale-[0.98]`), chuyển tab mượt mà.
