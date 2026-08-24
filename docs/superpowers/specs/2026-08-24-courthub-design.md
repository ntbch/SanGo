
# Đặc tả thiết kế — CourtHub
**Hệ thống đặt và quản lý sân thể thao trực tuyến** (đồ án tốt nghiệp)

- Ngày chốt: 2026-08-24
- Tên làm việc: **CourtHub** (có thể đổi trước khi nộp báo cáo)
- Thực hiện: 1 sinh viên + hỗ trợ AI · thời gian 6+ tháng · bảo vệ dự kiến ~2–3/2027

---

## 1. Bối cảnh & mục tiêu

Sân thể thao (bóng đá 5/7 người, pickleball, badminton, tennis) đang bùng nổ tại Việt Nam nhưng đa số chủ sân vẫn quản lý đặt sân qua điện thoại/Zalo/sổ tay: trùng lịch, mất đơn, không có số liệu doanh thu. CourtHub giải quyết trọn vẹn quy trình: khách tìm sân → chọn khung giờ trống → đặt cọc online → nhận mã check-in; chủ sân quản lý sân, bảng giá, đơn đặt và xem thống kê.

Mục tiêu chất lượng của đồ án: sản phẩm **deploy thật**, chỉn chu từ phân tích thiết kế đến triển khai, có điểm nhấn kỹ thuật (chống double-booking ở tầng DB) và điểm nhấn ứng dụng AI (trợ lý đặt sân tiếng Việt + gợi ý cá nhân hoá), kèm bộ tài liệu báo cáo được xây song song theo từng giai đoạn.

## 2. Vai trò người dùng (actors)

| Vai | Khả năng |
|---|---|
| **Khách hàng** | Tìm kiếm sân (loại/vị trí/giờ), xem lịch trống, đặt sân, thanh toán cọc/trả đủ, hủy đơn theo chính sách, xem lịch sử, đánh giá sân sau trận, dùng trợ lý AI |
| **Chủ sân (Owner)** | Đăng ký kinh doanh, quản lý cụm sân + sân con + bảng giá, xem đơn đặt, check-in khách bằng mã, đánh dấu no-show, dashboard thống kê |
| **Admin** | Duyệt/từ chối sân mới, quản lý người dùng (khóa/mở). Danh mục loại sân là enum cố định trong v1, không cần màn quản trị |

Khách chưa đăng nhập chỉ xem được thông tin sân; đặt sân bắt buộc đăng nhập.

## 3. Phạm vi tính năng

### Giai đoạn 1 — Lõi sản phẩm
1. **Xác thực**: đăng ký/đăng nhập email+mật khẩu; JWT access token (15 phút) + refresh token (7 ngày, xoay vòng, lưu cookie httpOnly); quên/đặt lại mật khẩu qua email.
2. **Quản lý sân**: cụm sân (Venue): ảnh (Cloudinary), địa chỉ + toạ độ hiển thị trên bản đồ Leaflet, giờ mở cửa thống nhất mỗi ngày, tiện ích; trạng thái `PENDING → APPROVED | REJECTED` — sân mới phải được admin duyệt mới công khai. Sân con (Court) theo loại sân, độ dài slot cấu hình (60'/90'), trạng thái bảo trì.
3. **Bảng giá**: giá mặc định theo slot cho từng sân con; các quy tắc ghi đè theo khung giờ trong ngày × loại ngày (ngày thường / cuối tuần T7–CN). Tiền lưu số nguyên VND.
4. **Đặt sân** ⭐:
   - Lịch tuần trực quan theo từng sân con; slot = còn trống / đã kín / đang giữ / quá hạn.
   - Chọn nhiều slot **liền kề** tạo thành 1 đơn (validate tính liền kề phía server).
   - **Giữ chỗ tạm (BookingHold) 10 phút** khi khách bước vào thanh toán; hết hạn tự nhả slot (cron mỗi phút).
   - **Chống double-booking bằng DB transaction + row-level lock** (chi tiết §6.1).
   - Giới hạn: tối đa 1 đơn đang chờ thanh toán trên mỗi người dùng (chống chiếm chỗ).
   - Mã đơn dạng `CH-YYYYMMDD-NNNN` + QR để check-in.
