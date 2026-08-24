# Dàn ý báo cáo tốt nghiệp — CourtHub

> Bản khung nội dung Chương 1–6 + Kết luận, ánh xạ trực tiếp sang đặc tả
> thiết kế `docs/superpowers/specs/2026-08-24-courthub-design.md` (trích dẫn
> dạng §x). Mỗi mục ghi 2–3 dòng gợi ý viết; chỗ cần số liệu thực nghiệm được
> đánh dấu **[ĐIỀN SAU]**. Sơ đồ tham chiếu nằm ở `docs/diagrams/`.

---

## Chương 1 — Tổng quan đề tài

### 1.1 Bối cảnh và lý do chọn đề tài (từ §1)
Sự bùng nổ sân thể thao (bóng đá 5/7, pickleball, cầu lông, tennis) tại Việt
Nam đối lập với cách quản lý đặt sân thủ công qua điện thoại/Zalo/sổ tay: trùng
lịch, mất đơn, không có số liệu doanh thu. Nêu khoảng trống mà CourtHub lấp đầy.

### 1.2 Mục tiêu đề tài
Xây dựng trọn vẹn quy trình tìm sân → chọn giờ → giữ chỗ → đặt cọc online →
check-in, kèm công cụ quản lý cho chủ sân. Nhấn 2 điểm nhấn: chống
double-booking ở tầng DB và trợ lý AI tiếng Việt. **[ĐIỀN SAU]:** mục tiêu đo
được (số luồng demo, độ trễ mục tiêu).

### 1.3 Phạm vi và đối tượng người dùng (§2, §3)
Ba vai khách hàng/chủ sân/admin với bảng khả năng của §2; phạm vi Giai đoạn 1
(9 nhóm tính năng) và Giai đoạn 2 (dashboard, ghép trận, AI). Liệt kê rõ những
gì chủ động loại khỏi phạm vi (§3 scope-out) để hội đồng thấy tư duy chọn lọc.

### 1.4 Phương pháp và tiến độ thực hiện (§10)
Quy trình từng phiên một đầu việc nhỏ chạy được ngay; lộ trình 6 tháng theo
bảng §10. **[ĐIỀN SAU]:** ngày bắt đầu/kết thúc thực tế, mốc giữa kỳ đã đạt.

## Chương 2 — Cơ sở lý thuyết và công cụ

### 2.1 Công nghệ frontend
React 18 + Vite + TypeScript: component, hook, render bất đồng bộ; TailwindCSS
và shadcn/ui; TanStack Query cho trạng thái server, React Router, Leaflet bản
đồ, Chart.js dashboard. Vì sao chọn stack này so với phương án khác (1 đoạn).

### 2.2 Công nghệ backend
NestJS 10: kiến trúc module/DI/guard/interceptor; REST quy ước /api/v1,
Swagger tự sinh; @nestjs/schedule cho cron; Prisma ORM trên PostgreSQL 16.
So sánh ngắn Prisma vs TypeORM/raw SQL cho đồ án sinh viên.

### 2.3 Vấn đề đồng thời và giao dịch DB
Transaction ACID, row-level lock `FOR UPDATE`, điều kiện race condition;
khái niệm idempotency key áp cho callback thanh toán (txnRef UNIQUE). Đây là
nền lý thuyết cho điểm nhấn chống double-booking (Chương 4).

### 2.4 Xác thực và bảo mật ứng dụng web
JWT access/refresh token, cơ chế xoay vòng refresh trong cookie httpOnly;
bcrypt; RBAC decorator+guard; OWASP top-rủi ro phổ biến (inject, XSS, CSRF)
và biện pháp tương ứng ở §7.

### 2.5 Thanh toán điện tử VNPay
Luồng redirect + IPN/callback, chữ ký HMAC-SHA512, sandbox vs production;
mô hình cọc % do chủ sân cấu hình.

### 2.6 Ứng dụng AI trong sản phẩm (cho GĐ2)
Tool-use/function-calling chống ảo giác: model chỉ được trả lời từ dữ liệu
tool call trả về (searchVenues/checkSlots/createHold); provider abstraction
(Gemini free tier mặc định); kỹ thuật prompt ràng buộc và throttle.

