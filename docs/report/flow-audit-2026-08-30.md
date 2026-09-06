# Báo cáo ra soát các luồng — SanGo Backend (2026-08-30)

Phạm vi: `apps/api` (NestJS + Prisma + PostgreSQL). Audit chỉ đọc, không sửa code.
Phương pháp: mapping endpoint qua controller decorators, đọc đích các đoạn transaction/locking quan trọng.

## 1. Trạng thái tổng quan theo luồng

| # | Luồng | Trạng thái | Bằng chứng chính |
|---|-------|-----------|------------------|
| 1 | Booking & Hold chống double-booking | ✅ HOẠT ĐỘNG | `bookings.service.ts:134-195` (FOR UPDATE courts), `:286-399` (confirm re-check + code seq atomic), `:810-825` (cron expire/complete) |
| 2 | Checkout & Payment (VNPay/Mock) | ✅ HOẠT ĐỘNG | `payments.service.ts:308-396` (HMAC-SHA512 + idempotent), `:251-290` (ADD_ON FOR UPDATE + recheck), `:88-149` (voucher re-validate trước khi phát URL) |
| 3 | Matchmaking "Kèo Giao Lưu" | ⚠️ HOẠT ĐỘNG — có race ở luồng duyệt | `matches.service.ts:280-304` (thiếu row lock — xem M1), đối trọng tốt: `bookings.service.ts:1084-1123` |
| 4 | Team Treasury & Split Bill | ⚠️ HOẠT ĐỘNG — non-atomic ở đóng quỹ | `teams.service.ts:286-396` (split có recheck), `:686-708` + `:726-767` (compensation 2 bước — xem M2) |
| 5 | AI Booking Assistant | ✅ HOẠT ĐỘNG | `ai.controller.ts:23-99` (throttle 20/h, hold bắt buộc login), `agent-chat.service.ts:119-197` (fallback rule-based), tool-call DB thật |
| 6 | Auth & Phân quyền | ✅ HOẠT ĐỘNG | JwtAuthGuard + RolesGuard nhất quán (venues/courts/pricing OWNER+ADMIN, admin ADMIN-only, check-in `bookings.service.ts:943` owner/admin) |
| 7 | Notifications | ✅ HOẠT ĐỘNG | 12 điểm dispatch (booking/payment/match/voucher/reminder); reminder dùng atomic claim + nhả claim khi lỗi (`bookings.cron.service.ts:132-170`) |

## 2. Phát hiện (xếp theo severity)

### M1 — HIGH · Race khi duyệt join-request cho kèo ghép trận
- **File:** `apps/api/src/matches/matches.service.ts:280-304`
- **Vấn đề:** `reviewJoinRequest` đếm participant trong transaction nhưng **không khoá dòng booking** (không có `FOR UPDATE`). Hai approval song song khi còn đúng 1 chỗ đều đọc `currentParticipants = needed-1`, cùng pass check, cùng tạo participant → kèo thừa người.
- **Hệ quả:** vi phạm cam kết "vacancy tracking" của §3.11; participant > slotsNeeded.
- **Đề xuất:** thêm `SELECT id FROM "bookings" WHERE id = ... FOR UPDATE` đầu tx + recheck (sao chép đúng pattern đã có sẵn ở `bookings.service.ts:1085` `joinOpenMatch`).

### M2 — MEDIUM-HIGH · Đóng quỹ 2 bước không atomic
- **File:** `apps/api/src/teams/teams.service.ts:686-708` (contributeFund), `:726-767` (contributeDirect)
- **Vấn đề:** tạo bản ghi đóng quỹ → `wallets.debit()` ở transaction riêng → catch mới xoá bản ghi (compensation ngoài tx). Crash giữa debit và delete (hoặc delete fail) → lệch sổ: quỹ ghi nhận mà ví không trừ (hoặc ngược lại).
- **Đề xuất:** gộp 1 transaction duy nhất — expose `WalletsService.applyInTx()` để ghi ledger trong cùng tx với `fundContribution.create`/`teamExpense.create`.

### M3 — MEDIUM · Mock payment callback: đối chiếu số tiền là TUỲ CHỌN
- **File:** `apps/api/src/payments/payments.service.ts:421`
- **Vấn đề:** `if (params.amount !== undefined && Number(params.amount) !== expected)` — callback mock không truyền amount vẫn xác nhận đơn. Đối chiếu với wallets topup (`wallets.service.ts:168-177`) nơi amount **bắt buộc**, và với chính comment S0 của hàm này ("amount là BẮT BUỘC phải khớp").
- **Hệ quả:** thấp trong prod (route bị chặn khi PAYMENT_MODE≠mock) nhưng lệch chuẩn nội bộ; nếu demo env để mock mà lộ route là xác nhận được đơn không đúng tiền.
- **Đề xuất:** bắt buộc amount như wallets (copy block L168-177).

### M4 — MEDIUM · Double-split bill khi hai request song song
- **File:** `apps/api/src/teams/teams.service.ts:360-369`
- **Vấn đề:** recheck `expenseShare.findFirst` trong tx nhưng ở isolation mặc định (ReadCommitted) hai tx song song cùng thấy chưa chia → cả hai tạo shares.
- **Đề xuất:** khoá dòng booking trong tx, hoặc thêm UNIQUE partial index `(teamId, bookingId)` trên `ExpenseShare` (một booking chỉ chia 1 lần/đội).

### M5 — LOW · Giới hạn 1 hold/user check ngoài transaction
- **File:** `apps/api/src/bookings/bookings.service.ts:95-103`
- **Vấn đề:** count ACTIVE hold nằm trước `$transaction` — hai createHold song song của cùng user có thể tạo 2 holds.
- **Đề xuất:** chuyển check vào trong tx, hoặc unique partial index `userId WHERE status='ACTIVE'`.

