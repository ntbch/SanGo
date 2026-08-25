-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "remindedAt24h" TIMESTAMP(3),
                      ADD COLUMN     "remindedAt2h" TIMESTAMP(3);
