-- AlterTable
ALTER TABLE "venues" ADD COLUMN     "city" TEXT NOT NULL DEFAULT 'Hà Nội',
ADD COLUMN     "district" TEXT NOT NULL DEFAULT 'Cầu Giấy';

-- CreateIndex
CREATE INDEX "venues_city_district_idx" ON "venues"("city", "district");