5. **Thanh toán**: cọc % do chủ sân cấu hình (mặc định 30%) hoặc trả đủ; cổng **VNPay sandbox**; callback verify chữ ký HMAC-SHA512 + đối chiếu số tiền + **idempotency qua `vnp_TxnRef` UNIQUE**. Có cờ môi trường `PAYMENT_MODE=mock` để demo dự phòng khi sandbox gặp sự cố.
6. **Hủy & hoàn cọc** (chính sách toàn hệ thống v1): >24h trước giờ chơi hoàn 100% số đã trả · 12–24h hoàn 50% · <12h không hoàn. Mọi thay đổi tiền ghi nhận là bản ghi Payment loại REFUND.
7. **Check-in & hoàn tất**: chủ sân quét/nhập mã → `CHECKED_IN`; đơn tự `COMPLETED` khi qua giờ kết thúc (cron); chủ sân có thể đánh dấu `NO_SHOW`.
8. **Đánh giá**: 1–5 sao + bình luận, chỉ người có đơn `COMPLETED`, mỗi đơn 1 đánh giá.
9. **Email thông báo** (Resend): xác nhận đơn, hủy đơn, nhắc trận trước 2h (cron).

### Giai đoạn 2 — Nâng cao & AI
10. **Dashboard chủ sân**: doanh thu + lượt đặt theo ngày/tuần/tháng (Chart.js), xếp hạng sân con chạy nhất, tỷ lệ hủy/no-show.
11. **Ghép trận mở (open match)**: khi đặt, chủ đơn chọn công khai "cần ghép X người"; người khác tham gia tới đủ; đầy thì khoá. Không kèm thanh toán phức tạp — người tham gia trả chủ đơn ngoài hệ thống (ghi rõ giới hạn này).
12. **AI-1 — Trợ lý đặt sân ngôn ngữ tự nhiên** ⭐: chat widget trong webapp; hiểu tiếng Việt tự nhiên, gọi 3 tool nội bộ `searchVenues` / `checkSlots` / `createHold`; mọi dữ liệu slot đều truy vấn DB thật (**tool-use chống ảo giác**); guardrail: không tự thanh toán, không tiết lộ dữ liệu người khác; cần đăng nhập để tạo giữ chỗ; giới hạn 20 tin nhắn/giờ/người; provider abstraction — mặc định Google Gemini (free tier) qua adapter dễ thay thế; khi API lỗi → phản hồi mượt "hệ thống gợi ý bận, thử lại" và tính năng thoái hoá an toàn.
13. **AI-2 — Gợi ý khung giờ phù hợp**: dải "Gợi ý cho bạn" trong màn chọn slot, suy ra từ lịch sử đặt của người dùng (histogram thứ + khung giờ); người mới chưa có lịch sử → giờ phổ biến nhất của sân đó. Thuần thống kê SQL aggregate, không tốn phí API, không thêm bảng mới.

### Chủ động loại khỏi phạm vi
Chat realtime giữa người dùng · app mobile native (web responsive phủ đủ) · ví nội bộ · dự báo nhu cầu/gợi ý giá động (AI-3) · thanh toán MoMo/ZaloPay thật (chỉ thiết kế gateway abstraction để mở rộng).

## 4. Kiến trúc

Monorepo **pnpm workspaces**:

```
courthub/
├── apps/
│   ├── web/    # React 18 + Vite + TS · Tailwind + shadcn/ui · TanStack Query
│   │           # React Router · react-hook-form + zod · Leaflet · Chart.js (GĐ2)
│   └── api/    # NestJS · Prisma · Swagger (/api/docs) · @nestjs/schedule
├── packages/shared/   # types + zod schemas dùng chung (enum trạng thái, DTO, helper tiền/giờ)
├── docker-compose.yml # Postgres 16 cho dev/test
└── .github/workflows/ci.yml
```

Modules backend: `auth` · `users` · `venues` · `courts` · `pricing` · `bookings` · `payments` (gateway abstraction: VnPayGateway | MockGateway) · `reviews` · `notifications` · `ai` · `admin` · `common` (guards, filters, interceptors).

Quy ước API: REST `/api/v1`, tài liệu Swagger tự sinh; lỗi thống nhất `{ statusCode, message, code }` với mã nghiệp vụ (`SLOT_TAKEN`, `HOLD_EXPIRED`, `PAYMENT_AMOUNT_MISMATCH`, …).

Quy ước dữ liệu quan trọng:
- Thời gian chơi lưu `date (YYYY-MM-DD)` + `startMinute/endMinute` theo giờ Việt Nam (UTC+7) — tránh mọi lỗi múi giờ; quyết định này ghi rõ trong báo cáo.
- ID: UUID; tiền: số nguyên VND.

## 5. Mô hình dữ liệu (Prisma)

