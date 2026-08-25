# CourtHub — QA Checklist Sprint 2 (Map bbox · Team/quỹ đội · Add-on · Fix MAJOR-1)

> Owner: qa · Trạng thái: CHUẨN BỊ — kích hoạt khi các task BE/FE Sprint 2 xong (QA Regression là mục 6 kế hoạch sprint).
> Căn cứ: roadmap-master (đợt 2), mô tả t13–t18 trong team state, code hiện hữu (schema đã có PaymentType.ADD_ON :74, Booking.teamId? :303).

## A. Cổng chất lượng (bắt buộc, giữ nguyên chuẩn Sprint 1)
| # | Lệnh | Kỳ vọng |
|---|---|---|
| A1 | `pnpm -r typecheck` | 0 lỗi |
| A2 | `pnpm -r test` | 0 fail (API ≥169 test cũ phải còn nguyên — không vỡ regression Sprint 1) |
| A3 | `pnpm lint` | eslint + prettier sạch toàn monorepo |
| A4 | Migration S2-T0 | đúng **1 batch gộm** (Teams, ExpenseShare, VenueServices, BookingAddOns); data Sprint 1 (wallet/voucher/booking) nguyên vẹn sau migrate |

## B. Fix MAJOR-1 — ưu tiên CAO NHẤT (tiền đã thu, chưa có booking)
Lỗi gốc: consume voucher ở `confirmFromHold` SAU khi Payment PAID. Path tất định cần bị vô hiệu sau fix:
- **B1 Repro tất định:** 1 user áp CÙNG mã vào 2 hold (apply chỉ snapshot, không chặn — hành vi này GIỮ NGUYÊN) → checkout cả 2. Kỳ vọng post-fix: checkout thứ 2 **bị chặn ngay tại `checkout()`** (trước khi phát paymentUrl) với code VOUCHER_USER_LIMIT/VOUCHER_EXHAUSTED; **không sinh Payment**, không có tiền "đã thu chưa có booking".
- **B2 Đồng thời:** 2 checkout song song dùng chung lượt cuối của mã (`Promise.allSettled`) → đúng **1 thắng**, 1 thằng bị chặn sạch (không crash 500).
- **B3 Không hồi quy:** happy path 1-user-1-voucher-1-hold giữ nguyên hành vi (apply → snapshot → trả tiền → quota tiêu đúng 1 lần); retry callback trùng txnRef không tiêu thêm quota.
- **B4 Hủy sau thanh toán:** hoàn ví/refund khi đơn có voucher vẫn đúng như Sprint 1 (ledger REFUND, không hoàn phần discount ngoài quy định).

## C1. F5 Map nâng cao (bbox + ghim giá)
- GET `/venues?bbox=minLng,minLat,maxLng,maxLat`: chỉ trả venue trong hộp; biên lệch (min>max) → 400 validation.
- `priceFrom` aggregate = min giá court của venue — so khớp DB thực tế ≥3 venue.
- Migration có `@@index([latitude, longitude])` (soi schema/migration, không PostGIS/clustering — kiểm code review).
- FE ghim giá + **debounce**: kéo map liên tục chỉ bắn request sau khi dừng (unit test debounce hoặc đo network); ghim cache không nhảy giá sai giữa các pan.
- Regression: search/filter venues cũ (phân trang, district) không vỡ.

## C2. F1 Team Profile & quỹ đội
- Team/TeamMember CAPTAIN/MEMBER: tạo đội, invite-link join; chỉ captain sửa/xóa đội, member thường bị 403 khi thao tác quản trị.
- Đặt sân kèm `teamId` → booking ghi nhận đúng đội; teamId lạ/không thuộc → 4xx rõ ràng.
- Quỹ đội: **TeamFundEntry bảng RIÊNG TRACK-ONLY** — soi diff đảm bảo KHÔNG ai ghi vào WalletLedger ngữ nghĩa cá nhân; chia-đều số học đúng (test 100k/3 người: phần nguyên+lẻ xử lý tường minh, tổng khớp).
- ExpenseShare ghi nợ từng thành viên; đánh dấu đã trả cập nhật đúng trạng thái, idempotent khi bấm 2 lần.
- Dashboard doanh thu vẫn đọc ledger — không nhiễm dữ liệu quỹ đội.

## C3. F4 Dịch vụ đi kèm (Add-on)
- Owner CRUD menu dịch vụ (VenueService: tên/giá/sân áp dụng); UI tiếng Việt bám pattern features/.
- Ràng buộc thời điểm: bán SAU booking CONFIRMED (hoặc chọn kèm lúc checkout nếu spec chọn phương án đó) — addon trên đơn HELD/CANCELLED bị chặn.
- Thanh toán addon = Payment RIÊNG `type=ADD_ON`, **txnRef giữ format '<id>.ADD_ON.<rand>'** — parseTxnRef whitelist MỞ RỘNG (không đổi shape); `expectedAmountFor` nhánh ADD_ON tra đúng tổng quantity×unitPrice theo bookingId.
- Callback addon: thiếu/sai amount → 400 PAYMENT_AMOUNT_MISMATCH; mode ≠mock → 403 (chuẩn S0); replay idempotent — 1 Payment PAID duy nhất.
- FE: tổng tiền hiển thị = booking + addon; lịch sử addon theo đơn đầy đủ.

## D. Bất invariant kiến trúc xuyên sprint
1. txnRef '<id>.<TYPE>.<rand>' bất biến, whitelist chỉ mở rộng ADD_ON.
2. WalletLedger append-only; mọi luồng tiền mới (nếu có) ghi SAU commit.
3. Migration gộm kỷ luật — mỗi đợt 1 batch.
4. Commit conventional-commits nhỏ, test trước commit.
5. UI tiếng Việt, pattern features/ + TanStack Query/RHF+Zod.

## E. Smoke E2E demo Sprint 2 (kịch bản đề xuất)
1. **Map:** mở bản đồ Hà Nội, kéo bbox khu Cầu Giấy → ghim giá hiện đúng min-price, không request spam khi kéo.
2. **Đội:** captain tạo "Team QA", gửi invite-link, 2 thành viên join.
3. **Quỹ:** captain nạp 300k quỹ → chia đều 3 người (100k/người) → ExpenseShare ghi nợ từng member, đánh dấu 1 người đã trả.
4. **Đặt sân theo đội:** member đặt sân 18:00 kèm teamId → CONFIRMED.
5. **Add-on:** mua 2 nước + 1 bóng kèm đơn → Payment ADD_ON txnRef '<id>.ADD_ON.<rand>' → callback OK → menu dịch vụ owner trừ tồn/ghi nhận đúng.
6. **Regression nhanh Sprint 1:** nạp ví mock +100k ✅ · áp GIAM20-* thấy giảm giá tại checkout ✅ · owner bulk-cancel ngày mưa hoàn về ví + thông báo ✅ · **path MAJOR-1 (B1) bị chặn** ✅.

## F. Tiêu chí PASS Sprint 2
A1–A4 pass + B1/B2 (MAJOR-1) bị chặn chắc chắn + C1–C3 không bug chặn + E chạy trơn 2 lần liên tiếp → báo captain mở task QA regression sprint 2 hoàn tất, reviewer tiếp nhận.