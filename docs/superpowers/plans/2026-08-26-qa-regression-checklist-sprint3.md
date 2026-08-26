# SanGo — QA Checklist Sprint 3 (Điểm uy tín · Badge · Bracket 8 đội)

> Owner: qa2 · Trạng thái: CHUẨN BỊ — kích hoạt khi FE xong (claim t33). 
> Căn cứ: spec captain (công thức uy tín, cache 5', badge 10/25, bracket 8 đội single-elim + bye) · nền code hiện hữu: `Match` (ghép trận mở §3.11), `Team`/`TeamMember`, `Review`, `BookingStatus` CHECKED_IN/NO_SHOW, `NotificationType.TOURNAMENT`.

## A. Cổng chất lượng (giữ nguyên chuẩn)
| # | Lệnh | Kỳ vọng |
|---|---|---|
| A1 | `pnpm -r typecheck` | 0 lỗi |
| A2 | `pnpm -r test` | 0 fail — API ≥198 test (S2) + Web 197 + Shared 26 nguyên vẹn |
| A3 | `pnpm lint` | eslint + prettier sạch toàn monorepo |
| A4 | Migration S3 | mỗi đợt 1 batch gộm kỷ luật; data S1+S2 nguyên vẹn sau migrate (`prisma migrate status` up-to-date) |

## B. Điểm uy tín (Reputation Score)
**Cập nhật sau charter chốt trong task (compute-on-read)**: `score = clamp(BASE(50) + 10×checkInĐúngGiờ − 5×hủySát(<12h) − 20×noShow, 0, 100)` — KHÔNG bảng lịch sử, KHÔNG denormalize; no-show = COMPLETED mà không có checkedInAt; check-in muộn/dữ liệu NULL = trung tính; badge là **SQL aggregate count-based** ('Đúng giờ 10 lần', '10 lần đặt sân' — đếm gồm CONFIRMED), không phải ngưỡng điểm.
> Spec ban đầu (base100/+2/−10/clamp200/badge-theo-điểm-10-25) đã bị thay thế — giữ ở đây để vết lịch sử.
- **B1 Toán học**: unit test bảng case — chỉ đúng giờ (+2/n), chỉ hủy sát (−5/n), chỉ no-show (−10/n), hỗn hợp, **clamp dưới 0** (nhiều no-show không âm) và **clamp trên 200**; user mới = đúng 100.
- **B2 Nguồn sự kiện**: đúng-giờ đếm từ check-in đúng cửa sổ slot (CHECKED_IN), no-show từ cron đánh NO_SHOW.
- **B2+ Ngưỡng hủy-sát — ĐÃ CHỐT (captain)**: **<12h** trước startMinute mới là hủy-sát (−5), tái dùng đúng tier hoàn tiền hiện có tại `bookings.service.ts:456` — `hoursUntil > 24 ? 100 : hoursUntil >= 12 ? 50 : 0` (§6.2) — để nhất quán nghiệp vụ; **hủy từ ≥12h là hủy thường, KHÔNG trừ điểm**. Test biên bắt buộc: hủy tại **12h01'** trước start → KHÔNG trừ · hủy tại **11h59'** → TRỪ 5 · biên ==12h thuộc nhóm `>=12` → không trừ. Swagger phải ghi rõ ngưỡng này.
- **B3 Idempotent**: cùng sự kiện không cộng/trừ lặp (retry/cron chạy lại giữ nguyên score); score lưu DB khớp tổng tay từ ledger/log sự kiện.
- **B4 Cache 5 phút — ĐÃ CHỐT (captain): TTL thuần**, không invalidate chủ động khi ghi sự kiện:
  - GET lần đầu truy DB; gọi lại trong TTL → cache hit (timestamp/query count unchanged).
  - Ghi sự kiện đổi điểm xong, GET NGAY trong TTL → vẫn giá trị CŨ (đúng thiết kế, chấp nhận trễ tối đa 5') — test này khóa hành vi KHÔNG invalidate sớm.
  - Sau TTL hết hạn → trả giá trị MỚI (vi-test quay thời gian >5' hoặc chờ thật).
  - Swagger endpoint phải ghi chú "số liệu có thể trễ tối đa 5 phút" (soi code review).
- **B5 API/FE**: endpoint public xem điểm đối thủ + FE hiển thị; sai quyền/không tồn tại → 404 rõ ràng.
- **B6 Leaderboard GLOBAL — fa1dfcb** (`GET /reputation/leaderboard?limit=N`):
  - Shape: `items[{userId, fullName, score, onTime, noShow}]` + `total` + `generatedAt` — đủ trường FE cần.
  - Sort: `score desc`, hòa → `onTime desc` → `fullName`; verify bằng dataset có điểm trùng.
  - Limit: mặc định **10**, chặn trần **50** (`z.coerce 1..50`) — `limit=100/0/âm/chữ` → 400 validation (không clamp im lặng).
  - Phạm vi **GLOBAL gồm cả user seed demo** — smoke t33 khẳng định presence của user seed trong items khi đủ điều kiện top.
  - `generatedAt` thay đổi giữa 2 lần gọi cách nhau quá TTL cache điểm (khớp hành vi TTL thuần B4).

## C. Badge theo ngưỡng
- **C1 Biên ngưỡng**: score 9→không badge, **10 → badge 1**, 24→badge 1, **25 → badge 2**, 26→badge 2 (test đúng ranh giới 9/10 và 24/25).
- **C2 Nhất quán**: badge phản ánh score sau clamp; hạ điểm dưới ngưỡng → badge bị thu hồi (không badge "cũ").
- **C3 FE hiển thị badge đúng tier ở profile/team page; UI tiếng Việt bám pattern features/.

## D. Bracket 8 đội single-elim (+bye)
- **D1 Sinh nhánh**: đủ 8 đội → đúng **7 trận** (4 QF + 2 SF + 1 F); cặp seed chuẩn 1v8/4v5/2v7/3v6 (hoặc quy tắc seed repo dùng — soi implementation, test khóa theo quy tắc đó).
- **D2 Bye**: 6 đội → đúng 2 bye (2 đội cao nhất vào thẳng SF), tổng trận = 5; 5 đội → 3 bye; **số trận tổng = số đội − 1** bất biến với mọi n ∈ {4..8}.
- **D3 Luật chơi**: thắng QF → winner xuất hiện đúng chỗ ở SF; hòa/chưa có kết quả → vòng sau không sinh trận giả; một đội không thể có 2 trận cùng vòng.
- **D4 Ràng buộc**: đội bị xóa/rút giữa giải → xử lý tường minh (walkover hoặc hủy bracket) — KHÔNG crash 500; chỉ organizer/admin sửa kết quả (403 cho người lạ).
- **D5 Thông báo**: NotificationType.TOURNAMENT bắn cho đội thắng/thua đúng người, không fan-out trùng.

## E. Regression S1 + S2 (bắt buộc mỗi lần re-verify)
- `node apps/api/smoke-sprint2.mjs` → 26/26 PASS (map bbox · team/quỹ · add-on · MAJOR-1 voucher guard).
- `node apps/api/smoke-teamflow.mjs` → teamId flow + TEAM_NOT_FOUND 6/6 PASS.
- Suite tiền (payments/vouchers/wallets) xanh; invariant ví per-user SUM(credit−debit)=balance.

## F. Smoke demo Sprint 3 (kịch bản đề xuất)
1. User mới xem điểm = 100 → check-in đúng giờ 2 lần → 104 → badge vẫn tier thấp.
2. Hủy sát giờ 1 lần (−5) + no-show 1 lần (−10) → 89; ép xuống <10 → mất badge.
3. Cache: sửa điểm nền, GET liên tục trong 5' thấy giá trị cached, sau 5' thấy mới.
4. Organizer tạo bracket 8 đội → nhập kết quả QF/SF → final đúng 2 đội → champion + notification.
5. Bracket 6 đội → 2 bye đúng đội hạt giống cao nhất.
6. Regression nhanh: smoke-sprint2 26/26 + ví mock topup ✓.

## G. Tiêu chí PASS Sprint 3
A1–A4 pass · B1–B5 không bug chặn (công thức + clamp + cache đúng spec) · C biên 10/25 chính xác · D bracket 7 trận/bye đúng luật · E regression S1+S2 xanh · F chạy trơn 2 lần → báo captain hoàn tất t33, reviewer tiếp nhận.
