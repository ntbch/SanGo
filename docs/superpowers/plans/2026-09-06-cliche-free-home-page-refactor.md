# Home Page Cliché-Free Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor toàn bộ Trang Chủ (`/`) của SanGo theo chuẩn nghiêm ngặt của `cliche-free-frontend`: chuyển đổi từ 9 khối rải rác sang 5 khối có nhịp bề mặt full-bleed tương phản (`bg-background` xen kẽ `bg-secondary/40`), tập trung Hero vào 1 Command Center focal point, đồng bộ lưới sân tiêu biểu sang thẻ hàng ngang 2 cột, và hợp nhất cơ chế vận hành.

**Architecture:**
- Cấu trúc 5 khối full-bleed:
  1. Section 1 (Hero - Background): Asymmetric 60/40 với Command Bar tìm kiếm đa năng bên trái và Bảng ticker các trận đấu đang thiếu người bên phải (`JetBrains Mono` tabular).
  2. Section 2 (Featured Venues - Secondary/40): Lưới 2 cột thẻ hàng ngang (`VenueCard`), hiển thị giá/cự ly tabular, nút điều hướng xem toàn bộ sân.
  3. Section 3 (Sports Discovery - Background): 4 môn thể thao trọng điểm với số lượng cụm sân thực tế, khung giá chuẩn theo giờ/slot.
  4. Section 4 (Operations & Tech - Secondary/40): Hợp nhất Quy trình đặt sân & 4 cơ chế vận hành tự động (Khóa slot 10p, Chia tiền VietQR, Check-in mã QR, Tín nhiệm) thành 1 khối minh bạch duy nhất.
  5. Section 5 (FAQ & Partner Ecosystem - Background): Thắc mắc thường gặp dạng accordion phẳng và lời mời hợp tác dành cho chủ sân.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, TypeScript, @tanstack/react-query, Lucide React, Vitest.

**Spec:** Quyết định qua Grilling Round 1 Trang Chủ ngày 2026-09-06 và bộ luật `/cliche-free-frontend`.

## Global Constraints

- **0 Gradient / 0 Glassmorphism:** Toàn bộ bề mặt dùng semantic token (`bg-background`, `bg-card`, `bg-secondary/40`, `border-border`).
- **Nhịp Section Full-bleed:** Xen kẽ `bg-background` và `bg-secondary/40` để phân tách khối rõ rệt mà không cần phụ thuộc vào đường kẻ bao quanh cả trang.
- **1 Focal Point / Section:** Hero có 1 thanh tìm kiếm đa năng tích hợp, tiêu đề không chứa icon trang trí.
- **100% Số liệu là Tabular/Mono:** Giờ thi đấu, chi phí chia theo đầu người, giá thuê sân, số lượng sân khả dụng đều dùng `font-mono-num` (`JetBrains Mono`).
- **Tương tác có phản hồi:** Mọi button và thẻ tương tác có `active:scale-[0.98]`, transition 150-200ms, cấm `hover:opacity`.

---

## File Structure Map

| File Path | Trách nhiệm chính |
|---|---|
| `apps/web/src/features/home/components/home-hero.tsx` | Hero Command Center (Headline, Unified Search Bar, Live Match Roster) |
| `apps/web/src/features/home/components/home-featured-venues.tsx` | Sân tiêu biểu lưới 2 cột sử dụng thẻ hàng ngang `VenueCard` |
| `apps/web/src/features/home/components/home-sports-cards.tsx` | 4 môn thể thao với thông số sân thực tế và giá sàn `tabular-nums` |
| `apps/web/src/features/home/components/home-tech-pillars.tsx` | Khối vận hành & quy trình hợp nhất (Cơ chế 01 - 04) |
| `apps/web/src/features/home/pages/home-page.tsx` | Trang chủ bố cục 5 khối full-bleed nhịp nhàng |
| `apps/web/tests/HomeFlow.test.tsx` | Bộ kiểm thử tự động toàn diện cho Trang Chủ |

---

### Task 1: Tinh Gọn Hero Thành Command Center Thể Thao (`home-hero.tsx`)

**Files:**
- Modify: `apps/web/src/features/home/components/home-hero.tsx`
- Test: `apps/web/tests/HomeFlow.test.tsx`

**Interfaces:**
- Consumes: `listOpenMatchesApi` từ `src/features/matches/api/matches-api`, `SPORT_LABELS`
- Produces: `HomeHero()` với thanh tìm kiếm tích hợp và danh sách trận đấu cần người font tabular.

- [ ] **Step 1: Viết test cho Hero Command Center**

