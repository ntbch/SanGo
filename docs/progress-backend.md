# SANGO BACKEND RE-ENGINEERING REPORT

**Ngày thực hiện:** 26/08/2026  
**Người thực hiện:** Senior Developer — Backend  
**Phạm vi:** `apps/api/**`, `packages/shared/**`, `apps/api/prisma/schema.prisma`  
**Trạng thái Build:** ✅ **PASS 100%** (tsc -p tsconfig.build.json không có lỗi).

---

## 1. TỔNG HỢP CÁC THAY ĐỔI THEO TỪNG PHẦN

### 🔹 Packages/Shared (`packages/shared/src/index.ts`)
- Bổ sung các Enum & Type dùng chung:
  - `MatchStatus`: `OPEN`, `FULL`, `COMPLETED` (dùng cho filter & status tag của kèo).
  - `MatchLevel`: `FRIENDLY` (Giao lưu), `CASUAL` (Vui vẻ), `SCRIM` (Cọ xát), `SEMI_PRO` (Bán chuyên) kèm map nhãn tiếng Việt `MATCH_LEVEL_LABELS`.
  - `PreferredFoot`: `LEFT`, `RIGHT`, `BOTH` kèm map nhãn `PREFERRED_FOOT_LABELS`.
  - `SportTypeGroup`: `FOOTBALL` (gộp `FOOTBALL5`, `FOOTBALL7`), `PICKLEBALL`, `BADMINTON`, `TENNIS` kèm hàm mapping `sportTypeToGroup()`.
  - `MatchJoinRequestStatus`: `PENDING`, `APPROVED`, `REJECTED`.
  - `FundDriveScope`: `MONTHLY`, `MATCH`.
  - `FundDriveStatus`: `ACTIVE`, `CLOSED`.
  - `TeamFundEntryType`: `INCOME`, `EXPENSE`.
  - Mở rộng `NotificationType`: thêm `MATCH_REQUEST`, `FUND_DRIVE`.

---

### 🔹 Prisma Schema (`apps/api/prisma/schema.prisma`)
1. **User**:
   - Thêm hồ sơ thể thao & tài khoản: `bannerUrl`, `bio`, `favoriteSports` (mảng SportType), `preferredPositions` (mảng string), `preferredFoot` (PreferredFoot), `selfLevel` (MatchLevel), `bankName`, `bankAccountNumber`, `bankAccountName`, `notifyEmail` (Boolean), `notifyInApp` (Boolean).
2. **Booking**:
   - Thêm các trường cho Matchmaking Hub (P6): `matchLevel` (MatchLevel), `targetPositions` (String[]), `costPerPerson` (Int).
3. **P5 Team Treasury Models**:
   - `FundDrive`: Đợt thu quỹ (title, scope, targetAmount, amountPerMember, status, bookingId, deadline).
   - `FundContribution`: Bản ghi đóng quỹ thành viên (fundDriveId, userId, amount, paidAt, note).
   - `TeamExpense`: Nhật ký thu - chi quỹ đội (type: INCOME/EXPENSE, amount, reason, receiptUrl, recordedBy, occurredAt).
4. **P6 Matchmaking Models**:
   - `MatchJoinRequest`: Yêu cầu tham gia kèo (bookingId, userId, position, message, status: PENDING/APPROVED/REJECTED, UNIQUE(bookingId, userId)).
   - `MatchComment`: Bình luận thảo luận trong kèo (bookingId, userId, content, createdAt).

---

### 🔹 P1: Sửa Lỗi Core Flow (Giữ Chỗ, Thanh Toán, Hủy Đơn)
1. **CreateHold (`apps/api/src/bookings/dto/booking.dto.ts`)**:
   - Chuẩn hoá validation: `date` regex YYYY-MM-DD, `slots` mảng phút bắt đầu (0..1439), `courtId` UUID, `slotsNeeded` (1..10) bắt buộc khi `isPublicMatch: true`.
   - Bổ sung tùy chọn tạo kèo mở ngay lúc đặt: `matchLevel`, `targetPositions`, `costPerPerson`.
   - Giữ mã lỗi cụ thể (`COURT_NOT_FOUND`, `COURT_MAINTENANCE`, `VENUE_NOT_BOOKABLE`, `SLOTS_NOT_CONTIGUOUS`, `OUTSIDE_OPENING_HOURS`, `SLOT_TAKEN`, `HOLD_LIMIT`, `VOUCHER_EXHAUSTED`...).
2. **Hủy Đơn & Preview Hoàn Tiền (`apps/api/src/bookings/bookings.controller.ts`)**:
   - Bổ sung endpoint **`POST /api/v1/bookings/:id/cancel`** (bên cạnh `DELETE /api/v1/bookings/:id`) để frontend gọi đúng ngữ nghĩa RFC.
   - Endpoint **`GET /api/v1/bookings/:id/refund-preview`** xem trước mức hoàn theo chính sách: >24h hoàn 100%, 12–24h hoàn 50%, <12h không hoàn. Khi hủy, hoàn tiền tức thì vào Ví cá nhân (`WalletLedger` type `REFUND`).
