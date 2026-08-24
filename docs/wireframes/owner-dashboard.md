# 06 · Dashboard chủ sân

## (a) Mục đích & actor
Trung tâm điều hành cho chủ sân: quản lý cụm sân/sân con (wizard nhiều bước),
editor bảng giá khung giờ × loại ngày, xử lý đơn (check-in/hủy hộ/no-show).
**Actor:** chủ sân (OWNER) — RBAC `@Roles('OWNER')` + ownership check (§7).

## (b) Wireframe desktop (shell + 3 vùng chức năng)

```
┌───────────┬──────────────────────────────────────────────────────────────────┐
│ SIDEBAR   │  Sân Pickleball Saigon                    [● APPROVED]           │
│           ├──────────────────────────────────────────────────────────────────┤
│ Tổng quan │  TAB: [Thông tin] [Sân con] [Bảng giá] [Đơn hàng]                │
│ Cụm sân ◂─┤                                                                  │
│ Bảng giá  │  ── WIZARD THÔNG TIN (tạo/sửa cụm sân, nhiều bước) ──            │
│ Đơn hàng  │  (1 Thông tin → 2 Ảnh → 3 Sân con → 4 Xem trước & gửi duyệt)     │
│ Đánh giá  │  Bước 1/4 ●○○○                                                   │
│           │  Tên: [__________________] Slug: san-pickleball-saigon (auto)    │
│ ──────────│  Địa chỉ: [______________] Toạ độ: [Chọn trên bản đồ 🗺]          │
│ 👤 Owner  │  Giờ mở cửa: [06:00 ▼] – [23:00 ▼]  Cọc %: [30 ▼]                │
│ [Đăng xuất]│ Tiện ích: [x]Ánh sáng [x]Trạm nước [ ]Phòng đổi đồ [+Thêm]      │
└───────────┴──────────────────────────────────────────────────────────────────┘

BƯỚC 2 — ẢNH:  [Kéo-thả ảnh vào đây] hoặc [Chọn file]   (lưu Cloudinary)
               [img1][img2][img3 ✕]

BƯỚC 4 — Trạng thái sau gửi duyệt: banner vàng "Đang chờ admin duyệt (PENDING)"
         hoặc banner đỏ "Bị từ chối: <rejectReason>" + [Chỉnh sửa & gửi lại].

── EDITOR BẢNG GIÁ (court: [Sân 1 ▼], slot 60') ───────────────────────────────
│ Khung giờ      │ NGÀY THƯỜNG (T2–T5) │ CUỐI TUẦN (T6–CN) │                  │
│ 06:00–12:00    │ [150.000₫]          │ [200.000₫]        │                  │
│ 12:00–18:00    │ [180.000₫]          │ [250.000₫]        │                  │
│ 18:00–23:00    │ [250.000₫]          │ [300.000₫]        │                  │
│ [Copy từ cột trái→phải]  [+Thêm khung giờ]  [Lưu bảng giá]                   │
│ (ô trống = dùng defaultPricePerSlot của court)                               │

── BẢNG ĐƠN HÀNG (filter: [Hôm nay ▼] [Trạng thái ▼] [Sân con ▼]) ────────────
│ Mã đơn        │ Giờ chơi    │ Khách        │ Trạng thái │ Hành động         │
│ CH-…-0007     │ 28/8 18:00  │ Minh T.      │ CONFIRMED  │ [Check-in] [Hủy]  │
│ CH-…-0009     │ 28/8 19:30  │ Lan P.       │ CHECKED_IN │ [No-show]         │
│ Nhập/quét mã: [CH-__________] [Check-in nhanh]                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Khác biệt mobile:** sidebar thu hamburger drawer; wizard thành stepper full-
width; bảng giá cuộn ngang; bảng đơn chuyển card stack, action nút icon.

## (c) Thành phần tương tác
- Wizard 4 bước: validation từng bước (slug tự sinh từ tên, toạ độ pick từ
  Leaflet mini-map), lưu nháp ở client đến bước 4 mới submit; trạng thái venue:
  sửa được cả khi PENDING/REJECTED, trường khoá khi APPROVED (liên hệ admin).
- Ảnh: preview + xoá; upload thẳng Cloudinary qua chữ ký server (signed
  upload), giới hạn số ảnh.
- Editor bảng giá: ma trận khung giờ × DayType; ô số nguyên VND; validate
  khung giờ không chồng lấn; `[Copy trái→phải]` tiện cuối tuần; lưu batch.
- Bảng đơn: filter ngày/trạng thái/sân con; hành động:
  - `[Check-in]` / `[Check-in nhanh]`: nhập mã CH-… hoặc quét camera → xác
    nhận thông tin đơn → chuyển CHECKED_IN (§6.3); lỗi mã sai/không thuộc venue
    mình → toast đỏ.
  - `[Hủy]`: hộp lý do **bắt buộc** (hủy hộ khách) → cùng chính sách hoàn §6.2.
  - `[No-show]`: confirm kép → NO_SHOW (không hoàn cọc).
- Badge trạng thái venue: PENDING vàng / APPROVED xanh / REJECTED đỏ kèm lý do.

## (d) API sử dụng
- `POST /api/v1/venues` · `PUT /api/v1/venues/:id` **[ĐỀ XUẤT shape]** — gửi
  duyệt = POST với `status` mặc định PENDING phía server (client không set).
- `POST /api/v1/venues/:id/courts` · `PUT /api/v1/courts/:id` **[ĐỀ XUẤT]**
- `PUT /api/v1/courts/:id/pricing-rules` **[ĐỀ XUẤT — batch mảng rule]**
- Upload ảnh: `POST /api/v1/uploads/sign` **[ĐỀ XUẤT]** → PUT thẳng Cloudinary.
- `GET /api/v1/owner/bookings?venueId=&date=&status=` **[ĐỀ XUẤT]**
- `POST /api/v1/bookings/check-in {code}` **[ĐỀ XUẤT body — luồng §6.3 chuẩn]**
- `POST /api/v1/bookings/:id/no-show` **[ĐỀ XUẤT]**
- Hủy hộ: `DELETE /api/v1/bookings/:id {reason}` **(§6.2 — owner/admin được
  hủy hộ; reason đưa vào query/body do DELETE không mang body truyền thống —
  chốt cùng backend)**
