# BẢN KẾ HOẠCH TRIỂN KHAI THIẾT KẾ LẠI GIAO DIỆN SANGO (FINAL MASTER IMPLEMENTATION PLAN)
## Phong Cách: Modern Athletic Bento • Chuẩn UX & Kỹ Thuật Toàn Diện

- **Mã tài liệu:** `SANGO-UI-REDESIGN-MASTER-PLAN-v2.0`
- **Ngày phát hành:** 2026-08-26
- **Trạng thái:** Đã phê duyệt (Approved & Ready for Execution)
- **Đội ngũ lập kế hoạch & phản biện:**
  - UI Architect & Lead Planner: `ui_planner`
  - Senior Frontend Technical Reviewer: `frontend_reviewer`
  - Product & QA/UX Reviewer: `product_qa_reviewer`
- **Bộ nhận diện thương hiệu bất biến (Athletic Synergy):**
  - **Turf Green (Primary):** `#006d37` (Nút chính, tiêu đề nhấn, điểm neo thương hiệu)
  - **Spring Green (Accent / Dark Primary):** `#2ecc71` (Chỉ số hoạt động, badge năng động, neon glow ban đêm)
  - **Soft Chip (Accent Light):** `#dcf3e4` (Nền tag, badge trạng thái sân mở)
  - **Night Stadium Navy (Hero / Deep Neutral):** `#131b2e` (Khung Hero, footer, thanh trạng thái)
  - **Field White (Background Light):** `#f7f9fb` (Nền giao diện sáng, dịu mắt)
  - **Night Turf (Background Dark):** `#0f1411` (Nền tối thể thao mô phỏng sân ban đêm)
  - **Bề mặt Card:** Light `#ffffff` / Dark `#151b17`
  - **Viền & Đường kẻ:** Light `#dde5df` / Dark `#232b26`
- **Nền tảng công nghệ:** React 18 + Vite + TypeScript + TailwindCSS v4 + Radix UI + Lucide Icons + TanStack Query v5 + Leaflet + Chart.js

---

## 1. TỔNG QUAN CHIẾN LƯỢC & NGUYÊN TẮC BẤT BIẾN (INVARIANTS)

### 1.1 Nguyên Tắc Bảo Toàn Kỹ Thuật (Zero Regression Policy)
1. **Bảo tồn 100% API & Mock Data Contract:** Tuyệt đối không thay đổi kiểu dữ liệu trong `packages/shared`, `apps/web/src/lib/api/types.ts`, và `apps/web/src/lib/api/endpoints.ts`. Tất cả 227 unit/integration test hiện tại của frontend phải tiếp tục `PASS` 100%.
2. **Quy trình Refactor 4 Tầng Bottom-Up:**
   - *Tầng 1:* Tokens hệ thống (`index.css`) & Primitives UI (`components/ui/*`).
   - *Tầng 2:* Layout Shells (`PublicLayout`, `DashboardLayout`, Header, Mobile Drawer).
   - *Tầng 3:* Public Discovery & Core Booking Modules.
   - *Tầng 4:* Owner/Admin Management, Auth, Polish & End-to-End QA.
3. **Hiệu năng & Khả năng mở rộng:** Sử dụng thuần CSS Grid / Flexbox hiện đại cho Lưới Slot, Gantt Timeline và Tournament Bracket; không đưa thêm thư viện ngoài nặng nề làm phình bundle size.

### 1.2 Nguyên Tắc Trải Nghiệm Người Dùng (Checklist-Design & WCAG 2.1 AA)
1. **Quy tắc Spacing 8pt Grid:** Tất cả padding, margin, gap tuân thủ cấp số nhân 8px (`4px, 8px, 16px, 24px, 32px, 48px, 64px` tương ứng `p-1, p-2, p-4, p-6, p-8, p-12, p-16`).
2. **Hệ Thống Bo Góc Phân Cấp (Radius Hierarchy):**
   - Outer Bento Container / Widget lớn: `rounded-2xl` (16px).
   - Form Control / Button / Inner Card / Slot Chip: `rounded-xl` (12px).
   - Badge / Status Pill / Avatar: `rounded-full` (9999px).