3. **Thanh Toán Mock Đồng Bộ (`apps/api/src/payments/payments.controller.ts` & `payments.service.ts`)**:
   - Bổ sung **`POST /api/v1/payments/mock/confirm`** nhận `{ txnRef: string, amount?: number }` → xử lý callback nội bộ đồng bộ và trả về JSON `{ success: true, txnRef, bookingCode, type }` giúp Frontend modal thanh toán xử lý mượt mà và redirect sang `/thanh-toan/ket-qua?txnRef=...`.

---

### 🔹 P5: Team Treasury (Quỹ Đội)
- File: `apps/api/src/teams/teams.controller.ts`, `teams.service.ts`, `teams.module.ts`, `teams/dto/team.dto.ts`
- Module wiring: `TeamsModule` kết nối trực tiếp với `WalletsModule` để thực hiện trừ ví cá nhân (`wallets.debit`) khi đóng quỹ.
- **5 Tính năng hoàn thiện**:
  1. `GET /api/v1/teams/:id/treasury`: Tổng quan quỹ đội (số dư hiện tại, tổng thu/chi tháng này, danh sách đợt thu đang mở).
  2. `POST /api/v1/teams/:id/fund-drives`: Đội trưởng tạo đợt thu quỹ theo tháng (`MONTHLY`) hoặc theo trận (`MATCH`).
  3. `POST /api/v1/teams/:id/fund-drives/:driveId/contribute`: Thành viên đóng quỹ → **trừ tiền ví cá nhân** trong transaction, ghi nhận `WalletLedger` (type `PAYMENT`, refType `FUND_CONTRIBUTION`).
  4. `GET /api/v1/teams/:id/fund-expenses`: Xem danh sách nhật ký thu - chi kèm link ảnh hóa đơn/chứng từ.
  5. `POST /api/v1/teams/:id/fund-expenses`: Ghi nhận khoản thu/chi quỹ mới kèm ảnh hóa đơn (`receiptUrl`).
  6. Split Bill đơn đặt sân (`POST /api/v1/teams/:id/expenses/split-booking`): Chia đều tiền sân đã trả cho các thành viên tham gia.

---

### 🔹 P6: Matchmaking Hub (Ghép Trận Mở)
- File: `apps/api/src/matches/matches.controller.ts`, `matches.service.ts`, `matches/dto/open-match.dto.ts`
- **Tính năng hoàn thiện**:
  1. `GET /api/v1/matches/open`: Tìm kiếm kèo mở với bộ lọc đa năng: `sportType`, `sportGroup` (FOOTBALL gộp sân 5 + sân 7), `city`, `district`, `level` (FRIENDLY/CASUAL/SCRIM/SEMI_PRO), `fromMinute`, `toMinute`, `date`, phân trang `page` & `limit`.
  2. `GET /api/v1/matches/:id`: Chi tiết kèo ghép trận, thông tin host, sân bãi, slot còn thiếu, vị trí cần tuyển (`targetPositions`), chi phí dự kiến/người (`costPerPerson`), danh sách người đã tham gia.
  3. `POST /api/v1/matches/:id/requests`: Gửi yêu cầu xin tham gia kèo (chọn vị trí mong muốn, lời nhắn).
  4. `GET /api/v1/matches/:id/requests`: Chủ kèo xem danh sách yêu cầu xin vào kèm thông tin trình độ của người gửi.
  5. `PATCH /api/v1/matches/:id/requests/:requestId`: Chủ kèo duyệt (`APPROVED` → tự động thêm vào `MatchParticipant`, cập nhật cờ `matchFull`) hoặc từ chối (`REJECTED`).
  6. `GET /api/v1/matches/:id/comments` & `POST /api/v1/matches/:id/comments`: Hệ thống bình luận, thảo luận trực tiếp trong trang kèo.

---

### 🔹 P7: User Profile & Cài Đặt Thể Thao
- File: `apps/api/src/users/users.controller.ts`, `users/dto/user.dto.ts`, `apps/api/src/auth/auth.service.ts`
- **Tính năng hoàn thiện**:
  1. `GET /api/v1/users/me` & `PATCH /api/v1/users/me`: Lấy và cập nhật đầy đủ hồ sơ thể thao:
     - Header/Visual: `avatarUrl`, `bannerUrl`, `fullName`, `phone`, `bio`.
     - Hồ sơ kỹ năng: `favoriteSports` (danh sách môn), `preferredPositions` (vị trí sở trường), `preferredFoot` (`LEFT`/`RIGHT`/`BOTH`), `selfLevel` (`FRIENDLY`/`CASUAL`/`SCRIM`/`SEMI_PRO`).
     - Hoàn tiền & Ngân hàng: `bankName`, `bankAccountNumber`, `bankAccountName`.
     - Cài đặt thông báo: `notifyEmail` (boolean), `notifyInApp` (boolean).
  2. Đổi mật khẩu: Đã có sẵn tại **`POST /api/v1/auth/change-password`** (`oldPassword`, `newPassword`).

