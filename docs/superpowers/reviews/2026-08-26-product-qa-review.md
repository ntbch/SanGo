# Báo Cáo Phản Biện Product & UX/QA Review (Bản Kế Hoạch Thiết Kế Lại SanGo)

- **Người thực hiện:** Product QA Reviewer (`product_qa_reviewer`)
- **Tài liệu thẩm định:** `docs/superpowers/plans/2026-08-26-ui-redesign-implementation-plan.md` (v1.0.0)
- **Phương pháp tiếp cận:** Đối chiếu 100+ tiêu chuẩn Checklist Design, UX Guidelines, WCAG 2.1 AA, và Đánh giá luồng nghiệp vụ thể thao thực tế.

---

## 1. Đánh Giá Đối Chiếu Tiêu Chuẩn Checklist-Design & Accessibility (WCAG AA)

### 1.1 Visual Hierarchy & Bento Grid Structure
- **Điểm mạnh trong kế hoạch:** Phân bổ các cụm module rõ ràng theo F-pattern/Z-pattern (Hero Search $\rightarrow$ Sport Matrix $\rightarrow$ Live Stats $\rightarrow$ Featured Venues).
- **Góp ý hoàn thiện UX:**
  - *Nguyên tắc "One Primary Action per Bento View":* Trên trang chủ và các trang chi tiết, mỗi viewport chỉ nên có **duy nhất 1 nút CTA Primary** (màu `#006d37` hoặc `#2ecc71`), các nút phụ (Xem thêm, Lưu sân, Chi tiết) phải dùng `variant="outline"` hoặc `variant="ghost"` để tránh làm nhiễu thị giác người dùng.
  - *Card Elevation Consistency:* Cần chuẩn hóa mức nâng độ cao: `shadow-sm` cho trạng thái tĩnh, `shadow-lg` + `-translate-y-1` cho hoverable cards, `ring-2 ring-primary` cho card được active/selected.

### 1.2 Spacing System & 8pt Grid Discipline
- **Tiêu chuẩn áp dụng:** Mọi khoảng cách (margin, padding, gap) phải tuân thủ nghiêm ngặt cấp số nhân $8\text{px}$ (4px, 8px, 16px, 24px, 32px, 48px, 64px - tương ứng `p-1, p-2, p-4, p-6, p-8, p-12, p-16` trong Tailwind).
- **Điểm cần lưu ý:** Cần tránh dùng các giá trị lẻ như `p-3` ($12\text{px}$) hay `p-5` ($20\text{px}$) trừ trường hợp micro-components (chip/badge).
- **Border Radius Hierarchy:**
  - Outer Container / Bento Card lớn: `rounded-2xl` ($16\text{px}$)
  - Inner Component / Form Input / Button / Slot Chip: `rounded-xl` ($12\text{px}$)
  - Badge / Status Pill / Avatar: `rounded-full` ($9999\text{px}$)

### 1.3 Color Contrast & Dark Mode (WCAG 2.1 AA Compliance)
- **Tỷ lệ tương phản tối thiểu:**
  - Text thông thường: Tỷ lệ $\ge 4.5:1$ so với nền.
  - Large text ($ge 18.5\text{px}$ bold hoặc $ge 24\text{px}$ regular) & UI Controls: $\ge 3.0:1$.
- **Cảnh báo lỗi tương phản tiềm ẩn trong kế hoạch:**
  - *Màu Vàng Amber (Trạng thái Giữ chỗ / Cảnh báo):* Chữ vàng trên nền trắng hoặc chữ đen trên `bg-amber-100` thường bị trượt WCAG. **Khuyến nghị:** Dùng `bg-amber-50 text-amber-900 border-amber-300` trên Light mode và `bg-amber-950/60 text-amber-200 border-amber-700` trên Dark mode.
  - *Màu Xanh Thể thao `#006d37` (Turf Green):* Khi dùng làm nền, text bắt buộc là `#ffffff` (tỷ lệ 6.2:1 - Đạt). Nhưng khi chuyển sang Dark Mode, nền tối `#0f1411` không thể dùng chữ `#006d37` (tỷ lệ chỉ 2.1:1 - Trượt). **Khuyến nghị:** Trên Dark Mode, chuyển text link/accent sang Spring Green `#2ecc71` (tỷ lệ 8.4:1 - Đạt xuất sắc).
  - *Slot đã kín (`BOOKED`):* Không nên chỉ dựa vào gạch chéo (`line-through`) mà cần phối hợp 3 yếu tố: icon khóa/gạch, nền `bg-muted/60`, và tooltip hoặc badge "Đã kín" để phục vụ người dùng mù màu (Accessibility).