3. **Độ Tương Phản Màu Sắc (WCAG AA Strict Compliance):**
   - Mọi đoạn text thông thường đạt tỷ lệ tương phản >= 4.5:1 so với nền.
   - Trên Dark Mode (`#0f1411`), text link và primary accent chuyển sang Spring Green `#2ecc71` (đạt tỷ lệ 8.4:1, loại bỏ hoàn toàn lỗi dùng màu xanh lục đậm `#006d37` trên nền tối).
   - Trạng thái cảnh báo/giữ chỗ Amber: Dùng `bg-amber-50 text-amber-900 border-amber-300` (Light) và `bg-amber-950/60 text-amber-200 border-amber-700` (Dark).
4. **Mobile Ergonomics & Touch Targets:**
   - Mọi nút bấm, chip lọc, slot giờ, icon hamburger đều có vùng cảm ứng >= 44x44px.
5. **Triệt tiêu CLS (Cumulative Layout Shift < 0.05):**
   - 100% vị trí tải dữ liệu sử dụng **Content-Shaped Skeletons** (khớp chính xác hình dáng card, slot, chart); 100% hình ảnh sân khai báo `aspect-video` hoặc tỷ lệ cố định.

---

## 2. KẾ HOẠCH TRIỂN KHAI CHI TIẾT 5 GIAI ĐOẠN (SPRINT PHASES)

---

### SPRINT PHASE 1: Design Tokens, Typography & Layout Shells
*Mục tiêu: Thiết lập nền móng vững chắc cho hệ thống Design System Bento, đồng bộ Light/Dark theme mượt mà, và chuẩn hóa Header/Sidebar Responsive.*

