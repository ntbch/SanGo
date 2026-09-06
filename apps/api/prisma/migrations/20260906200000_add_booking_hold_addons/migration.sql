-- Thêm cột addOns JSONB vào booking_holds để lưu dịch vụ đi kèm chọn lúc đặt sân
ALTER TABLE "booking_holds" ADD COLUMN "addOns" JSONB;