### 1.4 Touch Targets trên Mobile ($ge 44 \times 44\text{px}$)
- **Yêu cầu bắt buộc:** Tất cả phần tử tương tác trên màn hình cảm ứng (nút bấm, radio button, slot chip, nút tăng giảm số lượng, hamburger icon) phải có bounding box hoặc tap target $\ge 44 \times 44\text{px}$.
- Đối với các chip nhỏ (ví dụ nút lọc $32\text{px}$ height), phải tăng padding ảo bằng `before:absolute before:inset--2` để vùng nhận cảm ứng đạt tối thiểu $44\text{px}$.

### 1.5 Empty States & Error States
- **Empty States:** Tuyệt đối không để màn hình trắng trơn hoặc dòng text "Không có dữ liệu".
  - *Cấu trúc chuẩn:* Icon minh họa thể thao sống động $\rightarrow$ Tiêu đề thân thiện $\rightarrow$ Mô tả nguyên nhân $\rightarrow$ Nút CTA hành động cụ thể (Ví dụ: "Không có sân nào phù hợp với bộ lọc" $\rightarrow$ Nút "Xóa bộ lọc" + "Xem sân gợi ý gần bạn").
- **Error States:**
  - Inline error dưới form input (màu đỏ, icon alert, câu thông báo chỉ rõ cách sửa thay vì mã lỗi kỹ thuật).
  - Toast error cho lỗi mạng kèm nút "Thử lại" (Retry).
  - Error Boundary toàn trang phong cách thể thao vui nhộn (Hình trọng tài rút còi kèm nút "Tải lại trang" và "Về trang chủ").

### 1.6 Loading Skeletons & CLS (Cumulative Layout Shift)
- Thay thế hoàn toàn Spinner tròn quay ở giữa trang bằng **Content-Shaped Skeletons** (Skeleton dạng thẻ sân, skeleton dạng lưới slot, skeleton dạng bảng KPI).
- Toàn bộ ảnh sân phải gán `aspect-ratio: 16/9` hoặc `aspect-video` cố định để trình duyệt giữ chỗ trước khi ảnh tải xong, triệt tiêu hiện tượng giật cục giao diện (CLS < 0.05).

---

## 2. Đánh Giá Chuyên Sâu 3 Luồng Nghiệp Vụ Cốt Lõi

---

### 2.1 Luồng Giữ Chỗ Đếm Ngược 10 Phút (10-Minute Hold & Checkout)

```
[Chọn Slot trên Lưới] 
       │ (1) POST /api/booking-holds
       ▼
[Tạo Hold thành công] ──> Đồng hồ 10:00 bắt đầu đếm ngược
       │
       ├─ [08:00 còn lại] -> Bình thường (Xanh/Neutral)
       ├─ [02:00 còn lại] -> Cảnh báo (Amber pulse + Toast nhắc nhở)
       ├─ [00:00 hết hạn] -> Modal thông báo hết hạn + Nút "Giữ lại slot"
       │
       ▼ (2) Điền Voucher & Add-ons (Nước/Bóng)
[Xác nhận Thanh toán] ──> Chuyển cổng PayOS / QR MoMo / Ví SanGo
       │
       ▼ (3) Webhook / Polling xác nhận
[Thành công] ──> Trả về Ticket QR Check-in động
```

#### Các rủi ro UX & Giải pháp QA:
1. **Lệch giờ đếm ngược giữa Client và Server (Clock Drift):**
   - *Rủi ro:* Nếu đồng hồ trên điện thoại của khách chạy chậm hơn server 1 phút, client hiển thị còn 1:00 nhưng server đã tự động hủy hold và nhả slot cho người khác.
   - *Giải pháp:* `CountdownTimer` phải nhận `expiresAt` từ server, tính delta đồng bộ thời gian `serverTimeOffset = serverTimestamp - Date.now()`.
2. **Xung đột giữ chỗ đồng thời (Race Condition):**
   - *Rủi ro:* 2 khách hàng cùng bấm chọn 1 slot tại cùng 1 giây.
   - *Giải pháp UX:* Người gửi sau nhận toast thông báo: *"Rất tiếc! Khung giờ 18:00 - 19:00 vừa có người giữ trước vài giây."* $\rightarrow$ Hệ thống tự động refresh lưới slot, giữ nguyên các slot khác mà khách đã chọn thành công.
