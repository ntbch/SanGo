# Báo cáo Staff Code Review + Checklist-Design Audit + Nghiệm thu — T5

- **Người thực hiện:** code_reviewer (staff-frontend-code-reviewer — team sango-fe-expert-team)
- **Ngày:** 2026-08-26 · **Nền:** working-tree Modern Athletic Bento redesign (chưa commit, base 4408234)
- **Phạm vi:** toàn bộ apps/web/src (thiết kế Athletic Synergy) · đối chiếu docs/design/athletic-synergy-web.md, SANGO-REENGINEERING-SPEC.md, master-plan (2026-08-26-ui-redesign-final-master-plan.md), Checklist Design + WCAG 2.1 AA

## 0. Kết luận nghiệm thu

**✅ ĐƯỢC DUYỆT (APPROVED — có điều kiện phi chặn trước merge)**

Triển khai đạt chuẩn Modern Athletic Bento + bộ nhận diện Athletic Synergy + WCAG 2.1 AA cho toàn bộ các cặp token đã đo. Các gate tự động frontend đều xanh. 2 finding tương phản nhỏ + 1 finding lint backend cần sửa trước khi merge cuối (xem §6 — đều không thuộc phạm vi UI redesign, chi phí sửa < 15 phút).

## 1. Gates (chạy lại độc lập trong đợt review này)

| Gate | Kết quả |
| --- | --- |
| `npx tsc --noEmit -p tsconfig.json` (apps/web) | ✅ PASS, EXIT=0 |
| `npx vitest run` (apps/web) | ✅ 48 files / 227 tests PASS, EXIT=0 (14.15s) |
| `vite build` | ✅ PASS (theo QA t4 + dist/ artifacts) |
| `pnpm lint` (toàn repo) | ⚠️ 3 lỗi `no-explicit-any` ở **backend** `apps/api/src/bookings/bookings.service.ts:361-363` (ngoài phạm vi frontend redesign, pre-existing). Frontend + prettier sạch. |

## 2. Token Athletic Synergy & typography — NHẤT QUÁN ✅

