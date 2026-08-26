# 01 · Trang chủ — Tìm kiếm sân

## (a) Mục đích & actor
Cửa ngõ vào sản phẩm: khách tìm cụm sân theo loại sân/khu vực/thời gian rồi
vào trang chi tiết. **Actor:** khách hàng (chưa đăng nhập vẫn xem được — §2);
chủ sân/admin cũng dùng làm điểm neo điều hướng.

## (b) Wireframe desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚽ SanGo   [Tìm sân]  [Đơn của tôi]              [Đăng nhập] [Đăng ký]    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│            Tìm sân thể thao gần bạn                                          │
│  ┌──────────────────┐ ┌─────────▼┐ ┌──────────────┐ ┌───────────┐ ┌───────┐ │
│  │ Tên sân/khu vực  │ │Loại sân ▼│ │ Ngày chơi    │ │ Khung giờ │ │[Tìm 🔍]│ │
│  └──────────────────┘ └──────────┘ └──────────────┘ └───────────┘ └───────┘ │
│                                                                              │
├────────────┬─────────────────────────────────────────────────────────────────┤
│ BỘ LỌC     │  Kết quả (24 sân)        Sắp xếp: [Phổ biến ▼]                 │
│ Loại sân   │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│ [x] Bóng đá5│  │ [ảnh sân]  │ │ [ảnh sân]  │ │ [ảnh sân]  │ │ [ảnh sân]  │   │
│ [x] Pickle │ │ Sân A ★4.8 │ │ Sân B ★4.6 │ │ Sân C      │ │ Sân D      │   │
│ [ ] Cầu lông│ │ Q.BìnhThạnh│ │ Q.1        │ │ Q.GoVap    │ │ Q.ThuDuc   │   │
│ [ ] Tennis │ │ từ 120k/h  │ │ từ 90k/h   │ │ ...        │ │ ...        │   │
│ Giá ≤ [──●──┤ │ [Đặt ngay] │ │ [Đặt ngay] │ │ [Đặt ngay] │ │ [Đặt ngay] │   │
│ Tiện ích ▾ │ └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│            │  ‹ 1 2 3 ›                                                    │
└────────────┴─────────────────────────────────────────────────────────────────┘
```

**Khác biệt mobile:** search bar thành 1 hàng cuộn ngang dưới hero; bộ lọc thu
vào nút nổi `[⚙ Bộ lọc]` mở bottom-sheet; grid card 1 cột; tab bar dưới
(Tìm · Đơn · Tài khoản).

## (c) Thành phần tương tác
- Search bar: text input (debounce), select loại sân (enum cố định v1 — lấy từ
  `SPORT_TYPE_LABELS` của `@sango/shared`, không cần gọi API), date picker,
  khung giờ (select start/end theo bước 30').
- Bộ lọc: checkbox loại sân, slider giá tối đa, đa chọn tiện ích, sort select.
- Card sân: hover nâng khối; click → `venue-detail`. Nút `[Đặt ngay]` → thẳng
  `booking-grid` của sân đó (nếu chưa đăng nhập: cho xem, chặn lúc giữ chỗ).
- Trạng thái: skeleton khi loading; empty-state "Không tìm thấy sân phù hợp"
  + gợi ý xóa filter; phân trang hoặc infinite scroll (chọn 1, ghi chú đây).

## (d) API sử dụng
- `GET /api/v1/venues?sportType=&q=&date=&startMinute=&endMinute=&maxPrice=&amenities=&sort=&page=` **[ĐỀ XUẤT query params — §3.2 chỉ chốt tính năng tìm kiếm]**
- Chỉ trả sân `APPROVED` (§3.2 — sân mới phải được admin duyệt mới công khai).
- Danh sách loại sân: hardcode từ `@sango/shared` (enum cố định v1).