3. **Trải nghiệm khi hết hạn 10 phút:**
   - Khi đếm về `00:00`, không giật lag chuyển trang đột ngột mà mở **Expired Dialog** trang trọng: *"Thời gian giữ chỗ của bạn đã kết thúc. Bạn có muốn tiếp tục đặt lại các khung giờ này không?"* $\rightarrow$ Nếu slot vẫn còn trống, 1-click tạo hold mới ngay mà không cần quay lại tìm từ đầu.
4. **Áp dụng Voucher & Add-ons tức thời:**
   - Khi tick chọn thêm nước uống hoặc gõ mã giảm giá, cột tóm tắt tài chính (Order Summary) phải có hiệu ứng số nhảy mượt mà (Number Counter Animation) để khách thấy rõ số tiền được trừ.

---

### 2.2 Luồng Tạo Lịch Walk-in Tại Quầy Cho Chủ Sân (Owner Quick Counter Booking)

```
[Gantt Scheduler / Lịch Sân] 
       │
       ├─ Bấm 1 chạm vào Slot trống (Desktop/Tablet/Mobile)
       │
       ▼
[Modal "Đặt Sân Nhanh Tại Quầy"]
       ├─ Họ tên khách (Tùy chọn) + SĐT (Gợi ý autocomplete khách quen)
       ├─ Hình thức: [Tiền mặt] / [Chuyển khoản QR tại quầy] / [Nợ/Ghi sổ]
       ├─ Checkbox: [x] "Khách đã đến sân (Check-in ngay)"
       ├─ Tùy chỉnh giá: Cho phép giảm giá trực tiếp cho khách quen
       │
       ▼ (1 Bấm xác nhận < 5 giây)
[Cập nhật Realtime lên Gantt] ──> Slot chuyển sang màu Xanh Lá Đậm "Đang sử dụng"
```

#### Các rủi ro UX & Giải pháp QA:
1. **Tốc độ là yếu tố sống còn (Time-to-Create < 10 giây):**
   - Chủ sân thao tác tại quầy thường rất bận rộn khi khách đang đứng chờ. Form tạo lịch walk-in **không được yêu cầu tạo tài khoản user phức tạp**. Chỉ cần 2 trường tối thiểu: Số điện thoại + Hình thức thanh toán.
2. **Khóa slot bảo trì / Sự kiện đột xuất (1-Click Maintenance Lock):**
   - Bổ sung nút chuyển đổi tab nhanh trong dialog: **[Đặt sân nhanh]** hoặc **[Khóa sân bảo trì/Mưa bão]** $\rightarrow$ Giúp chủ sân khóa slot ngay lập tức chỉ với 1 click để ngăn khách online đặt nhầm khi trời mưa hoặc sân đang sửa đèn.
3. **Đồng bộ thời gian thực (Real-time Sync):**
   - Khi chủ sân vừa mở form tạo walk-in trên quầy, slot đó trên hệ thống online của khách phải được tạm khóa ở trạng thái `HELD` để tránh trường hợp khách online vừa bấm thanh toán xong thì chủ sân cũng nhận tiền mặt tại quầy.

---

### 2.3 Lưới Slot Giờ Trên Mobile (Mobile Weekly Slot Matrix Ergonomics)

#### Đánh giá hạn chế của bảng ma trận truyền thống:
- Ma trận 7 ngày $\times$ 17 khung giờ (06:00 - 23:00) gồm $119$ ô trên màn hình điện thoại $375\text{px}$ sẽ khiến người dùng phải vuốt ngang vuốt dọc liên tục, các ô bị co bé lại ($< 25\text{px}$), rất dễ bấm nhầm và gây ức chế.

#### Giải pháp thiết kế Mobile-First tối ưu (Adaptive Dual-Mode):

```
[Mobile Viewport: 360px - 640px]
┌─────────────────────────────────────────────────────────┐
│ ‹   Tháng 8/2026   ›                                   │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │
│ │ T2  │ │ T3  │ │ T4* │ │ T5  │ │ T6  │ │ T7  │ │ CN  │ │ <- Date Ribbon
│ │ 24  │ │ 25  │ │ 26  │ │ 27  │ │ 28  │ │ 29  │ │ 30  │ │    (Vuốt ngang)
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │
├─────────────────────────────────────────────────────────┤
│ Bộ lọc nhanh: [Tất cả] [Buổi sáng] [Giờ vàng tối 🔥]    │
├─────────────────────────────────────────────────────────┤
│ Sân 1 (Sân cỏ nhân tạo 7 người)                        │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│ │ 17:00 - 18:00│ │ 18:00 - 19:00│ │ 19:00 - 20:00│      │ <- Slot Chips
│ │ 300.000đ     │ │ [Đã kín]     │ │ 400.000đ 🔥  │      │    (Cao 48px,
│ │ [✓ Chọn]     │ │              │ │              │      │     Dễ bấm ngón cái)
│ └──────────────┘ └──────────────┘ └──────────────┘      │
└─────────────────────────────────────────────────────────┘
│ 🛒 Đã chọn: 1 slot (Sân 1: 17h-18h) • 300.000đ [Tiếp tục]│ <- Sticky Bottom Drawer
└─────────────────────────────────────────────────────────┘
```

