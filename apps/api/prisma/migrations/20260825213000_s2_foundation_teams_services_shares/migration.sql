-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('CAPTAIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "TeamMemberStatus" AS ENUM ('ACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "ExpenseShareStatus" AS ENUM ('UNPAID', 'PAID');

-- CreateEnum
CREATE TYPE "VenueServiceType" AS ENUM ('BEVERAGE', 'EQUIPMENT', 'OTHER');

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "captainId" UUID NOT NULL,
    "sportType" "SportType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "TeamMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "TeamMemberStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_shares" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "bookingId" UUID,
    "payerId" UUID NOT NULL,
    "debtorId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "status" "ExpenseShareStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_services" (
    "id" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "type" "VenueServiceType" NOT NULL DEFAULT 'OTHER',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venue_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_add_ons" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_add_ons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teams_captainId_idx" ON "teams"("captainId");

-- CreateIndex
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");

-- CreateIndex
CREATE INDEX "expense_shares_teamId_status_idx" ON "expense_shares"("teamId", "status");

-- CreateIndex
CREATE INDEX "expense_shares_debtorId_status_idx" ON "expense_shares"("debtorId", "status");

-- CreateIndex
CREATE INDEX "venue_services_venueId_idx" ON "venue_services"("venueId");

-- CreateIndex
CREATE INDEX "booking_add_ons_serviceId_idx" ON "booking_add_ons"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_add_ons_bookingId_serviceId_key" ON "booking_add_ons"("bookingId", "serviceId");

-- CreateIndex
CREATE INDEX "venues_lat_lng_idx" ON "venues"("lat", "lng");

-- CreateIndex
CREATE INDEX "bookings_teamId_idx" ON "bookings"("teamId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_debtorId_fkey" FOREIGN KEY ("debtorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_services" ADD CONSTRAINT "venue_services_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_add_ons" ADD CONSTRAINT "booking_add_ons_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_add_ons" ADD CONSTRAINT "booking_add_ons_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "venue_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

