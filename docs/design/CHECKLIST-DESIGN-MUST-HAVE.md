# CHECKLIST THIẾT KẾ & TRẢI NGHIỆM NGƯỜI DÙNG (CHECKLIST-DESIGN MUST-HAVE)

**Dự án:** SanGo — Nền tảng Đặt & Quản lý Sân Thể Thao Trực Tuyến  
**Tiêu chuẩn:** Checklist Design Quốc Tế & Quy Chuẩn UI/UX Thể Thao  
**Mục đích:** Bộ tiêu chí nghiệm thu bắt buộc (Quality Gates) cho từng màn hình và component khi viết lại Frontend.

---

## 1. NAVIGATION, HEADER & FOOTER (ĐIỀU HƯỚNG CỐT LÕI)

- [ ] **Header Sticky & Backdrop Blur:** Header luôn cố định `sticky top-0 z-40` với hiệu ứng làm mờ nền `backdrop-blur-md bg-background/80`.
- [ ] **Logo & Brand Home Link:** Logo SanGo luôn điều hướng về `/`, có nhãn `aria-label="SanGo Trang chủ"`.
- [ ] **Active Route State:** Menu hiện tại có gạch chân hoặc màu nhấn `text-primary font-bold`.
- [ ] **Responsive Mobile Drawer / Menu:** Màn hình < 768px có nút hamburger icon mở menu mobile trượt mượt mà.
- [ ] **User Account Dropdown:** Dropdown menu tài khoản phân nhóm rõ ràng (Đơn đặt sân, Ví, Đội của tôi, Đổi mật khẩu, Đăng xuất).
- [ ] **Notification Bell Badge:** Icon chuông có badge đỏ hiển thị `unreadCount` realtime nếu có thông báo mới.
- [ ] **Footer Toàn Diện:** Footer nền navy chứa thông tin bản quyền, liên kết Về chúng tôi (`/about`), Dành cho chủ sân (`/partner`), mạng xã hội, hotline hỗ trợ.

---

## 2. KHÁM PHÁ SÂN, BỘ LỌC & BẢN ĐỒ (DISCOVERY & MAP UX)

- [ ] **Tìm kiếm tức thì (Debounced Search):** Ô tìm kiếm tên sân tự động debounce 300ms, không spam API request.
- [ ] **Bộ lọc đa tiêu chí:** Lọc đồng thời theo Môn thể thao, Quận/Huyện, Khoảng giá Min-Max, Khung giờ sáng/chiều/tối.
- [ ] **Định vị GPS "Gần tôi":** Nút định vị GPS một chạm yêu cầu quyền Geolocation chuẩn, hỗ trợ bán kính tinh chỉnh gần hơn: **1km / 2km / 5km / 10km**.
- [ ] **Card sân thể thao (Venue Card):**
  - [ ] Ảnh thumbnail có tỉ lệ cố định `aspect-[16/10]` với hiệu ứng `group-hover:scale-105`.
  - [ ] Chip môn thể thao + Chip cự ly ("Cách bạn 1.8 km").
  - [ ] Tên sân đậm nét, địa chỉ quận/thành phố rõ ràng.
  - [ ] Đánh giá sao trung bình (`4.8 ★ (120)`) và giá từ `font-score font-bold`.
  - [ ] Fallback hình ảnh gradient đẹp mắt nếu sân chưa có ảnh.
- [ ] **Bản đồ Leaflet (Map Page):**
  - [ ] Tự động gọi `map.invalidateSize()` khi render để chống xé hình và mất tile.
  - [ ] Marker custom icon có màu thương hiệu Turf Green cho sân thể thao.
  - [ ] Click vào marker hiển thị Card thông tin nổi (Quick Preview) kèm nút "Đặt sân ngay".
  - [ ] Zoom control và nút GPS "Về vị trí của tôi" đặt ở góc dễ thao tác bằng 1 ngón tay.

---

## 3. LUỒNG ĐẶT SÂN, GIỮ CHỖ & THANH TOÁN (CORE BOOKING FLOW)

- [ ] **Lịch chọn ngày thông minh:** Hiển thị 7 - 14 ngày kế tiếp, tự động highlight ngày hôm nay theo giờ VN (`vnToday()`).
- [ ] **Ma trận khung giờ (Slot Matrix):**
  - [ ] Phân biệt trực quan 4 trạng thái: Có thể đặt (Trắng/Xanh), Đang giữ (Vàng), Đã đặt (Xám gạch ngang), Bảo trì (Sọc cam).
  - [ ] Hỗ trợ chọn nhiều slot liền kề (Contiguous slots) của cùng một sân con.
  - [ ] Tính tổng tiền tạm tính realtime khi click chọn từng ô slot.
- [ ] **Countdown Timer Giữ chỗ 10 phút (Hold Countdown):**
  - [ ] Thanh đếm ngược hiển thị rõ số phút:giây còn lại (`09:45`).
  - [ ] Chuyển màu vàng cam khi còn < 3 phút, chuyển đỏ khi còn < 1 phút.
  - [ ] Modal cảnh báo khi hết hạn (Expired) và tự động hoàn trả slot cho người khác đặt.
- [ ] **Trang Checkout & Áp dụng Voucher:**
  - [ ] Lựa chọn rõ ràng giữa Đặt cọc (Deposit %) và Thanh toán toàn bộ (Full 100%).
  - [ ] Ô nhập mã Voucher có nút "Áp dụng", hiển thị số tiền được giảm trừ và thông báo lỗi rõ ràng nếu không đủ điều kiện (ví dụ: chỉ áp dụng giờ thấp điểm).
  - [ ] Lựa chọn phương thức thanh toán linh hoạt: Cổng VNPAY / Số dư Ví SanGo / Chế độ Thử nghiệm Mock.
