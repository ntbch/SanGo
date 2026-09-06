# Complete Customer Surfaces Cliché-Free Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor toàn bộ các phân hệ khách hàng còn lại (Social Matches, Team Treasury, Tournaments, Ranking, và Wallet Passbook) theo chuẩn nghiêm ngặt của `cliche-free-frontend`: chuyển đổi sang thẻ hàng ngang lịch thi đấu (Fixture Row), thẻ đội (Team Roster), cây bảng đấu phẳng (Flat Lineage Bracket), bảng xếp hạng Leaderboard, và sổ cái tài chính ví (Financial Passbook Ledger), đảm bảo 100% số liệu dùng `JetBrains Mono` tabular, loại bỏ toàn bộ `animate-pulse` và các pattern AI-slop.

**Architecture:**
- `/matches` & `/matches/:id`: Chuyển danh sách sang Fixture Row hàng ngang; trang chi tiết thiết kế theo bố cục bất đối xứng 60/40 (Cột trái: Thông số trận + Đội hình tham gia + Timeline thảo luận; Cột phải sticky: Thẻ xuất trận với số slot còn lại, chi phí mỗi người `font-mono-num font-black 2xl`, và CTA nộp cọc/tham gia).
- `/teams` & `/teams/:id`: Thẻ đội Athletic Roster; trang chi tiết chuyển tab Treasury thành Bảng sổ cái kế toán (General Ledger) có số dư lũy kế, tab Split thành bảng đối soát chia tiền trận đấu, tab Members minh bạch.
- `/tournaments` & `/tournaments/:id`: Thẻ giải đấu phẳng với cơ cấu giải thưởng tabular; trang chi tiết có sơ đồ cây bảng đấu phẳng (Flat Lineage Bracket) trên desktop và fallback dạng danh sách vòng đấu trên mobile.
- `/ranking`: Bục Podium thể thao phẳng tối giản kết hợp Bảng xếp hạng Leaderboard table chuẩn thể thao chuyên nghiệp, thứ hạng và điểm ELO định dạng `tabular-nums`.
- `/wallet`: Clean Financial Passbook trên một trang duy nhất: số dư lớn `font-mono-num`, bảng sao kê ledger thu (+ xanh lá) / chi (- foreground), xem chi tiết mở modal Biên lai điện tử (E-Receipt).

**Tech Stack:** React 18, Vite, Tailwind CSS v4, TypeScript, @tanstack/react-query, Lucide React, Vitest.

**Spec:** Quyết định qua Grilling Round 2 ngày 2026-09-06 và bộ luật `/cliche-free-frontend`.

## Global Constraints

- **0 Gradient / 0 Glassmorphism:** Toàn bộ bề mặt dùng semantic token (`bg-card`, `bg-background`, `border-border`, `bg-secondary/40`).
- **0 Animate-pulse / 0 Hover-opacity:** Xóa bỏ toàn bộ `animate-pulse` trên skeleton; cấm `hover:opacity`.
- **100% Số liệu là Tabular/Mono:** Giờ thi đấu, chi phí chia theo đầu người, giải thưởng VND, số dư ví, điểm ELO đều dùng `font-mono-num` (`JetBrains Mono`).
- **Quy tắc 4 Trạng thái:** Mọi danh sách phải có Skeleton đồng dạng, Empty state 3 dòng (tên + lý do + làm gì tiếp theo + 1 CTA).

---

## File Structure Map

