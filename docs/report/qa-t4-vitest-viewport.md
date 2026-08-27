# Báo cáo QA — T4 · Vitest Regression Suite + Multi-viewport + Theme (Modern Athletic Bento)

- **Người thực hiện:** qa_test_engineer (team sango-fe-expert-team)
- **Ngày:** 2026-08-26 · **Nền:** working-tree Modern Athletic Bento redesign (chưa commit, base 4408234)
- **Môi trường:** Node 22 / pnpm 11.22 · Vitest 3 (jsdom) · API thật :4000 (Nest) · Web Vite :5173 · Google Chrome headless qua CDP · chống FOUC path được kiểm bằng localStorage thật + prefers-color-scheme emulation

## 1. Kết luận tổng quan

| Hạng mục | Kết quả |
| --- | --- |
| `pnpm --filter @sango/web test` | ✅ **48/48 test files · 227/227 tests PASS** (chạy 3 lần ổn định, EXIT=0) |
| Typecheck `tsc --noEmit` | ✅ PASS |
| Production build `vite build` | ✅ PASS (⚠️ chunk 1.3 MB — non-blocking) |
| Rules of Hooks violations | ✅ **0** (đã sửa 2 chỗ vi phạm — xem §3) |
| Radix refs warnings | ✅ **0** (cả trong Vitest lẫn browser thật) |
| Dark/Light toggle — FOUC | ✅ Không FOUC: inline bootstrap áp .dark/.light lên <html> trước paint (verified htmlClass=dark ngay khi load, 6/6 lần) |
| Mobile viewports 375 / 768 / 1280 | ✅ overflowX=false ở cả 3 viewport × 2 theme (6/6) |
| Console browser thật | ✅ Không React error; chỉ React Router future-flag warnings (info) + 401 auth-probe (mong đợi khi chưa đăng nhập) |

**Tổng: 227/227 test PASS · 0 critical · 2 finding đã sửa ngay (High) · 4 finding mở (Low/Info).**

## 2. Kết quả test suite (chi tiết)

- 48 test files (unit + component + page flows): admin, owner, booking/checkout-hold, public discovery, auth, teams, tournaments, matches, reputation, wallet, notifications, AI chat widget, router, dashboard, lib/api.
- 3 lần chạy độc lập: **227/227 PASS** (lần 1: 13.07s; lần 2: 13.48s; lần 3 sau khi sửa hook: 15.69s).

### Phân loại warning trong test suite (sau khi sửa)

| Loại | Số lần | Mức | Ghi chú |
| --- | --- | --- | --- |
| Rules of Hooks ("change in the order of Hooks") | **0** (trước: 2) | 🔴 → ✅ | Đã sửa — xem §3 |
| `act(...)` not wrapped (WalletBalanceBadge, NotificationBell, StatisticsPage, ToastAnnounce) | 13 | 🟡 Low | Chỉ test-hygiene: state update async sau assertion (query/timer); không phải lỗi production. Đề xuất cleanup/waitFor. |
| React Router Future Flag (v7_startTransition, v7_relativeSplatPath) | 74 | ⚪ Info | RR 6.30 → v7 sắp tới; thêm `future` flags khi upgrade. |
| Radix ref warnings | **0** | ✅ | Không có. |

## 3. Findings đã sửa trong đợt QA này

### 🔴 F-1 (High) · Rules of Hooks — `AdminStatsPage` (features/admin/pages/admin-stats-page.tsx)
- **Hiện tượng:** `useChartTheme()` được gọi **bên trong IIFE trong nhánh ternary có điều kiện** (`isPending ? … : isError ? … : (() => { useChartTheme() })()`) → số hook thay đổi giữa các render (skeleton ↔ dữ liệu). React cảnh báo "change in the order of Hooks"; ngoài đời có thể crash admin khi toggle khoảng ngày 7/14/30/90.
- **Sửa:** đưa `const chartTheme = useChartTheme();` lên đầu component (hook vô điều kiện), xoá khỏi IIFE.

### 🔴 F-2 (High) · Rules of Hooks — `AdminStatsSection` (pages/dashboard-page.tsx)
- **Hiện tượng:** `useChartTheme()` nằm **sau 2 early-return** (`if (isPending) return …; if (isError…) return …;`) → hook chỉ chạy khi có data.
- **Sửa:** đưa hook lên ngay sau `useAdminStats()` (vô điều kiện).

