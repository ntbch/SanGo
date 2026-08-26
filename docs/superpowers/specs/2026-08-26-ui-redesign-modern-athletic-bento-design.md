# SanGo UI Redesign Specification: Modern Athletic Bento

- **Date:** 2026-08-26
- **Status:** Draft / Ready for Implementation
- **Style Direction:** Direction 1 — Modern Athletic Bento
- **Target App:** `apps/web` (React 18 + Vite + TypeScript + TailwindCSS v4 + Radix UI)

---

## 1. Executive Summary & Brand Identity

Hệ thống **SanGo** được tái thiết kế toàn diện theo phong cách **Modern Athletic Bento**, mang đến trải nghiệm trực quan, nhịp điệu thể thao công nghệ cao cấp, hiện đại và tối ưu hóa khả năng thao tác nhanh (speed-to-book).

### 1.1 Nguyên tắc bảo toàn nhận diện (Brand Preservation)
- **Giữ nguyên logo và typography nhận diện SanGo.**
- **Bảng màu cốt lõi:**
  - **Primary (Turf Green):** `#006d37` (Nút chính, tiêu đề nhấn, điểm neo thương hiệu).
  - **Accent / Highlight (Spring Green):** `#2ecc71` (Chỉ số hoạt động, badge năng động, neon glow ban đêm).
  - **Accent Light / Soft Chip:** `#dcf3e4` (Nền tag, badge trạng thái sân mở).
  - **Hero / Deep Neutral (Night Stadium Navy):** `#131b2e` (Khung Hero, footer, thanh trạng thái).
  - **Background (Field White):** `#f7f9fb` (Nền giao diện sáng, dịu mắt).
  - **Dark Background (Night Turf):** `#0f1411` (Nền tối thể thao mô phỏng sân ban đêm).
  - **Card Surface:** Sáng `#ffffff` / Tối `#151b17`.
  - **Border & Dividers:** Sáng `#dde5df` / Tối `#232b26`.

---

## 2. Design System & Component Foundation

### 2.1 Bento Grid Principles
- **Grid Layouts:** Kết hợp lưới 12-cột linh hoạt với các thẻ Bento có `col-span-*` và `row-span-*` đa dạng (1x1, 2x1, 2x2, 3x2).
- **Corner Radii:** Chuẩn hóa `rounded-2xl` (16px) cho thẻ chính / Bento widget; `rounded-xl` (12px) cho thẻ con / item; `rounded-full` cho pill badges và floating action search bars.
- **Surface & Elevation:**
  - Lớp bề mặt tinh xảo với viền nhẹ `border border-border/80`.
  - Hiệu ứng đổ bóng nhiều tầng: `shadow-xs` cho trạng thái nghỉ, `shadow-md hover:shadow-xl hover:-translate-y-0.5` khi hover tương tác.
  - Sử dụng hiệu ứng mờ kính nhẹ `backdrop-blur-md bg-card/85` cho thanh điều hướng, sticky search bar và floating cart summary.

### 2.2 Typography Scale & Rhythm
- **Display / Hero:** Font sans thể thao mạnh mẽ, `tracking-tight font-black`.
- **H1 / H2 / H3:** Phân cấp rõ ràng với màu chữ tương phản cao (`text-foreground`).
- **Body & Micro-copy:** Cân đối khoảng cách dòng `leading-relaxed`, màu phụ `text-muted-foreground` đạt chuẩn tương phản.

---

## 3. Public Pages & User Flows

### 3.1 Public Header & Navbar
- **Thiết kế:** Dạng Floating Pill Bar (`sticky top-4 z-40 mx-auto max-w-7xl px-4`) với viền mờ kính `backdrop-blur-lg bg-background/80 border border-border/60 shadow-sm`.
- **Cấu trúc:**
  - Trái: Logo SanGo với biểu tượng thể thao đặc trưng.
  - Giữa: Navigation Pills (Trang chủ, Đặt sân, Tìm đối thủ, Đội bóng, Giải đấu).
  - Phải: Quick Search icon, Notification Bell with live count, Theme Toggle (Dark/Light), User Menu Dropdown / Login Button.

