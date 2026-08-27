# HỆ THỐNG THIẾT KẾ SANGO — DESIGN SYSTEM (ATHLETIC SYNERGY)

**Chuẩn hóa:** Stitch Design Language, Tailwind CSS v4, Semantic Tokens (Light & Dark mode)  
**Font chữ:** Plus Jakarta Sans (UI chính) & JetBrains Mono (Label kỹ thuật, Giờ, Giá tiền, Mã vé)

---

## 1. CẤU TRÚC 3 TẦNG DESIGN TOKENS

```
┌────────────────────────────────────────────────────────┐
│ 1. PRIMITIVE TOKENS (Giá trị Hex thô)                   │
│    Turf Green (#006d37, #2ecc71), Navy (#131b2e),      │
│    Slate (#f7f9fb, #191c1e), Amber (#f59e0b)           │
├────────────────────────────────────────────────────────┤
│ 2. SEMANTIC TOKENS (Ý nghĩa ngữ cảnh)                  │
│    --background, --foreground, --card, --primary,      │
│    --secondary, --muted, --accent, --destructive       │
├────────────────────────────────────────────────────────┤
│ 3. COMPONENT TOKENS (Áp dụng cụ thể)                   │
│    btn-primary, venue-card, slot-held, ticket-badge    │
└────────────────────────────────────────────────────────┘
```

---

## 2. BẢNG SEMANTIC TOKENS & UTILITIES

| Token CSS Variable | Tailwind Utility | Light Mode | Dark Mode | Ngữ cảnh sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| `--background` | `bg-background` | `#f7f9fb` (Field White) | `#0f1411` (Deep Turf) | Nền tổng thể toàn bộ trang |
| `--foreground` | `text-foreground` | `#191c1e` | `#ecf1ed` | Màu chữ chính, tiêu đề |
| `--card` | `bg-card` | `#ffffff` | `#151b17` | Thẻ sân, dialog, form container |
| `--card-foreground` | `text-card-foreground` | `#191c1e` | `#ecf1ed` | Chữ hiển thị bên trong thẻ |
| `--primary` | `bg-primary`, `text-primary` | `#006d37` (Turf Đậm) | `#2ecc71` (Turf Sáng) | Nút bấm chính, liên kết active, giá tiền |
| `--primary-foreground` | `text-primary-foreground` | `#ffffff` | `#00210c` | Màu chữ trên nền nút primary |
| `--secondary` | `bg-secondary` | `#e7efe9` | `#232b26` | Nút thứ cấp, thẻ phụ |
| `--muted` | `bg-muted` | `#f2f4f6` | `#1a211d` | Nền input vô hiệu hóa, skeleton loader |
| `--muted-foreground` | `text-muted-foreground` | `#5c6470` | `#93a39a` | Chữ phụ, mô tả nhỏ, placeholder |
| `--accent` | `bg-accent` | `#dcf3e4` | `#173427` | Box icon nổi bật, hover table |
| `--accent-foreground`| `text-accent-foreground` | `#005228` | `#6bfe9c` | Chữ/icon trên nền accent |
| `--destructive` | `bg-destructive` | `#ba1a1a` | `#ff5449` | Trạng thái lỗi, huỷ đơn, cảnh báo đỏ |
| `--border` | `border-border` | `#dde5df` | `#26302a` | Viền ngăn cách card/input |
| `--ring` | `ring-ring` | `#006d37` | `#2ecc71` | Viền focus cho accessibility |

### Brand Colors (Dùng chung cho Hero, Footer, Banner)
- **Navy Deep:** `#0f172a` / **Navy:** `#131b2e` (`bg-navy`) — Tạo chiều sâu uy tín thể thao.
- **Turf Green:** `#2ecc71` (`bg-turf`, `text-turf`) — Màu sân cỏ năng động.
- **Turf Bright:** `#6bfe9c` (`text-turf-bright`) — Nhấn logo và highlight banner.
- **Oxygen Cyan:** `#38bdf8` (`text-oxygen`) — Gradient accent công nghệ hiện đại.

---

## 3. TYPOGRAPHY & TEXT STYLES

- **Font Sans (Giao diện chính):** `Plus Jakarta Sans`, sans-serif.
- **Font Score (Thông số kỹ thuật):** `JetBrains Mono`, monospace (Áp dụng cho Giá VND, Giờ slot, Mã vé `CH-2026...`, Đồng hồ đếm ngược).

### Hệ thống cỡ chữ (Type Scale)
1. **Display Hero:** `text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-balance`
2. **Page Title (H1):** `text-2xl sm:text-3xl font-bold tracking-tight text-foreground`
3. **Section / Card Title (H2/H3):** `text-lg sm:text-xl font-bold tracking-tight text-foreground`
4. **Body Text:** `text-sm sm:text-base leading-relaxed text-foreground`
5. **Technical / Score Label:** `font-score text-xs font-semibold uppercase tracking-wider`
6. **Price Display:** `text-lg sm:text-xl font-extrabold text-primary font-score`

---

## 4. 5 BỐ CỤC KHUNG CHUẨN (5 LAYOUT ARCHETYPES)

```typescript
export const SHELL_CONTAINER = 'w-full px-4 sm:px-6 lg:px-10';
```

1. **A1 — Landing Full-Bleed:** Hero phủ rộng `bg-navy`, Header cố định `sticky backdrop-blur-md`, Footer full-bleed.
2. **A2 — Danh Sách & Khám Phá (Grid View):** Main bọc `SHELL_CONTAINER py-8`, Grid thẻ linh hoạt `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`.
3. **A3 — Chi Tiết & Đặt Sân (2 Cột):** Cột trái nội dung `lg:col-span-8`, Cột phải thẻ thanh toán dính `lg:col-span-4 sticky top-28`.
4. **A4 — Bản Đồ Tương Tác Fullscreen:** Chiều cao `calc(100vh - 5rem)`, thanh tìm kiếm nổi `absolute top-4 left-4 z-[1000]`, card thông tin trượt từ dưới lên.
5. **A5 — Dashboard & Admin Console:** Bố cục Sidebar bên trái (thu gọn trên mobile), Topbar thông báo/user, vùng làm việc chính dạng Data Table/Charts.

---

## 5. QUY CHUẨN COMPONENT PRIMITIVES

1. **Button:**
   - Chiều cao chuẩn: `h-10` (nhỏ `h-8`, lớn `h-12`). Bo góc: `rounded-lg` / `rounded-xl`.
   - Hiệu ứng: `active:scale-[0.98] transition duration-150`.
2. **Input / Select:**
   - Chiều cao: `h-11 px-4`. Viền: `border-border/80 focus:ring-2 focus:ring-ring`.
3. **Card:**
   - Nền: `bg-card text-card-foreground border border-border/70 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200`.
4. **Status Badges:**
   - `CONFIRMED` / `ACTIVE`: `bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50`.
   - `PENDING` / `HELD`: `bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50`.
   - `CANCELLED` / `REJECTED`: `bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200/50`.
   - `COMPLETED`: `bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`.
5. **Slot Picker Matrix:**
   - Trạng thái `AVAILABLE`: Nền sáng, viền nét đứt, click chọn chuyển xanh `bg-primary text-primary-foreground`.
   - Trạng thái `HELD` / `BOOKED`: Nền xám mờ `bg-muted text-muted-foreground/60 cursor-not-allowed`.
