# SanGo 🏟️

> **Hệ thống đặt và quản lý sân thể thao trực tuyến** (Đồ án tốt nghiệp)

SanGo giải quyết trọn vẹn quy trình tìm kiếm sân, kiểm tra lịch trống theo thời gian thực, giữ chỗ tạm 10 phút, chống double-booking bằng Database Transaction & Row-level Locking, thanh toán cọc online qua VNPay Sandbox (kèm chế độ Mock fallback), check-in bằng mã đơn và đánh giá chất lượng sân.

**Giai đoạn 2 (nâng cao & AI):** dashboard thống kê chủ sân (doanh thu/lượt đặt theo ngày, xếp hạng sân con — Chart.js), ghép trận mở (chủ đơn công khai "cần ghép X người", đủ người tự khoá), trợ lý đặt sân tiếng Việt nâng cấp lên **LLM agent tool-use đa lượt** (mặc định Gemini 2.5 Flash qua REST — tự quyết định gọi `searchVenues`/`checkSlots`/`getSuggestedSlots` đọc DB thật, không bịa dữ liệu, cần đăng nhập để giữ chỗ; nhớ ngữ cảnh hội thoại giữa các tin nhắn) và gợi ý khung giờ cá nhân hoá bằng thống kê lịch sử đặt. Chưa cấu hình key (`LLM_PROVIDER=none`) thì trợ lý tự chạy NLU rule-based offline.

---

## 1. Kiến trúc Monorepo

Dự án được tổ chức theo mô hình Monorepo quản lý bởi **pnpm workspaces**:

```
sango/
├── apps/
│   ├── api/             # NestJS 10 REST API · Prisma ORM · Swagger (/api/docs)
│   └── web/             # React 18 · Vite · TypeScript · Tailwind CSS · TanStack Query
├── packages/
│   └── shared/          # Enums trạng thái, Zod schemas, DTOs và helper dùng chung
├── docs/                # Đặc tả thiết kế hệ thống, sơ đồ C4 và tài liệu đồ án
├── docker-compose.yml   # PostgreSQL 16 Alpine cho môi trường phát triển cục bộ
└── pnpm-workspace.yaml  # Cấu hình workspace
```

---

## 2. Công nghệ sử dụng (Tech Stack)