```
User(id, email UNIQUE, passwordHash, fullName, phone, role[CUSTOMER|OWNER|ADMIN], status[ACTIVE|LOCKED])
RefreshToken(id, userId FK, tokenHash, expiresAt, revokedAt)          -- xoay vòng
Venue(id, ownerId FK→User, name, slug UNIQUE, address, lat, lng, openMinute, closeMinute,
      images[], amenities[], depositPercent, status[PENDING|APPROVED|REJECTED], rejectReason?)
Court(id, venueId FK, name, sportType[FOOTBALL5|FOOTBALL7|PICKLEBALL|BADMINTON|TENNIS],
      slotMinutes[60|90], defaultPricePerSlot, status[ACTIVE|MAINTENANCE])
PricingRule(id, courtId FK, dayType[WEEKDAY|WEEKEND], startMinute, endMinute, pricePerSlot)
BookingHold(id, userId FK, courtId FK, date, startMinute, endMinute, subtotal, expiresAt,
            status[ACTIVE|CONVERTED|EXPIRED])
Booking(id, code UNIQUE, customerId FK, courtId FK, date, startMinute, endMinute,
        subtotal, depositAmount, status[CONFIRMED|CHECKED_IN|COMPLETED|CANCELLED|NO_SHOW],
        cancelledAt?, cancelReason?, isPublicMatch?, slotsNeeded?, matchFull?)
Payment(id, bookingId FK, amount, type[DEPOSIT|FULL|REFUND], method[VNPAY|MOCK],
        txnRef UNIQUE (=idempotency key), status[PENDING|PAID|FAILED|REFUNDED], paidAt?, rawPayload jsonb)
Review(id, bookingId FK UNIQUE, venueId FK, customerId FK, rating 1..5, comment, createdAt)
```

Index chính: `Booking(courtId, date)` · `BookingHold(courtId, date, status)` · `Venue(status)`; tìm kiếm tên sân nâng cao (tsvector) để GĐ2 nếu cần.

## 6. Luồng nghiệp vụ then chốt

### 6.1 Đặt sân & chống double-booking ⭐
```
1. POST /bookings/hold {courtId, date, slots[]}   ← validate liền kề + trong giờ mở cửa
2. TRANSACTION:
   a. SELECT id FROM "Court" WHERE id=? FOR UPDATE        -- khoá dòng sân
   b. Overlap check: slot yêu cầu ∩ (Booking ACTIVE ∪ Hold ACTIVE) ?
      - Trùng   → ROLLBACK, HTTP 409 SLOT_TAKEN
      - Không   → INSERT BookingHold (expiresAt = now + 10')
3. Client redirect VNPay (txnRef unique theo hold)
4. VNPay callback: verify HMAC-SHA512 + amount khớp
   → Payment PAID (idempotent theo txnRef UNIQUE)
   → Hold CONVERTED, Booking CONFIRMED (cùng transaction)
Cron 1'/lần: Hold ACTIVE quá hạn → EXPIRED (nhả slot); Booking CONFIRMED qua giờ kết thúc → COMPLETED;
t-2h trước giờ chơi → gửi email nhắc.
```
> Quy ước: "Booking đang chiếm slot" = trạng thái `CONFIRMED` hoặc `CHECKED_IN`.
> Không có trạng thái chờ thanh toán trên Booking — suốt quá trình thanh toán, slot do `BookingHold` giữ;
> callback thành công mới tạo Booking thẳng ở `CONFIRMED`.

Khoá dòng theo sân tuần tự hoá mọi request cùng lúc ở tầng DB — độc lập timing application. Test tích hợp chứng minh: 2 request đồng thời → 1 thắng, 1 nhận 409.

### 6.2 Hủy & hoàn cọc
```
DELETE /bookings/:id (khách hủy đơn của mình; owner/admin hủy hộ)
→ tính mức hoàn theo khoảng cách giờ chơi (>24h: 100%, 12–24h: 50%, <12h: 0%)
→ Booking CANCELLED + bản ghi Payment(REFUND) ghi nhận số hoàn
   (sandbox/mock không đẩy tiền thật)
→ email xác nhận hủy
```

### 6.3 Check-in
QR chứa mã đơn; chủ sân quét/nhập mã → kiểm tra đơn thuộc venue của mình → chuyển `CHECKED_IN`.

### 6.4 Trợ lý AI (GĐ2)
Client gửi `{message}` lên `POST /ai/chat`; server stateless với provider abstraction (`RuleBasedNluProvider` mặc định, `GeminiAdapter` cài khi có `GEMINI_API_KEY`); guardrail: chỉ trả lời về đặt sân, mọi slot/sân phải đến từ tool call DB thật (`toolsUsed` echo về UI minh bạch); giữ chỗ qua `POST /ai/hold` yêu cầu JWT — chat không bao giờ tự thanh toán. Timeout 15s; vượt hạn mức 20 tin/h/user → thông báo thân thiện.

## 7. Bảo mật
- bcrypt cost 12; access token 15' (client giữ trong memory) + refresh 7' trong cookie `httpOnly; Secure; SameSite=Lax`, xoay vòng mỗi lần dùng, phát hiện reuse → thu hồi cả session.
- RBAC: decorator `@Roles()` + guard trên từng endpoint; owner chỉ thao tác venue/court/booking của chính mình (ownership check ở tầng service).
- Validate toàn bộ input (zod + whitelist); Prisma parametrized chống SQL injection; React escape mặc định + sanitize URL ảnh.
- `@nestjs/throttler`: login/register/AI chat; Helmet; CORS whitelist; secrets qua env (không commit .env); callback VNPay kiểm tra chữ ký + amount + txnRef UNIQUE.

