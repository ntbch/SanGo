# Báo Cáo Phản Biện Kỹ Thuật & Codebase Review (Frontend Technical Review)

- **Ngày thực hiện:** 2026-08-26
- **Người thực hiện:** Senior Frontend Technical Reviewer (`frontend_reviewer`)
- **Tài liệu đối chiếu:** `docs/superpowers/plans/2026-08-26-ui-redesign-implementation-plan.md`
- **Hiện trạng Codebase:** React 18 + Vite 6 + Tailwind CSS v4 + Radix UI + TanStack Query v5 + Leaflet + Chart.js + Vitest (48 files, 227 tests đang green).

---

## 1. Đánh Giá Tính Khả Thi Kỹ Thuật Trên Stack Hiện Tại

### 1.1 Tailwind CSS v4 & Theme Tokens (`apps/web/src/index.css`)
- **Khả thi:** Dự án đã cấu hình `@import 'tailwindcss';` và `@custom-variant dark (&:is(.dark *));` cùng biến CSS semantic trong `index.css`.
- **Lưu ý & Khuyến nghị:**
  - Tailwind v4 xử lý token qua cú pháp `@theme inline` thay vì `tailwind.config.js`. Khi bổ sung các token mới cho Bento (như `--radius-2xl`, `shadow-xs`, `soft-chip`), cần khai báo nhất quán trong `index.css` để tránh lỗi CSS parse.
  - Phải duy trì quy tắc 100% semantic classes: Dùng `bg-card`, `text-foreground`, `border-border`, tuyệt đối tránh hardcode `bg-white`, `text-gray-900` gây vỡ Dark Mode Night Turf.

### 1.2 Radix UI Primitives & React Hook Form
- **Điểm nóng (Hotspot) Ref:** Radix `Slot` (được dùng trong `FormControl` của `apps/web/src/components/ui/form.tsx`) yêu cầu component con trực tiếp PHẢI hỗ trợ `React.forwardRef`.
- **Phát hiện thực tế:** Component `AuthInput` hiện tại là functional component bọc ngoài `div` mà không dùng `forwardRef`, dẫn đến cảnh báo `Function components cannot be given refs` khi chạy test. Trong Phase 1 & Phase 5, bắt buộc mọi wrapper input (như `AuthInput`, `PriceRangeSlider`) phải dùng `React.forwardRef` truyền ref chuẩn vào thẻ input gốc.

### 1.3 TanStack Query v5 & Cache Management
- **Khả thi cao:** Query keys và custom hooks đã phân tách module rõ ràng theo từng feature (`features/public/queries.ts`, `features/owner/queries.ts`, v.v.).
- **Lưu ý Cache Invalidation:** Với luồng giữ chỗ 10 phút (Phase 3) và Gantt Scheduler (Phase 4), cần áp dụng đúng cơ chế:
  - Cập nhật optimistic update cho slot grid khi user bấm chọn.
  - Xử lý `refetchInterval` thông minh: chỉ bật polling (5-10s) khi tab đang active (`document.visibilityState === 'visible'`) và ở trang checkout/booking, tắt khi tab ẩn hoặc component unmount để tránh nghẽn mạng.

### 1.4 Leaflet & React-Leaflet (Map Split-View)
- **Khả thi:** Đã có component `interactive-venues-map.tsx` hoạt động ổn định.
- **Lưu ý Leaflet Container Resize:** Khi chuyển đổi giữa Split-View (List + Map) hoặc toggle mở rộng bản đồ, Leaflet bị hiện tượng tile xám do kích thước DOM thay đổi. Bắt buộc kích hoạt `map.invalidateSize()` trong `useEffect` hoặc qua `ResizeObserver`.

### 1.5 Chart.js & React-Chartjs-2
- **Lưu ý Canvas Reactivity:** Canvas 2D của Chart.js không tự động phản hồi CSS Variables khi chuyển Dark/Light mode. Cần xây dựng custom hook `useChartTheme()` để giải mã màu hex tương ứng từ CSS variables và inject vào Chart dataset options khi theme thay đổi.

---

## 2. Kiểm Tra Nguy Cơ Breaking Changes & Hợp Đồng Dữ Liệu

### 2.1 Hợp Đồng API & Mock Server (`apps/web/src/lib/api/mock-server.ts`)
- **Rủi ro:** Mock server mô phỏng chặt chẽ các endpoint REST (`GET /venues`, `POST /bookings/hold`, `POST /auth/login`, v.v.) và đang có 227 tests phụ thuộc.
- **Nguyên tắc bất biến:** Redesign giao diện **KHÔNG ĐƯỢC PHÉP** thay đổi:
  - Query parameters (ví dụ: `district`, `sport`, `minPrice`, `maxPrice`, `sort`, `q`).
  - Request body payloads (ví dụ: format payload `courtId`, `date`, `slotTimes`, `voucherCode`).
  - Response shape & Error contracts (`{ statusCode, message, code }`).
