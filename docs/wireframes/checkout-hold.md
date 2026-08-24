# 04 · Giữ chỗ & chuyển cổng thanh toán

## (a) Mục đích & actor
Khẳng định đơn trong **10 phút giữ chỗ**, hiển thị rõ tổng tiền/cọc rồi đưa
khách sang VNPay (hoặc mock) an toàn. **Actor:** khách hàng (đã đăng nhập).

## (b) Wireframe desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        ⏳ HOÀN TẤT TRONG 10 PHÚT                             │
│                     ┌──────────┐                                             │
│                     │  09:41   │   ← đếm ngược từ expiresAt của Hold         │
│                     └──────────┘   (< 2' đổi màu vàng→đỏ, nhấp nháy nhẹ)     │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────┐   ┌─────────────────────────────────────┐ │
│ │ ĐƠN CỦA BẠN                    │   │ THANH TOÁN                          │ │
│ │ Sân Pickleball Saigon · Sân 1  │   │ Tạm tính 3 slot      360.000₫       │ │
│ │ T5 28/08 · 18:00 → 19:30       │   │ Cọc phải trả (30%)   108.000₫       │ │
│ │ ────────────────────           │   │ Còn lại (tại sân)    252.000₫       │ │
│ │ Mã giữ chỗ: #H-9f2c…           │   │ ─────────────────────────────       │ │
│ │ (mã tạm — hết 10' mất slot)    │   │ ( ) Thanh toán CỌC 108.000₫         │ │
│ └────────────────────────────────┘   │ (•) Thanh toán ĐỦ  360.000₫         │ │
│                                      │                                     │ │
│                                      │ Cổng: VNPay Sandbox 🔒              │ │
│                                      │ [Thanh toán qua VNPay →]            │ │
│                                      │ [Hủy giữ chỗ]                       │ │
│                                      └─────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

Trạng thái khác (cùng layout, thay khối phải):

- **HẾT HẠN:** banner đỏ "Giữ chỗ đã hết hạn — slot được nhả cho người khác"
  + `[Quay lại lịch]`. Không cho thanh toán.
- **ĐÃ PAID (quay về từ VNPay thành công):** banner xanh "Đặt sân thành công!"
  + mã đơn `CH-20260828-0007` + QR + `[Xem đơn của tôi]`.
- **THẤT BẠI:** banner vàng "Thanh toán không thành công (sai chữ ký/lệch tiền)"
  + hướng dẫn thử lại (nếu hold còn hạn) hoặc đặt lại.
- **PAYMENT_MODE=mock:** thay nút VNPay bằng `[Thanh toán giả lập (mock)]`
  — môi trường demo dự phòng khi sandbox trục trặc (§11).

**Khác biệt mobile:** đồng hồ đếm ngược sticky top; hai khối xếp dọc; nút
thanh toán full-width sticky bottom.

## (c) Thành phần tương tác
- Countdown: nguồn sự thật là `expiresAt` từ server (không tự đếm từ lúc mở
  trang); chạm 0 → khoá nút, poll trạng thái 1 lần xác nhận EXPIRED.
- Radio cọc/đủ: mặc định chọn CỌC; số tiền đổi theo radio.
- `[Thanh toán qua VNPay]`: disable khi đang gọi API (chống double-click tạo
  2 payment); redirect tab sang cổng.
- `[Hủy giữ chỗ]`: confirm dialog "Nhả slot sớm?" → quay lại booking-grid.
- Quay lại trang này bằng nút Back browser sau khi paid: hiện trạng thái PAID
  (idempotent theo trạng thái server, không cho thanh toán lần 2 cùng hold).

## (d) API sử dụng
- `GET /api/v1/bookings/holds/:id` **[ĐỀ XUẤT]** — chi tiết hold + expiresAt +
  trạng thái (ACTIVE | CONVERTED | EXPIRED).
- `POST /api/v1/payments/checkout {holdId, type: DEPOSIT|FULL}` **[ĐỀ XUẤT —
  hiện thực bước 3 §6.1]** → `{redirectUrl}` (VNPay sandbox hoặc mock);
  `txnRef` sinh server-side UNIQUE làm idempotency key.
- `DELETE /api/v1/bookings/holds/:id` **[ĐỀ XUẤT]** — hủy giữ chỗ sớm.
- Callback VNPay `GET /api/v1/payments/callback?vnp_...` **(§6.1 bước 4)** —
  server-to-server, frontend KHÔNG gọi; kết quả phản ánh qua trạng thái hold/
  booking khi quay về.
