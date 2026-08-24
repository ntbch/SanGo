# 03 · Lịch tuần chọn slot ⭐

## (a) Mục đích & actor
Màn quan trọng nhất: khách chọn sân con, xem lịch tuần trực quan 4 màu trạng
thái slot, chọn nhiều slot **liền kề** thành một đơn rồi giữ chỗ để thanh
toán. **Actor:** khách hàng — **bắt buộc đăng nhập mới giữ chỗ được** (§2).

## (b) Wireframe desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Sân Pickleball Saigon     Sân con: [Sân 1 ▼]  [Sân 3 ▼]      Tuần ‹ 24–30/8›│
├──────────────────────────────────────────────────────────────────────────────┤
│        │ T2 25/8 │ T3 26/8 │ T4 27/8 │ T5 28/8 │ T6 29/8 │ T7 30/8 │ CN 31/8│
│ 06:00  │    ░    │    ░    │    ░    │    ░    │    ░    │    ░    │    ░   │
│ 06:30  │    ░    │    ▓    │    ░    │    ░    │    ░    │    ▓    │    ░   │
│  ...   │   ...   │   ...   │   ...   │   ...   │   ...   │   ...   │  ...   │
│ 18:00  │    ▒    │    ░    │    ░    │ [░✓]   │    ░    │    ▓    │    ░   │
│ 18:30  │    █    │    ░    │    ░    │ [░✓]   │    ░    │    ▓    │    ░   │
│ 19:00  │    ░    │    ░    │    ░    │ [░✓]   │    ░    │    ▒    │    ░   │
│ 22:00  │    █    │    █    │    █    │    █    │    █    │    █    │    █   │
├──────────────────────────────────────────────────────────────────────────────┤
│ Chú thích: ░ Trống  ▓ Đã kín  ▒ Đang giữ  █ Ngoài giờ/quá hạn                │
│ 💡 Gợi ý cho bạn: [T5 18:00–19:00 phổ biến nhất] [CN sáng ít người]  (AI-2)  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Đã chọn 3 slot liền kề · T5 28/8 · 18:00–19:30                               │
│ Tổng tiền: 360.000₫ · Cọc 30% = 108.000₫          [Xoá chọn] [Giữ chỗ & Thanh toán →] │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Khác biệt mobile:** chuyển sang **1 ngày/màn hình** — dải ngày cuộn ngang,
slot liệt kê dạng chip dọc; multi-select bằng tap; tổng tiền + CTA thành
**sticky bottom bar**; legend thu thành chấm màu.

## (c) Thành phần tương tác
- Court selector (tab/dropdown): chỉ hiện sân `ACTIVE`; `MAINTENANCE` disabled.
- Week strip: ‹ › đổi tuần; ô ngày hôm qua trở về trước disabled.
- Grid slot (bước = `slotMinutes` của court: 60'/90'; hàng phụ 30' nếu cần):
  - `░` trống: click chọn/bỏ chọn; kéo chuột quét dải; **client validate liền
    kề** — chọn rời rạc thì rung ô + toast "Chỉ chọn slot liền kề".
  - `▓` kín / `▒` đang giữ / `█` ngoài giờ: disabled + tooltip lý do.
  - Slot đã qua thời điểm hiện tại của ngày hôm nay hiển thị như `█`.
- Dải gợi ý AI-2 (GĐ2): chip gợi ý bấm là preselect dải slot; **placeholder ở
  GĐ1** — ẩn hoàn toàn khi chưa tới GĐ2.
- Thanh tổng: số slot, mốc giờ, tổng theo `PricingRule` (WEEKDAY/WEEKEND),
  cọc = `depositPercent` của venue; nút `[Xoá chọn]`, `[Giữ chỗ & Thanh toán]`.
- Xử lý 409: nếu giữ chỗ bị trả `SLOT_TAKEN` → refresh grid vùng đó + toast đỏ
  "Slot vừa có người đặt" (race vẫn có thể xảy ra dù client check).
- Chưa đăng nhập bấm giữ chỗ → modal đăng nhập/đăng ký rồi quay lại đúng lựa
  chọn (giữ state selection).

## (d) API sử dụng
- `GET /api/v1/courts/:id/slots?from=YYYY-MM-DD&days=7` **[ĐỀ XUẤT]** — trả ma
  trận trạng thái 4 màu + giá từng slot theo PricingRule (server tính để tránh
  lệch giá client).
- `POST /api/v1/bookings/hold {courtId, date, slots[]}` **(§6.1 chuẩn)** —
  server re-validate liền kề + trong giờ mở cửa; lỗi:
  `SLOT_TAKEN`, `SLOTS_NOT_ADJACENT`, `OUT_OF_OPENING_HOURS` (§4 error shape).
- Thành công → điều hướng `checkout-hold.md` kèm holdId.
