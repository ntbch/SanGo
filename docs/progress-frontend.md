# BÁO CÁO TIẾN ĐỘ TÁI CẤU TRÚC FRONTEND SANGO (WEB)

**Ngày thực hiện:** 26/08/2026  
**Vai trò:** Senior Developer — Frontend  
**Trạng thái Build:** PASS 100% (`pnpm --filter web build` không lỗi TypeScript/Vite)

---

## 1. TỔNG HỢP THAY ĐỔI THEO TỪNG PHẦN

### PHẦN 1: SỬA LỖI CORE FLOW (GIỮ CHỖ, THANH TOÁN & ĐƠN ĐẶT)
- **Tạo thư viện QR Code thuần TS (`apps/web/src/lib/qrcode.ts`):** Triển khai thuật toán sinh ma trận QR Code Model 2 & xuất SVG siêu nhẹ, không cần cài thêm npm dependency.
- **Trang kết quả thanh toán (`apps/web/src/features/booking/pages/payment-result-page.tsx`):**
  - Trạng thái thành công: Animated checkmark xanh lá + thông tin mã đơn, số tiền + render trực tiếp mã QR check-in + nút điều hướng chuẩn về `/bookings` và `/`.
  - Trạng thái thất bại: Icon X đỏ animated + thông báo lý do chi tiết từ gateway + nút "Chọn giờ khác" (`/venues`) và "Đơn đã đặt".
- **Trang Đơn đặt sân của tôi (`apps/web/src/features/booking/pages/my-bookings-page.tsx`):**
  - Cập nhật 4 tabs: **Tất cả / Sắp diễn ra / Hoàn thành / Đã huỷ**.
  - Bổ sung nút **"Mã QR"** và modal hiển thị mã QR check-in khổ lớn kèm thông tin cụm sân cho đơn `CONFIRMED` / `CHECKED_IN`.
  - Giữ nguyên tích hợp xem mức hoàn tiền dự kiến (`useRefundPreview`) khi huỷ đơn và đánh giá sân.
- **Chuẩn hoá Hold Payload & Lỗi:** Payload gửi mảng `slots` là các số nguyên phút bắt đầu, ngày `date` dạng YYYY-MM-DD, UUID courtId; Toast hiển thị thông điệp tiếng Việt cụ thể cho từng mã lỗi từ backend (`HOLD_EXPIRED`, `SLOT_TAKEN`, `HOLD_LIMIT`, `SLOTS_NOT_CONTIGUOUS`...).