| File Path | Trách nhiệm chính |
|---|---|
| `apps/web/src/features/matches/components/match-card.tsx` | Thẻ kèo đấu hàng ngang Fixture Row với giờ xuất trận tabular lớn |
| `apps/web/src/features/matches/pages/matches-page.tsx` | Trang danh sách kèo thi đấu với 4 trạng thái chuẩn |
| `apps/web/src/features/matches/pages/match-detail-page.tsx` | Trang chi tiết kèo đấu bố cục 60/40 Match Command Center |
| `apps/web/src/features/teams/components/team-card.tsx` | Thẻ đội Athletic Roster hiển thị thành viên & quỹ đội mono |
| `apps/web/src/features/teams/pages/teams-page.tsx` | Trang danh sách đội thể thao với 4 trạng thái chuẩn |
| `apps/web/src/features/teams/pages/team-detail-page.tsx` | Trang chi tiết đội với Bảng sổ cái kế toán (Treasury Ledger) & Bảng chia bill |
| `apps/web/src/features/tournaments/pages/tournaments-page.tsx` | Trang danh sách giải đấu với thẻ giải đấu phẳng |
| `apps/web/src/features/tournaments/pages/tournament-detail-page.tsx` | Trang chi tiết giải đấu với sơ đồ cây bảng đấu phẳng (Bracket Tree) |
| `apps/web/src/features/ranking/pages/ranking-page.tsx` | Bảng xếp hạng Leaderboard table & Podium thể thao phẳng |
| `apps/web/src/features/wallet/pages/wallet-page.tsx` | Trang Ví thể thao Clean Financial Passbook, sao kê ledger & E-Receipt modal |
| `apps/web/tests/MatchesFlow.test.tsx` | Test suite cho luồng Kèo đấu |
| `apps/web/tests/TeamsFlow.test.tsx` | Test suite cho luồng Đội nhóm & Quỹ đội |
| `apps/web/tests/TournamentsFlow.test.tsx` | Test suite cho luồng Giải đấu |
| `apps/web/tests/RankingFlow.test.tsx` | Test suite cho luồng Bảng xếp hạng |
| `apps/web/tests/WalletFlow.test.tsx` | Test suite cho luồng Ví thể thao & Sao kê |

---

### Task 1: Kèo Đấu — Fixture Row Card & Match Command Center 60/40 (`/matches`, `/matches/:id`)

**Files:**
- Modify: `apps/web/src/features/matches/components/match-card.tsx`
- Modify: `apps/web/src/features/matches/pages/matches-page.tsx`
- Modify: `apps/web/src/features/matches/pages/match-detail-page.tsx`
- Test: `apps/web/tests/MatchesFlow.test.tsx`

- [ ] **Step 1: Viết test cho Fixture Row và Match Detail 60/40**

Trong `apps/web/tests/MatchesFlow.test.tsx`:
- Kiểm tra `MatchCard` hiển thị giờ tabular lớn (`font-mono-num font-black`), chi phí mỗi người, badge slot thiếu rõ ràng, nút CTA `active:scale-[0.98]`.
- Kiểm tra `MatchDetailPage` hiển thị cột trái 60% (thông số trận, danh sách thành viên, comments) và cột phải 40% (thẻ xuất trận sticky, chi phí mono, nút tham gia/duyệt).

- [ ] **Step 2: Chạy test để kiểm tra**

Run: `pnpm --filter web test tests/MatchesFlow.test.tsx`

- [ ] **Step 3: Triển khai `match-card.tsx`, `matches-page.tsx` và `match-detail-page.tsx`**

- `match-card.tsx`: Card hàng ngang (`sm:flex-row items-center justify-between p-4 sm:p-5`), số liệu `tabular-nums`, không `hover:opacity`.
- `matches-page.tsx`: Danh sách xếp chồng dọc (`flex flex-col gap-3`), xóa `animate-pulse`, tích hợp `EmptyState` 3 dòng.
- `match-detail-page.tsx`: Bố cục 60/40 (`lg:grid lg:grid-cols-12 lg:gap-8`: Cột trái 7/12, Cột phải sticky 5/12). Xóa `animate-pulse` trên loading.

- [ ] **Step 4: Chạy test xác nhận PASS**

Run: `pnpm --filter web test tests/MatchesFlow.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/matches/ apps/web/tests/MatchesFlow.test.tsx
git commit -m "feat(matches): redesign match card into fixture row and match detail to 60/40 command center"
```

---

### Task 2: Đội Nhóm — Athletic Roster & Sổ Cái Quỹ Đội Treasury Ledger (`/teams`, `/teams/:id`)

**Files:**
- Modify: `apps/web/src/features/teams/components/team-card.tsx`
- Modify: `apps/web/src/features/teams/pages/teams-page.tsx`
- Modify: `apps/web/src/features/teams/pages/team-detail-page.tsx`
- Test: `apps/web/tests/TeamsFlow.test.tsx`

