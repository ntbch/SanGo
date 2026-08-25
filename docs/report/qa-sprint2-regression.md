# CourtHub — Biên bản QA Regression Sprint 2

> Owner: qa2 · Ngày: 2026-08-26 · Căn cứ: docs/superpowers/plans/2026-08-25-qa-regression-checklist-sprint2.md
> Kết luận: **PASS Sprint 2** — A1–A4 xanh, MAJOR-1 bị chặn chắc chắn, Smoke demo 6 bước **26/26 PASS × 2 lần liên tiếp**.

## A. Cổng chất lượng
| # | Kiểm | Kết quả |
|---|---|---|
| A1 | `pnpm -r typecheck` | PASS — shared/api/web 0 lỗi |
| A2 | `pnpm -r test` | PASS — API 26 suites / **187 tests** (đo lại trên HEAD `33f203a`), Web 40/197, Shared 3/26. API ≥169 test cũ nguyên vẹn |
| A3 | `pnpm lint` (eslint + prettier) | PASS sau khi format lại 14 file lệch style |
| A4 | Migration S2-T0 | PASS — đúng 1 batch gộm `20260825213000_s2_foundation_teams_services_shares` (teams, team_members, expense_shares, venue_services, booking_add_ons + venues_lat_lng_idx); schema up-to-date; invariant ví per-user SUM(credit−debit)=balance khớp toàn bộ (tổng 1.470.000đ) |

## B. Fix MAJOR-1 (voucher quota trước khi phát URL thanh toán)
Chứng minh bằng smoke `apps/api/smoke-sprint2.mjs` (S6):
- Owner tạo mã riêng usageLimit=1 → customer apply (snapshot 201) → checkout FULL PAID (giảm đúng 20%: 120k→96k) → tiêu lượt.
- customer2 áp CÙNG mã: snapshot tại apply vẫn 201 (đúng spec — apply không tiêu quota) → **checkout thứ 2 bị chặn ngay tại checkout(): 409 VOUCHER_EXHAUSTED**, không sinh Payment nào (verified trong DB).
- Bảo vệ per-user: user đã dùng mã apply lại → **409 VOUCHER_USER_LIMIT ngay tại apply** (chặn sớm hơn spec, an toàn hơn).
- B3/B4 không hồi quy: happy path 1-user-1-mã chạy đúng giá snapshot; callback trùng replay idempotent (S5g).

## C. Feature Sprint 2
### C1 Map bbox + ghim giá — PASS
- GET /venues/map?bbox=… trả 24 venue kèm priceFrom/priceTo aggregate (vd CLB Pickleball & Tennis Xuân Đỉnh 120k–300k); bbox min>max → 400 validation.
- Index `venues_lat_lng_idx` tồn tại trong migration (lưu ý: cột schema là `lat/lng`, checklist ghi "latitude/longitude" chỉ là mô tả ngữ nghĩa).
- FE Leaflet + ghim giá: đã có commit 80ba824; debounce/kéo bản đồ thuộc FE unit test (web suite 197 pass).

### C2 Team Profile & quỹ đội — PASS
- Vòng đời đội: captain tạo → invite MEMBER → member accept → danh sách ACTIVE đủ vai (S2a–d).
- Phân quyền: member thường PATCH đội → **403** (S2e).
- Booking tư cách đội: hold kèm teamId → checkout mock → callback → booking CONFIRMED mang đúng teamId (S3a–d).
- Quỹ track-only: split-booking chia đều floor(total/members), **loại payer khỏi debtors** (spec hiện tại), ExpenseShare bảng riêng — diff xác nhận KHÔNG ghi WalletLedger quỹ đội; dashboard doanh thu vẫn đọc ledger cá nhân.
- Đánh dấu PAID: chỉ payer/captain (debtor tự đánh dấu bị 403 — đúng spec); bấm 2 lần idempotent 200/200 (S4b).

### C3 Add-on dịch vụ — PASS
- Owner CRUD menu (BEVERAGE/EQUIPMENT): 201; public GET danh sách mở bán.
- Addon trên đơn CONFIRMED: upsert quantity, checkout ADD_ON tính unpaidAmount = Σ qty×price = 50k; txnRef `<bookingId>.ADD_ON.<rand>` giữ shape.
- Callback sai amount → 400 PAYMENT_AMOUNT_MISMATCH; đủ amount → PAID; replay → vẫn đúng 1 Payment ADD_ON PAID (idempotent); lịch sử addon theo đơn đầy đủ.

## D. Invariant xuyên sprint — ĐẠT
txnRef '<id>.<TYPE>.<rand>' bất biến (DEPOSIT/FULL/ADD_ON) · WalletLedger append-only, quỹ đội tách bảng · migration 1 batch · conventional commits nhỏ · UI tiếng Việt pattern features/.

## E. Smoke demo buổi 2 (apps/api/smoke-sprint2.cjs)
Map bbox/ghim giá ✅ → Tạo đội/mời/join ✅ → Đặt sân teamId CONFIRMED ✅ → Chia tiền + PAID idempotent ✅ → Mua nước+thuê vợt ADD_ON thanh toán ✅ → **MAJOR-1 bị chặn (409 VOUCHER_EXHAUSTED, 0 payment)** ✅.
Chạy: `cd apps/api && node smoke-sprint2.mjs` (cần API đang chạy port .env PORT=4000). Kết quả: **26/26 PASS × 2 lần liên tiếp**; chạy lại lần 3 sau commit `fd8fb46` (addons-dialog error state) — vẫn 26/26.

## Phát hiện & xử lý trong đợt QA
1. **test(ai) QA-t8 fail do phụ thuộc đồng hồ thật** (hardcode 'hôm nay' = 2026-08-25) → sửa test-only: jest.useFakeTimers cố định mốc UTC, deterministic. Commit `20f1078`.
2. **14 file lệch prettier** (từ các commit FE/BE sprint 2) → `pnpm format`, formatting-only. Commit `a375a3e`.
3. **Prisma client stale**: ts-jest compile lỗi `hold.teamId` TS2339 dù typecheck pass → `npx prisma generate` + clear cache → 26/26 suites xanh. (Khuyến nghị reviewer: thêm prisma generate vào postinstall.)
4. Observations (không phải bug, đúng nghiệp vụ): login throttle 429 khi gọi dồn; 1 user/1 hold ACTIVE (HOLD_LIMIT); slot trùng bị chặn (SLOT_TAKEN); DB dev còn sót dữ liệu test integration (itwal-*/itflow-* users) — cân nhắn tách DB test nếu muốn sạch.

## Delta verification sau khi biên bản lập xong
- `fd8fb46` fix(web) addons-dialog error state: typecheck ✓ web 197 ✓ smoke chạy lại **lần 3 — 26/26 PASS**.
- `33f203a` feat(ai) gemini adapter: format 2 file lệch prettier, typecheck ✓, API suite đo lại **187/187 PASS**, lint sạch.

## Tiêu chí F
A1–A4 ✅ · B1/B2 chặn chắc chắn ✅ · C1–C3 không bug chặn ✅ · E trơn 2 lần liên tiếp ✅ → **mở cửa cho reviewer tiếp nhận (t22)**.