Cập nhật test case trong `apps/web/tests/HomeFlow.test.tsx`:
- Kiểm tra tiêu đề "Đặt Sân Thể Thao & Ghép Kèo Nhanh" text-only, font black.
- Kiểm tra form tìm kiếm chứa input nhập tên sân/khu vực và bộ chọn nhanh môn thể thao.
- Kiểm tra danh sách trận đấu bên phải hiển thị giờ và chi phí dạng tabular (`font-mono-num`).

- [ ] **Step 2: Chạy test để kiểm tra**

Run: `pnpm --filter web test tests/HomeFlow.test.tsx`

- [ ] **Step 3: Triển khai `HomeHero` theo chuẩn Cliché-Free**

Trong `apps/web/src/features/home/components/home-hero.tsx`:
- Cột trái (60%):
  - Headline: Chữ đặc, `leading-[1.15]`, tối đa 1 focal point.
  - Command Bar: Tích hợp chọn môn thể thao (dạng pill phẳng `bg-secondary` khi chưa chọn, `bg-primary text-primary-foreground` khi chọn) + Ô nhập từ khóa/quận + Nút bấm "Tìm sân trống" to rõ, có `active:scale-[0.98]`.
- Cột phải (40%):
  - Card bảng kê "Trận đấu đang thiếu người hôm nay" với tag trạng thái phẳng, giờ thi đấu mono, chi phí mỗi người định dạng `font-mono-num`, và nút "Xem tất cả kèo".

- [ ] **Step 4: Chạy test xác nhận PASS**

Run: `pnpm --filter web test tests/HomeFlow.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/home/components/home-hero.tsx apps/web/tests/HomeFlow.test.tsx
git commit -m "feat(home): streamline hero into athletic command center with integrated search and tabular match ticker"
```

---

### Task 2: Refactor Sân Tiêu Biểu Sang Lưới 2 Cột Thẻ Hàng Ngang (`home-featured-venues.tsx`)

**Files:**
- Modify: `apps/web/src/features/home/components/home-featured-venues.tsx`
- Test: `apps/web/tests/HomeFlow.test.tsx`

**Interfaces:**
- Consumes: `VenueCard` từ `src/features/venues/components/venue-card`, `getVenuesListApi`
- Produces: `HomeFeaturedVenues()` dạng lưới 2 cột thẻ ngang `grid-cols-1 lg:grid-cols-2 gap-4`.

- [ ] **Step 1: Viết test cho Featured Venues lưới 2 cột**

Trong `apps/web/tests/HomeFlow.test.tsx`:
- Kiểm tra hiển thị tiêu đề "Cụm sân tiêu biểu được yêu thích".
- Kiểm tra render các thẻ sân bằng `VenueCard` dạng hàng ngang.
- Kiểm tra có nút điều hướng "Xem tất cả 250+ sân".

- [ ] **Step 2: Chạy test để kiểm tra**

Run: `pnpm --filter web test tests/HomeFlow.test.tsx`

- [ ] **Step 3: Triển khai `HomeFeaturedVenues`**

Trong `apps/web/src/features/home/components/home-featured-venues.tsx`:
- Lấy danh sách 4 sân tiêu biểu (sắp xếp theo rating hoặc số booking).
- Render dạng lưới 2 cột: `grid grid-cols-1 lg:grid-cols-2 gap-4`.
- Sử dụng trực tiếp `VenueCard` để đảm bảo tính đồng nhất 100% với trang `/venues`.
- Header section: Tiêu đề phẳng bên trái, nút "Xem tất cả cụm sân" phẳng bên phải.

- [ ] **Step 4: Chạy test xác nhận PASS**

Run: `pnpm --filter web test tests/HomeFlow.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/home/components/home-featured-venues.tsx apps/web/tests/HomeFlow.test.tsx
git commit -m "feat(home): render featured venues in high-density 2-column horizontal card grid"
```

---

### Task 3: Nâng Cấp Khối Môn Thể Thao & Hợp Nhất Cơ Chế Vận Hành (`home-sports-cards.tsx`, `home-tech-pillars.tsx`)

**Files:**
- Modify: `apps/web/src/features/home/components/home-sports-cards.tsx`
- Modify: `apps/web/src/features/home/components/home-tech-pillars.tsx`
- Test: `apps/web/tests/HomeFlow.test.tsx`

**Interfaces:**
- Produces: 
  - `HomeSportsCards()` hiển thị thông số sân thực tế (140+ sân bóng, 60+ sân pickleball...) và mức giá sàn `tabular-nums`.
  - `HomeTechPillars()` tích hợp 4 cơ chế vận hành minh bạch (Khóa slot 10p, Chia tiền VietQR, Check-in QR, Điểm tín nhiệm) với số thứ tự 01-04 rõ ràng.

