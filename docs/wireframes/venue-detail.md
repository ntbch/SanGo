# 02 · Chi tiết cụm sân

## (a) Mục đích & actor
Xem đầy đủ thông tin một cụm sân: ảnh, vị trí bản đồ, tiện ích, các sân con +
bảng giá từ, đánh giá của người chơi thật. **Actor:** khách hàng (công khai).

## (b) Wireframe desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Tìm sân                                    Sân Pickleball Saigon ⭐ 4.8 (36)│
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────┐  📍 12 Nguyễn Văn Bảo, Q.Gò Vấp          │
│ │                                  │  🕖 Mở cửa 06:00 – 23:00                 │
│ │        ẢNH CHÍNH (16:9)          │  💳 Cọc 30% · Hủy >24h hoàn 100%         │
│ │         ‹   1/6   ›              │  Tiện ích: [Toilet][Ánh sáng][Trạm nước] │
│ ├────┬────┬────┬────┬────┬────┤       │  [🧭 Xem trên bản đồ lớn]               │
│ │thmb│thmb│thmb│thmb│thmb│thmb│       │ ┌──────────────────────────────┐         │
│ └────┴────┴────┴────┴────┴────┘       │ │   BẢN ĐỒ LEAFLET (embed)     │         │
│                                      │ │        📍                    │         │
│                                      │ └──────────────────────────────┘         │
├──────────────────────────────────────────────────────────────────────────────┤
│ SÂN CON (3)                                                                 │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐  │
│ │ Sân 1 · Pickleball   │ │ Sân 2 · Pickleball   │ │ Sân 3 · Bóng đá 5    │  │
│ │ Slot 60' · ACTIVE    │ │ Slot 60' · BẢO TRÌ   │ │ Slot 90'             │  │
│ │ từ 120.000₫/slot     │ │ (tạm ngưng)          │ │ từ 400.000₫/slot     │  │
│ │ [Chọn giờ →]         │ │                      │ │ [Chọn giờ →]         │  │
│ └──────────────────────┘ └──────────────────────┘ └──────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────────┤
│ ĐÁNH GIÁ (36)   ⭐ 4.8                                                        │
│ ★★★★★ "Sân mới, bóng đẹp..." — Minh T. · 12/08  ⋯ (phân trang)              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Khác biệt mobile:** gallery swipe full-width; bản đồ thu accordion "Xem bản đồ";
card sân con dọc; **sticky bottom bar** `[Chọn giờ — từ 120k]`.

## (c) Thành phần tương tác
- Gallery: mũi tên ‹ ›, click thumb, lightbox phóng to; ảnh load lazy.
- Court card: sân `MAINTENANCE` disabled + tooltip; `[Chọn giờ]` →
  `booking-grid` với courtId được chọn.
- Bản đồ Leaflet: marker từ lat/lng; nút mở overlay bản đồ lớn.
- Reviews: pager; form đánh giá KHÔNG nằm ở đây — chỉ vào được từ
  `my-bookings` khi đơn COMPLETED (§3.8: chỉ người có đơn hoàn tất).
- Trạng thái: 404 nếu slug không tồn tại hoặc chưa APPROVED (ẩn với khách).

## (d) API sử dụng
- `GET /api/v1/venues/:slug` **[ĐỀ XUẤT shape — trả venue + courts[] + amenities]**
- `GET /api/v1/venues/:id/reviews?page=&size=` **[ĐỀ XUẤT — §3.8]**
- Giá "từ": min(`defaultPricePerSlot`, các `PricingRule`) — backend tính sẵn.
