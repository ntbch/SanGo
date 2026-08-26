# SanGo — Master Roadmap triển khai tính năng v5 (chốt CÓ ví nội bộ)

> For agentic workers: Đây là bản roadmap tổng. Khi triển khai từng feature, sinh kế hoạch chi tiết theo skill writing-plans (mỗi feature một file docs/superpowers/plans/YYYY-MM-DD-<feature>.md) rồi thực thi bằng subagent-driven-development.

**Lịch sử quyết định:** v3 có ví → user tạm bỏ (v4) → chốt CÓ LẠI ví (v5, hiện tại). Phạm vi: đủ 8 tính năng yêu cầu + S0 bảo mật + nền tảng WalletLedger + N2/N3/N4.

## 0. Nguyên tắc xuyên suốt
- Demo-first: mỗi feature có phiên bản cắt 30–60% effort vẫn đủ thuyết phục hội đồng.
- Tái dụng pattern sẵn có: atomic counter BookingCodeSeq, txnRef UNIQUE idempotency, transaction FOR UPDATE, cron setInterval + cờ dedup remindedAt24h/2h, notify.service (in-app + email best-effort).
- Tiền có 2 tầng: WalletLedger = nguồn sự thật số dư; Payment(REFUND) = chứng từ đối soát. Dashboard doanh thu chỉ đọc ledger.
- Không đụng format txnRef '<id>.<TYPE>.<rand>' (payments.service.ts:222, whitelist DEPOSIT|FULL :227 — chỉ mở rộng whitelist).
- Migration kỷ luật: mỗi đợt gộp 1 batch migration duy nhất.
- Seed/reset script riêng cho từng buổi demo.

## S0 — CẮN TIÊN QUYẾT: vá lỗ hổng thanh toán miễn phí (0.5–1 ngày)

Đã kiểm chứng: GET /payments/mock/callback không gate theo env PAYMENT_MODE (payments.controller.ts:54-60) và BỎ QUA đối chiếu amount khi thiếu query param (payments.service.ts:198). Ai biết txnRef đều confirm đơn không trả tiền.
**Fix:** gate route theo env + bắt buộc so khớp amount mọi luồng. Làm TRƯỚC mọi feature liên quan tiền.

## T0 — Nền tảng schema (gộp 1 migration, 1–2 ngày)

- WalletLedger(id, userId, direction CREDIT|DEBIT, type TOPUP|PAYMENT|REFUND|CASHBACK, amount, refType, refId, balanceAfter, UNIQUE(refType, refId, type)) — append-only; UNIQUE chống hoàn kép khi retry/crash.
- Thêm cột cùng lúc: BookingHold.discountAmount/finalAmount (cho F3), Booking.checkedInAt (cho F2 — bookings.service.ts:657 hiện chỉ set status), PaymentType.ADD_ON (cho F4), Booking.teamId? (cho F1).
- Không denormalize reputationScore — aggregate-on-read + cache 5'.

## Đợt 1 — "Vòng tiền hoàn chỉnh" (~3 tuần)

| # | Feature | Nội dung chính | Effort |
|---|---|---|---|
| 1 | **F6 Sport Wallet** (demo-first) | Nạp tiền qua Mock gateway → ghi thẳng ledger refType='TOPUP' (KHÔNG dùng bảng Payment vì Payment.bookingId NOT NULL schema.prisma:308, enum thiếu TOPUP); hủy đúng quy định → hoàn vào ví tức thì (sửa cancelBooking :407-433, giữ Payment REFUND làm chứng từ); KHÔNG rút tiền, KHÔNG cashback ở v1 | 7–8 ngày |
| 2 | **F3 Voucher** | Voucher(code UNIQUE, PERCENT, cửa sổ khung giờ thấp điểm, usageLimit/perUserLimit) + VoucherRedemption UNIQUE(voucherId,userId); SNAPSHOT discountAmount vào hold lúc áp mã vì callback recompute quoteHold rồi so vnp_Amount !== expected*100 (payments.service.ts:111-114,159); chặn vượt limit bằng UPDATE … WHERE usedCount<usageLimit atomic; combo để v2 | 3–4 ngày |
| 3 | **N2 Mass-cancel thời tiết** | Owner hủy hàng loạt theo ngày → hoàn 100% VÀO VÍ (policy='WEATHER' force percent=100, KHÔNG tái dụng tier >24h→100/>=12h→50/else 0 :377) + UI bulk + fan-out notify best-effort sau commit | 2–3 ngày |
| 4 | **F8 Notification Center** (cuối đợt) | UI trung tâm + filter + unread count + broadcast helper; thêm enum type WALLET/VOUCHER/TEAM/TOURNAMENT — làm sau cùng để có producer tạo dữ liệu thật | 2 ngày |