---

## 2. CHI TIẾT API CONTRACT CHO FRONTEND

| Nhóm | Method | Đường dẫn | Body / Query Params | Response Shape |
| :--- | :--- | :--- | :--- | :--- |
| **Bookings** | `POST` | `/api/v1/bookings/holds` | `{ courtId, date, slots: number[], isPublicMatch?, slotsNeeded?, matchLevel?, targetPositions?, costPerPerson? }` | `{ id, courtId, date, startMinute, endMinute, subtotal, expiresAt, status }` |
| | `GET` | `/api/v1/bookings/:id/refund-preview` | N/A | `{ bookingId, depositAmount, hoursUntilPlay, percent, refundAmount }` |
| | `POST` | `/api/v1/bookings/:id/cancel` | `{ reason?: string }` | `{ booking, refundPercent, refundAmount, refundPaymentId }` |
| **Payments** | `POST` | `/api/v1/payments/mock/confirm` | `{ txnRef: string, amount?: number }` | `{ success: true, txnRef: string, bookingCode?: string, type?: string }` |
| **Treasury** | `GET` | `/api/v1/teams/:id/treasury` | N/A | `{ balance: number, monthIncome: number, monthExpense: number, totalIncome: number, totalExpense: number, activeDrives: Array<{ id, title, description, scope, targetAmount, amountPerMember, status, deadline, contributionsCount, myContribution }> }` |
| | `POST` | `/api/v1/teams/:id/fund-drives` | `{ title, description?, scope: 'MONTHLY'|'MATCH', targetAmount, amountPerMember, bookingId?, deadline? }` | `FundDrive object` |
| | `POST` | `/api/v1/teams/:id/fund-drives/:driveId/contribute` | `{ amount: number, note?: string }` | `FundContribution object` (trừ tiền ví thành công) |
| | `GET` | `/api/v1/teams/:id/fund-expenses` | N/A | `Array<{ id, type, amount, reason, receiptUrl, occurredAt, recorder: { id, fullName, avatarUrl } }>` |
| | `POST` | `/api/v1/teams/:id/fund-expenses` | `{ type: 'INCOME'|'EXPENSE', amount, reason, receiptUrl?, occurredAt? }` | `TeamExpense object` |
| **Matches** | `GET` | `/api/v1/matches/open` | Query: `sportType?, sportGroup?, city?, district?, level?, fromMinute?, toMinute?, date?, page?, limit?` | `{ items: Array<{ bookingId, code, courtName, sportType, venue, date, startMinute, endMinute, subtotal, depositAmount, costPerPerson, matchLevel, targetPositions, host, slotsNeeded, joinedCount, commentsCount }>, total, page, limit, pages }` |
| | `GET` | `/api/v1/matches/:id` | N/A | `{ bookingId, code, status: 'OPEN'|'FULL'|'COMPLETED', date, startMinute, endMinute, subtotal, depositAmount, costPerPerson, matchLevel, targetPositions, slotsNeeded, joinedCount, court, host, participants, myJoinRequest, isHost }` |
| | `POST` | `/api/v1/matches/:id/requests` | `{ position?: string, message?: string }` | `MatchJoinRequest object` |
| | `GET` | `/api/v1/matches/:id/requests` | N/A | `Array<MatchJoinRequest & { user: { id, fullName, avatarUrl, preferredPositions, selfLevel } }>` |
| | `PATCH` | `/api/v1/matches/:id/requests/:requestId` | `{ status: 'APPROVED' | 'REJECTED' }` | `MatchJoinRequest object` |
| | `GET` | `/api/v1/matches/:id/comments` | N/A | `Array<{ id, content, createdAt, user: { id, fullName, avatarUrl } }>` |
| | `POST` | `/api/v1/matches/:id/comments` | `{ content: string }` | `MatchComment object` |
| **Users** | `GET` | `/api/v1/users/me` | N/A | `{ user: SafeUser }` |
| | `PATCH` | `/api/v1/users/me` | `{ fullName?, phone?, avatarUrl?, bannerUrl?, bio?, favoriteSports?, preferredPositions?, preferredFoot?, selfLevel?, bankName?, bankAccountNumber?, bankAccountName?, notifyEmail?, notifyInApp? }` | `{ user: SafeUser }` |

