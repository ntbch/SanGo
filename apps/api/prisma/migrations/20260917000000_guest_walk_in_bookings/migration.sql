ALTER TABLE "bookings"
  ALTER COLUMN "customerId" DROP NOT NULL,
  ADD COLUMN "guestName" TEXT,
  ADD COLUMN "guestPhone" TEXT;