### 3.2 Home Page (`home-page.tsx`) — Bento Showcase
- **Hero Section:** Bento Grid 3 cột bất đối xứng:
  - *Cell 1 (Col 8, Row 2):* Banner hình ảnh động ấn tượng "Đặt sân nhanh trong 30 giây", kèm thanh tìm kiếm tức thì đa tiêu chí (Môn thể thao, Quận/Huyện Hà Nội, Ngày & Giờ).
  - *Cell 2 (Col 4, Row 1):* Live Sport Activity widget — Hiển thị số lượng trận đấu đang mở và số sân trống hôm nay với pulse indicator xanh lá.
  - *Cell 3 (Col 4, Row 1):* Quick AI Assistant / Khuyến mãi giờ vàng (Flash Booking).
- **Bento Category Matrix:** Lưới 6 môn thể thao (Bóng đá, Cầu lông, Pickleball, Tennis, Bóng rổ, Bơi lội) với icon 3D/vector phong cách, số lượng sân hiện có và giá khởi điểm.
- **Featured Venues Bento:** Card sân thể thao thiết kế lại với badge trạng thái (Còn slot / Đang hot), gallery trượt nhanh, tag tiện ích (Đỗ xe ô tô, Đèn chiếu sáng, Căng tin), khoảng cách GPS và rating sao vàng.
- **Matchmaking & Community Teaser:** Bento thẻ ghép đấu hiển thị trình độ (Rank), thời gian, sân thi đấu và nút "Tham gia ngay".

### 3.3 Venues Discovery & Map View (`venues-page.tsx`, `map-page.tsx`)
- **Split-Screen Interactive Layout:**
  - Bên trái (hoặc chuyển đổi tab): Danh sách sân thể thao dạng Bento Card tối ưu cuộn nhanh.
  - Bên phải: Bản đồ Leaflet tương tác tùy biến marker màu theo trạng thái sân, hỗ trợ hover đồng bộ giữa card và map marker.
- **Floating Smart Filter Pill:** Lọc nhanh theo Quận/Huyện, Khoảng giá (Price Slider), Môn thể thao, Tiện ích và Slot trống theo khung giờ.

### 3.4 Venue Detail & Interactive Slot Matrix (`venue-detail-page.tsx`)
- **Hero Gallery Bento:** 1 ảnh lớn chính kèm 3 ảnh phụ xem sân đa góc độ, rating badge, địa chỉ tích hợp chỉ đường Google Maps.
- **Time-Slot Matrix:**
  - Bố cục lưới trực quan: Trục tung là danh sách sân (Sân 1, Sân 2...), trục hoành là các khung giờ từ 06:00 đến 23:00.
  - Trạng thái slot phân định rõ ràng bằng màu sắc + icon + tooltip:
    - *Trống (Available):* Nền xanh nhạt `bg-accent/40 border-primary/20 hover:bg-primary hover:text-white`.
    - *Đang giữ chỗ / Hold:* Nền vàng hổ phách kèm bộ đếm ngược.
    - *Đã đặt (Booked):* Nền xám nhạt mờ disabled.
    - *Giờ vàng (Peak Hour):* Viền cam nổi bật có badge "Hot".
- **Sticky Booking Summary Drawer:** Khi người dùng click chọn các slot, thanh tóm tắt xuất hiện mượt mà ở góc dưới màn hình hiển thị tổng tiền, thời gian giữ chỗ (Hold countdown) và nút "Tiến hành giữ chỗ / Thanh toán".

---

## 4. Community & Tournament Modules

### 4.1 Matches & Teams (`matches-page.tsx`, `my-teams-page.tsx`)
- **Player Match Bento Cards:** Thẻ thách đấu thiết kế tương tự thẻ cầu thủ chuyên nghiệp (Badge đội, Elo/Rank, Vị trí sân, Cần tuyển thêm n người, nút Xin gia nhập).
- **Team Hub:** Quản lý thành viên dạng lưới Avatar, lịch sử đối đầu và thống kê phong độ.