---

## 3. QUYẾT ĐỊNH THIẾT KẾ & XỬ LÝ CHỖ MƠ HỒ
1. **Trừ ví khi đóng quỹ đội (P5)**:
   - Thay vì chỉ ghi nhận công nợ trên giấy, hàm `contributeFund()` gọi trực tiếp `walletsService.debit()` trong transaction. Nếu số dư ví của thành viên không đủ, API trả mã lỗi `WALLET_INSUFFICIENT_FUNDS` (409) và tự động huỷ bản ghi đóng quỹ.
2. **Kèo ghép trận (P6) & Đơn đặt sân (P1)**:
   - Các thông tin bổ sung như `matchLevel`, `targetPositions`, `costPerPerson` được tích hợp vào `BookingHold` và chuyển sang `Booking` khi thanh toán thành công.
   - Luồng duyệt thành viên: khi chủ kèo duyệt `APPROVED` một `MatchJoinRequest`, hệ thống tự động ghi bản ghi vào `MatchParticipant` và nếu số người đạt `slotsNeeded`, cờ `matchFull` sẽ tự chuyển thành `true`.
3. **Mã lỗi nhất quán cho Frontend toast**:
   - Tất cả các Exception trả về đều có payload chuẩn: `{ message: string, code: string }` giúp Frontend hiển thị Toast thông báo lỗi trực quan.

---

## 4. LỆNH MIGRATION ĐỀ XUẤT CHO DATABASE
Khi DB sẵn sàng, chạy lệnh migration sau:
```bash
pnpm --filter api exec prisma migrate dev --name add_treasury_matchmaking_user_profile
```

---

## 5. BẰNG CHỨNG BUILD
```bash
$ pnpm --filter api exec prisma generate
✔ Generated Prisma Client (v6.19.3) in 165ms

$ pnpm --filter api build
$ tsc -p tsconfig.build.json
# Build thành công 100%, 0 errors, 0 warnings.
```

---

## 6. VIỆC TỒN ĐỌNG / LƯU Ý
- DB migrations thực tế cần được chạy trên môi trường có PostgreSQL live.
- Frontend có thể kết nối ngay với các endpoint mới theo đúng schema được mô tả ở trên.

---

## 7. CẬP NHẬT ĐỒNG BỘ KHỚP CHÍNH XÁC VỚI FRONTEND (FINAL ALIGNMENT)

1. **`POST /api/v1/teams/:id/treasury/contribute`**:
   - Request Body: `{ amount: number, note?: string }`
   - Xử lý: Trừ ví cá nhân qua `WalletsService.debit`, ghi nhận nguồn thu vào quỹ đội.
   - Response Shape: `{ success: true, newBalance: number, log: TeamFundLog }`

2. **`POST /api/v1/teams/:id/treasury/expense`**:
   - Request Body: `{ title: string, amount: number, billImageUrl?: string }`
   - Xử lý: Đội trưởng ghi khoản chi quỹ kèm link ảnh hóa đơn.
   - Response Shape: `{ id, teamId, type: 'EXPENSE', title, amount, creatorName, billImageUrl, createdAt }`

3. **`POST /api/v1/teams/:id/expenses/split-booking`**:
   - Request Body: `{ bookingId: string, memberIds: string[], note?: string }`
   - Xử lý: Chia đều tiền sân cho các thành viên được chọn.

4. **`GET /api/v1/teams/:id/expenses`**:
   - Response Shape: `{ treasuryBalance: number, monthlyIncome: number, monthlyExpense: number, totalUnpaid: number, myOwed: number, myReceivable: number, shares: ExpenseShareItem[], fundLogs: TeamFundLog[] }`

5. **`GET /api/v1/matches/open`**:
   - Query: `sportType?`, `date?`, `sportGroup?`, `city?`, `district?`, `level?`, `fromMinute?`, `toMinute?`, `page?`, `limit?`

6. **`POST /api/v1/bookings/:id/join`** & **`DELETE /api/v1/bookings/:id/join`**:
   - Đã khớp 100% logic tham gia và rời kèo ghép trận mở.

7. **`GET /api/v1/venues/map`**:
   - Query: `bbox=minLat,minLng,maxLat,maxLng`, `sportType?`, `q?`, `limit?`
   - Response Shape: `{ items: MapVenueItem[], total: number, bounds: { minLat, minLng, maxLat, maxLng } }`

8. **Mã lỗi giữ chỗ**:
   - Bảo đảm đầy đủ các mã: `HOLD_EXPIRED`, `SLOT_TAKEN`, `HOLD_LIMIT`, `SLOTS_NOT_CONTIGUOUS`, `COURT_MAINTENANCE`, `VENUE_NOT_BOOKABLE`, `OUTSIDE_OPENING_HOURS`.

