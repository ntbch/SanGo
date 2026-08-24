# 08 · Trợ lý đặt sân AI (floating widget)

## (a) Mục đích & actor
Chat tiếng Việt tự nhiên giúp tìm sân → xem slot → giữ chỗ mà không rời trang
đang mở (GĐ2 — §3.12). AI chỉ gợi ý từ dữ liệu thật qua tool-call, KHÔNG tự
thanh toán. **Actor:** khách hàng (createHold yêu cầu đã đăng nhập).

## (b) Wireframe desktop

```
                                                        Trang booking-grid đang mở…
                                                 ┌───────────────────────────┤
                                                 │ 🤖 Trợ lý CourtHub    — ✕ │
                                                 ├───────────────────────────┤
                                                 │ 🤖 Chào bạn! Mình giúp tìm │
                                                 │    sân nhé 🏸              │
                                                 │ 🧑 Cho mình sân pickleball │
                                                 │    gần Gò Vấp tối nay     │
                                                 │ 🤖 [tool: searchVenues ✓]  │
                                                 │    Mình tìm được 2 sân:    │
                                                 │ ┌───────────────────────┐ │
                                                 │ │ Sân PB Saigon ★4.8    │ │
                                                 │ │ Gò Vấp · từ 120k      │ │
                                                 │ │ [Xem slot tối nay]    │ │
                                                 │ └───────────────────────┘ │
                                                 │ ┌───────────────────────┐ │
                                                 │ ⋯│ Sân PB Thủ Đức ★4.6   │ │
                                                 │ └───────────────────────┘ │
                                                 │ 🧑 Sân Saigon còn giờ nào? │
                                                 │ 🤖 [tool: checkSlots ✓]    │
                                                 │    Tối nay còn:            │
                                                 │    [18:00–19:00] [19:00–20:00]
                                                 │ 🧑 Giữ giúp 18:00–19:00    │
                                                 │ 🤖 [tool: createHold ✓]    │
                                                 │    Đã giữ chỗ 10 phút!     │
                                                 │    T5 28/8 · 120.000₫      │
                                                 │ ┌───────────────────────┐ │
                                                 │ │ [Tiếp tục thanh toán →]│ │ ← bubble kết quả
                                                 │ └───────────────────────┘ │
                                                 ├───────────────────────────┤
                                                 │ [Nhập tin nhắn………] [Gửi ➤]│
                                                 │ AI chỉ gợi ý — kiểm tra   │
                                                 │ kỹ trước khi đặt          │
                                                 └───────────────────────────┘
                                                          [💬 nổi góc phải ↓]
```

**Khác biệt mobile:** nút nổi 💬 góc phải dưới; panel mở thành **full-screen
sheet** trừ thanh input; bàn phím đẩy input lên; card venue thu gọn 1 dòng +
ảnh nhỏ.

## (c) Thành phần tương tác
- Nút floating 💬: mở/đóng panel; badge chấm đỏ khi có tin nhắn chưa đọc (tuỳ
  chọn). Vị trí panel: docked phải-dưới, rộng ~360px cao ~520px.
- Bubble hội thoại: user phải/xanh đậm, AI trái/trắng; bên trong AI có thể nhúng
  **card venue** (ảnh+tên+rating+CTA), **chip slot** (tap = preselect vào grid
  hoặc tạo hold ngay), **bubble kết quả** chứa nút `[Tiếp tục thanh toán →]`
  điều hướng sang checkout-hold với holdId vừa tạo.
- Tool indicator dòng nhỏ `[tool: xxx ✓]` — minh bạch rằng dữ liệu từ DB thật
  (anti-hallucination, §3.12).
- Quick-reply chips gợi ý câu hỏi mẫu khi mở lần đầu.
- Input + Enter/Gửi gửi mảng messages lên server (stateless client giữ hội
  thoại — §6.4); typing indicator khi chờ.
- Guardrail hiển thị: vượt hạn mức 20 tin/giờ → bubble thân thiện "Bạn đã gửi
  nhiều tin quá, mình nghỉ chút nhé, thử lại sau"; provider lỗi/timeout 15s →
  "Hệ thống gợi ý bận, thử lại sau" (giữ hội thoại không vỡ).
- Chưa đăng nhập mà xin giữ chỗ → bubble kèm nút đăng nhập, quay lại đúng ngữ
  cảnh hội thoại.

## (d) API sử dụng
- `POST /api/v1/ai/chat {messages: [{role, content}...]}` **(§6.4 chuẩn)** —
  server stateless, system prompt ràng buộc + tool-use nội bộ
  `searchVenues` / `checkSlots` / `createHold`; JWT bắt buộc để createHold
  (token trong cookie/header như mọi API khác).
- Timeout 15s + retry 1 lần (§6.4) — client hiển thị thông báo mượt trong lúc
  chờ; rate limit 20 tin/giờ/người (throttler §7) trả lỗi code riêng để UI
  phân biệt với lỗi hệ thống.
- Nút `[Tiếp tục thanh toán]` KHÔNG gọi API AI — điều hướng sang màn
  `checkout-hold.md` (dùng holdId đã có): mọi thao tác tiền vẫn qua luồng
  chuẩn bookings/payments.
