# SANGO RE-ENGINEERING — ĐẶC TẢ KỸ THUẬT TOÀN DIỆN (SPEC v1)

## BỐI CẢNH DỰ ÁN (đã kiểm chứng trên disk)
Monorepo pnpm **Sango** — nền tảng đặt sân thể thao Việt Nam:
- `apps/web`: React 18 + Vite + React Router v6 + TailwindCSS + lucide-react + TanStack Query.
  `src/`: components/, features/ (admin, ai, auth, booking, matches, notifications, owner, profile, public, reputation, teams, tournaments, wallet), lib/, pages/, routes/router.tsx
- `apps/api`: NestJS + Prisma + PostgreSQL + Zod/class-validator + JWT + Throttler.
  Modules: admin, ai, analytics, auth, bookings, courts, matches, notifications, payments, pricing, prisma, reputation, teams, tournaments, users, venues, venue-services, vouchers, wallets
- `packages/shared`: geo.ts, schemas.ts, index.ts (enums SportType/UserRole/BookingStatus, DTOs, utilities)
- API prefix: /api/v1

## QUY TẮC THỰC THI
1. Có thư mục `.codegraph/` — dùng CLI `codegraph explore/query/callers/callees/impact` để khám phá code thay vì grep/read tràn lan.
2. Working tree đang có thay đổi CHƯA COMMIT (schema.prisma, admin, venues...). KHÔNG stash/revert/checkout — làm việc chồng lên trạng thái hiện tại.
3. Đọc file có chọn lọc: grep định vị trước, read với offset/limit ~100 dòng quanh vị trí cần sửa. Ưu tiên edit đích, không ghi lại toàn bộ file dài trừ khi tạo mới.
4. Thứ tự ưu tiên: Phần 1 → 2 → 3 → 4 trước (bug chặn luồng tiền + IA), rồi 5 → 6 → 7. Sau mỗi phần lớn chạy typecheck/build tương ứng. Tuyệt đối không kết thúc khi repo đang build fail.
5. Nếu hết dư địa mà chưa xong: hoàn tất chắc chắn các phần trước, phần còn lại ghi rõ mục "Chưa hoàn thành".
6. Schema Prisma thiếu model cho tính năng mới thì bổ sung model + migration an toàn, tái sử dụng module wallets hiện có.

---

# PHẦN 1: SỬA LỖI CORE FLOW (GIỮ CHỖ, THANH TOÁN & ĐƠN ĐẶT)

## 1.1. Khắc phục lỗi "Giữ chỗ không thành công / Dữ liệu không hợp lệ"
- File: apps/web/src/features/booking/, apps/api/src/bookings/dto/booking.dto.ts, apps/api/src/bookings/bookings.service.ts
- Nguyên nhân: Payload từ Booking Modal/Calendar ở Web không khớp CreateHoldSchema:
  - `date`: bắt buộc chuẩn YYYY-MM-DD.
  - `slots`: mảng số nguyên phút bắt đầu (vd [1020, 1110]), KHÔNG gửi slot object.
  - `courtId`: UUID hợp lệ.
  - `slotsNeeded` (1..10): bắt buộc khi isPublicMatch: true.
- Yêu cầu: Chuẩn hóa hàm format payload frontend trước khi gọi POST /api/v1/bookings/holds. Thêm Toast hiển thị nguyên nhân lỗi cụ thể từ mã lỗi backend.

## 1.2. Sửa lỗi "Xác nhận thanh toán không ra gì" & Luồng Checkout
- File: apps/web/src/features/booking/pages/checkout-hold-page.tsx, payment-result-page.tsx, apps/api/src/payments/payments.service.ts
- checkout-hold-page.tsx: đồng hồ đếm ngược 10 phút của hold; tóm tắt tiền cọc DEPOSIT hoặc FULL; mã giảm giá đã áp dụng.
- Xử lý mượt mode mock và vnpay: mode mock bấm xác nhận → gọi thẳng callback API → điều hướng /thanh-toan/ket-qua?txnRef=...
- PaymentResultPage chuẩn UI/UX:
  - Thành công: icon checkmark xanh animated + thông tin đơn (mã đơn, tên sân, giờ đá, số tiền đã trả) + QR Check-in + nút "Xem đơn đặt của tôi" & "Về trang chủ".
  - Thất bại/hết hạn: lý do rõ ràng + nút "Thử thanh toán lại" / "Chọn giờ khác".

## 1.3. Trang "Xem đơn đã đặt" (/bookings)
- File: apps/web/src/features/booking/pages/my-bookings-page.tsx, routes/router.tsx
- Route chuẩn /bookings (thay /dashboard/my-bookings).
- Tabs: Tất cả / Sắp diễn ra / Hoàn thành / Đã hủy.
- Card: mã đơn, tên cụm sân, loại sân, khung giờ, tiền cọc/tổng, Badge CONFIRMED|CHECKED_IN|COMPLETED|CANCELLED.
- Modal QR check-in, chính sách hoàn tiền, nút Hủy đơn (GET /api/v1/bookings/:id/refund-preview + POST /api/v1/bookings/:id/cancel).

# PHẦN 2: TÁI CẤU TRÚC BẢN ĐỒ & TÌM KIẾM SÂN

## 2.1. Maps không hiển thị tile
- File: apps/web/src/features/public/components/interactive-venues-map.tsx
- Container w-full h-full min-h-[500px] (tránh height:0 trong flexbox/grid); nạp leaflet/dist/leaflet.css; tile OpenStreetMap chuẩn https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png; gọi map.invalidateSize() sau khi tab/container render xong.

