# Hướng dẫn triển khai SanGo (free tier) — đặc tả §9

> **Ghi chú scaffolding:** tài liệu này viết sớm theo cấu trúc đã chốt. Các URL
> dịch vụ thật (Render, Vercel) sẽ được điền vào chỗ `<...>` ở **mốc deploy
> cuối Giai đoạn 1**. Toàn bộ bí mật nằm trên dashboard của từng dịch vụ,
> **không bao giờ commit** vào repo.

## 0. Tổng quan kiến trúc triển khai

| Thành phần | Dịch vụ | Gói | Ghi chú |
|---|---|---|---|
| Postgres | [Neon](https://neon.tech) | Free | Serverless, suspend khi rảnh — hợp free tier |
| API (NestJS) | [Render](https://dashboard.render.com) | Free | Sleep sau ~15' im lặng → cần UptimeRobot (mục 6) |
| Web (React/Vite) | [Vercel](https://vercel.com/dashboard) | Hobby | Root Directory = `apps/web` |
| Ảnh sân | [Cloudinary](https://cloudinary.com/console) | Free | Upload flow thuộc giai đoạn sau |
| Email | [Resend](https://resend.com) | Free | Xác nhận đơn / hủy đơn / nhắc trận |
| Keep-alive | [UptimeRobot](https://uptimerobot.com) | Free | Ping `/api/v1/health` mỗi 10 phút |

Thứ tự triển khai: **Neon → Render → Vercel** (API cần DATABASE_URL trước, web
cần URL của API sau).

---

## 1. Tạo database trên Neon

1. Đăng nhập <https://console.neon.tech> → tạo project mới, đặt tên
   `sango`, region **Singapore** (gần người dùng VN nhất trong free tier).
2. Trong project, tạo database tên `sango` (mặc định là `neondb` — có thể
   dùng luôn, nhưng đặt riêng cho gọn gàng).
3. Lấy connection string dạng **pooled**: Dashboard → *Connection Details* →
   bật/tích chọn **"Pooled connection"**. Chuỗi có dạng:

   ```
   postgresql://<user>:<password>@ep-xxxxx-pooler.ap-southeast-1.aws.neon.tech/sango?sslmode=require
   ```

   - Host chứa `-pooler` là endpoint qua PgBouncer của Neon — **dùng chuỗi này
     cho Render** (số kết nối free tier rất ít, pooler giúp không chạm trần).
   - Host KHÔNG có `-pooler` (direct) dành cho migration chạy dài — nếu
     `prisma migrate deploy` báo lỗi qua pooler, chạy tay bằng direct string.
4. Copy nguyên chuỗi, giữ làm giá trị `DATABASE_URL` (bước 2). **Không commit
   chuỗi này.**

## 2. Triển khai API lên Render

1. Push repo lên GitHub → <https://dashboard.render.com> → **New → Web
   Service** → chọn repository.
2. Nếu repo có `render.yaml` ở gốc, Render phát hiện Blueprint và nạp sẵn cấu
   hình (xem file để biết chi tiết). Tùy chỉnh thủ công thì khớp bảng sau:

   | Mục | Giá trị |
   |---|---|
   | Region | Singapore |
   | Plan | Free |
   | Build command | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @sango/api prisma:generate && pnpm --filter @sango/api build && pnpm --filter @sango/api prisma migrate deploy` |
   | Start command | `pnpm --filter @sango/api start` |
   | Health check path | `/api/v1/health` |

   > Vì sao migrate nằm trong build? Gói **free** của Render chưa hỗ trợ
   > pre-deploy/release command. Khi nâng plan, chuyển dòng
   > `prisma migrate deploy` sang `preDeployCommand` (đã ghi mẫu ngay trong
   > `render.yaml`).
3. **Environment variables** (Render → Environment). Các biến đánh dấu
   `sync: false` trong `render.yaml` phải set thủ công:

   | Key | Cách lấy / giá trị |
   |---|---|
   | `DATABASE_URL` | Chuỗi pooled từ bước 1 |
   | `JWT_SECRET`, `JWT_REFRESH_SECRET` | Sinh ngẫu nhiên: `openssl rand -hex 32` (hai giá trị khác nhau) |
   | `PAYMENT_MODE` | `mock` cho demo an toàn; đổi `vnpay` khi sandbox ổn định |
   | `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` | Portal sandbox VNPay (làm cùng mốc thanh toán) |
   | `RESEND_API_KEY` | Bước 5 dưới đây |
   | `EMAIL_FROM` | Địa chỉ gửi email đã xác thực trên Resend |
   | `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Bước 4 dưới đây |
   | `CORS_ORIGIN` | URL Vercel của web, ví dụ `https://sango.vercel.app` (điền lại sau bước 3) |
4. Deploy lần đầu → mở log kiểm tra migrate chạy xong → thử
   `https://<service>.onrender.com/api/v1/health` trả về
   `{"status":"ok"}`.
5. Ghi lại URL thật của service thay cho mọi chỗ `<render-api-url>` trong
   tài liệu/dự án.

## 3. Triển khai Web lên Vercel

1. <https://vercel.com/dashboard> → **Add New → Project** → import repo GitHub.
2. **Root Directory = `apps/web`** (quan trọng với monorepo pnpm — Vercel sẽ
   tự nhận lockfile pnpm và cài dependency từ gốc workspace). Framework
   **Vite** được nhận diện tự động nhờ `vercel.json` đặt trong `apps/web`
   (SPA rewrite: mọi route về `index.html`, trừ `/assets`).
3. Trước khi deploy: **Project Settings → Environment Variables**, thêm:

   | Key | Value | Ghi chú |
   |---|---|---|
   | `VITE_API_URL` | `https://<render-api-url>/api/v1` | Trỏ đúng URL Render ở bước 2; thêm cho cả Production lẫn Preview |

4. Deploy → mở URL Vercel, kiểm tra trang "SanGo" hiển thị và gọi được API.
5. Quay lại Render cập nhật `CORS_ORIGIN` = URL Vercel vừa tạo (nếu khác dự
   kiến), redeploy API.

## 4. Cloudinary (ảnh venue) — free tier

1. Đăng ký <https://cloudinary.com/console> (free plan đủ demo).
2. Dashboard → *Programmable Media* → copy `Cloud name`, `API key`,
   `API secret` → điền vào 3 biến env tương ứng trên Render.

## 5. Resend (email thông báo) — free tier

1. Đăng ký <https://resend.com>, free tier đủ giới hạn demo/báo cáo.
2. Thêm + xác thực domain (hoặc dùng địa chỉ sender mặc định onboarding khi
   chưa có domain).
3. *API Keys* → tạo key → chính là `RESEND_API_KEY`; `EMAIL_FROM` dùng đúng
   địa chỉ/sender đã xác thực.

## 6. UptimeRobot chống sleep Render

Render free ngủ sau ~15 phút im lặng (đặc tả §11). Đánh lừa bằng ping định kỳ:

1. Đăng ký <https://uptimerobot.com> (free: monitor 10-phút/lần? free tier
   chuẩn là 10–15 phút tùy thời điểm — chọn khoảng nhỏ nhất cho phép).
2. **Add New Monitor**: type *HTTP(s)*, URL =
   `https://<render-api-url>/api/v1/health`, interval thấp nhất được phép
   (~10 phút), tùy chọn Keyword = `ok`.
3. Kiểm tra dashboard Render: service không còn trạng thái sleeping giữa ngày.

> UptimeRobot chỉ giữ service "ấm" về mặt runtime; cold-start vẫn có thể xảy ra
> sau deploy mới hoặc sự cố mạng → luôn warm-up trước demo (mục 8).

## 7. Quy trình phát hành hằng tuần (thói quen tốt)

1. `git push` → CI xanh (lint/typecheck/test/build) → merge `main`.
2. Render auto-deploy chạy migrate + restart; Vercel auto-deploy web.
3. Xem nhanh health endpoint + trang chủ sau mỗi bản release.

## 8. ✅ CHECKLIST WARM-UP TRƯỚC DEMO / BẢO VỆ

Chạy checklist này **trước giờ bảo vệ 30 phút** và trước mỗi buổi demo quan trọng:

- [ ] **T-30':** mở terminal, `curl https://<render-api-url>/api/v1/health` đến khi trả `{"status":"ok"}` (đánh thức Render khỏi sleep).
- [ ] Mở Neon console xác nhận database **Active**, không bị khóa hạn mức.
- [ ] Chạy lại seed dữ liệu demo nếu DB bị xáo trộn bởi buổi demo trước (script seed — có từ mốc Prisma/seed): `pnpm --filter @sango/api db:seed`.
- [ ] Mở sẵn tab: trang chủ Vercel, Swagger `/api/docs`, trang đặt sân, admin duyệt sân.
- [ ] Xác nhận `PAYMENT_MODE=mock` đang bật nếu không muốn phụ thuộc VNPay sandbox; nếu demo thanh toán thật thì test 1 giao dịch sandbox trước.
- [ ] Kiểm tra UptimeRobot monitor đang **UP** (không red).
- [ ] Đăng nhập sẵn tài khoản customer + owner + admin trong các tab riêng.
- [ ] **T-24h:** quay VIDEO BACKUP toàn bộ luồng: tìm sân → đặt → giữ chỗ → thanh toán mock → check-in → hủy/hoàn. Video là phương án dự phòng số 1 khi mạng/rơm Render gặp sự cố tại chỗ (đặc tả §11).

---

*Bảo trì tài liệu: cập nhật URL thật + số liệu hạn mức tại mốc deploy cuối Giai đoạn 1.*
