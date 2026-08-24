# Wireframe các màn chính — CourtHub (low-fi)

> **⚠️ GHI CHÚ ĐỊNH HƯỚNG:** đây là wireframe **low-fi** nhằm chốt cấu trúc,
> thành phần và luồng chức năng để các task frontend có điểm tựa thống nhất.
> Frontend **có toàn quyền cải tiến UI/UX** (visual, layout tinh, micro-interaction)
> miễn là **giữ đủ chức năng** và đúng các trạng thái/API đã liệt kê.

## Danh mục màn

| # | File | Màn hình | Actor |
|---|---|---|---|
| 1 | `home-search.md` | Trang chủ: tìm kiếm + filter + grid sân | Khách (kể cả chưa đăng nhập) |
| 2 | `venue-detail.md` | Chi tiết cụm sân: gallery, court, bản đồ, review | Khách |
| 3 | `booking-grid.md` ⭐ | Lịch tuần chọn slot (trái tim sản phẩm) | Khách đã đăng nhập khi đặt |
| 4 | `checkout-hold.md` | Giữ chỗ 10 phút + chuyển cổng thanh toán | Khách |
| 5 | `my-bookings.md` | Đơn của tôi + hủy/mức hoàn + đánh giá | Khách đã đăng nhập |
| 6 | `owner-dashboard.md` | Quản lý cụm sân/bảng giá/đơn + check-in | Chủ sân (OWNER) |
| 7 | `admin-approval.md` | Hàng chờ duyệt sân mới | Admin |
| 8 | `ai-chat-widget.md` | Trợ lý đặt sân AI (floating widget) | Khách (createHold cần đăng nhập) |

## Quy ước ký hiệu ASCII

| Ký hiệu | Ý nghĩa |
|---|---|
| `┌ ─ ┐ │ └ ┘` | Khung vùng/layout |
| `[ Nhãn ]` | Nút bấm |
| `[ Nhãn ▼]` | Dropdown / select |
| `(•)` / `( )` | Radio chọn / không chọn |
| `[x]` / `[ ]` | Checkbox bật / tắt |
| `‹ ›` | Điều hướng trái/phải (carousel, pager) |
| `⋯` | Vùng dữ liệu lặp (card, row) |
| `░▒▓` | Trạng thái nền ô slot (xem booking-grid) |

## Quy ước API trong tài liệu

- Endpoint viết dạng `/api/v1/...` theo đặc tả §4.
- Endpoint **in kèm (§6.x)** là những gì đặc tả đã chốt — **bắt buộc đúng**.
- Endpoint đánh dấu **[ĐỀ XUẤT]** là thiết kế bổ sung hợp lý từ §3–§6 nhưng
  đặc tả chưa nêu đuôi URL/chính xác — **frontend và backend cần chốt chung**
  trong task API tương ứng trước khi code.
- Mọi lỗi nghiệp vụ trả thống nhất `{ statusCode, message, code }` (§4),
  ví dụ `SLOT_TAKEN`, `HOLD_EXPIRED`.

## Màu trạng thái slot (chuẩn dùng xuyên suốt)

| Trạng thái | Ký hiệu | Gợi ý màu UI |
|---|---|---|
| Trống (đặt được) | `░` | trắng viền xanh |
| Đã kín | `▓` | xám |
| Đang giữ (hold người khác) | `▒` | vàng hổ phách |
| Ngoài giờ mở cửa / quá hạn | `█` | xám đậm disabled |
