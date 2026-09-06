-- P5b O1 (HOLD-FIX): BookingHold.requiresApproval Boolean? nullable — additive,
-- KHÔNG default, không phá data cũ (bản ghi cũ NULL = DIRECT đúng chốt O1 2026-08-30).
-- Ngữ nghĩa: true = kèo cần duyệt thành viên (POST /bookings/:id/join -> 409
-- APPROVAL_REQUIRED, phải qua /matches/:id/requests); NULL/false = join trực tiếp.
-- confirmFromHold copy cột này sang "bookings"."requiresApproval" khi caller không
-- truyền opts.requiresApproval (ưu tiên opts nếu có).
ALTER TABLE "booking_holds" ADD COLUMN "requiresApproval" BOOLEAN;
