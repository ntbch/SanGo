-- Sửa partial unique của S3-T0: một booking chia tiền tạo MỘT dòng ExpenseShare
-- PER DEBTOR nên (teamId, bookingId) không đủ — phải kèm debtorId để vẫn chặn
-- chia trùng nhưng không khoá các dòng nợ hợp lệ của các thành viên khác nhau.
DROP INDEX IF EXISTS "expense_shares_team_booking_unique";
CREATE UNIQUE INDEX "expense_shares_team_booking_debtor_unique" ON "expense_shares"("teamId","bookingId","debtorId") WHERE "bookingId" IS NOT NULL;