### 2.7 Công cụ hỗ trợ quy trình
Git/GitHub Actions CI; pnpm workspaces; Mermaid cho sơ đồ version-control;
AI pair-programming hỗ trợ sinh viên (phạm vi sử dụng, kiểm soát chất lượng).

## Chương 3 — Phân tích và thiết kế hệ thống

### 3.1 Phân tích yêu cầu theo tác nhân (§2)
Bảng vai/khả năng §2 chuyển thành yêu cầu chức năng đánh mã FR-x; yêu cầu
phi chức năng (bảo mật §7, hiệu năng slot query, deploy free tier §9).
**[ĐIỀN SAU]:** bảng FR-NFR hoàn chỉnh sau khi chốt danh mục endpoint.

### 3.2 Danh mục tính năng và ưu tiên (§3)
9 tính năng GĐ1 + 4 nâng cao GĐ2, kèm ranh giới "chủ động loại bỏ" (chat
realtime, mobile native, ví nội bộ…). Giải thích thứ tự ưu tiên phục vụ mốc
demo giữa kỳ.

### 3.3 Thiết kế dữ liệu — sơ đồ ERD (§5)
Trình bày `docs/diagrams/erd.mmd`: 9 bảng, khóa/unique/index chính
(Booking(courtId,date), BookingHold(courtId,date,status), Venue(status)).
Quy ước quan trọng: thời gian chơi = date + startMinute/endMinute giờ VN để
tránh lỗi múi giờ; ID UUID; tiền số nguyên VND.

### 3.4 Kiến trúc tổng thể (§4, §9)
Sơ đồ `architecture.mmd`: tách frontend/backend/db, monorepo pnpm, các dịch
vụ ngoài (VNPay, Resend, Cloudinary), cron trong tiến trình API. Lý do chọn
Render/Vercel/Neon free tier cho đồ án có deploy thật.

### 3.5 Thiết kế luồng nghiệp vụ trọng yếu (§6)
`booking-sequence.mmd` cho luồng đặt sân ⭐ và `cancel-refund-flow.mmd`
cho chính sách hủy 3 mức. Phân tích vì sao hold 10 phút + cron giải phóng là
cân bằng tốt giữa trải nghiệm và rủi ro chiếm chỗ.

### 3.6 Máy trạng thái Booking (§5, §6.1)
`booking-state.mmd`: CONFIRMED → CHECKED_IN → COMPLETED, nhánh
CANCELLED/NO_SHOW. Nhấn quyết định "Booking không có trạng thái chờ thanh
toán" và quy ước "đang chiếm slot" = CONFIRMED ∪ CHECKED_IN.

### 3.7 Thiết kế giao diện (wireframe các màn chính)
Wireframe trang tìm sân + lịch tuần chọn slot, màn quản lý chủ sân, admin duyệt
sân. **[ĐIỀN SAU]:** ảnh chụp UI thật thay wireframe khi GĐ1 hoàn thiện.

## Chương 4 — Hiện thực

### 4.1 Tổ chức source code và công cụ phát triển (§4)
Cây monorepo apps/web · apps/api · packages/shared; chia sẻ enum/type qua
workspace package; ESLint/Prettier/tsconfig strict chung; CI GitHub Actions
frozen-lockfile → lint → typecheck → test → build xanh từ commit đầu.

### 4.2 Hiện thực xác thực và phân quyền (§3.1, §7)
JWT 15'/refresh 7' xoay vòng + phát hiện reuse thu hồi session; bcrypt cost
12; RBAC @Roles() + ownership check tầng service. Trích đoạn code then chốt.

### 4.3 Điểm nhấn kỹ thuật — chống double-booking (§6.1) ⭐
Diễn giải sequenceDiagram thành code thật: transaction + FOR UPDATE khoá dòng
sân, overlap check, 409 SLOT_TAKEN; BookingHold hết hạn bởi cron 1'. Kèm test
integration chứng minh 2 request đồng thời → 1 thắng 1 nhận 409.
**[ĐIỀN SAU]:** kết quả chạy test race + ảnh chụp log hai request.

### 4.4 Hiện thực thanh toán VNPay sandbox (§3.5)
Gateway abstraction VnPayGateway | MockGateway; verify HMAC-SHA512 + đối chiếu
số tiền + idempotency txnRef UNIQUE; cờ PAYMENT_MODE=mock dự phòng demo.