## 8. Chiến lược kiểm thử
| Lớp | Công cụ | Phạm vi |
|---|---|---|
| Unit | Jest (api) · Vitest + RTL (web) | tính giá, chính sách hoàn cọc, máy trạng thái đơn, form |
| Integration | Jest + Postgres docker | luồng hold/convert, callback idempotent, **race 2 request cùng slot**, cron hết hạn hold |
| E2E | Playwright | tìm sân → đặt → tới trang thanh toán sandbox; đăng nhập; admin duyệt sân |

Ngưỡng chất lượng: CI xanh là điều kiện merge; luồng booking phải có integration test mới coi là xong.

## 9. CI/CD & triển khai (free tier)
- **CI** (GitHub Actions, mọi push): install frozen-lockfile → lint (ESLint+Prettier) → type-check → test → build api+web.
- **Deploy** khi merge `main`: web → **Vercel**; api → **Render** (release command chạy `prisma migrate deploy`); DB → **Neon**; ảnh → **Cloudinary**; email → **Resend**; keep-alive ping Render bằng dịch vụ ngoài (UptimeRobot).
- Seed script tạo dữ liệu demo đẹp: 3 venue, ~10 sân nhiều loại, bảng giá, các đơn mẫu ở mọi trạng thái.

## 10. Lộ trình 6 tháng
| Khoảng | Giai đoạn | Definition of Done |
|---|---|---|
| Tuần 1–2 | 📐 Khởi động | Đề cương chi tiết · monorepo + CI xanh từ commit đầu · sơ đồ DB + wireframe màn chính |
| Tháng 1–1.5 | 🧱 Nền tảng | Auth + RBAC hoàn chỉnh · CRUD venue/court/pricing (owner) · admin duyệt sân · trang công khai danh sách sân + bản đồ |
| Tháng 2–3 | ⭐ Lõi booking | Slot engine + hold + transaction chống double-booking (+ test race) · VNPay sandbox · hủy/hoàn · check-in QR · đánh giá · email · **🎯 mốc giữa kỳ: demo end-to-end trên link deploy thật** |
| Tháng 4–4.5 | 🚀 Nâng cao & AI | Dashboard doanh thu · ghép trận mở · **AI-1 trợ lý NLU + tool-use** · **AI-2 gợi ý slot** · UI responsive chỉn chu |
| Tháng 5 | ✨ Chỉn chu & hồ sơ | E2E · tối ưu index/pagination · seed đẹp · Swagger hoàn chỉnh · tài liệu người dùng · viết chương hệ thống của báo cáo |
| Tháng 6 | 🎓 Bảo vệ | Báo cáo hoàn chỉnh · slide + kịch bản demo · video backup · luyện Q&A hội đồng |

Nhịp làm việc: mỗi phiên = 1 đầu việc nhỏ chạy được ngay; cuối mỗi giai đoạn chốt dần phần báo cáo tương ứng.

## 11. Rủi ro & phương án
| Rủi ro | Phương án |
|---|---|
| Render free ngủ sau 15' im lặng | Keep-alive ping + warm-up trước giờ bảo vệ + ghi nhận là hạn chế trong báo cáo |
| VNPay sandbox trục trặc lúc demo | Cờ `PAYMENT_MODE=mock` chuyển cổng giả lập, đổi 1 biến env là xong |
| Hạn mức Gemini free tier cạn | Adapter đổi provider nhanh; throttle theo user; fallback thông báo thân thiện |
| Ôm tính năng sớm phá tiến độ | Kỷ luật scope §3; tính năng mới phải nằm đúng giai đoạn lộ trình |
| Neon/Vercel đổi hạn mức free | Schema chuẩn Postgres — di chuyển nhà cung cấp chỉ là đổi connection string |

## 12. Tiêu chí hoàn thành đồ án
1. Toàn bộ tính năng GĐ1 + GĐ2 hoạt động trên link public (web + api + DB thật).
2. Unit/integration/E2E xanh trong CI; luồng booking có test chứng minh chống double-booking.
3. Swagger docs đầy đủ; tài liệu người dùng ngắn gọn; seed data demo đẹp.
4. Báo cáo đủ chương: phân tích – thiết kế – hiện thực – kiểm thử – triển khai – ứng dụng AI; sơ đồ vẽ sạch lại từ chính đặc tả này.
5. Video demo dự phòng + bộ câu hỏi/trả lời dự kiến hội đồng.