## 2.2. Tab Bản đồ lên Navbar, bỏ Split View
- Navbar: thêm tab "Bản đồ" → /map.
- /map (MỚI): bản đồ fullscreen, marker cluster, click marker → card (ảnh, tên, địa chỉ, khoảng cách, giá từ, nút đặt ngay).
- /venues: XÓA split view → Grid Cards 3–4 cột hiện đại; XÓA panel "Tìm sân thể thao gần bạn" → thanh search tinh gọn + nút "Gần tôi" (Near Me icon) cạnh chọn Tỉnh/TP & Quận/Huyện; click "Gần tôi" xin GPS, lọc bán kính 3/5/10km Haversine.

## 2.3. Bộ lọc tìm kiếm
- Price range: dual slider hoặc Min–Max input + nút nhanh (<100k, 100k–200k, >200k/slot).
- Gộp FOOTBALL5+FOOTBALL7 thành nút "Bóng đá"; chọn "Sân 5 người"/"Sân 7 người" trong filter nâng cao/trang chi tiết sân.
- Date & Time picker trên thanh filter để chỉ hiện sân còn slot trống.

# PHẦN 3: ROUTING & IA

## 3.1. Customer URLs vs Admin/Owner
- CUSTOMER (role CUSTOMER) chỉ dùng URL sạch, KHÔNG BAO GIỜ redirect vào /dashboard/*:
  / , /venues , /venues/:slug , /map , /bookings , /wallet , /teams , /teams/:id , /matches , /profile , /about , /partner
- /dashboard/* chỉ cho OWNER và ADMIN với sidebar quản trị.

## 3.2. Trang chủ (/)
- Dọn apps/web/src/pages/home-page.tsx: không chèn widget đơn đặt/ví vào layout chung. Ví & Đơn đặt chỉ trong trang riêng hoặc dropdown Avatar trên Navbar.

## 3.3. Trang mới /about & /partner
- /about: sứ mệnh nền tảng kết nối thể thao, đội ngũ phát triển, tính năng nổi bật.
- /partner: chủ sân/doanh nghiệp — lợi ích số hóa sân, biểu đồ doanh thu tăng trưởng, form đăng ký hợp tác mở sân.
- Gắn link trên Navbar và Footer.

# PHẦN 4: UI/UX PRO-MAX

## 4.1. Hardcode text-white light mode
- Quét sạch text-white, bg-slate-900 hardcode thiếu dark: trong apps/web/src/components/ và features/.
- Chuyển sang semantic tokens: text-foreground, text-muted-foreground, bg-card, bg-background, border-border, bg-muted. Hoàn hảo Light + Dark mode.

## 4.2. Ví /wallet
- Số tiền (₫/VND): font-mono tracking-tight font-bold (tabular numbers).
- Nút Eye toggle ẩn/hiện số dư.
- Bảng lịch sử biến động (Topup, Booking payment, Refund, Team fund contribution) badge màu: xanh lá = nạp/hoàn, đỏ = trừ tiền.

# PHẦN 5: TEAM TREASURY (QUỸ ĐỘI)
- File: apps/web/src/features/teams/, apps/api/src/teams/
1. Tổng quỹ: thẻ số dư quỹ, tổng thu tháng, tổng chi tháng.
2. Đội trưởng tạo đợt thu quỹ (theo tháng/theo trận); thành viên "Đóng quỹ" bằng Ví cá nhân.
3. Split Bill: chọn 1 đơn đặt sân của đội → chia đều cho thành viên tham gia trận.
4. Nhật ký thu–chi: bảng chi tiết (lý do, số tiền, người chi, ảnh hóa đơn, ngày giờ).

# PHẦN 6: MATCHMAKING HUB
- File: apps/web/src/features/matches/pages/matches-page.tsx, apps/api/src/matches/
- Filter: môn thể thao, khu vực, cấp độ (Giao lưu/Vui vẻ/Cọ xát/Bán chuyên), khung giờ.
- Card kèo: chủ kèo (avatar + uy tín), sân & vị trí, slot trống ("Đã có 7/10 người · Cần 1 Thủ môn, 2 Tiền đạo"), chi phí/người ("45.000₫/người"), nút "Xin tham gia kèo", chat/bình luận trong kèo, tag Đang tìm người | Đã đủ người | Đã đá xong.

# PHẦN 7: USER PROFILE
- File: apps/web/src/features/profile/pages/profile-page.tsx, apps/api/src/users/
- Header: avatar upload, banner tùy chỉnh, tên, SĐT, email, bio ngắn.
- Hồ sơ thể thao: môn yêu thích, vị trí sở trường (Tiền đạo, Thủ môn, Hitter...), chân thuận, đẳng cấp tự đánh giá.
- Uy tín & thống kê: Reputation Score, tỷ lệ hoàn thành trận, số trận đã chơi, huy hiệu.
- Bảo mật & cài đặt: đổi mật khẩu, thông báo email/in-app, thông tin ngân hàng nhận hoàn tiền.

# PHẦN 8: DEFINITION OF DONE
1. pnpm --filter web build và pnpm --filter api build pass 100%, không lỗi TypeScript.
2. E2E: chọn sân → chọn giờ → hold 10 phút không lỗi payload → thanh toán → QR đúng trong /bookings. Light/Dark không lỗi chữ trắng nền trắng. /map đủ tile + marker.
3. Responsive mobile ≤640px và desktop ≥1024px.
