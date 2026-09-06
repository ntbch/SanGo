# Báo cáo sẵn sàng Production — SanGo (2026-08-30)

Phạm vi: loại bỏ toàn bộ mock-data runtime, sửa các phát hiện của `flow-audit-2026-08-30.md`, đối chiếu contract Backend↔Frontend, hoàn thiện cấu hình deploy.
Kết quả verify: **shared build ✓ · api build ✓ · api test 35/35 suites, 248/248 tests ✓ · web build ✓**.
Cập nhật đợt 5-gap (2026-08-30, chi tiết §8): **api test 272/272 (35 suites) ✓ · web build ✓ · prisma validate ✓**.

## 1. Fix theo audit (backend — có test bảo chứng)

| Mục | File:line | Nội dung |
|-----|-----------|----------|
| M1 HIGH | `apps/api/src/matches/matches.service.ts:292-296` | `reviewJoinRequest`: thêm `SELECT ... FOR UPDATE` khoá dòng booking + đọc lại `slotsNeeded` trong tx + bắt P2002 → 409 `ALREADY_JOINED`. Hai duyệt song song không còn thể vượt số chỗ. |
| M2 MED-HIGH | `apps/api/src/teams/teams.service.ts:684-770`, `wallets.service.ts:77` | `WalletsService.applyInTx()` chuyển sang public; đóng quỹ (`contributeFund`/`contributeDirect`) ghi ledger + tạo bản ghi trong **cùng 1 transaction** — hết lệch sổ khi crash. |
| M3 MED | `apps/api/src/payments/payments.service.ts:423-433` | Mock callback: `amount` là **bắt buộc** (thiếu/rỗng/sai → 400 `PAYMENT_AMOUNT_MISMATCH`), đồng bộ chuẩn với wallets topup. |
| M4 MED | `apps/api/src/teams/service.ts` (hunk split @356) | Chống double-split bill khi 2 request song song (recheck khoá trong tx). |
| M5 LOW | `apps/api/src/bookings/bookings.service.ts:132+` | Giới hạn 1 hold/user chuyển vào trong transaction. |
| M6 LOW | `apps/api/src/matches/matches.service.ts:210-226` | Validate `position ∈ targetPositions` khi xin vào kèo (400 `POSITION_NOT_ALLOWED`). |
| M7 LOW | `apps/api/src/bookings/bookings.service.ts:1171+` | `leaveOpenMatch` gộp delete participant + update cờ vào 1 tx. |

Còn mở (cần quyết định nghiệp vụ, chưa sửa): **O1** (2 đường join kèo song song), **O2** (2 chuỗi ghi đóng quỹ) — **ĐÃ XỬ LÝ trong đợt 5-gap 2026-08-30 (§8.1): O1 chốt DIRECT/409 qua `Booking.requiresApproval`; O2 giữ 2 model + chuẩn hoá `getTreasuryOverview`.**

## 2. Tắt đường mock khi chạy thật

### Backend
- `payments.service.ts:48-54` + `wallets.service.ts:63-69` — `resolveMode()` mới:
  - `NODE_ENV=production` → mặc định **vnpay**; chỉ quay lại mock khi `PAYMENT_MODE=mock` opt-in tường minh.
  - Local dev giữ hành vi cũ (không set = mock).
  - Hệ quả: ở prod, route `GET /payments/mock/callback` và `POST /payments/mock/confirm` tự 403 (`PAYMENT_MOCK_DISABLED`).
- `prisma/seed.ts` chỉ chạy bằng lệnh tay, không nằm trong startCommand prod.