### 4.2 Tournaments & Bracket Tree (`tournaments-page.tsx`, `tournament-detail-page.tsx`)
- **Bracket View:** Sơ đồ nhánh thi đấu (Cây giải đấu Knockout) vẽ bằng SVG/CSS grid trực quan, hỗ trợ zoom/pan và cập nhật kết quả tỷ số trực tiếp.

---

## 5. Partner & Dashboard Interfaces

### 5.1 Partner Landing Page (`partner-page.tsx`)
- **Interactive Revenue Calculator:** Bento widget cho phép chủ sân kéo thanh trượt (Số lượng sân, Tỷ lệ lấp đầy, Giá giờ trung bình) $ightarrow$ hiển thị doanh thu ước tính tăng thêm theo thời gian thực.
- **Feature Bento:** 4 khối giới thiệu: Tự động hóa lịch đặt, Quản lý tài chính & ví rút tiền tức thì, Hệ thống chống bùng sân (Cọc & Hold), Tiếp cận 50,000+ người chơi.

### 5.2 Owner Dashboard & Admin Portal (`dashboard-page.tsx`, `statistics-page.tsx`)
- **KPI Bento Overview:** 4 thẻ đo lường chính (Doanh thu hôm nay, Lượng booking mới, Tỷ lệ lấp đầy sân, Đánh giá trung bình) kèm biểu đồ mini (sparklines) tăng/giảm phần trăm.
- **Live Court Scheduler Grid:** Giao diện điều phối sân cho chủ sân: Kéo thả đặt lịch tại chỗ, duyệt cọc, khóa sân bảo trì.
- **Analytics & Financial Charts:** Biểu đồ Chart.js trực quan với bộ lọc tuần/tháng/năm.

---

## 6. Design Checklist Verification (/check)

| Tiêu chí | Mô tả kiểm thử | Đạt chuẩn |
| :--- | :--- | :---: |
| **Visual Hierarchy** | Sử dụng F-pattern và Bento modular cards giúp mắt người dùng dễ dàng lướt qua thông tin trọng tâm. | [x] |
| **Color Contrast (WCAG 2.1 AA)** | Tỷ lệ tương phản chữ/nền tối thiểu 4.5:1, không dùng màu đơn độc để thể hiện trạng thái slot sân. | [x] |
| **Micro-Interactions** | Mọi button, card, time-slot đều có trạng thái hover, focus-visible, active và skeleton loading mượt mà. | [x] |
| **Mobile Responsiveness** | Bố cục Bento tự động chuyển đổi từ 3-4 cột trên Desktop thành 1-2 cột trên Mobile; touch target $ge 44	ext{px}$. | [x] |
| **Dark Mode Fidelity** | Chế độ nền tối thể thao `#0f1411` với viền tinh tế và accent `#2ecc71` giữ được năng lượng cao ban đêm. | [x] |
| **Consistency** | Toàn bộ components kế thừa chung từ Design System `@sango/web/components/ui` và CSS tokens. | [x] |

---

## 7. Implementation Milestones

1. **Sprint 1 — Core Theme & Base Components:** Tinh chỉnh token Tailwind v4 trong `index.css`, chuẩn hóa Button, Card, Badge, Dialog, Table, Skeleton theo Bento standards.
2. **Sprint 2 — Public Pages Redesign:** Thiết kế lại Public Header, Home Page Bento, Partner Page, About Page.
3. **Sprint 3 — Venues Discovery & Slot Matrix:** Cải tiến Venues List/Map View, Time-Slot Matrix trên Venue Detail, Sticky Hold Drawer.
4. **Sprint 4 — Community & Dashboard:** Cải tiến Matches/Teams/Tournaments và Owner/Admin Dashboard Bento.
