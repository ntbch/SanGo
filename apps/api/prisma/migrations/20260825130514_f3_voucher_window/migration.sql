/*
  Warnings:

  - Added the required column `dayOfWeek` to the `vouchers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "booking_holds" ADD COLUMN     "voucherId" UUID;

-- AlterTable
ALTER TABLE "vouchers" ADD COLUMN     "dayOfWeek" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "booking_holds_voucherId_idx" ON "booking_holds"("voucherId");
