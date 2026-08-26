-- Treo/kích hoạt cụm sân (ADMIN): thêm trạng thái SUSPENDED vào enum VenueStatus.
-- Sân SUSPENDED ẩn khỏi tìm kiếm public và không đặt được; chỉ chuyển APPROVED <-> SUSPENDED.
ALTER TYPE "VenueStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';
