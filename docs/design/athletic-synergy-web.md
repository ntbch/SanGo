# Đặc tả thiết kế web — Athletic Synergy (SanGo)

> Bản chuẩn cho team sango-ui-restyle. Nguồn: `stitch_pitch_booking_home/athletic_synergy/DESIGN.md`,
> 19 màn HTML Stitch, và 5 file golden đã migrate (`apps/web/index.html`, `src/index.css`,
> `src/components/layout/public-layout.tsx`, `src/pages/home-page.tsx`,
> `src/features/public/components/venue-card.tsx`).
> **Spec mô tả token/class THỰC TẾ đang có trong `apps/web/src/index.css` — không đặt tên token mới.**

---

## 1. Token màu

### 1.1 Bảng token (chỉ được dùng danh sách này)

| Token CSS var | Utility Tailwind | Light | Dark | Dùng khi nào |
|---|---|---|---|---|
| `--background` | `bg-background` / `text-background` | `#f7f9fb` Field White | `#0f1411` | Nền mọi trang |
| `--foreground` | `text-foreground` | `#191c1e` | `#ecf1ed` | Chữ chính |
| `--card` | `bg-card`, `text-card-foreground` | `#ffffff` | `#151b17` | Nền card, dialog, search bar trên hero |
| `--primary` | `bg-primary`, `text-primary`, `ring-ring` | `#006d37` Turf đậm | `#2ecc71` | Nút chính, giá, link nhấn, active nav, focus ring |
| `--primary-foreground` | `text-primary-foreground` | `#ffffff` | `#00210c` | Chữ trên nút primary |
| `--secondary` | `bg-secondary` | `#e7efe9` | `#232b26` | Badge phụ, nút thứ cấp |
| `--muted` / `--muted-foreground` | `bg-muted`, `text-muted-foreground` | `#f2f4f6` / `#5c6470` | `#1a211d` / `#93a39a` | Nền ảnh fallback, chữ phụ/mô tả |
| `--accent` | `bg-accent`, `text-accent-foreground` | `#dcf3e4` / `#005228` | `#173427` / `#6bfe9c` | Icon box, hover item, chip tiện ích |
| `--destructive` | `bg-destructive`, `text-destructive` | `#ba1a1a` | `#ff5449` | Lỗi, huỷ đơn, timer giữ chỗ hết hạn |
| `--border` / `--input` | `border-border`, `border-input` | `#dde5df` / `#dbe3dd` | `#26302a` / `#2b362f` | Viền card/input; hay dùng kèm `/60` |
| `--ring` | `ring-ring` | `#006d37` | `#2ecc71` | Focus ring input/nút |

**Màu thương hiệu (brand — dùng xuyên suốt hero/footer/banner, giống nhau cả 2 mode):**

| Token | Hex | Utility | Dùng khi nào |
|---|---|---|---|
| navy | `#131b2e` | `bg-navy`, `text-navy-deep`... | Hero landing, footer, chip quận trên ảnh (`bg-navy/75`) |
| navy-deep | `#0f172a` | `text-navy-deep` | Chữ trên nền turf (CTA banner); là gốc màu của mọi ambient shadow |
| turf | `#2ecc71` | `bg-turf`, `hover:bg-turf-bright` | Chip "Cách bạn", slot đã chọn trong banner, CTA trên gradient |
| turf-bright | `#6bfe9c` | `text-turf-bright`, `hover:bg-turf-bright` | Chữ logo footer, hover trên nền navy |
| oxygen | `#38bdf8` | `to-oxygen/80` | Đầu mút gradient banner |
| ocean | `#00668a` | `from-ocean` | Đầu gradient banner |

**Ngoại lệ hex được phép tồn tại (đã nằm trong golden, KHÔNG nhân rộng thành hex mới):**
- `rgba(15,23,42,…)` trong ambient shadow = navy-deep ở độ alpha thấp.
- `text-[#005027]` (on-primary-container) chỉ trong chip `bg-turf` của venue-card.
- Gradient fallback ảnh trống: `from-emerald-200 via-emerald-100 to-teal-200 dark:from-emerald-900 dark:via-emerald-950 dark:to-teal-900`.
- Warning/danger nhấn: dùng palette chuẩn `amber-*` / `destructive`; không thêm hex.

**CẤM:** bất kỳ hex/rgb nào ngoài bảng trên (reviewer grep `#[0-9a-fA-F]{3,8}` và `rgba\?(` để bắt).

### 1.2 Dark mode

