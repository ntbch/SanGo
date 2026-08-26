-- CreateEnum
CREATE TYPE "MatchLevel" AS ENUM ('FRIENDLY', 'CASUAL', 'SCRIM', 'SEMI_PRO');

-- CreateEnum
CREATE TYPE "PreferredFoot" AS ENUM ('LEFT', 'RIGHT', 'BOTH');

-- CreateEnum
CREATE TYPE "MatchJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FundDriveScope" AS ENUM ('MONTHLY', 'MATCH');

-- CreateEnum
CREATE TYPE "FundDriveStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "TeamFundEntryType" AS ENUM ('INCOME', 'EXPENSE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'MATCH_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'FUND_DRIVE';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "costPerPerson" INTEGER,
ADD COLUMN     "matchLevel" "MatchLevel" DEFAULT 'FRIENDLY',
ADD COLUMN     "targetPositions" TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "favoriteSports" "SportType"[],
ADD COLUMN     "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "preferredFoot" "PreferredFoot",
ADD COLUMN     "preferredPositions" TEXT[],
ADD COLUMN     "selfLevel" "MatchLevel";

-- CreateTable
CREATE TABLE "fund_drives" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scope" "FundDriveScope" NOT NULL DEFAULT 'MONTHLY',
    "targetAmount" INTEGER NOT NULL,
    "amountPerMember" INTEGER NOT NULL,
    "status" "FundDriveStatus" NOT NULL DEFAULT 'ACTIVE',
    "bookingId" UUID,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fund_drives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fund_contributions" (
    "id" UUID NOT NULL,
    "fundDriveId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "fund_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_expenses" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "type" "TeamFundEntryType" NOT NULL DEFAULT 'EXPENSE',
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "recordedBy" UUID NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_join_requests" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "position" TEXT,
    "message" TEXT,
    "status" "MatchJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_comments" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fund_drives_teamId_status_idx" ON "fund_drives"("teamId", "status");

-- CreateIndex
CREATE INDEX "fund_contributions_fundDriveId_idx" ON "fund_contributions"("fundDriveId");

-- CreateIndex
CREATE INDEX "fund_contributions_userId_idx" ON "fund_contributions"("userId");

-- CreateIndex
CREATE INDEX "team_expenses_teamId_occurredAt_idx" ON "team_expenses"("teamId", "occurredAt");

-- CreateIndex
CREATE INDEX "match_join_requests_bookingId_status_idx" ON "match_join_requests"("bookingId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "match_join_requests_bookingId_userId_key" ON "match_join_requests"("bookingId", "userId");

-- CreateIndex
CREATE INDEX "match_comments_bookingId_createdAt_idx" ON "match_comments"("bookingId", "createdAt");

-- AddForeignKey
ALTER TABLE "fund_drives" ADD CONSTRAINT "fund_drives_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_drives" ADD CONSTRAINT "fund_drives_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_contributions" ADD CONSTRAINT "fund_contributions_fundDriveId_fkey" FOREIGN KEY ("fundDriveId") REFERENCES "fund_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_contributions" ADD CONSTRAINT "fund_contributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_expenses" ADD CONSTRAINT "team_expenses_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_expenses" ADD CONSTRAINT "team_expenses_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_join_requests" ADD CONSTRAINT "match_join_requests_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_join_requests" ADD CONSTRAINT "match_join_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_comments" ADD CONSTRAINT "match_comments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_comments" ADD CONSTRAINT "match_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