### Frontend (apps/web)
| File | Trước | Sau |
|------|-------|-----|
| `features/venues/api/venue-services-api.ts` | catch → trả 5 item menu giả | trả `[]` (render rỗng thật) |
| `features/home/components/home-matches-feed.tsx` | mảng `OPEN_MATCHES` cứng 3 kèo | gọi `GET /matches/open` thật + skeleton loading + empty state, nút "Tham gia kèo" dẫn `/matches/:id` |
| `features/notifications/store/notifications-store.ts` | `INITIAL_NOTIFICATIONS` 5 thông báo giả + localStorage persist | gọi `GET /notifications` thật, mapper type BE→FE (`BOOKING_CONFIRMED…→BOOKING`…), `markAsRead`/`markAllAsRead` gọi `POST :id/read`/`read-all`, loading state. `deleteNotification`/`clearAll` chỉ là view-state (BE chưa có endpoint xoá). |
| `features/teams/pages/team-detail-page.tsx` | split bill cứng `bookingId: 'b-mock-1'`, mã đơn mặc định `SG-20260828-001` | dùng mã đơn người dùng nhập thật, validate rỗng |
- `VITE_USE_MOCK`: **không còn tham chiếu nào trong src/** (chỉ còn dòng mẫu trong `.env.example`) — FE luôn đi API thật.
- Tests backend giữ nguyên jest-mock (hợp lệ, không phải runtime mock).

## 3. Đối chiếu contract Backend↔Frontend

Phương pháp: trích toàn bộ endpoint từ controller decorators (~100 route) và 74 pattern gọi `apiClient` của FE, so khớp path/method.

### Lệch đã phát hiện & sửa (FE sẽ 404 thật khi chạy)
| FE gọi | BE thực tế | Sửa |
|--------|-----------|-----|
| `GET /auth/me` (`lib/auth-store.ts:101`) | `GET /users/me` trả `{ user }` | → `GET /users/me` + unwrap `.user` |
| `PUT /auth/profile` (`auth-api.ts:75`) | `PATCH /users/me` (UpdateProfileDto) | → `PATCH /users/me` + unwrap `.user` |
| `PATCH /courts/:id/maintenance` (`admin-api.ts:340`) | `PUT /courts/:id` nhận `status: ACTIVE\|MAINTENANCE` | → `PUT /courts/:id` `{ status }` |
| FE đọc `hostName` thiếu field | BE trả `host.fullName` | `matches-api.ts:95` ưu tiên `host.fullName` |
| Trang kết quả thanh toán thiếu mã đơn | BE redirect kèm `code` | `payment-result-page.tsx` hiển thị `bookingCode` |

### Khớp (đã verify trực tiếp)
Auth (register/login/refresh/logout/forgot/reset/change-password), users, venues/courts/pricing, bookings (holds/slots/check-in/join/cancel/refund-preview), payments checkout + vnpay callback, wallet (topup/me), matches (open/requests/comments/score), teams (đủ treasury/fund-expenses/split), vouchers, venue-services + addons, tournaments (register/start/score), ranking (clubs/athletes), AI (chat/hold/suggested-slots), notifications (list/unread-count/read-all/:id/read), admin.

### Ghi chú
- `POST /payments/mock/confirm` FE vẫn export hàm gọi nhưng **không trang nào dùng** — chỉ có tác dụng ở chế độ mock local; prod sẽ 403 an toàn.
- Response list của BE luôn bọc `{ items, ... }` — các trang đã unwrap đúng.

## 4. Verify đã chạy (bằng chứng)

| Lệnh | Kết quả |
|------|---------|
| `pnpm --filter @sango/shared build` | exit 0 |
| `pnpm --filter @sango/api build` | exit 0 |
| `pnpm --filter @sango/api test` | **35/35 suites, 248/248 tests pass** (23.1s) |
| `pnpm --filter @sango/web build` | ✓ built (2.73s) sau các fix contract |

## 5. render.yaml — đã bổ sung service web

- `sango-api` (web service, node) — có sẵn, `prisma migrate deploy` nối cuối buildCommand (free tier).
- `sango-web` (static site) — **mới**: build shared+web, publish `apps/web/dist`, rewrite `/* → /index.html` cho React Router, biến `VITE_API_URL`.

## 6. Checklist env var cần set trên Render dashboard (KHÔNG chứa secret thật)

**sango-api:**
| Biến | Giá trị đề xuất |
|------|-----------------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Postgres prod (Render DB / Neon) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | random ≥ 32 ký tự, 2 giá trị khác nhau |
| `PAYMENT_MODE` | **để trống** (prod tự chọn vnpay). Chỉ set `mock` nếu muốn demo không tiền thật |
| `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` | từ cổng VNPay (sandbox hoặc merchant thật) |
| `VNPAY_RETURN_URL` | `https://<api-url>/api/v1/payments/vnpay/callback` |
| `VNPAY_REFUND_ENABLED` | **mặc định OFF** — bật mới gọi refund qua VNPay DR API; thiếu flag/refund fail → giữ hành vi credit ví nội bộ + `Payment(REFUND)` PENDING đối soát |
| `VNPAY_API_USER` | tài khoản API merchant VNPay cho lệnh refund (DR) |
| `VNPAY_API_PASSWORD` | mật khẩu API merchant VNPay cho lệnh refund (DR) |
| `FRONTEND_URL` | `https://<web-url>` (dùng tạo link redirect sau callback) |
| `CORS_ORIGIN` | `https://<web-url>` |
| `COOKIE_SECURE` | `true` (HTTPS) |
| `RESEND_API_KEY`/`EMAIL_FROM` hoặc `SMTP_*` | email notification |
| `CLOUDINARY_CLOUD_NAME`/`API_KEY`/`API_SECRET` | upload ảnh |
| `LLM_PROVIDER`/`GEMINI_API_KEY` | AI assistant (không có thì dùng fallback rule-based) |

**sango-web:** `VITE_API_URL` = `https://<api-url>/api/v1` — lưu ý VITE_* bị nướng vào bundle lúc build, đổi URL phải rebuild.

## 7. Việc user phải tự làm để go-live
1. Tạo dịch vụ Postgres (Render DB free/Neon), lấy `DATABASE_URL`.
2. Đăng ký VNPay sandbox → `VNPAY_TMN_CODE` + `VNPAY_HASH_SECRET` (muốn tiền thật cần merchant).
3. Push code lên GitHub → Render → **New Blueprint** trỏ repo (render.yaml sẽ tạo cả 2 service) → điền env var theo mục 6.
4. Sau deploy: mở `https://<api-url>/api/v1/health` phải 200; nếu cần dữ liệu mẫu, chạy seed 1 lần bằng tay.
5. Smoke test luồng thật: đăng ký → đăng nhập → tạo hold → checkout (VNPay sandbox) → redirect về trang kết quả có mã đơn → kiểm ví/treasury → notifications.
6. Lưu ý free tier: service ngủ sau 15 phút im lặng (cold start ~30-60s); nâng plan thì chuyển `migrate deploy` sang `preDeployCommand` (mẫu có sẵn trong render.yaml).

## 8. Đợt 5-gap 2026-08-30 — Phase 1/2/3/4/5a/5b + HOLD-FIX + FE-wiring + FIX F1/F2 — ĐÃ XỬ LÝ

Chuỗi 5-gap đóng bởi 3 đội kế tiếp (Phase 1/2/4 + PAY-5 đội trước; Phase 5a → 3+5b → HOLD-FIX → FE-wiring → FIX F1/F2 → DR repair đội này), tất cả pass review, làm trong working tree **chưa commit**. Gate cuối t9: **api test 272/272 (35 suites) ✓ · web build ✓ (4.64s) · prisma validate ✓**.

### 8.1 Gap đã xử lý (kèm file chính)

| Mục | Trạng thái | File chính |
|-----|-----------|-----------|
| Phase 1 — Chia tiền | ✅ ĐÃ XỬ LÝ | `teams.service.ts` (applyInTx public, chia tiền trong tx), `teams.controller.ts`, FE `team-split-tab.tsx` + `teams-api.ts`, test `teams.integration.spec.ts` (+217) |
| PAY-5 test + Phase 2 — Topup VNPay | ✅ ĐÃ XỬ LÝ | `wallets.service.ts` (tạo URL VNPay + callback verify chữ ký), `wallets.controller.ts`, FE `wallet-page.tsx`, test `wallets.integration.spec.ts` (+201, VNPay-1..7) |
| Phase 4 — Realtime @Injectable | ✅ ĐÃ XỬ LÝ | `realtime.gateway.ts` + `realtime.module.ts` (mới, 190 dòng), `notify.service.ts` phát event, FE `lib/socket.ts` (mới, 91 dòng) |
| Phase 5a — Booking.requiresApproval | ✅ ĐÃ XỬ LÝ | migration `20260830160000_add_booking_requires_approval` (nullable), `schema.prisma:399`, FE `matches-api.ts` (OpenMatch.requiresApproval) |
| Phase 3+5b — Refund VNPay (flag off) + O1 join gate | ✅ ĐÃ XỬ LÝ | `vnpay-refund.service.ts` (mới, 183 dòng; DR payload theo spec VNPay: vnp_TransactionType '02', vnp_CreateBy, signData 13 thành phần; fallback DR fail → MOCK), `dto/create-booking.dto.ts`, join gate 409 `APPROVAL_REQUIRED` (`matches.service.ts`), `.env.example` |
| HOLD-FIX — BookingHold.requiresApproval | ✅ ĐÃ XỬ LÝ | migration `20260830183000_add_booking_hold_requires_approval`, `schema.prisma:364`, `bookings.service.ts` confirm truyền opts theo hold |
| FE-wiring — toggle + 409 UX (P5a.3) | ✅ ĐÃ XỬ LÝ | `booking-api.ts` + `booking-calendar-page.tsx` (toggle "Duyệt thành viên trước"), `match-detail-page.tsx` (bắt 409 APPROVAL_REQUIRED → dẫn tới form join-request), `match-card.tsx` (badge "Cần duyệt" chỉ khi === true) |
| FIX F1 — test DB pollution | ✅ ĐÃ XỬ LÝ | `notifications-flows.integration.spec.ts` (afterAll prefix `itflow-`, xoá con-trước-cha đúng FK), `reputation.integration.spec.ts` (assertion tương đối trong tập test) |
| FIX F2 — vnpay ResponseCode hardening | ✅ ĐÃ XỬ LÝ | `wallets.service.ts:293-296` — chỉ `vnp_ResponseCode === '00'` mới credit + PAID; test VNPay-7 phủ nhánh thiếu field |
| O1 — 2 đường join kèo (chốt) | ✅ ĐÃ XỬ LÝ | kèo cũ `requiresApproval = null` coi là DIRECT, chỉ `true` mới 409 — kết hợp Phase 3+5b + HOLD-FIX ở trên |
| O2 — 2 chuỗi ghi quỹ (chốt) | ✅ ĐÃ XỬ LÝ | giữ `FundContribution` (schema.prisma:842) + `TeamExpense` (schema.prisma:859); `getTreasuryOverview` (`teams.controller.ts:163`) là nguồn số liệu duy nhất; audit trail ghi ở `plan-5-gaps-2026-08-30.md` §O2 |

DR repair (round 2): payload refund DR sửa theo docs chính thức VNPay sandbox — vnp_TransactionType '02', vnp_CreateBy, signData 13 thành phần đúng thứ tự (TransactionNo rỗng vẫn giữ vị trí checksum); fallback DR fail → method MOCK + rawPayload `{drFail:true}`. Bulk consistency refund (low) — informational, quyết định: ghi nhận, chưa sửa.

### 8.2 Known-limits (phase sau)

- wallet:updated FE hiện broadcast window event sango:wallet:updated (lib/socket.ts) chưa có listener — nối vào use-wallet/wallet page phase sau bằng 1 dòng addEventListener + refetch (REST vẫn nguồn sự thật); match:comment realtime đã lược khỏi scope Phase 4.
- Toggle "Duyệt thành viên trước" hiển thị vô điều kiện trên booking-calendar trong khi form tạo kèo đầy đủ (isPublicMatch/matchLevel/…) chưa có — bật trên booking thường vô nghĩa; phase sau ẩn toggle trên booking thường hoặc đưa vào form tạo kèo.
- FE luôn gọi API thật; `POST /payments/mock/confirm` vẫn export nhưng không trang nào dùng (prod sẽ 403 an toàn).

### 8.3 Tổng kết git diff theo phase (working tree, chưa commit — so với HEAD)

Tổng: **43 file tracked (+2380/−419) + 10 file mới** (2 migration, dto, vnpay-refund, realtime gateway/module, socket.ts, 3 docs — ~724 dòng).

| Phase | Diffstat | Nội dung 1 dòng |
|-------|----------|-----------------|
| Audit gốc M1–M7 + contract FE | 9 file, +336/−245 | fix khoá tx/validate + các trang FE đi API thật (báo cáo §1–3) |
| Phase 1 — Chia tiền | 6 file, +551/−64 | teams service/controller + FE split-tab + teams integration test |
| PAY-5 + Phase 2 — Topup VNPay | 4 file, +450/−28 | wallets VNPay + callback chữ ký + wallet-page + test VNPay-1..7 |
| Phase 3+5b — Refund + O1 gate | 7 file + 2 mới, +634/−47 | vnpay-refund.service, dto, join gate 409, bookings integration test (+413) |
| Phase 4 — Realtime @Injectable | 4 file + 3 mới, +33/−3 | realtime gateway/module + socket.ts FE |
| Phase 5a — requiresApproval | 2 file + 2 mới, +12/−1 | migration nullable + schema + FE matches-api + plan-5-gaps doc |
| HOLD-FIX | +1 mới, ~7 dòng | migration BookingHold.requiresApproval (phần code gộp trong bookings.service/schema) |
| FE-wiring P5a.3 | 4 file, +152/−11 | toggle + 409 UX + badge "Cần duyệt" |
| FIX F1/F2 | 2 file + hardening, +45/−18 | pollution cleanup prefix-based + ResponseCode '00' hardening (gộp wallets.service) |
| Docs + hạ tầng | 5 file + 2 mới, +167/−2 | flow-audit + prod-readiness + render.yaml + lock/vite |

Chú ý: file đụng nhiều phase được tính nguyên file vào phase chủ đạo (`bookings.service.ts` +168/−32 gồm M5/M7 + O1 + HOLD-FIX + DR fallback; `teams.service.ts` +209/−59 gồm M2/M4 + Phase 1; `wallets.service.ts` +144/−16 gồm Phase 2 + FIX F2) — tổng khớp `git diff --shortstat`.

---
*Người thực hiện: 2 phiên Senior Developer (fix backend M1-M7 + sửa test; FE contract) + verify & bàn giao; đợt 5-gap đóng bởi 3 đội AgentTeams kế tiếp (Phase 1/2/4/PAY-5 → Phase 5a/3+5b/HOLD-FIX/FE-wiring/FIX F1+F2/DR repair → gate cuối t9). Chưa commit — kiểm tra `git diff` trước khi commit.*