- Tokens tự đảo qua `.dark` — component viết bằng token thì dark mode "free".
- Mọi màu tùy chỉnh phải có cặp: ví dụ `border-white/15 bg-white/5 text-white` CHỈ hợp trên nền navy/banner (giống cả 2 mode); nếu nền là `background/card` thì phải dùng token và kiểm tra song song light/dark.
- Rule nhanh: nền sáng → `text-foreground/muted-foreground`; nền navy/turf/gradient → `text-white`, `text-turf-bright`, `text-navy-deep`.

---

## 2. Typography

Fonts nạp tại `apps/web/index.html`: Plus Jakarta Sans (400–800) + JetBrains Mono 600.
Utility: `font-sans` (body mặc định), `font-score` (JetBrains Mono).

| Vai trò (DESIGN.md) | Thông số Stitch | Class thật trong app | Dùng cho |
|---|---|---|---|
| display-lg | 48/800, lh 1.1, ls −0.02em | `text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-[-0.02em]` (+`text-balance`) | H1 hero landing |
| headline-lg | 32/700, lh 1.2 | `text-2xl sm:text-3xl font-bold tracking-tight` (mobile tự về ~24px = headline-lg-mobile) | Tiêu đề section, tiêu đề trang |
| headline-md | 24/600, lh 1.3 | `text-xl font-semibold tracking-tight` hoặc `text-base font-bold tracking-tight` trong card | Tiêu đề card/dialog |
| body-lg | 18/400, lh 1.6 | `text-lg leading-relaxed` | Đoạn dẫn hero |
| body-md | 16/400, lh 1.5 | `text-sm`/`text-base` + `leading-relaxed` khi đoạn dài | Body mặc định; phụ = `text-muted-foreground` |
| label-caps | JetBrains Mono 12/600, ls +0.05em | `font-score text-xs font-semibold uppercase tracking-widest` | Nhãn kỹ thuật: giờ slot, số sân, giá, eyebrow chip, header bảng |

Quy tắc:
- Trọng số chữ đậm là bản sắc: nút/link hành động `font-bold`, tiêu đề `font-extrabold/bold tracking-tight`.
- Giá tiền hiển thị kiểu "score": `text-lg font-extrabold text-primary` + hậu tố nhỏ `text-xs font-medium text-muted-foreground` (như venue-card).
- Copy 100% tiếng Việt; `aria-label` tiếng Việt. Không giữ text placeholder tiếng Anh của mockup ("Or continue with"…).

---

## 3. Luật layout — 5 archetype

Hằng số container dùng lại đúng chuỗi golden (**fluid fullscreen** — cập nhật 2025-08-25 theo yêu cầu dùng trọn chiều ngang màn hình):

```
SHELL_CONTAINER = 'w-full px-4 sm:px-6 lg:px-10'
```

Nguyên tắc đi kèm: không gian ngang lớn được lấp bằng CỘT (grid thêm tầng `xl:4`, `2xl:5`) chứ không phải khoảng trắng; chỉ cap chiều đọc cho khối văn bản (`max-w-2xl`) và form/auth (A5).

### A1 — Landing full-bleed
- Section hero `relative isolate overflow-hidden bg-navy` **full-bleed**, nội dung bên trong bọc `SHELL_CONTAINER` (`py-16 md:py-24`, căn giữa).
- Nền nhiều lớp thay ảnh: radial-gradient quầng turf/oxygen + vệt chéo `repeating-linear-gradient(115deg, rgba(46,204,113,.07)…)` (xem home-page.tsx dòng 62–77 — copy pattern, không invent mới).
- Header public: `sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md`, cao `h-20`, nội dung trong SHELL_CONTAINER.
- Footer: `bg-navy text-white/70` full-bleed, nội dung trong SHELL_CONTAINER, `py-10`; brand text `text-turf-bright`.

