# SanGo — QA Regression Checklist Sprint 1 (buổi demo 1)

> Owner: qa · Trạng thái: CHUẨN BỊ SẴN — kích hoạt khi t9/t10/t6 hoàn tất (task t11).
> Căn cứ: docs/superpowers/plans/2026-08-25-feature-roadmap-master.md + code thực tế tại thời điểm 2026-08-25.

## A. Cổng chất lượng bắt buộc (chạy theo thứ tự, tất cả phải PASS)

| # | Lệnh | Vị trí | Kỳ vọng |
|---|---|---|---|
| A1 | `pnpm -r typecheck` | root | 3 workspace (api/web/shared) 0 lỗi TS |
| A2 | `pnpm -r test` | root | api jest (hiện 21 spec), web vitest (hiện 32 file), shared vitest — 0 fail |
| A3 | `pnpm lint` | root | eslint + prettier --check sạch |
| A4 | `pnpm build` | root | build thành công toàn monorepo |
| A5 | Migration: đúng **1 batch duy nhất** cho T-T0 | apps/api/prisma/migrations | KHÔNG có migration rời rạc ngoài mô tả T-T0; `prisma migrate dev` sạch |

Quy tắc commit: conventional-commits nhỏ từng bước, đã chạy test trước mỗi commit (`git log --oneline` soát).

## B. Hai ca bảo mật S0 (bắt buộc PASS trước mọi thứ khác)

### SEC-S0-01 — Callback mock không xác nhận đơn miễn phí
- **Lỗ hổng đã kiểm chứng (pre-fix):** `payments.service.ts:198` — `if (params.amount !== undefined && ...)` ⇒ thiếu `amount` thì BỎ qua đối chiếu; ai biết `txnRef` gọi GET `/api/v1/payments/mock/callback?txnRef=<ref>` là confirm đơn 0 đồng. Route `payments.controller.ts:54-60` chưa gate theo env.
- **Điều kiện chấp nhận post-fix:**
  1. Gọi mock/callback **không kèm** `amount` → từ chối (400 PAYMENT_AMOUNT_MISMATCH hoặc tương đương), booking vẫn HELD, không tạo Payment PAID.
  2. Gọi mock/callback khi `PAYMENT_MODE != mock` → bị chặn (403/404), không lộ route ở prod.
  3. Gọi với amount sai → 400 PAYMENT_AMOUNT_MISMATCH.
- **Bằng chứng cần lưu:** response code + DB (booking.status, Payment count).

### SEC-S0-02 — Idempotency & chống hoàn kép
- Replay đúng txnRef + amount đúng lần 2 → SUCCESS idempotent, chỉ **1** Payment PAID, booking CONFIRMED 1 lần (isAlreadyPaid :231).
- Retry/crash luồng hoàn tiền → `WalletLedger UNIQUE(refType, refId, type)` chặn ghi trùng; số dư chỉ thay đổi đúng 1 lần.
- `parseTxnRef` (:221-229): giữ nguyên shape '<id>.<TYPE>.<rand>', whitelist chỉ mở rộng (DEPOSIT|FULL|ADD_ON...), type lạ → null.

## C. Regression theo tính năng

### C1. F6 Sport Wallet (t3/t8)
- Nạp tiền mock → ghi thẳng ledger refType='TOPUP' (KHÔNG tạo Payment vì bookingId NOT NULL); balanceAfter tăng đúng.
- GET số dư + lịch sử phân trang; số dư = SUM(ledger) khớp balanceAfter cuối.
- Hủy đúng quy định → hoàn vào ví tức thì; Payment(REFUND) vẫn làm chứng từ, ledger mới là nguồn sự thật.
- Thanh toán booking bằng ví → DEBIT, balanceAfter giảm đúng, không âm ví.

### C2. F3 Voucher (t5/t9)
- Áp mã tại checkout: snapshot discountAmount/finalAmount vào hold NGAY LÚC ÁP MÃ (callback recompute quoteHold — payments.service.ts:111-114,159 phải so đúng finalAmount*100).
- Vượt usageLimit → UPDATE ... WHERE usedCount<usageLimit atomic, request thừa bị chặn; perUserLimit + VoucherRedemption UNIQUE(voucherId,userId).
- Ngoài cửa sổ khung giờ thấp điểm / mã sai / hết hạn → lỗi rõ ràng, giá không đổi.
- Mã hợp lệ → hiển thị giá giảm ngay trên UI checkout trước khi trả tiền.

### C3. N2 Hủy hàng loạt ngày mưa (t4)
- Owner hủy cả ngày theo policy='WEATHER' force percent=100 — KHÔNG tái dụng tier refundQuote :377 (>24h→100/>=12h→50/else 0).
- Hoàn 100% VÀO VÍ từng booking; fan-out notify best-effort SAU commit; lỗi notify không rollback tiền.
- Khách tự hủy thường vẫn giữ tier cũ (không bị policy WEATHER nhiễm vào).

### C4. F8 Notification Center (t7/t10)
- Enum mới WALLET/VOUCHER/TEAM/TOURNAMENT; broadcast + unread count đúng; đánh dấu đã đọc per-user.

## D. Kiểm toán bất biến kiến trúc (soi diff/dữ liệu)
1. Format txnRef '<id>.<TYPE>.<rand>' KHÔNG đổi.
2. WalletLedger append-only — không có code UPDATE/DELETE ledger.
3. Ghi ledger SAU commit (afterCommit/outbox), không giữ FOR UPDATE dài.
4. Dashboard doanh thu đọc ledger, không đọc Payment.
5. UI tiếng Việt, pattern features/ hiện có.

## E. Smoke E2E — kịch bản demo buổi bảo vệ 1 ("vòng tiền hoàn chỉnh")
Seed/reset dữ liệu demo trước (t6). Các bước:
1. **Nạp ví:** khách A nạp 500k qua mock gateway → số dư 500k, ledger TOPUP hiện lịch sử.
2. **Áp mã tại checkout:** đặt sân giờ thấp điểm, áp voucher PERCENT → giá giảm ngay trên màn hình.
3. **Trả tiền:** thanh toán (ví hoặc VNPay-mock) → đơn CONFIRMED, ví trừ đúng finalAmount snapshot.
4. **Mưa — hủy hàng loạt:** owner hủy cả ngày mưa (policy WEATHER 100%) → tiền về ví khách A tức thì (+chuông thông báo).
5. **Kiểm chứng sau demo:** ledger A = TOPUP(+500k) − PAYMENT(finalAmount) + REFUND(deposit); Payment REFUND tồn tại làm chứng từ; không dòng ledger trùng.

## F. Tiêu chí chốt PASS sprint
A1–A5 pass + SEC-S0-01/02 pass + C1–C4 không regression + E chạy trơn 2 lần liên tiếp (reset seed giữa 2 lần) → báo captain mở t11 hoàn tất, reviewer nhận t12.