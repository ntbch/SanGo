-- S2-F1: đặt sân tư cách đội — persist teamId trên hold
-- để confirmFromHold copy sang Booking kể cả khi payments không truyền opts.teamId.
ALTER TABLE "booking_holds" ADD COLUMN "teamId" UUID;

ALTER TABLE "booking_holds" ADD CONSTRAINT "booking_holds_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "booking_holds_teamId_idx" ON "booking_holds"("teamId");