- [x] **Step 1: Viết test cho môn thể thao và cơ chế vận hành**

Trong `apps/web/tests/HomeFlow.test.tsx`:
- Kiểm tra 4 thẻ môn thể thao hiển thị số lượng cụm sân và giá giờ mono.
- Kiểm tra khối công nghệ vận hành chứa đủ 4 cơ chế 01-04.

- [x] **Step 2: Chạy test để kiểm tra**

Run: `pnpm --filter web test tests/HomeFlow.test.tsx`

- [x] **Step 3: Cập nhật `HomeSportsCards` & `HomeTechPillars`**

- `home-sports-cards.tsx`: Card phẳng, loại bỏ hiệu ứng hover phóng to thái quá, bổ sung thông số sân có sẵn và giá sàn `font-mono-num font-bold`.
- `home-tech-pillars.tsx`: Thiết kế dạng 4 khối cơ chế vận hành dứt khoát với số thứ tự lớn `font-mono-num text-2xl font-black text-muted-foreground/40`, tag chức năng phẳng, nội dung súc tích hướng vào giá trị thực tế.

- [x] **Step 4: Chạy test xác nhận PASS**

Run: `pnpm --filter web test tests/HomeFlow.test.tsx`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add apps/web/src/features/home/components/home-sports-cards.tsx apps/web/src/features/home/components/home-tech-pillars.tsx apps/web/tests/HomeFlow.test.tsx
git commit -m "feat(home): upgrade sports cards and consolidate operational mechanics"
```

---

### Task 4: Tái Cấu Trúc Bố Cục Trang Chủ Full-Bleed 5 Khối (`home-page.tsx`)

**Files:**
- Modify: `apps/web/src/features/home/pages/home-page.tsx`
- Test: `apps/web/tests/HomeFlow.test.tsx`
- Test: `apps/web/tests/App.test.tsx`
- Test: `apps/web/tests/AuthAndRoutes.test.tsx`

**Interfaces:**
- Produces: `HomePage()` hoàn chỉnh với 5 section full-bleed nhịp nhàng.

- [ ] **Step 1: Viết test kiểm tra 5 khối của HomePage**

Trong `apps/web/tests/HomeFlow.test.tsx`:
- Kiểm tra cả 5 section đều được render đầy đủ.
- Kiểm tra các liên kết hành động chính (Tìm sân, Xem kèo, Đối tác).

- [ ] **Step 2: Chạy test để kiểm tra**

Run: `pnpm --filter web test tests/HomeFlow.test.tsx`

- [ ] **Step 3: Triển khai cấu trúc 5 section full-bleed trong `home-page.tsx`**

Trong `apps/web/src/features/home/pages/home-page.tsx`:
```tsx
export function HomePage(): React.ReactElement {
  return (
    <div className="w-full">
      {/* 1. Hero Command Center (Background) */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 border-b border-border/40">
        <HomeHero />
      </section>

      {/* 2. Sân Tiêu Biểu 2 Cột Thẻ Ngang (Secondary/40) */}
      <section className="w-full bg-secondary/40 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 border-b border-border/40">
        <HomeFeaturedVenues />
      </section>

      {/* 3. Khám Phá Theo 4 Môn Thể Thao (Background) */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 border-b border-border/40">
        <HomeSportsCards />
      </section>

      {/* 4. Quy Trình & Công Nghệ Vận Hành SanGo (Secondary/40) */}
      <section className="w-full bg-secondary/40 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 border-b border-border/40">
        <HomeTechPillars />
      </section>

      {/* 5. Câu Hỏi Thường Gặp & Đối Tác Chủ Sân (Background) */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 space-y-12 sm:space-y-16">
        <HomeGuestFaq />
        <HomePartnerCta />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Chạy toàn bộ test suite để xác nhận PASS**

Run: `pnpm --filter web test tests/HomeFlow.test.tsx tests/App.test.tsx tests/AuthAndRoutes.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/home/pages/home-page.tsx apps/web/tests/HomeFlow.test.tsx
git commit -m "feat(home): structure home page with 5 rhythmic full-bleed sections and verified test pass"
```

---

### Task 5: Self-Audit Grep & Full Web Regression Pass

- [ ] **Step 1: Rà soát 20 pattern cấm trong features/home**

```bash
cd apps/web/src && grep -rn "bg-gradient-to\|backdrop-blur\|bg-clip-text\|hover:opacity" features/home
```
Expected: 0 matches.

- [ ] **Step 2: Typecheck & Full Test Suite**

```bash
pnpm --filter web typecheck
pnpm --filter web test
```
Expected: 0 errors, 100% test files PASS.