### M6 — LOW · Join request không kiểm tra position theo targetPositions
- **File:** `apps/api/src/matches/matches.service.ts:221-235`
- **Vấn đề:** `dto.position ?? null` được chấp nhận bất kể kèo có `targetPositions` hay không — spec §3.11 có "position requirements (Goalkeeper, Forward…)".
- **Đề xuất:** nếu `booking.targetPositions` khác rỗng, yêu cầu position ∈ targetPositions (host vẫn có thể duyệt ngoại lệ nếu muốn).

### M7 — LOW · leaveOpenMatch cập nhật cờ matchFull ngoài transaction
- **File:** `apps/api/src/bookings/bookings.service.ts:1160-1172`
- **Vấn đề:** delete participant rồi update cờ ngoài tx — race nhẹ với approval chạy đồng thời. Ảnh hưởng thấp vì joinOpenMatch luôn recheck đếm fresh.

## 3. Quan sát kiến trúc (không phải lỗi)

- **O1 — Hai cơ chế join kèo song song:** `POST /bookings/:id/join` (tham gia trực tiếp, `bookings.service.ts:1056`) và `POST /matches/:id/requests` + duyệt (P6). Cần xác nhận chủ đích: nếu P6 là luồng chính thì luồng join trực tiếp nên bị chặn với kèo có approval, nếu không host sẽ thấy người vào mà không qua duyệt.
- **O2 — Hai chuỗi dữ liệu "đóng quỹ":** contributeFund ghi `FundContribution`, contributeDirect ghi `TeamExpense(INCOME)`. `getTreasuryOverview` (`teams.service.ts:551-591`) cộng cả hai nên không double-count, nhưng cùng một nghiệp vụ có 2 đường ghi khác nhau — khó audit về sau.

## 4. Điểm mạnh đáng ghi nhận (đã verify trong code)

- Chống double-booking thật sự ở DB: `FOR UPDATE` trên courts/bookings/wallet_balances, độc lập timing ứng dụng.
- Booking code cấp phát số thứ tự atomic qua `booking_code_seq` (`INSERT ... ON CONFLICT DO UPDATE RETURNING`) — chịu cả dữ liệu cũ không liền kề (fix 25P02).
- Idempotency payment 3 lớp: `isAlreadyPaid` + UNIQUE txnRef (P2002 xử lý như replay thành công) + recheck tổng paid trong tx cho ADD_ON.
- Wallet append-only ledger là nguồn sự thật, `UNIQUE(refType, refId, type)` chống hoàn kép; refund ghi sau commit, crash chỉ để Payment(REFUND) PENDING làm dấu đối soát.
- Voucher: `UPDATE ... WHERE usedCount < usageLimit` atomic + `UNIQUE(voucherId, userId)`; re-validate quota tại checkout trước khi phát URL thanh toán.
- Reminder cron dùng atomic claim (`updateMany WHERE cột = null`) — chịu nhiều instance, nhả claim khi gửi lỗi.
- AI: tool-call DB thật, thời gian ngân sách + fallback rule-based, `/ai/hold` bắt buộc đăng nhập và tái dùng đúng transaction giữ chỗ.

## 5. Cập nhật triển khai (2026-08-30, phiên buổi sáng)

Toàn bộ M1–M7 đã được implement trong working tree (chưa commit), kèm 2 thay đổi bonus:
- **M1** DONE — matches.service.ts: FOR UPDATE dòng booking + fresh re-read + P2002 guard trong reviewJoinRequest.
- **M2** DONE — teams.service.ts + wallets.service.ts: applyInTx() chuyển public; contributeFund/contributeDirect ghi quỹ + trừ ví trong MỘT transaction (bỏ compensation delete).
- **M3** DONE — payments.service.ts: cả hai đường mock (processMockCallback, handleMockCallback) bắt buộc amount.
- **M4** DONE — teams.service.ts:359: FOR UPDATE dòng booking trong splitBookingExpense.
- **M5** DONE — bookings.service.ts:135: khoá dòng user + đếm lại hold ACTIVE trong tx.
- **M6** DONE — matches.service.ts:213: validate position thuộc targetPositions khi kèo có yêu cầu.
- **M7** DONE — bookings.service.ts:1174: xoá participant + đồng bộ matchFull trong một tx có lock.
- Bonus 1: resolveMode() PROD-READY — NODE_ENV=production mặc định vnpay, mock phải opt-in tường minh (payments + wallets đồng bộ).
- Bonus 2: sửa 2 integration spec (weekday rule, host shape).

**Kết quả verify (11:16):**
- tsc --noEmit: PASS (0 lỗi).
- Jest toàn suite: 240/248 PASS lúc chưa có DB (8 fail notifications thuần môi trường). Sau khi bật Postgres: **35/35 suite, 248/248 test PASS** — integration assertions chạy thật trên DB (race double-booking, hold limit, treasury atomic, payment callback, wallet ledger).
- Vòng verify ĐÃ ĐÓNG: 2026-08-30 11:21, Postgres qua docker compose, prisma migrate deploy sạch (18 migrations, no pending).

## 6. Thứ tự xử lý đề xuất (bản gốc)

1. **M1** (row lock cho reviewJoinRequest) — 1 transaction, pattern đã có sẵn trong repo.
2. **M2** (atomic đóng quỹ) — chạm WalletsService public surface, cần test treasury.
3. **M3 + M4 + M5** — chỉnh nhỏ, mỗi mục < 30 phút.
4. **M6, M7, O1, O2** — quyết định nghiệp vụ rồi mới sửa.
