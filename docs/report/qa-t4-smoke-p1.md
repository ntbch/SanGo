# Báo cáo QA — T4 · Smoke test Đợt 1 (P1-F1/F2)

- **Người thực hiện:** qa-reviewer (team courthub-p1)
- **Ngày:** 2026-08-25 · **Commit kiểm thử:** 1afb676
- **Môi trường:** không Docker; Web dev server Vite chạy trực tiếp với VITE_USE_MOCK=true (http://localhost:5173); Google Chrome headless 1440×900 điều khiển qua CDP; Postgres embedded (.tooling-cache/pgdev/start-pg.js) phục vụ gate test API.

## 1. Kết luận tổng quan

| Hạng mục | Kết quả |
| --- | --- |
| Guest journey (landing → /venues → Giữ chỗ → login?next) | ⚠️ 5/6 bước PASS — **lỗi mất redirect ?next sau đăng nhập** |
| Quên mật khẩu end-to-end trên mock | ✅ 5/5 PASS |
| Đổi mật khẩu + sửa hồ sơ | ✅ 7/7 PASS |
| Gates lint / typecheck / test / build | ✅ toàn bộ xanh (0 lỗi) |

**Tổng smoke journey: 16 PASS / 1 FAIL** — chi tiết từng bước ở §2.

## 2. Chi tiết smoke journey

### J1 · Guest journey (P1-F1)

| Bước | Kết quả | Bằng chứng |
| --- | --- | --- |
| J1.1 Mở "/" thấy landing | PASS | h1 «CourtHub — Sân chơi đúng ý, giờ chơi đúng hẹn» |
| J1.2 "/venues" duyệt tự do không bị chặn | PASS | 24 link cụm sân công khai, bộ lọc 12 quận hiển thị |
| J1.3 Vào chi tiết sân | PASS | slug san-the-thao-quan-ngua, h1 «Sân Thể Thao Quần Ngựa» |
| J1.4 Lịch tuần + tab sân con render | PASS | URL /venues/san-the-thao-quan-ngua/book |
| J1.5 Khách chọn slot Trống → bấm «Giữ chỗ & Thanh toán →» | PASS | Toast «Yêu cầu đăng nhập» + chuyển /login?next=%2Fvenues%2F…%3FcourtId%3Dc-hn-101 |
| J1.6 Đăng nhập xong quay lại đúng trang next | **FAIL** | Sau đăng nhập thành công rơi về /dashboard thay vì trang giữ chỗ — xem Finding QA-T4-01 |

### J2 · Quên mật khẩu end-to-end (mock, P1-F2)

| Bước | Kết quả | Bằng chứng |
| --- | --- | --- |
| J2.1 Gửi email quên mật khẩu | PASS | Mock trả devResetLink = /dat-lai-mat-khau?token=reset-… |
| J2.2 Mở form đặt lại KHÔNG có token | PASS | Chặn kèm cảnh báo «Thiếu token đặt lại mật khẩu…» |
| J2.3 Đặt mật khẩu mới bằng token | PASS | Thành công → tự động về /login |
| J2.4 Đăng nhập mật khẩu CŨ | PASS | Từ chối «Email hoặc mật khẩu không đúng.» (INVALID_CREDENTIALS) |
| J2.5 Đăng nhập mật khẩu MỚI | PASS | Vào được /dashboard |

Token reset là one-time đúng hợp đồng (dùng lại sẽ RESET_TOKEN_STALE — đã phủ bởi unit test password-pages.test.tsx).

## 3. Finding

### QA-T4-01 · Mất redirect ?next sau đăng nhập (Medium-High) — cần fix trong Đợt 2

- **Hiện tượng:** khách bấm «Giữ chỗ & Thanh toán →» bị đưa tới /login?next=%2Fvenues%2F<slug>%2Fbook%3FcourtId%3D…; sau khi đăng nhập thành công, app luôn về /dashboard thay vì quay lại trang giữ chỗ. Tái hiện 100%: 2 lần trong journey + 1 lần repro độc lập với full-page load.
- **Phạm vi ảnh hưởng:** trọn vòng guest booking P1-F1; mọi luồng dùng ?next (Giữ chỗ, tham gia trận ghép, AI giữ chỗ).
- **Nguyên nhân (phân tích tĩnh):** LoginPage.onSubmit gọi setSession() (zustand — thông báo subscriber ngay lập tức) TRƯỚC navigate(target). Khi store cập nhật, GuestRoute re-render thấy user !== null và trả <Navigate to="/dashboard" replace /> trước khi navigate(target) kịp có hiệu lực — đích ?next bị ghi đè.
- **Gợi ý fix (chọn 1):**
  1. Tính target và gọi navigate(target, { replace: true }) TRƯỚC setSession;
  2. hoặc cho GuestRoute ưu tiên location.state.from / giữ vị trí trong một nhịp sau login;
  3. hoặc dời setSession xuống sau navigate.
- **Kiểm thử bổ sung đề xuất:** thêm case e2e/unit «login có ?next → URL đích = next» để khoá hồi quy.

### J3 · Sửa hồ sơ + đổi mật khẩu (owner, P1-F2)

| Bước | Kết quả | Bằng chứng |
| --- | --- | --- |
| J3.1 Sửa fullName + phone → «Lưu thay đổi» | PASS | Toast «Đã lưu hồ sơ»; form và store/header phản ánh tên mới «QA Reviewer Đã Sửa» |
| J3.2 Đổi MK với mật khẩu hiện tại SAI | PASS | Chặn, toast destructive «Không đổi được mật khẩu» (CURRENT_PASSWORD_WRONG) |
| J3.3 Đổi MK đúng currentPassword | PASS | Toast «Đổi mật khẩu thành công» + đăng xuất về /login |
| J3.4 Phiên cũ chết — vào lại /dashboard trong cùng phiên | PASS | ProtectedRoute đẩy về /login |
| J3.5 Đăng nhập lại bằng MK cũ (owner) | PASS | INVALID_CREDENTIALS |
| J3.6 Đăng nhập bằng MK mới (owner) | PASS | Vào /dashboard |

## 4. Gates monorepo (CI=true)

| Gate | Kết quả | Ghi chú |
| --- | --- | --- |
| pnpm lint (eslint + prettier check) | ✅ exit 0 | Lần chạy đầu đỏ do import thừa forgotPassword trong password-pages.test.tsx; đã được fix ở commit 1afb676 giữa chừng, chạy lại xanh trên HEAD mới |
| pnpm typecheck | ✅ exit 0 | shared/api/web đều Done |
| pnpm test | ✅ exit 0 | web: 29 file / 154 test PASS · api: 13 suite / 108 test PASS (jest, chạy trên PG embedded) |
| pnpm build | ✅ exit 0 | shared + api tsc, web tsc && vite build |

## 5. Giới hạn của môi trường mock

- Mock server là module JS trong từng tài liệu trang: mỗi lần full-reload tạo heap mới (reset accounts/session/token). Vì vậy:
  - Không thể xác minh "thu hồi phiên" xuyên tab hay xuyên reload ở tầng mock — đã kiểm chứng trong CÙNG tài liệu (J3.3→J3.4: đổi MK xong, SPA điều hướng sang route protected vẫn bị chặn) kèm đăng nhập lại MK cũ/mới (J3.5/J3.6);
  - "Hồ sơ lưu đúng" xác minh theo store + phản hồi PATCH trong phiên (reload sẽ reset mock — đặc tính demo của mock, không phải bug sản phẩm; persistence thật thuộc trách nhiệm API/DB).
- Các case trên đã được unit test (auth-store.test.ts, schemas.test.ts, password-pages.test.tsx) phủ thêm.

## 6. Chỉ mục screenshot (.tmp-screens/qa-t4/)

| File | Nội dung |
| --- | --- |
| 01-guest-home.png | Landing công khai: header «Tìm sân / Ghép trận / Đăng nhập / Đăng ký», hero «NỀN TẢNG ĐẶT SÂN THỂ THAO TRỰC TUYẾN», 3 USP (bản đồ, giữ chỗ 10 phút, check-in QR), khối «Sân nổi bật» |
| 02-guest-venues.png | /venues: tiêu đề «Tìm sân thể thao gần bạn», chip 12 quận, bộ lọc loại sân/sắp xếp/«📍 Gần tôi», danh sách 24 thẻ sân APPROVED |
| 03-guest-venue-detail.png | Chi tiết «Sân Thể Thao Quần Ngựa»: đánh giá 4.5, địa chỉ Ba Đình, nút «Chỉ đường trên Google Maps», bảng giá sân con, link «Chọn giờ →» |
| 04-guest-book-calendar.png | Lịch tuần dạng lưới, tab chọn sân con, các ô trạng thái Trống/Đã kín, thanh dưới «Nhấp vào các ô màu xanh…» |
| 05-guest-hold-login-next.png | Sau khách bấm «Giữ chỗ & Thanh toán →»: toast đỏ «Yêu cầu đăng nhập» và URL /login?next=%2Fvenues%2F…%3FcourtId%3Dc-hn-101 |
| 06-login-back-to-book.png | **Bằng chứng lỗi QA-T4-01**: đăng nhập customer thành công nhưng app đứng ở /dashboard, không quay lại trang book |
| 07-forgot-dev-reset-link.png | Form quên mật khẩu sau khi gửi email: thông báo thành công + link «Đặt lại mật khẩu ngay» trỏ /dat-lai-mat-khau?token=reset-… (mock dev link) |
| 08-reset-missing-token-blocked.png | /dat-lai-mat-khau thiếu token: cảnh báo «Thiếu token đặt lại mật khẩu. Vui lòng mở đúng link trong email đã gửi.» |
| 09-reset-success-login.png | Sau đặt lại MK thành công: tự động về trang /login sạch |
| 10-old-password-rejected.png | Đăng nhập bằng MK cũ: lỗi đỏ «Email hoặc mật khẩu không đúng.» |
| 11-new-password-dashboard.png | Đăng nhập bằng MK mới: vào /dashboard khách hàng |
| 12-profile-saved-toast.png | Hồ sơ owner sau khi lưu: toast «Đã lưu hồ sơ», fullName = «QA Reviewer Đã Sửa», phone 0987654321, tên mới xuất hiện trên layout |
| 13-change-wrong-current.png | Đổi MK sai currentPassword: toast destructive «Không đổi được mật khẩu — Mật khẩu hiện tại không đúng» |
| 14-change-success-logout.png | Đổi MK đúng: toast «Đổi mật khẩu thành công — Vui lòng đăng nhập lại bằng mật khẩu mới», đã về /login |
| 15-old-session-kicked.png | PushState SPA sang /dashboard sau đổi MK: ProtectedRoute đẩy ngược về /login (phiên cũ chết) |
| 16-owner-old-password-fails.png | Owner đăng nhập MK cũ: «Email hoặc mật khẩu không đúng.» |
| 17-owner-new-password-ok.png | Owner đăng nhập MK mới: /dashboard với sidebar chủ sân (Quản lý sân, Đơn đặt, Thống kê) |