### A2 — Trang danh sách / task
- Main bọc `SHELL_CONTAINER py-8` (PublicLayout làm sẵn cho route ≠ "/").
- Grid kết quả: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6` — **không được thiếu tầng xl**; khu vực ít thẻ hơn (top sân) có thể dừng ở `lg:grid-cols-3`.
- Thanh filter/search: card `rounded-xl`, control cao `h-12`, các cụm cách nhau `gap-3`–`gap-4`.

### A3 — Chi tiết 2 cột
- `grid grid-cols-1 lg:grid-cols-12 gap-8`; trái `lg:col-span-8` (nội dung), phải `lg:col-span-4` (hành động).
- Card phải: `sticky top-28 rounded-xl border p-6 shadow-[0_12px_30px_rgba(15,23,42,0.1)]` (top-28 = dưới header h-20).
- Mobile xếp 1 cột, card hành động trượt xuống dưới cùng; separator trong card dùng `border-t border-dashed`.

### A4 — Dashboard có sidebar
- Sidebar: `hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-surface-container-equivalent z-40` → trong app dùng `bg-card`/`bg-muted` + `shadow-lg`, viền phải `border-r border-border`.
- Main: `flex-1 ml-0 md:ml-64 overflow-y-auto` — **KHÔNG thêm mx-auto/max-w chồng lên ml-64**; nội dung dashboard quản theo `p-4 md:p-6` và grid riêng của từng khối.
- <md: sidebar ẩn, điều hướng qua drawer/menu (pattern DropdownMenu như public-layout).

### A5 — Auth (đăng nhập/đăng ký)
- Trang `min-h-screen` căn giữa: `flex items-center justify-center py-12`.
- Thẻ hẹp chuẩn: `w-full max-w-md rounded-xl shadow-lg p-8` (register/quên mật khẩu; mockup dùng glass-panel — app dùng `bg-card border border-border/60` cho đủ dark mode).
- Biến thể đăng nhập (mockup): card chia đôi `max-w-4xl grid grid-cols-1 md:grid-cols-2 overflow-hidden` — form trái, panel ảnh/navy phải; vẫn căn giữa viewport.
- Input auth: `pl-10` có icon lucide trái, focus `focus:border-primary focus:ring-4 focus:ring-primary/20`.
- Nền quanh thẻ: navy gradient (radial turf như hero, nhẹ hơn) hoặc `bg-background`; chọn 1 trong 2 per-route, không trộn.
- Panel navy full-bleed (AuthShell): route auth render **ngoài PublicLayout** (không navbar/footer) nên section tự chiếm viewport với `min-h-screen`; cấm mount auth vào layout public hay dùng margin âm bù gutter.

---

## 4. Recipe component

Tất cả dựng từ component có sẵn `src/components/ui/*` (button, card, badge, input, form, label, dialog, dropdown-menu, table, toast, skeleton). Không thêm dependency, không icon ngoài lucide-react.

### 4.1 Button
- Base: component `ui/button`; CTA chính override: `className="rounded-lg font-bold shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)]"`.
- Trên nền navy/banner: `variant="outline"` + `border-white/25 bg-transparent font-bold text-white hover:bg-white/10 hover:text-white`.
- CTA trên gradient/turf: `bg-turf px-6 py-3 font-bold text-navy-deep hover:bg-turf-bright`.
- Booking CTA luôn có icon mũi tên phải: `<ArrowRight className="size-4" aria-hidden />`.
- Kích thước lớn dùng `size="lg"`; icon-only dùng `variant="ghost" size="icon"` + `aria-label`.

### 4.2 Card
- `rounded-xl border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow duration-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]` (chuẩn venue-card; khối feature tĩnh có thể hover .08).
- Ảnh đầu card: `aspect-[16/10] w-full overflow-hidden` (pt-0), hover zoom `group-hover:scale-105 duration-500`.
- Chip đặt trên ảnh (inset-x-2 top-2): quận trái `rounded-full bg-navy/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm`; khoảng cách phải `rounded-full bg-turf px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#005027] shadow-sm`.

### 4.3 Chip / Badge trạng thái
- Pill: `rounded-full` + label-caps thu nhỏ: `font-score text-[10px] xs→xs font-semibold uppercase tracking-wide px-2.5 py-1`.
- Mapping trạng thái: available → `bg-accent text-accent-foreground` hoặc `bg-turf text-[#005027]`; booked/hết → `bg-muted text-muted-foreground line-through`; chờ thanh toán/giữ chỗ sắp hết → `bg-destructive/10 text-destructive border border-destructive/20`; info → `bg-oxygen/15 text-ocean dark:text-oxygen`.
- Dot "live" (đang mở): `<span className="size-2 rounded-full bg-turf animate-pulse" />` cạnh chữ.

### 4.4 Input / Select
- Cao `h-12`: `h-12 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` (chuỗi golden home-page dòng 104).
- Label trên input: `text-sm font-semibold mb-1` hoặc sr-only khi có placeholder + aria-label.
- Icon trong input: `absolute inset-y-0 left-3` lucide `size-4 text-muted-foreground`, input `pl-10`.

### 4.5 Time-slot picker
- Nút slot: `flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-lg transition-all`.
- Trạng thái:
  - Trống: `border border-input bg-card hover:border-primary hover:text-primary`.
  - Chọn: `border-turf bg-turf font-bold text-navy-deep shadow-sm` (chữ tối trên turf để tương phản mạnh — chuẩn hoá sau review t6, khớp weekly-grid).
  - Không còn: `line-through opacity-40` + `cursor-not-allowed`, KHÔNG đổi màu khác.
- Giờ trong slot ghi `font-score text-xs font-semibold`; giá slot ghi nhỏ `text-[10px]`.

### 4.6 Banner gradient (khối CTA ngang)
- `relative isolate overflow-hidden rounded-xl bg-gradient-to-r from-ocean to-oxygen/80 p-8 md:p-10 text-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]`.
- Watermark icon lucide lớn mờ: `absolute -right-6 top-1/2 -translate-y-1/2 size-56 opacity-15 md:size-72`.
- Nội dung `relative z-10 max-w-2xl`; CTA theo recipe 4.1 kiểu turf.

### 4.7 Empty state
- `rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground` (golden home-page dòng 241); có thể thêm icon lucide `size-8 mx-auto mb-2 opacity-50`.
- Không bao giờ để vùng trống trắng tinh; luôn có câu dẫn hành động tiếng Việt.

### 4.8 Skeleton & loading
- `<Skeleton className="aspect-[16/10] rounded-xl" />` cho card sân; list dòng dùng `h-4 rounded-md`; lưới skeleton cùng grid với lưới thật.
- Vùng loading nên có `aria-busy="true"` + `aria-label` tiếng Việt.

### 4.9 Header/nav & footer (tham chiếu)
- Nav active: `border-b-2 border-primary pb-1 text-sm font-bold text-primary`; thường: `text-muted-foreground hover:text-primary transition-colors duration-200`.
- Logo box: `flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(15,23,42,0.08)]` + Trophy lucide.

---

## 5. Checklist CHỐNG LỆCH (reviewer tick trước khi approve diff)

1. ☐ Container đúng `w-full px-4 sm:px-6 lg:px-10` (fluid) — cấm quay lại max-w-[1280px]/6xl/7xl trừ khối form/auth có cap riêng trong spec.
2. ☐ Màn rộng ≥1280px: lưới phải có tầng `xl:`/`2xl:` tương ứng (xl:4, 2xl:5 cho lưới sân); không để dải trắng hai bên.
3. ☐ Grep diff: không có hex/rgba mới ngoài bảng §1.1 và 3 ngoại lệ được phép.
4. ☐ Chỉ dùng token/utility đã có (background/card/primary/…/navy/turf/oxygen/ocean) + palette Tailwind chuẩn cho warning amber-*; không invent `color-mint`…
5. ☐ Grid danh sách đủ tầng responsive: `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6` (hoặc có lý do rõ khi dừng sớm).
6. ☐ Chi tiết 2 cột: `lg:grid-cols-12`, 8/4, card phải `sticky top-28`; mobile 1 cột.
7. ☐ Dashboard: main đã `ml-64` thì KHÔNG `mx-auto`/max-w chồng lên; sidebar `fixed w-64 hidden md:flex`.
8. ☐ Dark mode song song: mọi class custom có cặp `dark:` hợp lý; `text-white*` chỉ xuất hiện trên navy/turf/gradient.
9. ☐ Icon 100% lucide-react, có `aria-hidden`; KHÔNG emoji mới làm icon (ngoại lệ hiện hữu: chuỗi neo test `📍 Cách bạn` trong venue-card — giữ nguyên, không nhân rộng).
10. ☐ Trước khi sửa component có test: grep `*.test.*` tìm chuỗi neo; nếu THAY chữ hiển thị thì ghi rõ lý do trong task output.
11. ☐ Shadow đúng bộ ambient: `0_4px_20px rgba(15,23,42,.05)` / hover `0_12px_30px rgba(15,23,42,.10–.12)`; không shadow đen đậm tùy tiện.
12. ☐ Radius đúng vai trò: input/nút `rounded-lg`, card/banner `rounded-xl`, chip trạng thái `rounded-full`; không lẫn lộn.
13. ☐ Dữ liệu kỹ thuật (giờ, giá, số sân, mã đơn) dùng `font-score` + uppercase/tracking; không dùng font thường.
14. ☐ CTA đặt sân/chuyển tiếp có icon mũi tên phải; nút icon-only có `aria-label` tiếng Việt.
15. ☐ Copy tiếng Việt toàn bộ (kể cả aria-label, empty state, toast); không sót placeholder tiếng Anh mockup.
16. ☐ Không đụng route/API/store/schema/hook data; không thêm dependency; giữ nguyên tính năng.
17. ☐ Gates chạy tại workdir `apps/web`: `npx tsc --noEmit -p tsconfig.json` rồi `npx vitest run` (file liên quan trước, full sau) — không dùng `pnpm --filter`.

*Lệch bất kỳ mục nào → reject diff và ghi mục số vào nhận xét.*
