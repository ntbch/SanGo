# 05 · Đơn của tôi

## (a) Mục đích & actor
Khách theo dõi các đơn đã đặt: mã đơn + QR check-in, badge trạng thái, hủy đơn
với **mức hoàn dự kiến** hiện trước khi xác nhận, đánh giá sân sau trận.
**Actor:** khách hàng đã đăng nhập.

## (b) Wireframe desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Đơn của tôi      (•) Sắp chơi   ( ) Lịch sử   ( ) Đã hủy        [Tìm sân →] │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ CH-20260828-0007   Sân Pickleball Saigon · Sân 1                       │ │
│ │ T5 28/08 · 18:00–19:30 · 3 slot                     [● CONFIRMED]      │ │
│ │ [QR ▦]  Cọc 108.000₫ / 360.000₫        [Hủy đơn]  [Xem chi tiết]       │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ CH-20260815-0012   Sân Bóng đá Hoa Lư · Sân 7                          │ │
│ │ T5 15/08 · 18:00–19:30              [● COMPLETED]                      │ │
│ │                         [⭐ Đánh giá]   ⋯ hoặc "Đã đánh giá ★★★★★"      │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│ ⋯                                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ MODAL HỦY ĐƠN (mở từ [Hủy đơn])                                             │
│ ┌──────────────────────────────────────────────────────────┐               │
│ │ Hủy đơn CH-20260828-0007?                                │               │
│ │ Giờ chơi: T5 28/08 18:00 · Còn ~2 ngày                   │               │
│ │ ➜ Mức hoàn dự kiến: HOÀN 100% = 108.000₫                 │               │
│ │   (chính sách: >24h hoàn 100% · 12–24h hoàn 50% · <12h 0%)│              │
│ │ Lý do (không bắt buộc): [____________________]           │               │
│ │                        [Giữ đơn]  [Xác nhận hủy]         │               │
│ └──────────────────────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Khác biệt mobile:** mỗi đơn 1 card dọc; QR bấm phóng full-screen; modal hủy
thành bottom-sheet; tab filter thành segmented control ngang.

## (c) Thành phần tương tác
- Tabs lọc: `Sắp chơi` (CONFIRMED/CHECKED_IN), `Lịch sử` (COMPLETED/NO_SHOW),
  `Đã hủy` (CANCELLED); empty-state mỗi tab.
- Badge màu: CONFIRMED xanh · CHECKED_IN teal · COMPLETED xám · CANCELLED đỏ ·
  NO_SHOW đen nhạt — đồng bộ bộ màu booking-grid.
- QR: chỉ với CONFIRMED/CHECKED_IN; bấm phóng to để chủ sân quét (§6.3).
- `[Hủy đơn]`: chỉ với CONFIRMED; mở modal hiển thị **mức hoàn dự kiến** tính
  từ khoảng cách giờ chơi (>24h 100% · 12–24h 50% · <12h 0% — §6.2), xác nhận
  rồi gọi API. Sau hủy: toast "Đã hủy — hoàn X₫ trong bản ghi Payment REFUND".
- `[⭐ Đánh giá]`: chỉ với COMPLETED và chưa có review (§3.8: 1 đơn 1 đánh giá);
  dialog chọn sao 1–5 + comment → gửi → nút biến thành "Đã đánh giá".
- Phân trang/cuộn vô hạn danh sách.

## (d) API sử dụng
- `GET /api/v1/bookings/me?filter=s upcoming|history|cancelled&page=` **[ĐỀ XUẤT]**
- `GET /api/v1/bookings/:id/refund-preview` **[ĐỀ XUẤT]** — mức hoàn server tính
  (nguồn sự thật duy nhất); fallback: client tự tính theo quy tắc §6.2 nếu BE
  chưa kịp có endpoint này — ghi rõ trong code comment để chốt sau.
- `DELETE /api/v1/bookings/:id` **(§6.2 chuẩn)** — khách hủy đơn của mình;
  server tạo Payment(REFUND) + trả số tiền hoàn thực tế.
- `POST /api/v1/bookings/:id/review {rating, comment}` **[ĐỀ XUẤT — §3.8]**