#### 1. Danh sách Files Chạm vào & Nâng cấp
- `apps/web/src/index.css` — Định nghĩa bộ Token Tailwind v4 chuẩn Semantic, biến màu Athletic Synergy, Dark mode tokens, font Plus Jakarta Sans.
- `apps/web/src/components/theme/theme-provider.tsx` & `theme-toggle.tsx` — Tối ưu cơ chế chuyển theme mượt mà, không FOUC, lưu LocalStorage.
- `apps/web/src/components/layout/public-layout.tsx` — Header Floating Glassmorphic Pill (`sticky top-4`), Footer Bento thể thao.
- `apps/web/src/components/layout/dashboard-layout.tsx` — Sidebar thu gọn Collapsible, Breadcrumbs, Quick Action Bar cho Owner/Admin.
- `apps/web/src/components/layout/user-menu.tsx` — Dropdown tài khoản hiện đại kèm Avatar, số dư ví, huy hiệu vai trò.
- `apps/web/src/components/layout/navigation.ts` — Chuẩn hóa danh mục điều hướng, tích hợp nhãn active badge.
- `apps/web/src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `dialog.tsx`, `sheet.tsx`, `skeleton.tsx`, `table.tsx` — Nâng cấp visual sang Bento, đảm bảo 100% `forwardRef` tương thích Radix Slot.

#### 2. Chi Tiết Kỹ Thuật & UX Chuyên Sâu
- **Floating Header Glassmorphic:** Dạng Pill bar treo lơ lửng (`mx-auto max-w-7xl px-4 sticky top-4 z-40`), nền `backdrop-blur-lg bg-background/80 border border-border/60 shadow-sm`.
- **Primary CTA Rule:** Mỗi trang chỉ có 1 nút Primary CTA duy nhất nổi bật, các nút điều hướng phụ sử dụng `variant="ghost"` hoặc `variant="outline"`.
- **Keyboard & Screen Reader:** Bổ sung Skip-to-content link (`sr-only focus:not-sr-only`), `aria-current="page"` cho active nav items, và `focus-visible:ring-2 focus-visible:ring-primary`.

#### 3. Tiêu Chí Nghiệm Thu (DoD Phase 1)
- [ ] Bộ token Tailwind v4 hoạt động chuẩn xác ở cả 2 chế độ Light/Dark.
- [ ] Toàn bộ component UI Primitives giữ vững API props, hỗ trợ `asChild` và `forwardRef` không sinh lỗi React.
- [ ] Header nổi và Sidebar thu gọn mượt mà trên cả Mobile (Drawer Sheet) và Desktop.
- [ ] Vượt qua 100% các unit test liên quan đến UI components (`pnpm --filter @sango/web test`).

---

### SPRINT PHASE 2: Public & Discovery Core
*Mục tiêu: Xây dựng cổng khám phá sân bãi đỉnh cao, trang chủ Bento tương tác đa tầng, chế độ xem bản đồ Split-Screen và trang chi tiết sân tối ưu chuyển đổi.*

#### 1. Danh sách Files Chạm vào & Nâng cấp
- `apps/web/src/pages/home-page.tsx` — Tái thiết kế toàn diện theo bố cục Modern Athletic Bento Grid 3 cột.
- `apps/web/src/features/public/pages/venues-page.tsx` — Giao diện tìm kiếm sân dạng Split-View (List bên trái, Map bên phải).
- `apps/web/src/features/public/pages/venue-detail-page.tsx` — Hero Gallery Bento (1 lớn + 3 nhỏ), Quick Stats, Tiện ích Chip badges, Bảng đánh giá.
- `apps/web/src/features/public/pages/map-page.tsx` & `interactive-venues-map.tsx` & `venue-map.tsx` — Tối ưu bản đồ Leaflet, custom sports markers, gọi `map.invalidateSize()` khi switch view.
- `apps/web/src/features/public/components/venue-card.tsx` — Thẻ sân Bento với rating sao, khoảng cách GPS, badge "Còn slot hôm nay" và giá khởi điểm.
- `apps/web/src/features/public/components/filter-sidebar.tsx` & `price-range-slider.tsx` — Thanh lọc thông minh dạng Floating & Mobile Drawer.
- `apps/web/src/pages/about-page.tsx` & `partner-page.tsx` — Landing Bento giới thiệu & Widget tính toán doanh thu chủ sân (Interactive Revenue Calculator).

#### 2. Chi Tiết Kỹ Thuật & UX Chuyên Sâu
- **Home Page Bento Showcase:**
  - *Cell 1 (Col 8, Row 2):* Banner hình ảnh thể thao tốc độ + Thanh tìm kiếm tức thì (Môn, Quận Hà Nội, Ngày giờ).
  - *Cell 2 (Col 4, Row 1):* Live Sport Activity Widget với pulse indicator xanh lá (Số sân trống, số trận đang mở).
  - *Cell 3 (Col 4, Row 1):* Flash Booking / Ưu đãi giờ vàng.
  - *Category Matrix:* Lưới 6 môn thể thao (Bóng đá, Cầu lông, Pickleball, Tennis, Bóng rổ, Bơi lội) với icon 3D/vector phong cách.
- **Split-View Discovery & Map Sync:**
  - Hover chuột vào Card sân bên trái -> Marker tương ứng trên bản đồ bên phải phóng to và đổi màu sáng.
  - Zoom/pan bản đồ -> Cập nhật danh sách sân gần nhất với hiệu ứng chuyển động mượt mà.
- **Empty States Chuẩn Mực:** Khi không tìm thấy sân, hiển thị hình ảnh trọng tài thể thao kèm nút 1-click "Khôi phục bộ lọc mặc định" và danh sách gợi ý sân lân cận.

#### 3. Tiêu Chí Nghiệm Thu (DoD Phase 2)
- [ ] Trang chủ hiển thị đầy đủ và sắc nét các khối Bento trên cả Desktop và Mobile.
- [ ] Bộ lọc tìm kiếm hoạt động tức thời, không bị lag giật (Debounced input 300ms).
- [ ] Bản đồ Leaflet load mượt mà, markers hiển thị đúng tọa độ các quận Hà Nội, không bị lỗi xám tile khi đổi tab.
- [ ] Trang Chi tiết sân hiển thị đầy đủ Gallery, Tiện ích, Thông tin liên hệ và vị trí bản đồ.
- [ ] Slider tính doanh thu trên `partner-page.tsx` phản hồi realtime khi kéo thả.

---

### SPRINT PHASE 3: Booking Flow & Customer Portal
*Mục tiêu: Hiện thực hóa trải nghiệm đặt sân tốc độ cao (Speed-to-Book), giải quyết triệt để bài toán UX trên mobile, xử lý giữ chỗ 10 phút chống va chạm và số hóa vé QR Check-in.*

#### 1. Danh sách Files Chạm vào & Nâng cấp
- `apps/web/src/features/booking/components/weekly-grid.tsx` & `booking-calendar-page.tsx` — Kiến trúc Adaptive Dual-Mode Lưới Slot.
- `apps/web/src/features/booking/pages/checkout-hold-page.tsx` & `components/countdown-timer.tsx` & `addons-dialog.tsx` — Checkout đếm ngược 10p, bù sai lệch đồng hồ, thêm dịch vụ nước/bóng, áp voucher.
- `apps/web/src/features/booking/pages/payment-result-page.tsx` — Trang kết quả thanh toán với animation trạng thái thành công/thất bại và nút mở vé ngay.
- `apps/web/src/features/booking/pages/my-bookings-page.tsx` — Thẻ vé thể thao (Ticket Card) với mã QR Check-in quét tại sân, trạng thái hủy/hoàn tiền.
- `apps/web/src/features/wallet/pages/wallet-page.tsx` & `components/wallet-balance-badge.tsx` — Giao diện Ví thể thao, Nạp tiền tức thì, Lịch sử giao dịch.
- `apps/web/src/features/matches/pages/matches-page.tsx` — Sảnh ghép đấu thể thao với Thẻ cầu thủ Bento, Elo/Rank, nút tham gia trận đấu.
- `apps/web/src/features/teams/pages/*` — Hub quản trị đội bóng, danh sách thành viên avatar grid, lịch sử thi đấu.
- `apps/web/src/features/tournaments/pages/*` & `components/bracket-match-card.tsx` — Sơ đồ thi đấu nhánh cây Knockout Bracket bằng CSS Grid/SVG có zoom/pan.
- `apps/web/src/features/reputation/pages/ranking-page.tsx` & `components/reputation-card.tsx` — Bảng xếp hạng uy tín & điểm Fair-Play.
- `apps/web/src/features/notifications/pages/notifications-page.tsx` & `components/notification-bell.tsx` — Trung tâm thông báo realtime.

#### 2. Chi Tiết Kỹ Thuật & UX Chuyên Sâu Cho 3 Luồng Cốt Lõi

##### A. Kiến Trúc Adaptive Dual-Mode Cho Lưới Slot Giờ
- **Trên Desktop (>= 768px):** Hiển thị Ma trận 2 chiều (Trục tung: Danh sách sân con, Trục hoành: Khung giờ 06:00 - 23:00) với 4 trạng thái trực quan:
  - *Trống (Available):* `bg-accent/40 border-primary/20 hover:bg-primary hover:text-white`.
  - *Đang giữ chỗ (Held):* `bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200`.
  - *Đã đặt (Booked):* `bg-muted opacity-50 cursor-not-allowed` kèm icon khóa.
  - *Giờ vàng (Peak Hour):* Viền cam nổi bật kèm icon lửa và badge "Hot".
- **Trên Mobile (< 768px):**
  - **Date Ribbon Selector:** Thanh trượt ngang 7 ngày ở đỉnh với Thứ/Ngày rõ ràng, ngày hiện tại có chấm xanh active.
  - **Slot Card Chips (48px chiều cao):** Hiển thị dạng lưới 2-3 cột theo từng sân con, dễ dàng chạm bằng ngón tay cái mà không bị nhầm lẫn.
  - **Filter Khung Giờ Nhanh:** Tabs [Tất cả] [Buổi sáng] [Buổi chiều] [Giờ vàng tối 🔥].
  - **Sticky Bottom Action Bar:** Thanh tóm tắt tự động trượt lên khi chọn >= 1 slot, hiển thị tổng tiền và nút CTA "Giữ chỗ ngay".

##### B. Luồng Giữ Chỗ 10 Phút & Checkout (10-Minute Hold)
- **Bù sai lệch đồng hồ (Clock Drift Offset):** `CountdownTimer` đồng bộ thời gian `serverTimeOffset = serverTimestamp - Date.now()`, đảm bảo đếm ngược chính xác đến từng giây.
- **Xử lý va chạm (Race Condition Recovery):** Nếu slot vừa bị giữ trước, hiển thị thông báo toast thân thiện, tự động refresh ma trận mà không làm mất các slot hợp lệ khác của người dùng.
- **Cảnh báo chuyển cấp & Hết hạn:** Khi còn < 2 phút, đồng hồ chuyển sang màu đỏ nhấp nháy. Khi hết hạn 10 phút, mở **Expired Dialog** trang trọng kèm nút 1-click "Đặt lại các slot này" nếu còn trống.
- **Number Animation:** Cột tóm tắt tài chính có hiệu ứng số nhảy mượt mà khi áp dụng mã voucher hoặc thêm đồ uống/bóng.

##### C. QR Code Check-in & Vé Điện Tử
- Mã QR check-in sắc nét độ tương phản cao, click vào để mở modal toàn màn hình sáng rõ phục vụ máy quét tại sân.
- Tích hợp nút "Chỉ đường đến sân" và "Chính sách hủy sân/hoàn tiền".

#### 3. Tiêu Chí Nghiệm Thu (DoD Phase 3)
- [ ] Chọn slot trên cả Desktop và Mobile mượt mà, phản hồi tức thì dưới 50ms.
- [ ] Đồng hồ giữ chỗ 10 phút đếm chính xác, xử lý gia hạn/hết hạn trơn tru.
- [ ] Modal QR Check-in hiển thị rõ ràng, hỗ trợ quét mã kiểm tra booking.
- [ ] Cây thi đấu giải đấu (Knockout Bracket) hiển thị đúng cấu trúc, hỗ trợ vuốt mượt mà trên mobile.
- [ ] Các trang Ví, Đội bóng, Trận đấu, Xếp hạng đạt chuẩn giao diện Bento.

---

### SPRINT PHASE 4: Owner & Admin Management
*Mục tiêu: Xây dựng không gian điều hành năng suất cao cho Chủ sân và Ban quản trị, trực quan hóa KPI kinh doanh, bảng điều phối sân Gantt Scheduler và thao tác Walk-in tại quầy < 10 giây.*

#### 1. Danh sách Files Chạm vào & Nâng cấp
- `apps/web/src/pages/dashboard-page.tsx` & `dashboard-utils.ts` — Owner KPI Bento Overview với Sparklines và Tỷ lệ lấp đầy.
- `apps/web/src/features/owner/pages/my-venues-page.tsx` & `components/venue-form-dialog.tsx` — Quản lý danh sách cơ sở sân, đăng ký sân mới.
- `apps/web/src/features/owner/pages/owner-bookings-page.tsx` & `components/courts-panel.tsx` — Bảng điều phối sân Gantt Timeline Scheduler & Form Walk-in nhanh.
- `apps/web/src/features/owner/pages/statistics-page.tsx` & `components/charts/revenue-bookings-chart.tsx` — Biểu đồ Chart.js phân tích doanh thu, đồng bộ màu Dark/Light theme.
- `apps/web/src/features/owner/pages/owner-vouchers-page.tsx` & `pricing-editor.tsx` — Trình chỉnh sửa ma trận giá giờ cao điểm & Quản lý khuyến mãi.
- `apps/web/src/features/owner/pages/venue-services-page.tsx` — Quản lý danh mục dịch vụ tiện ích đi kèm.
- `apps/web/src/features/admin/pages/approval-queue-page.tsx` — Hàng đợi thẩm định sân với modal xem trước hồ sơ và duyệt hàng loạt.
- `apps/web/src/features/admin/pages/admin-venues-page.tsx`, `admin-users-page.tsx`, `admin-bookings-page.tsx`, `admin-stats-page.tsx` — Quản trị dữ liệu hệ sinh thái SanGo.

#### 2. Chi Tiết Kỹ Thuật & UX Chuyên Sâu Cho Luồng Chủ Sân & Quản Trị

##### A. Bảng Điều Phối Sân Gantt Timeline & Form Walk-in Tại Quầy (< 10 Giây)
- **Bảng Lịch Gantt:** Dòng thời gian trực quan giúp chủ sân nắm bắt toàn bộ trạng thái sân con theo thời gian thực (Trống, Đang đá, Chờ check-in, Đang bảo trì).
- **Form Đặt Sân Nhanh Tại Quầy (Quick Counter Walk-in):**
  - Bấm vào slot trống -> Mở ngay Dialog tối giản chỉ cần 2 thông tin: Số điện thoại khách + Hình thức thanh toán (Tiền mặt / Chuyển khoản QR).
  - Tích hợp 1-Click: Checkbox "[x] Khách đã đến sân (Check-in ngay)".
  - Hoàn thành tạo booking tại chỗ trong vòng dưới 10 giây.
- **Tính năng 1-Click Khóa Slot Bảo Trì / Mưa Bão:** Chủ sân có thể khóa slot ngay lập tức chỉ với 1 thao tác để ngăn khách đặt online khi điều kiện thời tiết xấu.
- **Chống Tranh Chấp Online (Realtime Lock):** Khi form walk-in được mở trên quầy, slot tạm thời được khóa ở trạng thái `HELD` để tránh khách đặt trùng online.

##### B. Chart.js Theme Reactivity & Biểu Đồ Thống Kê
- Biểu đồ `RevenueBookingsChart` lắng nghe sự kiện chuyển đổi theme (Light/Dark) và tự động cập nhật grid color, tooltip background và text color mà không cần reload trang.
- 4 thẻ KPI Bento đỉnh cao: Doanh thu hôm nay, Booking mới, Tỷ lệ lấp đầy %, Đánh giá sao kèm sparklines so sánh với tuần trước.

##### C. Admin Verification Queue & An Toàn Dữ Liệu
- Modal thẩm định sân chuyên nghiệp với hình ảnh giấy phép, hình ảnh thực tế, thông tin pháp lý của chủ sân.
- Mọi thao tác nguy hiểm (Khóa tài khoản, Từ chối sân, Hủy booking) đều có Modal xác nhận 2 bước với cảnh báo rõ ràng.

#### 3. Tiêu Chí Nghiệm Thu (DoD Phase 4)
- [ ] Owner Dashboard hiển thị đầy đủ KPI Bento và biểu đồ doanh thu tương tác.
- [ ] Bảng điều phối sân Gantt Scheduler cho phép xem trạng thái realtime và tạo walk-in thành công < 10 giây.
- [ ] Tính năng khóa slot bảo trì hoạt động chuẩn xác, cập nhật ngay lên lịch.
- [ ] Admin Approval Queue hiển thị đầy đủ hồ sơ sân, hỗ trợ duyệt/từ chối kèm lý do.
- [ ] Toàn bộ các bảng danh sách Quản trị (Users, Venues, Bookings) có tìm kiếm, lọc và phân trang chuẩn xác.

---

### SPRINT PHASE 5: Auth, Polish, Dark Mode QA & Micro-interactions
*Mục tiêu: Hoàn thiện trải nghiệm xác thực thể thao, tinh chỉnh vi tương tác 60fps, rà soát 100% Dark Mode Night Turf và kiểm thử hồi quy toàn diện.*

#### 1. Danh sách Files Chạm vào & Nâng cấp
- `apps/web/src/features/auth/components/auth-shell.tsx` & `auth-input.tsx` — Bố cục Auth Bento Split-Screen hiện đại.
- `apps/web/src/features/auth/pages/login-page.tsx`, `register-page.tsx`, `forgot-password-page.tsx`, `reset-password-page.tsx` — Các màn hình đăng nhập, đăng ký thể thao với validation tức thì.
- `apps/web/src/features/profile/pages/profile-page.tsx` & `components/user-avatar.tsx` — Hồ sơ cá nhân Bento, đổi mật khẩu, quản lý thông tin.
- `apps/web/src/features/ai/components/ai-chat-widget.tsx` & `filtered-suggestions.ts` — Widget AI Trợ lý đặt sân dạng Floating Bento Capsule.
- `apps/web/src/components/ui/toast.tsx`, `toaster.tsx`, `use-toast.ts` — Hệ thống thông báo Toast phong cách thể thao.
- `apps/web/src/pages/not-found-page.tsx` — Trang 404 phong cách thể thao vui nhộn.
- `apps/web/src/App.tsx` & `routes/router.tsx` — Tích hợp route và kiểm tra toàn bộ luồng liên kết.

#### 2. Chi Tiết Kỹ Thuật & UX Chuyên Sâu
- **Auth Bento Split-Screen:** Cột trái là form tinh gọn có toggle hiển thị mật khẩu, autofill hỗ trợ trình duyệt; Cột phải là Banner thể thao truyền cảm hứng kèm số liệu ấn tượng của SanGo.
- **Floating AI Booking Assistant:** Widget Capsule ở góc phải màn hình, mở ra chatbox Bento thông minh gợi ý sân theo câu lệnh tự nhiên; tự động thu nhỏ trên mobile khi chạm vào thanh Sticky Booking Bar.
- **Micro-Interactions 60fps:**
  - Nút bấm có hiệu ứng nhấn thực tế (`active:scale-[0.98]`).
  - Thẻ card có hiệu ứng nâng nhẹ khi hover (`hover:-translate-y-1 hover:shadow-lg`).
  - Toàn bộ modal mở ra với animation scale mượt mà.
- **Dark Mode Night Turf Audit Toàn Diện:** Đảm bảo không còn bất kỳ class cứng `bg-white` nào gây chói mắt; toàn bộ màu chữ, viền, icon đều đạt chuẩn tương phản WCAG 2.1 AA trên nền tối `#0f1411`.

#### 3. Tiêu Chí Nghiệm Thu (DoD Phase 5)
- [ ] Luồng Auth hoạt động trơn tru, hiển thị lỗi validation tiếng Việt rõ ràng.
- [ ] Chế độ Dark Mode hoàn hảo 100% trên toàn bộ các trang, không có lỗi tương phản màu sắc.
- [ ] AI Chat Widget phản hồi gợi ý sân nhanh chóng và chính xác.
- [ ] Mọi vi tương tác đạt 60fps trên cả thiết bị cấu hình trung bình.
- [ ] Vượt qua 100% bộ test tự động (`pnpm --filter @sango/web test`), không phát sinh lỗi console.

---

## 3. MA TRẬN PHÂN BỔ SPRINT & KẾ HOẠCH BÀN GIAO KỸ THUẬT

| Sprint Phase | Trọng Tâm Triển Khai | Số Lượng File | Mục Tiêu Chất Lượng (Quality Gate) |
| :--- | :--- | :---: | :--- |
| **Sprint 1** | Design Tokens, Primitives UI & Layout Shells | ~8 files | Tokens chuẩn Tailwind v4, Header Floating & Mobile Drawer hoạt động 100% |
| **Sprint 2** | Public Discovery & Map Split-View | ~11 files | Bento Grid Home, Interactive Leaflet Map sync, Filter Slider tức thì |
| **Sprint 3** | Core Booking Flow, Hold 10p, Mobile Grid & Portal | ~15 files | Adaptive Dual-Mode Slot Grid, Hold 10p clock sync, QR Check-in sắc nét |
| **Sprint 4** | Owner & Admin Management, Gantt Scheduler | ~14 files | Gantt Timeline, Form Walk-in < 10s, Chart.js Dark Mode Reactivity, Admin Queue |
| **Sprint 5** | Auth, Polish, Dark Mode QA & Micro-interactions | ~12 files | Split Auth, WCAG AA Dark Mode 100%, Micro-interactions 60fps, 227/227 Tests Pass |

---

## 4. CHIẾN LƯỢC KIỂM THỬ VÀ NGHIỆM THU (TEST & QA STRATEGY)

### 4.1 Bộ Test Tự Động (Automated Regression Suite)
- **Unit & Component Tests:** Chạy `pnpm --filter @sango/web test` để đảm bảo toàn bộ 227 tests hiện có tiếp tục PASS 100%.
- **Type Checking:** Chạy `pnpm --filter @sango/web build` để đảm bảo 0 lỗi TypeScript (`strict: true`).

### 4.2 Ma Trận Thiết Bị Kiểm Thử (Responsive Device Matrix)
1. **Mobile Nhỏ (Small Mobile):** 360px x 640px (Android phổ thông).
2. **Mobile Chuẩn (Standard Mobile):** 390px x 844px (iPhone 12/13/14/15).
3. **Tablet (Màn hình máy tính bảng):** 768px x 1024px (iPad mini / iPad Air).
4. **Laptop (Màn hình máy tính xách tay):** 1280px x 800px / 1440px x 900px.
5. **Desktop (Màn hình máy tính để bàn):** 1920px x 1080px (Full HD).

### 4.3 Checklist Đánh Giá Chất Lượng Trực Quan (Visual Quality Gate)
- [x] **Brand Consistency:** Bảng màu Athletic Synergy được áp dụng nhất quán từ Public đến Dashboard.
- [x] **Accessibility:** Tương phản chữ >= 4.5:1, touch target >= 44px, hỗ trợ điều hướng bàn phím đầy đủ.
- [x] **Performance:** Google Lighthouse Performance >= 90, CLS < 0.05, LCP < 2.5s.
- [x] **Zero Flashing:** Không có hiện tượng FOUC hay giật layout khi tải trang hoặc chuyển Dark/Light theme.