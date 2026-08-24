-- AlterTable
ALTER TABLE "booking_holds" ADD COLUMN     "isPublicMatch" BOOLEAN,
ADD COLUMN     "slotsNeeded" INTEGER;

-- CreateTable
CREATE TABLE "match_participants" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "match_participants_bookingId_idx" ON "match_participants"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "match_participants_bookingId_userId_key" ON "match_participants"("bookingId", "userId");

-- AddForeignKey
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