- [ ] **Trang Kết quả Thanh toán & Check-in QR:**
  - [ ] Trạng thái Thành công: Checkmark animation xanh + mã đơn `CH-YYYYMMDD-NNNN` + QR Code check-in.
  - [ ] Trạng thái Thất bại: Icon cảnh báo đỏ + lý do chi tiết từ cổng thanh toán + nút "Thử lại / Chọn giờ khác".

---

## 4. QUẢN LÝ ĐƠN ĐẶT SÂN (MY BOOKINGS UX)

- [ ] **Tabs phân loại trạng thái:** 4 Tab riêng biệt: Tất cả / Sắp diễn ra / Hoàn thành / Đã huỷ.
- [ ] **Thao tác nhanh trên từng đơn:**
  - [ ] Đơn `CONFIRMED`: Nút "Xem mã QR check-in" (mở modal QR khổ lớn để đưa cho chủ sân quét) và nút "Huỷ đơn".
  - [ ] Đơn `COMPLETED`: Nút "Đánh giá sân" (mở form chấm sao 1-5 và viết review).
- [ ] **Xem trước hoàn tiền (Refund Preview Modal):** Khi nhấn "Huỷ đơn", hiển thị bảng tính minh bạch: Thời gian hủy còn bao lâu, % được hoàn lại theo chính sách (100% / 50% / 0%), số tiền hoàn về ví, và cảnh báo điểm uy tín.

---

## 5. FORMS, VALIDATION & XÁC THỰC (AUTHENTICATION & FORMS)

- [ ] **Validation Realtime (React Hook Form + Zod):** Báo lỗi ngay dưới từng ô input khi blur hoặc submit với câu thông báo tiếng Việt tự nhiên.
- [ ] **Ẩn / Hiện Mật khẩu:** Nút icon con mắt (Eye / EyeOff) ở mọi ô mật khẩu.
- [ ] **Trạng thái Loading trên nút bấm (Button Loading):** Khi đang gửi dữ liệu (isSubmitting / isPending), nút bấm hiển thị spinner và bị `disabled`, chống double-click.
- [ ] **Auto Focus & Tab Order:** Người dùng có thể nhấn Tab để di chuyển tuần tự qua các trường nhập liệu một cách tự nhiên.
- [ ] **Session Refresh Tự Động:** Khi access token hết hạn (401), API client tự động gọi `/auth/refresh` bằng cookie xoay vòng mà không làm gián đoạn trải nghiệm người dùng.

---

## 6. VÍ CÁ NHÂN & SỔ QUỸ ĐỘI (WALLET & TREASURY UX)

- [ ] **Định dạng tiền tệ chuẩn:** Mọi số tiền đều format `150.000 đ` bằng `font-score font-bold`.
- [ ] **Toggle Ẩn/Hiện Số dư:** Nút bật/tắt hiển thị số dư ví `••••••` để bảo vệ quyền riêng tư ở nơi công cộng.
- [ ] **Nạp tiền ví trực quan:** Các nút chọn nhanh mệnh giá phổ biến (50k, 100k, 200k, 500k, 1tr) kèm ô nhập tùy chỉnh.
- [ ] **Nhật ký thu chi có màu phân biệt:**
  - Tiền vào (Cộng tiền): Màu xanh lá kèm icon `+` (Nạp tiền, Hoàn tiền hủy đơn, Tiền thưởng).
  - Tiền ra (Trừ tiền): Màu đỏ/xám kèm icon `-` (Thanh toán sân, Đóng quỹ đội).

---

## 7. DASHBOARD CHỦ SÂN & ADMIN (MANAGEMENT UX)

- [ ] **Sidebar Điều Hướng Đa Tầng:** Menu phân cấp rõ ràng theo nghiệp vụ (Cụm sân, Sân con, Bảng giá giờ vàng, Đơn đặt sân, Check-in vé, Voucher, Doanh thu).
- [ ] **Công cụ Quét / Nhập Check-in Siêu Tốc:** Ô nhập mã vé `CH-...` với tính năng tự động tìm kiếm và nút "Xác nhận Check-in" tức thì.
- [ ] **Data Table Chuyên Nghiệp:** Bảng dữ liệu có phân trang, tìm kiếm, lọc theo ngày, sort cột và trạng thái Empty State khi không có kết quả.
- [ ] **Biểu đồ Thống kê Doanh thu (Chart.js):** Biểu đồ cột/đường trực quan biểu diễn doanh thu theo ngày và tỷ lệ lấp đầy sân.

---

## 8. ACCESSIBILITY, DARK MODE & HIỆU NĂNG (A11Y & PERFORMANCE)

- [ ] **Tương phản màu sắc (WCAG AA):** Tỷ lệ tương phản chữ trên nền tối thiểu 4.5:1 ở cả Light mode và Dark mode.
- [ ] **Focus Visible:** Mọi nút bấm, input, link đều có viền `ring-2 ring-ring ring-offset-2` khi điều hướng bằng phím Tab.
- [ ] **Tương thích Thiết bị Di động (Mobile Touch Targets):** Mọi nút bấm và control đều có diện tích chạm tối thiểu `44x44px`.
- [ ] **Không FOUC (Flash of Unstyled Content):** Script kiểm tra theme trong `<head>` của `index.html` áp dụng class `.dark` trước khi render React.
- [ ] **Skeleton Loading & Empty States:** Mọi trang và danh sách đều có Skeleton Loader nhấp nháy khi đang tải dữ liệu và Empty State kèm hình minh họa + nút CTA khi không có dữ liệu.