### 4.5 Các module nghiệp vụ còn lại
Venue/Court/Pricing CRUD, check-in QR (§6.3), review, email Resend, cron nhắc
trận T-2h. Mỗi mục 1–2 đoạn + hình minh hoạ màn hình. **[ĐIỀN SAU]:** ảnh UI.

### 4.6 Ứng dụng AI giai đoạn 2 (§3.12–13) ⭐
Kiến trúc tool-use: system prompt ràng buộc, 3 tool nội bộ đọc DB thật, guardrail
(không tự thanh toán, hạn mức 20 tin/h); AI-2 gợi ý slot bằng SQL aggregate
histogram không tốn phí API. **[ĐIỀN SAU]:** ví dụ hội thoại thật + tỉ lệ trả
lời đúng khi thử nghiệm.

## Chương 5 — Kiểm thử và đánh giá chất lượng (§8)

### 5.1 Chiến lược kiểm thử
Piramid: unit Jest (giá, hoàn cọc, state machine) · Vitest+RTL (form web) ·
integration Jest+Postgres docker (hold/convert, callback idempotent, race 2
request) · E2E Playwright (luồng đặt tới trang thanh toán).

### 5.2 Kết quả kiểm thử
Tổng hợp số test, độ phủ, thời gian CI. Ngưỡng chất lượng: CI xanh là điều
kiện merge; booking flow phải có integration test mới tính là xong.
**[ĐIỀN SAU]:** bảng số liệu chạy thật (số test, coverage %, thời gian).

### 5.3 Thử nghiệm hiệu năng tình huống tranh chấp slot
Kịch bản N request song song cùng slot: tỷ lệ thành công kỳ vọng 1/N nhận 409,
thời gian phản hồi p95. **[ĐIỀN SAU]:** số đo thật bằng script load nhỏ.

## Chương 6 — Triển khai hệ thống (§9)

### 6.1 Hạ tầng triển khai free tier
Neon Postgres → Render API (health check /api/v1/health) → Vercel web;
quy trình nối dịch vụ theo `docs/deploy.md`; biến môi trường và secrets.

### 6.2 Giám sát và giữ service "ấm"
UptimeRobot ping health mỗi ~10 phút chống sleep Render; xem log Render/Vercel
analytics. **[ĐIỀN SAU]:** link demo thật + ảnh uptime.

### 6.3 Quy trình phát hành
CI xanh trên main → auto deploy → smoke test health + trang chủ; checklist
warm-up trước demo/bảo vệ (docs/deploy.md mục 8) và video backup.

## Kết luận

### Kết quả đạt được
Tổng kết theo mục tiêu Chương 1: sản phẩm chạy trên link public, điểm nhấn
double-booking + AI, quy trình kỹ thuật nghiêm túc (CI/test/deploy thật).
**[ĐIỀN SAU]:** con số tổng (số endpoint, số test, uptime đạt được).

### Hạn chế
Hạn chế thừa nhận từ §11: Render free ngủ dù có keep-alive (cold start lúc
đổi mạng), phụ thuộc hạn mức free tier của Neon/Vercel/Resend/Gemini, thanh
toán thật ngoài sandbox chưa đưa vào phạm vi.

### Hướng phát triển
Mở rộng từ scope-out §3: chat realtime, app mobile, ví nội bộ, dự báo nhu cầu
(AI-3), MoMo/ZaloPay qua gateway abstraction sẵn có; bài học kinh nghiệm cá
nhân về làm việc với AI pair-programming.

---

## Tiến độ viết (dành cho người viết báo cáo)

| Chương | Trạng thái | Ghi chú |
|---|---|---|
| 1 | ⬜ Chưa viết | Viết sớm được, ít phụ thuộc code |
| 2 | ⬜ Chưa viết | Có thể song song với GĐ1 |
| 3 | 🔶 Một phần | ERD + sơ đồ đã có trong docs/diagrams |
| 4 | ⬜ Chưa viết | Chờ code GĐ1 ổn định, chèn ảnh/code thật |
| 5 | ⬜ Chưa viết | Chờ chạy test thật điền [ĐIỀN SAU] |
| 6 | 🔶 Một phần | Deploy.md đã có, chờ URL thật |