- **Backend**: [NestJS 10](https://nestjs.com/), [Prisma ORM 6](https://www.prisma.io/), [PostgreSQL 16](https://www.postgresql.org/), [Swagger OpenAPI](https://swagger.io/), [Throttler](https://docs.nestjs.com/security/rate-limiting), [Bcrypt](https://github.com/dcodeIO/bcrypt.js).
- **Frontend**: [React 18](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Radix UI / shadcn](https://ui.shadcn.com/), [TanStack Query v5](https://tanstack.com/query), [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/), [Leaflet](https://leafletjs.com/).
- **Xác thực & Bảo mật**: JWT Access Token (15 phút, bộ nhớ) + Refresh Token xoay vòng (7 ngày, cookie `httpOnly; Secure; SameSite=Lax`, phát hiện reuse thu hồi toàn bộ session).
- **Thanh toán**: Cổng VNPay Sandbox (chữ ký HMAC-SHA512 + idempotency qua `vnp_TxnRef` UNIQUE) và Mock Payment Gateway cho demo ngoại tuyến.

---

## 3. Hướng dẫn cài đặt và chạy (Quickstart)

### ⚡ Một lệnh chạy toàn bộ dự án (Docker — khuyên dùng)

```bash
docker compose up --build
# hoặc chạy ngầm: pnpm up:d
```

Lệnh này dựng đủ 3 service:

| Service | URL | Ghi chú |
| --- | --- | --- |
| **web** | http://localhost:8080 | nginx phục vụ SPA + proxy `/api` về API |
| **api** | http://localhost:4000/api/v1 | tự `migrate deploy`, lần đầu tự seed demo |
| **db** | localhost:5432 | PostgreSQL 16 (`sango/sango/sango`) |

- Tắt auto-seed khi restart: đặt `SEED_ON_START=false` cho service `api` trong `docker-compose.yml`.
- Dừng toàn bộ: `pnpm down`.

### Cài đặt thủ công (không Docker)

### Yêu cầu hệ thống
- **Node.js**: `>= 22.0.0`
- **pnpm**: `>= 10.0.0`
- **Docker** & **Docker Compose** (hoặc một instance PostgreSQL 16 đang chạy)

### Bước 1: Cài đặt dependencies

```bash
pnpm install
```

### Bước 2: Cấu hình biến môi trường

Sao chép file mẫu biến môi trường cho Backend và Frontend:

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Frontend (nếu cần tuỳ biến)
cp apps/web/.env.example apps/web/.env.local
```

### Bước 3: Khởi động Cơ sở dữ liệu & Seed dữ liệu demo

```bash
# 1. Khởi chạy container PostgreSQL
pnpm db:up

# 2. Áp dụng Prisma Migrations
pnpm --filter @sango/api db:migrate

# 3. Seed dữ liệu mẫu (3 tài khoản, 3 cụm sân, 10 sân con, bảng giá, đơn mẫu)
pnpm --filter @sango/api db:seed
```

### Bước 4: Chạy môi trường phát triển (Development)

Mở 2 terminal riêng biệt:

```bash
# Terminal 1: Chạy API Backend (lắng nghe tại http://localhost:4000)
pnpm dev:api

# Terminal 2: Chạy Web Frontend (lắng nghe tại http://localhost:5173)
pnpm dev:web
```

- **Giao diện Web**: [http://localhost:5173](http://localhost:5173)
- **API Swagger Documentation**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **API Health Check**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

---

## 4. Tài khoản Seed Demo

Mật khẩu dùng chung cho tất cả tài khoản demo: **`Sango@2026`**

| Vai trò | Email đăng nhập | Mật khẩu | Mục đích demo |
|---|---|---|---|
| **Admin** | `admin@sango.vn` | `Sango@2026` | Duyệt / Từ chối cụm sân mới (`PENDING`), quản trị hệ thống |
| **Owner (Chủ sân)** | `owner@sango.vn` | `Sango@2026` | Quản lý cụm sân, sân con, cấu hình bảng giá, xem đơn và check-in khách |
| **Customer (Khách hàng)** | `customer@sango.vn` | `Sango@2026` | Tìm kiếm sân, chọn slot, giữ chỗ 10 phút, đặt cọc, xem lịch sử và đánh giá |

---

## 5. Danh mục Biến môi trường (Environment Variables)

### Backend (`apps/api/.env`)

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `PORT` | Không | `4000` | Cổng lắng nghe của NestJS API |
| `DATABASE_URL` | **Có** | `postgresql://sango:sango@localhost:5432/sango?schema=public` | Chuỗi kết nối PostgreSQL |
| `JWT_SECRET` | **Có** | - | Secret khóa ký JWT Access Token |
| `JWT_REFRESH_SECRET` | **Có** | - | Secret khóa ký JWT Refresh Token |
| `COOKIE_SECURE` | Không | `true` | Bật cờ Secure cho cookie refresh (`false` khi test HTTP LAN) |
| `PAYMENT_MODE` | Không | `mock` | Chế độ thanh toán: `mock` (demo offline) hoặc `vnpay` |
| `FRONTEND_URL` | Không | `http://localhost:5173` | URL frontend để redirect sau callback thanh toán |
| `VNPAY_TMN_CODE` | Nếu dùng VNPay | - | Mã Terminal do VNPay cấp |
| `VNPAY_HASH_SECRET` | Nếu dùng VNPay | - | Chuỗi bí mật tạo mã checksum HMAC-SHA512 |
| `VNPAY_SANDBOX_URL` | Nếu dùng VNPay | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` | Endpoint cổng thanh toán VNPay Sandbox |
| `VNPAY_RETURN_URL` | Nếu dùng VNPay | `http://localhost:4000/api/v1/payments/vnpay/callback` | URL callback xử lý kết quả thanh toán |
| `GEMINI_API_KEY` | Không | - | Khóa Google Gemini cho Trợ lý AI (GĐ2). Bỏ trống → dùng NLU rule-based nội bộ, thoái hoá an toàn khi provider lỗi |

### Frontend (`apps/web/.env`)

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `VITE_API_URL` | Không | `/api/v1` | Base URL của Backend REST API |
| `VITE_USE_MOCK` | Không | `false` | Bật chế độ Mock API in-memory độc lập backend |

---

## 6. Kiểm thử & Cổng chất lượng (Quality Gates)

Hệ thống áp dụng quy chuẩn kiểm thử nghiêm ngặt trước mỗi commit và trong GitHub Actions CI:

```bash
# 1. Kiểm tra định dạng và quy chuẩn mã nguồn (ESLint + Prettier)
pnpm lint

# 2. Tự động sửa định dạng mã nguồn
pnpm format

# 3. Kiểm tra tính toàn vẹn kiểu dữ liệu TypeScript toàn bộ workspace
pnpm typecheck

# 4. Chạy toàn bộ Unit & Integration Test suites
pnpm test

# 5. Build production bundle (Backend & Frontend)
pnpm build
```

### Các điểm nhấn kiểm thử kỹ thuật:
- **Chống double-booking**: Integration test mô phỏng 2 request đồng thời trên cùng slot; chứng minh 1 request thành công và 1 nhận `409 SLOT_TAKEN` nhờ cơ chế `SELECT ... FOR UPDATE` trong DB transaction.
- **Xoay vòng Refresh Token & Phát hiện tái sử dụng**: Kiểm tra thu hồi toàn bộ phiên khi token cũ bị sử dụng lại.
- **Idempotency thanh toán**: Kiểm tra callback thanh toán lặp lại với cùng `txnRef` không làm nhân bản đơn hay trạng thái.

---

## 7. Tài liệu & Đặc tả chi tiết

- Đặc tả thiết kế hệ thống chi tiết: [`docs/superpowers/specs/2026-08-24-sango-design.md`](docs/superpowers/specs/2026-08-24-sango-design.md)
- Swagger API Docs: truy cập tại `/api/docs` khi backend đang chạy.