- [ ] **Step 1: Viết test cho Athletic Roster và Treasury Ledger**

Trong `apps/web/tests/TeamsFlow.test.tsx`:
- Kiểm tra `TeamCard` hiển thị số lượng thành viên, đội trưởng và vai trò bằng `font-mono-num`.
- Kiểm tra `TeamDetailPage` tab Treasury hiển thị dạng Bảng sổ cái kế toán (Ngày, Khoản mục, Thu/Chi, Số dư) với số liệu mono.
- Kiểm tra tab Split bill hiển thị bảng đối soát nộp tiền.

- [ ] **Step 2: Chạy test để kiểm tra**

Run: `pnpm --filter web test tests/TeamsFlow.test.tsx`

- [ ] **Step 3: Triển khai `team-card.tsx`, `teams-page.tsx` và `team-detail-page.tsx`**

- `team-card.tsx`: Xóa `group-hover:scale-105`, thay bằng viền phẳng `hover:border-primary/60`. Số liệu thành viên `font-mono-num`.
- `teams-page.tsx`: Tích hợp `EmptyState` 3 dòng chuẩn ("Chưa tham gia đội nào" + CTA "Tạo Đội Đầu Tiên"), xóa `animate-pulse`.
- `team-detail-page.tsx`: Tab Treasury biến thành Bảng sổ cái (General Ledger) phẳng có đường kẻ mảnh, số tiền `+` màu xanh lá, `-` màu foreground. Tab Split là bảng đối soát chia tiền trận đấu. Xóa `animate-pulse`.

- [ ] **Step 4: Chạy test xác nhận PASS**

Run: `pnpm --filter web test tests/TeamsFlow.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/teams/ apps/web/tests/TeamsFlow.test.tsx
git commit -m "feat(teams): implement athletic team roster and financial treasury ledger table"
```

---

### Task 3: Giải Đấu — Sơ Đồ Cây Bảng Đấu Flat Lineage Bracket (`/tournaments`, `/tournaments/:id`)

**Files:**
- Modify: `apps/web/src/features/tournaments/components/tournament-card.tsx`
- Modify: `apps/web/src/features/tournaments/pages/tournaments-page.tsx`
- Modify: `apps/web/src/features/tournaments/pages/tournament-detail-page.tsx`
- Test: `apps/web/tests/TournamentsFlow.test.tsx`

- [ ] **Step 1: Viết test cho Tournament Cards & Bracket Tree**

Trong `apps/web/tests/TournamentsFlow.test.tsx`:
- Kiểm tra giải thưởng và số lượng đội thi đấu hiển thị dạng tabular mono.
- Kiểm tra `TournamentDetailPage` hiển thị nhánh thi đấu bảng đấu (Bracket) phẳng dứt khoát.

- [ ] **Step 2: Chạy test để kiểm tra**

Run: `pnpm --filter web test tests/TournamentsFlow.test.tsx`

- [ ] **Step 3: Triển khai `tournament-card.tsx`, `tournaments-page.tsx` và `tournament-detail-page.tsx`**

- `tournament-card.tsx`: Bề mặt `bg-card`, viền sắc `border-border`, tiền thưởng `font-mono-num font-black text-lg text-primary`.
- `tournaments-page.tsx`: Xóa `animate-pulse`, tích hợp `EmptyState` 3 dòng.
- `tournament-detail-page.tsx`: Thiết kế sơ đồ cây bảng đấu phẳng: Các thẻ trận đấu nối với nhau bằng đường kẻ `border-border` rõ nét, tỷ số `font-mono-num font-bold`.

- [ ] **Step 4: Chạy test xác nhận PASS**

Run: `pnpm --filter web test tests/TournamentsFlow.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/tournaments/ apps/web/tests/TournamentsFlow.test.tsx
git commit -m "feat(tournaments): standardize tournament cards and flat lineage bracket tree"
```

---

### Task 4: Bảng Xếp Hạng & Bục Vinh Quang Phẳng (`/ranking`)

**Files:**
- Modify: `apps/web/src/features/ranking/pages/ranking-page.tsx`
- Modify: `apps/web/src/features/ranking/components/ranking-podium.tsx`
- Modify: `apps/web/src/features/ranking/components/ranking-leaderboard-table.tsx`
- Test: `apps/web/tests/RankingFlow.test.tsx`