### 🟡 F-3 (Medium) · FOUC dark mode — apps/web/index.html
- **Hiện tượng:** theme chỉ được áp trong `useEffect` của `ThemeProvider` (sau paint) → user đã lưu `sango-theme=dark` bị **flash nền sáng** mỗi lần load.
- **Sửa:** thêm inline script trong `<head>` đọc `localStorage["sango-theme"]` + `prefers-color-scheme`, gán class trước khi React mount. **Đã verify:** htmlClass=dark ngay tại lần navigate đầu (6/6 capture), không flash.
- Lưu ý: nếu production dùng CSP strict, cần cho phép inline script này (hoặc chuyển sang hash).

### 🟡 F-4 (Low) · Media listener ghi đè theme tường minh — components/theme/theme-provider.tsx
- **Hiện tượng:** listener `matchMedia("(prefers-color-scheme: dark)")` luôn áp `resolveTheme("system")` → nếu user **chọn tường minh** dark nhưng OS đổi sang light, class trên `<html>` bị đổi sai trong khi React state vẫn dark (mismatch đến khi render lại).
- **Sửa:** dùng `themeRef` để resolve theo lựa chọn hiện tại: `applyToDocument(resolveTheme(themeRef.current))`.

## 4. Multi-viewport + theme — kết quả CDP (Chrome headless thật)

Điều khiển Chrome qua CDP: emulation 3 viewport × light/dark, seed `localStorage["sango-theme"]` **trước** document (path chống FOUC thật), chụp sau khi API trả dữ liệu.

| Case | innerWidth | scrollWidth | overflowX | htmlClass | Console đáng chú ý |
| --- | --- | --- | --- | --- | --- |
| mobile-375-light | 375 | 375 | **false** | light | RR flags + 401 auth-probe |
| mobile-375-dark | 375 | 375 | **false** | dark | RR flags + 401 auth-probe |
| tablet-768-light | 768 | 768 | **false** | light | RR flags + 401 auth-probe |
| tablet-768-dark | 768 | 768 | **false** | dark | RR flags + 401 auth-probe |
| desktop-1280-light | 1280 | 1280 | **false** | light | RR flags + 401 auth-probe |
| desktop-1280-dark | 1280 | 1280 | **false** | dark | RR flags + 401 auth-probe |

- **Visual (mobile 375):** header nav (Đăng nhập/Đăng ký), hero "SanGo — Đam Mê Thể Thao…", form tìm sân (môn thể thao / thành phố / Tìm sân), thẻ môn (Bóng đá 5/7, Pickleball) render đầy đủ; **light/dark khác biệt rõ, tương phản tốt, không vỡ màu** (xác nhận bằng vision trên ảnh thật).
- **Console browser thật:** không có React error, không có Radix ref warning. Chỉ có:
  - ⚪ React Router Future Flag Warning ×2 (info, RR 6.30).
  - ⚪ `401 Unauthorized` từ auth session-restore (`POST /auth/refresh`) khi chưa đăng nhập — **hành vi đúng thiết kế** (landing public vẫn render, không redirect sai).
- Số liệu đo: `rootChildren=3` (nav + main + footer), `hasNav=true` ở cả 6 case.

## 5. Findings mở (không chặn release)

| ID | Mức | Mô tả | Đề xuất |
| --- | --- | --- | --- |
| QA-T4-01 | ⚪ Info | 13 warning `act(...)` trong test (async update sau assertion) | Dọn test: `waitFor`/cleanup timer hoặc `act` wrapper; ưu tiên NotificationBell & WalletBalanceBadge (poll/timer) |
| QA-T4-02 | ⚪ Info | 74 React Router future-flag warnings | Khi upgrade RR v7: bật `v7_startTransition` + `v7_relativeSplatPath` |
| QA-T4-03 | ⚪ Info | Bundle main 1.3 MB (373 KB gzip) | Code-split theo route / `manualChunks` (vendor react, chart.js, leaflet, zod) |
| QA-T4-04 | ⚪ Info | CSP inline-script (xem F-3) | Nếu dùng CSP strict, thêm hash cho inline theme script |

## 6. Gates

- ✅ `pnpm --filter @sango/web test` → 48 files / 227 tests PASS
- ✅ `pnpm --filter @sango/web typecheck` → PASS
- ✅ `pnpm --filter @sango/web build` → PASS (3.2s)
- ✅ Browser smoke 6 case (viewport × theme) → không overflow, không FOUC, console sạch
- ⚠️ `pnpm lint` toàn repo chưa chạy trong đợt này (chỉ typecheck/test/build) — đề xuất chạy ở gate cuối trước commit.

## 7. Artefacts

- Script: `qa/viewport-smoke.mjs` (CDP viewport × theme smoke — tái sử dụng được)
- Screenshots: `qa/screenshots/{mobile-375,tablet-768,desktop-1280}-{light,dark}.png` + `summary.json`
- Logs: `qa/test-run-after-fix.log`, `qa/build.log`, `qa/screenshots/run.log`
