# CourtHub — Biên bản QA Regression Sprint 3

> Owner: qa2 · Ngày: 2026-08-26 · Căn cứ: charter t33 + checklist sprint 3 · HEAD lúc chạy: `3f5926a`
> Kết luận: **PASS Sprint 3** — gates xanh toàn phần, F2/F7 hoạt động đúng charter, regression S1+S2 xanh.

## A. Cổng chất lượng
| # | Kiểm | Kết quả |
|---|---|---|
| A1 | typecheck | PASS 3/3 projects |
| A2 | test | API **209/209** (+11 test S3: reputation/tournaments/expense unique) · Web **206/206**¹ · Shared 26/26 |
| A3 | lint | PASS sau khi dọn `apps/api/scripts/tmp-dupcheck.js` (file tạm untracked, vi phạm no-require-imports) |
| A4 | Migration | `20260826070000_s3_tournaments_expense_unique` + `20260826073000_fix_expense_share_unique_debtor` — additive, up-to-date |

¹ Lần chạy đầu fail 1 test flaky `booking-calendar-page.test.tsx > G2-FIX` (không ổn định khi chạy song song full-suite; chạy riêng và chạy lại full suite đều 206/206). Khuyến nghị fe: mock đồng hồ/thời gian cho test này.

## B. F2 Ranking & Badge (compute-on-read)
- **Công thức khớp charter**: BASE=50 · đúng giờ +10 (checkedInAt ≤ date+startMinute) · hủy sát <12h −5 · no-show (COMPLETED không check-in) −20 · clamp 0..100. Smoke tự tính độc lập từ DB so khớp API: customer2 = 45 chính xác; customer self-consistency (clamp dưới 0 hoạt động khi nhiều no-show tích lũy).
- **User mới đăng ký** → score đúng 50 (BASE), mọi badge current=0.
- **Badge SQL aggregate**: ON_TIME_10 / BOOKINGS_10 — current/unlocked/target đúng nguồn đếm (BOOKINGS_10 gồm CONFIRMED — nhất quán định nghĩa "đã đặt sân").
- **Cache TTL thuần 5'**: ghi sự kiện đổi điểm ngay sau GET → GET tiếp trong TTL vẫn trả giá trị cũ (đúng thiết kế không-invalidate); Swagger đã khóa ngưỡng 12h + TTL (commit 8023bb9).
- **Leaderboard** (fa1dfcb): shape items[{userId,fullName,score,onTime,noShow}]+total+generatedAt; sort score desc→onTime→tên; limit default 10/trần 50 (limit=51 → 400); GLOBAL gồm user seed.

## C. F7 Tournament (single-elim demo-first)
- OWNER tạo giải REGISTRATION ✓ · captain đăng ký (người lạ 403 TEAM_FORBIDDEN) ✓ · 8/8 đội đăng ký ✓.
- Start: tự sinh bracket **7 trận** (QF=4, SF=2, F=1) — đúng bất biến số trận = đội − 1; status ONGOING.
- Nhập điểm tay PATCH /matches/:id/score (host/admin): winner tự đẩy vòng sau, đủ DONE → **FINISHED + championTeamId** ✓.
- Negative: customer thường nhập điểm → **403** ✓.

## D. MINOR debt S2
- dedup memberIds + unique index expense_shares (99fb9e4) — integration test phủ; API tests 209 xanh.

## E. Regression S1 + S2
- `smoke-sprint2.mjs` **26/26 PASS**² · `smoke-teamflow.mjs` **6/6 PASS** · suite tiền (payments/vouchers/wallets) xanh trong API suite.
- ² Hai script regression + sprint-3 smoke đã vá chọn slot **theo lưới giờ venue** (openMinute/slotMinutes) thay vì slot cứng — trước đó SLOTS_MISALIGNED khi seed S3 làm đổi venue findFirst.

## Findings (không chặn PASS, đề xử lý tiếp)
1. **Hòa điểm trong bracket**: UpdateMatchScoreSchema chấp nhận homeScore==awayScore; service chọn winner `home > away ? home : away` → hòa sẽ phong AWAY thắng vô lý (code review; DTO comment nói "bắt buộc thắng/thua"). Đề xuất: `z.refine(homeScore !== awayScore)`.
2. **POST /tournaments/:id/register với id không hợp lệ → 500** (raw query `::uuid` nổ ngoài try-catch có ý định bắt lỗi) — đề xuất validate UUID param → 404 TOURNAMENT_NOT_FOUND.
3. Test web G2-FIX flaky khi chạy song song (xem A2).
4. DB dev dần tích lũy dữ liệu QA (QAEXH vouchers, QA-NS bookings, team smoke...) — cân nhắc reset seed trước buổi bảo vệ.

## Tiêu chí PASS Sprint 3
Gates ✓ · ranking/badge/cache đúng charter ✓ · leaderboard ✓ · tournament bracket/champion/negative ✓ · regression S1+S2 ✓ → **PASS, mở cửa reviewer**.