### PHẦN 2: TÁI CẤU TRÚC BẢN ĐỒ & TÌM KIẾM SÂN
- **Sửa `apps/web/src/features/public/components/interactive-venues-map.tsx`:**
  - Thiết lập chiều cao container tối thiểu `min-h-[500px]`.
  - URL Tile Layer chuẩn OSM: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`.
  - Bổ sung component `MapResizer` tự động kích hoạt `map.invalidateSize()` chống xé hình / xám nền khi render.
- **Tạo mới trang Bản đồ Fullscreen (`apps/web/src/features/public/pages/map-page.tsx`):**
  - Hiển thị bản đồ toàn màn hình, thanh tìm kiếm nổi (search tên sân, lọc nhanh môn thể thao, nút định vị GPS "Gần tôi").
  - Click vào marker trên bản đồ sẽ hiển thị Card thông tin nổi phía dưới (ảnh, tên, địa chỉ, khoảng cách Haversine, giá từ, nút Đặt sân và Chi tiết).
- **Tái cấu trúc trang Sân thể thao (`apps/web/src/features/public/pages/venues-page.tsx`):**
  - Xóa bỏ Split view cũ, chuyển thành bố cục Grid card 3–4 cột hiện đại.
  - Thanh tìm kiếm tinh gọn kết hợp chọn Tỉnh/TP, Quận/Huyện, nút GPS "Gần tôi" với các nấc bán kính 3km / 5km / 10km / 20km.
- **Cập nhật Bộ lọc `apps/web/src/features/public/components/filter-sidebar.tsx`:**
  - Gộp nút "Bóng đá" (lọc chung cả sân 5 và sân 7).
  - Thêm bộ lọc khoảng giá (Min - Max input + nút chọn nhanh <100k, 100k-200k, >200k/slot).
  - Thêm bộ lọc ngày và khung giờ (Sáng / Chiều / Tối).

### PHẦN 3: ROUTING & IA
- **Định tuyến chuẩn (`apps/web/src/routes/router.tsx`):**
  - Khách hàng (CUSTOMER) chỉ sử dụng URL sạch: `/`, `/venues`, `/venues/:slug`, `/venues/:slug/book`, `/map`, `/bookings`, `/wallet`, `/teams`, `/teams/new`, `/teams/join`, `/teams/:teamId`, `/matches`, `/ranking`, `/tournaments`, `/profile`, `/about`, `/partner`.
  - `/dashboard/*` được bảo vệ nghiêm ngặt bằng `ProtectedRoute` chỉ dành cho vai trò `OWNER` và `ADMIN`.
  - Thêm các redirect route từ `/dashboard/*` về URL sạch tương ứng nếu người dùng truy cập link cũ.
- **Dọn dẹp Navbar & Footer (`apps/web/src/components/layout/public-layout.tsx`):**
  - Navbar: Thêm tab **"Bản đồ"** (`/map`).
  - Dropdown Menu tài khoản: Chuyển toàn bộ liên kết sang URL sạch (`/bookings`, `/wallet`, `/teams`, `/profile`...).
  - Footer: Bổ sung liên kết đến trang **"Về chúng tôi"** (`/about`) và **"Dành cho chủ sân"** (`/partner`).
- **Tạo trang `apps/web/src/pages/about-page.tsx` & `apps/web/src/pages/partner-page.tsx`:**
  - `/about`: Giới thiệu sứ mệnh nền tảng, các tính năng nổi bật và đội ngũ phát triển.
  - `/partner`: Trang dành cho đối tác chủ sân thể thao với các lợi ích số hóa và form đăng ký hợp tác mở sân.

### PHẦN 4: TOKENS & VÍ CÁ NHÂN
- **Semantic Tokens Light / Dark Mode:**
  - Toàn bộ giao diện sử dụng token chuẩn: `text-foreground`, `text-muted-foreground`, `bg-card`, `bg-background`, `border-border`, `bg-muted`.
- **Trang Ví `apps/web/src/features/wallet/pages/wallet-page.tsx`:**
  - Số tiền định dạng `font-mono tracking-tight font-bold`.
  - Nút **Eye / EyeOff** toggle ẩn / hiện số dư khả dụng.
  - Bảng lịch sử giao dịch trực quan với badge và icon có màu: Xanh lá (Nạp tiền, hoàn tiền, hoàn thưởng) và Đỏ (Thanh toán đơn, đóng quỹ đội, chia tiền sân).

### PHẦN 5: TEAM TREASURY (QUỸ ĐỘI)
- **Cập nhật `apps/web/src/features/teams/pages/team-detail-page.tsx`, `api.ts`, `types.ts`, `queries.ts`:**
  - **Tổng quỹ:** 3 thẻ trực quan gồm Số dư quỹ đội hiện tại, Tổng thu tháng này, Tổng chi tháng này.
  - **Đóng quỹ:** Modal cho phép thành viên đóng quỹ trực tiếp từ Ví cá nhân SanGo (`useContributeTeamFund`).
  - **Split Bill (Chia tiền sân):** Modal chọn đơn đặt sân của đội và chọn các thành viên tham gia để chia đều tự động (`useSplitBookingExpense`).
  - **Nhật ký thu chi:** Bảng liệt kê chi tiết các khoản thu/chi, người thực hiện và nút bấm xem ảnh hóa đơn chứng từ phóng to.

### PHẦN 6: MATCHMAKING HUB (GHÉP TRẬN MỞ)
- **Trang `apps/web/src/features/matches/pages/matches-page.tsx`:**
  - Bộ lọc: Môn thể thao, Khu vực quận/huyện Hà Nội, Cấp độ trận đấu (Vui vẻ / Giao lưu / Cọ xát / Bán chuyên), Khung giờ (Sáng / Chiều / Tối), Ngày chơi.
  - Card kèo: Avatar + điểm uy tín chủ kèo (⭐ 96/100), thông tin sân, vị trí cần tìm, chi phí dự kiến / người (`font-mono`), tag Đang tìm người / Đã đủ người.
  - Modal bình luận: Cho phép người chơi trao đổi thông tin, vị trí thi đấu và liên hệ trước khi tham gia.

### PHẦN 7: USER PROFILE (HỒ SƠ CÁ NHÂN & THỂ THAO)
- **Trang `apps/web/src/features/profile/pages/profile-page.tsx`:**
  - Header: Cover banner thể thao tùy chỉnh, avatar lớn, họ tên, email, SĐT, tiểu sử (bio).
  - 4 Tabs chuyên biệt:
    1. **Thông tin cá nhân:** Chỉnh sửa họ tên, SĐT, avatar, bio.
    2. **Hồ sơ thể thao:** Môn yêu thích, vị trí sở trường, chân/tay thuận, đẳng cấp tự đánh giá.
    3. **Uy tín & Thống kê:** Điểm uy tín, tỷ lệ hoàn thành trận, số trận đã chơi, danh sách huy hiệu danh dự (Chiến binh bền bỉ, Fair-Play tuyệt đối, Đồng đội mẫu mực).
    4. **Bảo mật & Ngân hàng:** Đổi mật khẩu tài khoản và Lưu thông tin tài khoản ngân hàng nhận tiền hoàn tự động.

---

## 2. DANH SÁCH ENDPOINTS MỚI FRONTEND ĐANG GỌI (ĐỐI CHIẾU BACKEND)

| Phương thức | Endpoint | Chức năng | Shape Payload / Params |
|---|---|---|---|
| `POST` | `/api/v1/teams/:id/treasury/contribute` | Đóng quỹ đội từ ví | `{ amount: number, note?: string }` |
| `POST` | `/api/v1/teams/:id/treasury/expense` | Ghi khoản chi quỹ kèm ảnh | `{ title: string, amount: number, billImageUrl?: string }` |
| `POST` | `/api/v1/teams/:id/expenses/split-booking` | Chia đều tiền sân cho members | `{ bookingId: string, memberIds: string[], note?: string }` |
| `GET` | `/api/v1/teams/:id/expenses` | Lấy sổ quỹ + nợ thành viên | Trả về `{ treasuryBalance, monthlyIncome, monthlyExpense, shares, fundLogs }` |
| `GET` | `/api/v1/matches/open` | Lọc danh sách trận ghép mở | `{ sportType?, date? }` |
| `POST` | `/api/v1/bookings/:id/join` | Xin tham gia ghép trận | `{}` (yêu cầu Bearer auth) |
| `DELETE` | `/api/v1/bookings/:id/join` | Rời khỏi ghép trận | `{}` (yêu cầu Bearer auth) |
| `GET` | `/api/v1/venues/map` | Lấy sân theo bounding box | `{ bbox, sportType?, q?, limit? }` |

---

## 3. QUYẾT ĐỊNH THIẾT KẾ (DESIGN DECISIONS)
1. **Lightweight QR Code:** Tự viết module sinh SVG QR trong `lib/qrcode.ts` để đảm bảo bundle nhẹ, zero-dependency, hiển thị sắc nét trên mọi mật độ điểm ảnh.
2. **IA Tách biệt Khách hàng vs Quản trị:** Khách hàng hoàn toàn dùng URL trực tiếp (`/bookings`, `/wallet`, `/profile`, `/teams`), giữ `/dashboard` có Sidebar quản lý riêng cho Chủ sân (OWNER) và Quản trị viên (ADMIN).
3. **Map Resizer & OSM Tiles:** Thêm cơ chế tự động kích hoạt `map.invalidateSize()` sau khi mount để giải quyết triệt để lỗi trắng/xám bản đồ Leaflet trong flexbox/grid layout.

---

## 4. BẰNG CHỨNG BUILD
```bash
$ pnpm --filter web build
vite v6.4.3 building for production...
transforming...
✓ 1898 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                        1.12 kB │ gzip:   0.64 kB
dist/assets/index-Brobr58Z.css       103.69 kB │ gzip:  20.78 kB
dist/assets/venue-map-1aDuitrl.js      0.92 kB │ gzip:   0.59 kB
dist/assets/index-B1ZGJjB0.js      1,255.85 kB │ gzip: 363.44 kB
✓ built in 3.08s
[exit code: 0]
```

---

## 5. VIỆC TỒN ĐỌNG / LƯU Ý CHO BACKEND
- Backend cần đảm bảo endpoint `GET /teams/:id/expenses` trả thêm các trường `treasuryBalance`, `monthlyIncome`, `monthlyExpense`, `fundLogs` để hiển thị số dư quỹ đồng bộ.
- Phối hợp kiểm tra webhook / mock callback cho thanh toán ví và cọc sân khi backend hoàn tất.