- Mọi logic tính toán hiển thị (như format tiền tệ, tính khoảng cách Haversine, đếm ngược slot) phải dùng lại các shared helper từ `@sango/shared` và `lib/api/types.ts`.

### 2.2 Form Validation (React Hook Form + Zod)
- Giữ nguyên các schema Zod cốt lõi trong `features/auth/schemas.ts`, `features/owner/schemas.ts`. Khi nâng cấp UI thành Bento Cards, chỉ thay đổi layout bọc ngoài (`FormItem`, `CardContent`), giữ nguyên tên các `name` field trong `FormField` để không phá vỡ liên kết state.

---

## 3. Đề Xuất Thứ Tự Refactor Component An Toàn & Chiến Lược Testing

### 3.1 Thứ Tự Refactor An Toàn (Bottom-Up Dependency Order)
1. **Tầng 1 - Design Tokens & Atomic UI Primitives (Phase 1):**
   - Cập nhật `index.css`, hoàn thiện các component gốc: `Button`, `Input` (kèm `forwardRef`), `Badge`, `Card`, `Dialog`, `Sheet`, `Skeleton`, `Toast`.
2. **Tầng 2 - Layout Shells & Global Navigation (Phase 1):**
   - `PublicLayout`, `DashboardLayout`, `UserMenu`, `ThemeToggle`, Mobile Drawer.
3. **Tầng 3 - Shared Feature Components (Đầu Phase 2 & Phase 3):**
   - `VenueCard`, `FilterSidebar`, `StarRating`, `WalletBalanceBadge`, `NotificationBell`.
4. **Tầng 4 - Core Feature Pages (Theo từng Phase 2 $\rightarrow$ 3 $\rightarrow$ 4 $\rightarrow$ 5):**
   - Cải tổ từng trang độc lập, đảm bảo test của feature đó pass trước khi chuyển sang feature tiếp theo.

### 3.2 Chiến Lược Kiểm Thử (Vitest + Testing Library)
- **Bảo tồn Selector Test:** Duy trì các `aria-label`, `role`, `data-testid`, và text nhãn nút quan trọng đã được viết trong 48 file test hiện tại.
- **Wrap State Updates với `act()`:** Khắc phục triệt để các warning `act(...)` ở `ToastAnnounce`, `NotificationBell`, `WalletBalanceBadge` trong test suite bằng cách đảm bảo custom hooks/polling xử lý lifecycle đúng cách.
- **Regression Gate:** Bắt buộc chạy `pnpm --filter @sango/web test` sau khi hoàn thành từng phase. Tuyệt đối không để xảy ra tình trạng phase sau làm gãy test của phase trước.

---

## 4. Điểm Cần Tinh Giản & Điểm Bổ Sung Kỹ Thuật

### 4.1 Điểm Cần Tinh Giản (Tránh Over-engineering)
- **Gantt Timeline Scheduler (Phase 4):** Không cài thêm thư viện timeline/gantt cồng kềnh từ bên ngoài. Sử dụng CSS Grid bản địa kết hợp với component court row hiện có (`courts-panel.tsx`) để giữ bundle size nhẹ và hiệu năng 60fps.
- **Tournament Knockout Bracket (Phase 3):** Không dùng canvas hay thư viện đồ thị phức tạp; chỉ cần cấu trúc CSS Flexbox/Grid lồng nhau kết hợp pseudo-elements (`::before`, `::after`) hoặc SVG path đơn giản để nối các nhánh đấu.

### 4.2 Điểm Thiếu Sót Cần Bổ Sung Vào Kế Hoạch
1. **Accessibility / Focus Trap:** Khi mở Modal QR Check-in (Phase 3) và Dialog thêm sân (Phase 4), cần đảm bảo Radix Dialog quản lý focus chuẩn, đóng bằng Escape và trả focus về trigger element.
2. **Floating Action Collisions:** Trên mobile, thanh `Sticky Booking Summary Drawer` (Phase 3), `Mobile Bottom Nav` (Phase 1) và `AiChatWidget` (Phase 5) có thể đè chồng lên nhau. Bổ sung giải pháp: tự động ẩn `AiChatWidget` hoặc đẩy widget lên cao hơn khi có sticky bottom bar active.
3. **Lazy Loading & Code Splitting:** Đảm bảo các thư viện nặng như `leaflet`, `chart.js`, và các trang Dashboard/Tournaments được dynamic import (`React.lazy`) để giữ FCP (First Contentful Paint) < 1.2s.

---

## 5. Kết Luận
Bản kế hoạch của `ui_planner` rất chặt chẽ và khả thi. Việc kết hợp phản biện kỹ thuật này cùng báo cáo Product/QA của `product_qa_reviewer` sẽ giúp chốt Master Plan hoàn hảo cho đội ngũ triển khai.
