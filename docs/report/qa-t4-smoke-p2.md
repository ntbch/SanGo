# Báo cáo QA — T4 · Smoke + tổng duyệt Đợt 2 (P2-QA)

- **Người thực hiện:** qa-reviewer (team sango-p2)
- **Ngày:** 2026-08-25 · **Cơ sở kiểm thử:** nội dung đã được kỹ sư commit thành `d379c55` (cron nhắc lịch 15' + cột chống trùng `remindedAt24h/remindedAt2h`) trên nền `c06a6aa`; QA chạy TRƯỚC khi commit trên cùng nội dung working-tree nên kết quả áp dụng trực tiếp cho `d379c55`.
- **Môi trường:** không Docker — PG embedded `.tooling-cache/pgdev` (localhost:5432); API chạy `ts-node src/main.ts` tại :4000 (`PAYMENT_MODE=mock`, ConsoleMailer); Web Vite :5174 chế độ **API thật** (`VITE_API_URL=http://localhost:4000/api/v1`); Google Chrome headless 1440×900 điều khiển qua CDP; SMTP chưa cấu hình ⇒ mail đi qua ConsoleMailer (log `[MAIL] to=… subject=…`).

## 1. Kết luận tổng quan

| Hạng mục | Kết quả |
| --- | --- |
| QA-1 · Đặt sân thành công → thông báo + mail biên nhận | ✅ PASS |
| QA-2 · Hủy đơn → mail hủy + thông báo cả 2 phía | ✅ PASS |
| QA-3 · Tham gia ghép trận → host nhận MATCH_JOINED | ✅ PASS |
| QA-4 · Job nhắc lịch T‑24h/T‑2h — đúng 1 lần dù chạy lại | ✅ PASS (kể cả 3 lần chạy ĐỒNG THỜI + qua restart) |
| QA-5 · Bell UI: badge / mark-read / read-all / điều hướng | ⚠️ 6/7 PASS — **Finding QA‑T4‑P2‑01** (điều hướng về trang 404) |
| Gates lint / typecheck / test / build | ✅ typecheck/test/build xanh toàn monorepo; eslint xanh; prettier chỉ đỏ ở thư mục **chưa track** `stitch_pitch_booking_home/` của nhiệm vụ khác (không thuộc phạm vi P2) |

**Tổng: 20/21 bước smoke PASS · 2 Finding mới (1 Medium‑High, 1 High cho môi trường dev/demo).**

## 2. Chi tiết kiểm thử

### QA-1 · Flow đặt sân thành công (khách `customer@sango.vn`, sân của owner khác)

| Bước | Kết quả | Bằng chứng |
| --- | --- | --- |
| Hold slot trống → checkout DEPOSIT → mock callback | PASS | Đơn `CH-20260826-0088` status=CONFIRMED |
| Khách nhận BOOKING_CONFIRMED + PAYMENT_RECEIVED (in-app) | PASS | 2 bản ghi đúng link `/bookings/<code>` |
| Khách nhận 2 mail giao dịch trong console log | PASS | `[MAIL] to=customer@sango.vn subject=[SanGo] Đã xác nhận đơn CH-20260826-0088` và `… Biên nhận thanh toán đơn CH-20260826-0088` |
| Chủ venue nhận NEW_BOOKING_OWNER (chỉ in-app) | PASS | Bản ghi «Có đơn đặt sân mới» cho owner thật của venue (lưu ý: venue test fixture «IT Flow Venue mt8e1pwv» thuộc `itflow-owner-mt8e1pwv@sango.vn`, KHÔNG phải owner demo — lần đo đầu sai do test đọc hộp thư owner demo) |
| Owner không bị gửi mail (tránh spam theo thiết kế) | PASS | 0 dòng `[MAIL] to=owner@sango.vn` |

### QA-2 · Hủy đơn

| Bước | Kết quả | Bằng chứng |
| --- | --- | --- |
| DELETE /bookings/:id | PASS | HTTP 200, đơn chuyển CANCELLED |
| Khách nhận BOOKING_CANCELLED | PASS | «Đơn đặt sân đã bị hủy» |
| Chủ venue nhận BOOKING_CANCELLED | PASS | «Một đơn vừa bị hủy» |
| Mail hủy đơn trong console log | PASS | `[MAIL] … subject=[SanGo] Đơn <code> đã bị hủy` |

### QA-3 · Tham gia ghép trận mở

| Bước | Kết quả | Bằng chứng |
| --- | --- | --- |
| Host tạo đơn public match (slotsNeeded=2) | PASS | Đơn CONFIRMED, `isPublicMatch=true` |
| Joiner (tài khoản mới đăng ký) POST /bookings/:id/join | PASS | HTTP 201 · joinedCount=1/2 |
| Host nhận MATCH_JOINED sau khi commit | PASS | «QA Joiner vừa tham gia đơn CH-20260826-0090 (1/2 người)» — DB xác nhận dòng notification cho đúng host |

### QA-4 · Job nhắc lịch (P2-B2) — chống gửi trùng

Đặt đơn bắt đầu trong cửa sổ (2h; 24h]: `CH-20260825-0092` hôm nay 18:00 (cách ~2,6h).

| Bước | Kết quả | Bằng chứng |
| --- | --- | --- |
| Chạy logic job lần 1 (gọi thẳng `sendReminders()` trên DB thật) | PASS | before=0 → **1** REMINDER; `remindedAt24h` được set đúng 1 lần; mail `[SanGo] Nhắc lịch đơn CH-20260825-0092 (T-24h)` vào log |
| Chạy lại lần 2 | PASS | vẫn **1** — không gửi thêm |
| 3 lần chạy ĐỒNG THỜI (Promise.all) | PASS | vẫn **1** — claim nguyên tử `updateMany(where id, col:null)` thắng đúng một lần |
| Bền vững qua tiến trình khác | PASS | Đơn `CH-20260825-0093` được claim đúng **1** lần ở 15:45 bởi một tiến trình HOÀN TOÀN ĐỘC LẬP khác (không phải runner lẫn timer của API); các tick 15 phút sau đó của server không gửi trùng — tổng số REMINDER vẫn **1**; đơn `0092` do runner claim cũng giữ nguyên **1** qua ≥3 tick của server |

> Ghi chú kiến trúc: cơ chế dedup mới (cột claim trên Booking) mạnh hơn bản cũ (findFirst Notification): an toàn khi nhiều instance/tick dồn và không phụ thuộc dữ liệu Notification.

### QA-5 · Bell UI (Chrome headless CDP, dữ liệu API thật)

| Bước | Kết quả | Bằng chứng |
| --- | --- | --- |
| Badge hiện số chưa đọc | PASS | badge=«2» sau khi tạo 2 thông báo mới (screenshot 01) |
| Mở dropdown: danh sách + chấm unread | PASS | 10 mục, 2 unread dot (screenshot 02) |
| Bấm mục unread → mark-read | PASS | badge 2→1 ngay lập tức (react-query invalidate) |
| Bấm mục → điều hướng theo link | PARTIAL | URL đúng `/bookings/CH-20260825-0093` nhưng trang là **404** — xem Finding QA‑T4‑P2‑01 (screenshot 03) |
| «Đánh dấu tất cả đã đọc» | PASS | badge biến mất, 0 unread dot (screenshot 04) |

Screenshot: `.tmp-screens/qa-t4-p2/01…04*.png` (1440×900). *(Thư mục còn chứa vài ảnh từ một phiên chạy song song của thành viên khác trên cùng tài khoản demo — xem §4 Ghi chú.)*

## 3. Finding — ✅ ĐÃ FIX & RE-VERIFIED (lần 2, 2026-08-25 ~16:20)

### QA-T4-P2-01 · Bell điều hướng tới trang 404 — thiếu route chi tiết đơn (Medium-High)

- **Hiện tượng:** mọi notification gắn link `/bookings/<code>`; bấm vào bell điều hướng đúng URL nhưng router web **không có** route `/bookings/:code` ⇒ rơi vào `*` → NotFoundPage («404 · Không tìm thấy trang»). Tái hiện 100% bằng CDP.
- **Phạm vi:** TOÀN BỘ loại thông báo (BOOKING_CONFIRMED/CANCELLED, PAYMENT_RECEIVED, NEW_BOOKING_OWNER, MATCH_JOINED/LEFT, REMINDER) — luồng chính vừa xây ở P2-B2/F1 bị đứt ở bước cuối.
- **Gợi ý sửa (chọn 1):**
  1. Thêm route đọc-đơn `/bookings/:code` (public hoặc protected) — đầy đủ nhất;
  2. Hoặc map link sang trang có sẵn `/dashboard/my-bookings` ở tầng tạo notification/hằng số link.
- **Fix:** `e952073` — toàn bộ link notification trỏ route có sẵn (customer → `/dashboard/my-bookings`, owner → `/dashboard/bookings`).
- **Re-verify PASS:** bấm bell «Thanh toán đã được ghi nhận» → điều hướng `/dashboard/my-bookings`, trang render danh sách đơn («Đơn của tôi»), HẾT 404; badge 4→3 sau khi đọc. Screenshot bộ lần 2 trong `.tmp-screens/qa-t4-p2/`.

### QA-T4-P2-02 · CORS chặn mọi lời gọi API thật từ browser dev (High cho dev/demo, không ảnh hưởng production same-origin)

- **Hiện tượng:** API bật `app.enableCors()` mặc định ⇒ `Access-Control-Allow-Origin: *`. Web gọi với `credentials: 'include'` ⇒ **browser chặn 100% response** khi origin khác cổng (Vite 5173/5174 → API 4000). Đây là lý do P1 phải chạy mock. Để smoke UI lần này phải khởi động Chrome với `--disable-web-security`.
- **Bằng chứng:** preflight `OPTIONS /auth/login` trả `ACAO: *` (thiếu `Allow-Credentials`); mọi fetch thật từ 5173/5174 fail ở bước đọc response.
- **Gợi ý sửa:** `app.enableCors({ origin: true, credentials: true })` (reflect origin) hoặc thêm `server.proxy` cho `/api/v1` trong `vite.config.ts` để dev cùng-origin như cấu hình mặc định `VITE_API_URL=/api/v1` đang kỳ vọng.
- **Fix:** `53c8b46` — `app.enableCors({ origin: true, credentials: true })`.
- **Re-verify PASS:** preflight từ `http://localhost:5174` trả `ACAO: http://localhost:5174` (reflect) + `Allow-Credentials: true`; toàn bộ Bell UI chạy lại trên Chrome headless KHÔNG `--disable-web-security`, profile mới — login → badge → dropdown → mark-read → điều hướng → read-all **PASS hết qua CORS thật**.

### Ghi chú (không phải lỗi P2)

1. **Dữ liệu demo dùng chung:** trong lúc test có ít nhất một phiên chạy song song của thành viên khác trên cùng tài khoản `customer@` (badge «9+», 10 unread rồi bị mark-all-read giữa chừng — các file `01-dashboard-badge-9+.png`, `02-dropdown-open-unread10.png`). Các kết luận trên dựa trên assertion DOM/DB tức thời nên không bị ảnh hưởng.
2. **Gate lint đỏ do file chưa track:** 19 file `stitch_pitch_booking_home/**` — ✅ ĐÃ XỬ LÝ bởi `b2528f0` (`.prettierignore`), stitch không còn bị flag. Lần verify lần 2 (16:19): eslint 0 lỗi; prettier chỉ còn warn 3 file web đang sửa dở CHƯA COMMIT (`public-layout.tsx`, `index.css`, `home-page.tsx`) — sẽ xanh khi format trước commit theo quy trình.

## 4. KẾT LUẬN CUỐI — CHỐT ĐỢT 2 (re-verify lần 2)

| Hạng mục | Lần 1 | Lần 2 (sau fix) |
| --- | --- | --- |
| QA-1..QA-4 nghiệp vụ thông báo | ✅ PASS | ✅ giữ nguyên (không regression) |
| QA-5 Bell UI | ⚠️ 6/7 (404 khi bấm) | ✅ **7/7** — điều hướng `/dashboard/my-bookings` đúng trang, hết 404 |
| CORS dev cross-origin | ❌ Finding QA-T4-P2-02 | ✅ **PASS** — login + toàn flow UI thật KHÔNG cần bypass security |
| Gates | prettier đỏ do WIP untracked | eslint 0 lỗi; `.prettierignore` hiệu lực; còn warn 3 file WIP đang sửa của kỹ sư |

**Kết luận: ĐỢT 2 ĐỦ ĐIỀU KIỆN CHỐT.** Nghiệp vụ thông báo P2-B2 đúng đặc tả, idempotent ở mức database (chịu đồng thời + đa tiến trình); chuông P2-F1 đủ 7/7 tiêu chí trên dữ liệu API thật; cả 2 finding đã fix + được QA verify độc lập. Khuyến nghị nhỏ: format 3 file web WIP trước commit để gate lint xanh tuyệt đối.
