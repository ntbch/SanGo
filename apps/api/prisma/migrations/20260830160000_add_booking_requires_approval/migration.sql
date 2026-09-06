-- Phase 5a O1: toggle "Duyệt thành viên trước" cho kèo ghép mở (Booking.requiresApproval).
-- Nullable — kèo cũ NULL = join trực tiếp (DIRECT) theo quyết định chốt 2026-08-30, không phá data cũ.
-- true  = POST /bookings/:id/join bị chặn 409 APPROVAL_REQUIRED; duyệt qua /matches/:id/requests.
-- false/null = hành vi cũ giữ nguyên.
ALTER TABLE "bookings" ADD COLUMN "requiresApproval" BOOLEAN;