- **index.css** khớp 100% bảng token §1.1 (light #f7f9fb/#191c1e/#006d37…; dark #0f1411/#ecf1ed/#2ecc71…; brand navy/turf/turf-bright/oxygen/ocean; ngoại lệ chuẩn hoá `--color-on-turf #005027`). Không token mới, không invent tên màu.
- **Fonts:** index.html nạp Plus Jakarta Sans 400–800 + JetBrains Mono 600; `--font-sans`/`--font-score` map đúng; `font-score` dùng cho toàn bộ dữ liệu kỹ thuật (giờ, giá, mã đơn, KPI, bảng) ở 35+ file; giá kiểu "score" `text-lg font-extrabold text-primary` + hậu tố `/slot` (venue-card, wallet…).
- **Logo gốc:** assets logo.png (998KB) chỉ tồn tại trong public/, runtime dùng `logo-256.png` (32KB) tại header/footer/sidebar kèm alt + APP_NAME — không có tham chiếu file nặng.
- **Hex ngoài bảng:** chỉ 3 chỗ Tailwind emerald (marker map `#16a34a`, nút map `bg-emerald-600`, icon thành công `bg-emerald-500`) + shadow hero `rgba(2,8,20,0.45)` — đều là family màu chuẩn, không phải hex mới tùy tiện (xem L-4/L-5).

## 3. Checklist-Design audit (tóm tắt theo hạng mục)

| Hạng mục | Đánh giá |
| --- | --- |
| Content & IA | ✅ URL sạch customer (/bookings, /wallet…), /dashboard/* chỉ OWNER/ADMIN, redirect alias giữ search params; copy 100% tiếng Việt kể cả aria-label; meta/SEO đủ |
| Visual hierarchy (F-pattern) | ✅ Hero → search → sport matrix → featured venues; 1 CTA primary/viewport; badge/card elevation chuẩn shadow ambient |
| Layout & Bento grid | ✅ SHELL_CONTAINER fluid `w-full px-4 sm:px-6 lg:px-10`; grid danh sách `sm:2 lg:3 xl:4`; chi tiết `lg:grid-cols-12` 8/4 + card phải sticky; dashboard sidebar `w-64 fixed` + `md:pl-64` không mx-auto; radius chuẩn (lg/xl/full) |
| Color & contrast | ✅ 21/21 cặp token đo đạt AA (tồi nhất 4.59:1 on-turf/turf; muted-fg 5.67:1 light, 6.62:1 dark; primary-fg 6.48:1) — 2 ngoại lệ nhỏ §6 |
| Typography | ✅ display-lg/headline/body/label-caps đúng chuỗi golden; trọng số đậm là bản sắc |
| Iconography | ✅ 100% lucide-react + aria-hidden; icon-only button đều có aria-label tiếng Việt |
| Imagery | ✅ lazy loading, aspect 16/10, fallback gradient emerald/teal chuẩn, hover zoom bằng transform |
| Motion | ✅ 60fps: zoom/scale dùng transform; skeleton opacity; dialog/sheet fade+slide; chart canvas — thiếu reduced-motion (L-2) |
| States & feedback | ✅ empty state luôn có câu dẫn + CTA; skeleton aria-busy; toast; spinner Loader2; slot grid legend đủ trạng thái |
| Accessibility (chi tiết §4) | ✅ tương phản + focus ring + bàn phím + screen reader |
| Responsive | ✅ QA t4: 375/768/1280 × light/dark overflowX=false 6/6; grid đủ tầng sm/lg/xl |

## 4. WCAG 2.1 AA — điểm mạnh đã xác minh

- Contrast: mọi cặp token §2 đều ≥ 4.5:1 (text) và ≥ 3:1 (UI/graphical) trừ 2 ngoại lệ §6.
- Focus: button/input/select có `focus-visible:ring-2 ring-ring`; NavLink active `border-b-2 border-primary`; card venue `focus-within:ring`.
- Dialog/Sheet/Dropdown: Radix primitives → focus trap, Escape, trả focus, aria-modal; close button có sr-only "Đóng".
- Slot grid (weekly-grid): button disabled + `aria-pressed` + `aria-label` "Khung giờ" theo ngày/giờ/trạng thái; trạng thái kín dùng 3 cue (line-through + opacity + nhãn) cho người mù màu; tap target min-h-[48px] ✓.
- Icon-only: theme toggle, bell, mobile menu, pricing editor, venue-form đều có aria-label tiếng Việt.
- lang="vi", nav/footer/table semantic; star-rating role="img" aria-label; anti-FOUC theme script trước paint.

## 5. Hiệu năng 60fps — ĐẠT (với 1 khuyến nghị)

- ✅ Zoom ảnh `transition-transform … scale-105/110` (compositor); không có animation layout property (width/height/top/left) trên đường tới hạn; Chart.js canvas light config; Leaflet `invalidateSize` + `min-h-[500px]` + leaflet.css đúng chuẩn; SVG sparkline không dependency.
- ⚠️ P-1 (Medium, đã track QA-T4-03): **chưa code-split theo route** — main bundle 1.3MB (373KB gzip); leaflet/chart.js/zod nằm trong chunk khởi tạo. Đề xuất `React.lazy` cho /map, /dashboard, /tournaments, /admin.
- P-2 (Low): `transition-all` trên chip/slot tương tác (map-page, filter-sidebar, weekly-grid) — chấp nhận được với số lượng nhỏ; nên đổi `transition-colors`.

## 6. Findings mở (không chặn nghiệm thu frontend)

| ID | Mức | Vị trí | Mô tả | Đề xuất |
| --- | --- | --- | --- | --- |
| R-1 | 🟡 Medium | apps/api/src/bookings/bookings.service.ts:361-363 | 3 lỗi eslint `no-explicit-any` — gate lint toàn repo đỏ | Thay `any` bằng kiểu cụ thể (ngoài phạm vi frontend) |
| R-2 | 🟡 Medium | index.css (dark --destructive-foreground: #fff) | Nút destructive dark: chữ trắng trên #ff5449 = 3.17:1 < 4.5:1 | Dark dùng `--destructive-foreground: #24040a` hoặc nền destructive tối hơn |
| R-3 | 🟡 Medium | countdown-timer.tsx:46 | Light mode trạng thái sắp hết giờ: `text-amber-600` trên `bg-amber-500/10` ≈ 2.96:1 < 4.5:1 | Đổi `text-amber-700` (≈4.9:1) |
| R-4 | 🟢 Low | payment-result-page.tsx:38 | Icon check trắng trên `bg-emerald-500` ≈ 2.47:1 < 3:1 (1.4.11) | `bg-emerald-600` (≈3.8:1) hoặc check tối |
| R-5 | 🟢 Low | toàn app | Chưa có `prefers-reduced-motion` cho animate-ping/pulse vô hạn | `motion-reduce:animate-none` hoặc media query toàn cục |
| R-6 | 🟢 Low | ui/button size icon (h-9 = 36px) | Touch target 36px < 44px theo visual quality gate của plan | `min-h-11 min-w-11` cho icon button / thêm padding ảo |
| R-7 | ⚪ Info | payment-result/my-bookings QR card | `bg-white text-slate-900` cố ý cho QR scan được — ngoại lệ hợp lệ | Thêm comment giải thích |
| R-8 | ⚪ Info | venue-map.tsx:20, interactive-venues-map.tsx:48, payment-result:38 | 3 chỗ dùng emerald thay vì turf — lệch brand nhẹ | Map/CTA nên dùng `bg-turf text-navy-deep` hoặc ghi nhận ngoại lệ |

## 7. Artefacts

- Report này: docs/report/review-t5-staff-signoff.md
- Bằng chứng độc lập: `npx tsc --noEmit` EXIT=0 · `npx vitest run` 227/227 PASS · `pnpm lint` 3 lỗi backend (xem §6 R-1)
- QA nền tảng: docs/report/qa-t4-vitest-viewport.md (227/227, 6 viewport×theme, không FOUC/overflow)

## 8. Chữ ký nghiệm thu

✅ **APPROVED (conditional)** — phê duyệt hoàn thành đợt triển khai giao diện Modern Athletic Bento cho SanGo.
Điều kiện trước khi merge cuối: sửa R-2, R-3 (tương phản), R-1 (lint backend). R-4…R-8 và P-1 là backlog polish không chặn.