- [ ] **Step 1: Viết test cho Leaderboard Table & Flat Podium**

Trong `apps/web/tests/RankingFlow.test.tsx`:
- Kiểm tra bục Podium phẳng (Top 1, Top 2, Top 3) hiển thị điểm mono.
- Kiểm tra Bảng xếp hạng Leaderboard table hiển thị cột Hạng (`#01`), Trận, Thắng, Điểm ELO căn phải định dạng `tabular-nums`.

- [ ] **Step 2: Chạy test để kiểm tra**

Run: `pnpm --filter web test tests/RankingFlow.test.tsx`

- [ ] **Step 3: Triển khai `ranking-podium.tsx`, `ranking-leaderboard-table.tsx` và `ranking-page.tsx`**

- `ranking-podium.tsx`: Bục vinh quang phẳng tối giản bằng các bậc cao thấp dứt khoát (`bg-card border border-border`), không hiệu ứng kim loại bóng.
- `ranking-leaderboard-table.tsx`: Cấu trúc table phẳng, phân cách hàng rõ nét, các cột số liệu dùng `font-mono-num font-bold tabular-nums`.
- `ranking-page.tsx`: Tích hợp `EmptyState` chuẩn khi chưa có dữ liệu mùa giải.

- [ ] **Step 4: Chạy test xác nhận PASS**

Run: `pnpm --filter web test tests/RankingFlow.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/ranking/ apps/web/tests/RankingFlow.test.tsx
git commit -m "feat(ranking): refine athletic leaderboard table and flat sports podium"
```

---

### Task 5: Ví Thể Thao Clean Financial Passbook & Sao Kê Ledger (`/wallet`)

**Files:**
- Modify: `apps/web/src/features/wallet/pages/wallet-page.tsx`
- Test: `apps/web/tests/WalletFlow.test.tsx`

- [ ] **Step 1: Viết test cho Wallet Passbook & Ledger Table**

Trong `apps/web/tests/WalletFlow.test.tsx`:
- Kiểm tra số dư ví hiển thị font mono lớn (`font-mono-num font-black`).
- Kiểm tra danh sách giao dịch hiển thị định dạng ledger với số tiền `+` / `-` tabular.
- Kiểm tra không có class `opacity-70 hover:opacity-100`.

- [ ] **Step 2: Chạy test để kiểm tra**

Run: `pnpm --filter web test tests/WalletFlow.test.tsx`

- [ ] **Step 3: Triển khai `wallet-page.tsx`**

- Xóa bỏ `opacity-70 hover:opacity-100`, thay bằng `text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors`.
- Số dư ví hiển thị `text-3xl sm:text-4xl font-mono-num font-black text-foreground`.
- Bảng sao kê giao dịch ngân hàng: Cột Thời gian, Loại giao dịch (Nạp tiền, Đặt cọc sân, Hoàn cọc, Chia bill), Số tiền định dạng `font-mono-num` (+ màu xanh lá, - màu foreground), Số dư sau giao dịch.
- Modal Biên lai điện tử (E-Receipt): Thiết kế phẳng sắc nét với mã tham chiếu ngân hàng và chi tiết đơn sân.

- [ ] **Step 4: Chạy test xác nhận PASS**

Run: `pnpm --filter web test tests/WalletFlow.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/wallet/ apps/web/tests/WalletFlow.test.tsx
git commit -m "feat(wallet): implement clean financial passbook with transaction ledger table and e-receipt modal"
```

---

### Task 6: Self-Audit Grep & Full Web Regression Pass

- [ ] **Step 1: Rà soát 20 pattern cấm trên toàn bộ codebase web**

```bash
cd apps/web/src && grep -rn "bg-gradient-to\|backdrop-blur\|bg-clip-text\|hover:opacity\|animate-pulse" features/matches features/teams features/tournaments features/ranking features/wallet
```
Expected: 0 matches.

- [ ] **Step 2: Typecheck & Full Test Suite**

```bash
pnpm --filter web typecheck
pnpm --filter web test
```
Expected: 0 errors, 100% test files PASS (23/23 files, 87+ tests).