1. **Date Ribbon Selector (Thanh chọn ngày trượt ngang ở đỉnh):** Hiển thị 7 ngày trong tuần với nhãn Thứ/Ngày rõ ràng, ngày hôm nay có chấm xanh, ngày có ưu đãi có badge sao.
2. **Khối Slot theo từng Sân con:** Slot hiển thị dạng lưới 2 hoặc 3 cột với chiều cao tối thiểu $48\text{px}$, hiển thị rõ: Giờ bắt đầu - Giờ kết thúc, Giá tiền, Icon Giờ Vàng.
3. **Filter theo buổi (Sáng / Chiều / Tối):** Giúp người dùng nhảy nhanh đến khung giờ mong muốn mà không cần cuộn dài.
4. **Sticky Bottom Action Bar:** Khi chọn $\ge 1$ slot, thanh bottom bar tự động nổi lên ở đáy với tổng tiền và nút CTA "Giữ chỗ & Thanh toán", không bị che khuất bởi bàn phím hay thanh điều hướng hệ thống.

---

## 3. Khuyến Nghị Bổ Sung Vào Kế Hoạch 5 Phase

| Phase | Mục tiêu bổ sung đề xuất | Tiêu chuẩn QA & UX cần nghiệm thu |
| :--- | :--- | :--- |
| **Phase 1** | Tối ưu Tokens & Khung Navigation | - Khai báo semantic tokens cho cả Light/Dark đảm bảo contrast $\ge 4.5:1$.\n- Bổ sung `aria-current="page"` và `focus-visible` outline rõ nét cho người dùng bàn phím. |
| **Phase 2** | Public Discovery & Map Split-view | - Trải nghiệm lọc tức thì (Instant Filter) không giật màn hình.\n- Khi bản đồ zoom/pan, danh sách sân bên trái tự động re-order theo khoảng cách gần nhất.\n- Empty state khi bộ lọc không có kết quả phải có nút 1-click "Khôi phục bộ lọc mặc định". |
| **Phase 3** | Booking Flow, Hold 10p, Mobile Grid | - Tích hợp cơ chế bù trừ sai lệch thời gian `serverTimeOffset` cho Countdown Timer.\n- Xây dựng giao diện Adaptive Dual-Mode cho Lưới Slot (Desktop ma trận Gantt, Mobile dạng Date Ribbon + Slot Cards).\n- QR Code Check-in có độ tương phản cao, hỗ trợ nút "Tăng độ sáng màn hình" và "Lưu ảnh vé vào máy". |
| **Phase 4** | Owner Walk-in & Scheduler | - Form tạo booking tại quầy tối giản (<= 3 trường), hoàn thành dưới 10 giây.\n- Tính năng 1-Click Khóa slot bảo trì / trời mưa.\n- Toast cảnh báo xác nhận 2 bước cho mọi thao tác hủy hoặc hoàn tiền. |
| **Phase 5** | Auth, Polish, Dark Mode & Micro-interactions | - Không có lỗi FOUC hay vỡ layout khi đổi theme.\n- Toàn bộ form auth hỗ trợ autofill trình duyệt, bàn phím điều hướng mượt mà, inline error thân thiện.\n- Kiểm thử hồi quy toàn diện trên các độ phân giải: 360px (Mobile nhỏ), 390px (iPhone tiêu chuẩn), 768px (iPad/Tablet), 1280px (Laptop), 1920px (Desktop). |

---

## 4. Kết Luận & Đánh Giá

Bản kế hoạch của `ui_planner` có cấu trúc rất bài bản, chia phase hợp lý và nắm bắt đúng tinh thần **Modern Athletic Bento**. Khi được bổ sung đầy đủ các tiêu chuẩn Checklist-Design và các khuyến nghị chuyên sâu về trải nghiệm người dùng ở trên (đặc biệt là giao diện Mobile Slot Grid và tính năng Walk-in nhanh cho chủ sân), bản thiết kế sẽ đảm bảo tính ứng dụng thực tế cao nhất, tăng tỷ lệ chuyển đổi đặt sân và mang lại sự hài lòng tối đa cho cả người chơi thể thao lẫn chủ sân.
