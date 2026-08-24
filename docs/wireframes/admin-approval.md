# 07 · Admin duyệt sân mới

## (a) Mục đích & actor
Admin xử lý hàng chờ cụm sân mới: xem đủ ngữ cảnh rồi DUYỆT (công khai) hoặc
TỪ CHỐI kèm lý do (lưu `rejectReason` để owner sửa và gửi lại). **Actor:** Admin.

## (b) Wireframe desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Quản trị sân        (•) Chờ duyệt (12)  ( ) Đã duyệt  ( ) Bị từ chối         │
│                    Tìm: [__________________] 🔍                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ [ảnh][ảnh][ảnh]  Sân Pickleball Saigon        Gửi lúc: 27/08 09:14     │ │
│ │                  slug: san-pickleball-saigon                           │ │
│ │                  📍 Gò Vấp · 06:00–23:00 · Cọc 30%                     │ │
│ │                  Chủ sân: owner@mail.com · 3 sân con                   │ │
│ │                  Tiện ích: Ánh sáng · Trạm nước                        │ │
│ │                                  [Xem chi tiết ↗] [✓ Duyệt] [✕ Từ chối]│ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│ ⋯ (các card tiếp theo)                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ MODAL TỪ CHỐI                                                               │
│ ┌────────────────────────────────────────────────────────┐                 │
│ │ Từ chối "Sân Pickleball Saigon"                        │                 │
│ │ Lý do (BẮT BUỘC, gửi thẳng cho chủ sân):               │                 │
│ │ [Ảnh chưa đủ rõ mặt sân. Bổ sung tối thiểu 4 ảnh.]     │                 │
│ │                                    [Thoát] [Xác nhận từ chối]           │ │
│ └────────────────────────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Khác biệt mobile:** card stack dọc; 3 nút hành động thành hàng sticky dưới
card; modal từ chối thành bottom-sheet.

## (c) Thành phần tương tác
- Tabs trạng thái + counter số lượng; search theo tên/slug/owner.
- Card: thumbnail gallery mini; `[Xem chi tiết ↗]` mở venue-detail dạng
  preview (chưa công khai).
- `[✓ Duyệt]`: confirm nhẹ ("Sân sẽ công khai?") → card rời hàng chờ + toast.
- `[✕ Từ chối]`: modal textarea **bắt buộc** (nút confirm disabled khi rỗng)
  → `rejectReason` hiển thị lại cho owner ở dashboard.
- Empty-state "Không còn sân chờ duyệt 🎉"; optimistic update + rollback khi lỗi.
- Route bảo vệ middleware: chỉ role ADMIN vào được (RBAC §7).

## (d) API sử dụng
- `GET /api/v1/admin/venues?status=PENDING&page=&q=` **[ĐỀ XUẤT]**
- `GET /api/v1/admin/venues/:id` **[ĐỀ XUẤT — chi tiết phục vụ preview]**
- `POST /api/v1/admin/venues/:id/approve` **[ĐỀ XUẤT — vòng đời §3.2]**
- `POST /api/v1/admin/venues/:id/reject {reason}` **[ĐỀ XUẤT — reason →
  rejectReason §5]**
- Tất cả endpoint trên nằm sau guard `@Roles('ADMIN')`.