**Demo ăn điểm buổi 1:** nạp ví → áp mã thấy giá giảm ngay tại checkout → trả tiền → owner hủy cả ngày mưa → tiền về ví tức thì + chuông thông báo từng khách.

## Đợt 2 — "Cộng đồng & tăng trưởng" (~2.5 tuần)

| # | Feature | Nội dung chính | Effort |
|---|---|---|---|
| 5 | **F5 Map nâng cao** (mở đầu đợt) | GET /venues?bbox= aggregate priceFrom; @@index([latitude, longitude]) (lat/lng select sẵn chưa index); ghim giá + debounce; KHÔNG PostGIS/clustering | 2–3 ngày |
| 6 | **F1 Team Profile** | Team/TeamMember(CAPTAIN/MEMBER, invite-link); đặt sân kèm teamId; quỹ đội chia-đều TRACK-ONLY qua bảng TeamFundEntry RIÊNG (KHÔNG nhét vào WalletLedger — ô nhiễm ngữ nghĩa balanceAfter cá nhân); ExpenseShare ghi nợ thành viên | 4–5 ngày |
| 7 | **F4 Dịch vụ đi kèm** | VenueService/BookingAddOn; bán SAU khi booking CONFIRMED bằng Payment riêng type ADD_ON; mở rộng whitelist parseTxnRef + nhánh expectedAmountFor tra tổng addon theo bookingId | 2–3 ngày |
| 8 | **N3 Recurring theo tuần** (v1 chỉ qua ví) | Mỗi hold cần URL VNPay riêng nên clone-hold × N tuần là full-version-trá-hình; v1 = đội đã nạp ví, 1 lần trừ ví tạo N booking trong 1 tx | 2 ngày |

## Đợt 3 — "Gamification & sự kiện" (~2–2.5 tuần)

| # | Feature | Nội dung chính | Effort |
|---|---|---|---|
| 9 | **F2 Ranking & Badge** | Aggregate-on-read từ Booking: check-in đúng giờ +, hủy sát giờ −, no-show −− (no-show = COMPLETED mà không check-in — viết sweep MỚI, cron hiện chỉ có expire-hold/complete/reminder); dựa vào checkedInAt ở T0; dữ liệu cũ NULL tính trung tính; 2 badge đầu = SQL aggregate; cache 5' | 3–4 ngày |
| 10 | **F7 Tournament** (demo-first) | Bracket cứng 8 đội single-elim tự sinh, nhập điểm tay, TournamentTeam → Team (phụ thuộc F1); KHÔNG gắn booking sân v1 | 5–7 ngày |
| 11 | **N4 Export Excel doanh thu** | exceljs, xuất từ ledger — chỉ làm nếu còn thời gian | 1–2 ngày |

**Demo ăn điểm buổi 3:** leaderboard + badge trên hồ sơ → bracket giải đấu tự sinh trực tiếp trên màn hình.

## Danh sách CẮT khi trễ deadline (theo thứ tự)

1. N4 Excel → 2. F7 Tournament (giữ mockup slide) → 3. N3 recurring → 4. Quỹ đội TeamFundEntry (giữ đặt-sân-tư-cách-đội) → 5. Cashback (đã cắt sẵn trong v1 wallet) → 6. Badge còn 1 → 7. Combo voucher.

Cắt sâu còn ~28–32 ngày dev thực chất; ước lượng lịch đầy đủ gồm khóa luận/slide/regression test là 45–55 ngày.

## Rủi ro đã nhận diện (kèm bằng chứng)

- Callback VNPay recompute giá → mọi thứ đổi giá phải snapshot vào hold (F3).
- parseTxnRef whitelist chặn type lạ → F4 mở rộng whitelist, giữ nguyên shape.
- Hoàn tiền kép khi retry/crash → UNIQUE(refType,refId,type) trên ledger ngay từ đầu.
- Ghi ledger trong tx hold kéo dài FOR UPDATE lock → ghi sau commit (afterCommit/outbox pattern).
- Cron no-show chưa tồn tại → cộng 1 ngày riêng cho F2.
- Dữ liệu Booking cũ thiếu checkedInAt → NULL tính trung tính.
- Top-up không thể là Payment (bookingId NOT NULL) → ledger-only refType='TOPUP', txnId riêng UNIQUE.

## Bước tiếp theo

1. User duyệt roadmap v5.
2. Sinh kế hoạch chi tiết nhóm đầu tiên (S0 + T0 + F6) theo skill writing-plans.
3. Thực thi theo đợt; mỗi đợt kết thúc bằng một buổi demo có kịch bản riêng.