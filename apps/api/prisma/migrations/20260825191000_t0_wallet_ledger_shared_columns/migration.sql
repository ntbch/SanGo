-- CreateEnum
CREATE TYPE "WalletLedgerDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "WalletLedgerType" AS ENUM ('TOPUP', 'PAYMENT', 'REFUND', 'CASHBACK');

-- AlterEnum
ALTER TYPE "PaymentType" ADD VALUE 'ADD_ON';

-- AlterTable
ALTER TABLE "booking_holds" ADD COLUMN     "discountAmount" INTEGER,
ADD COLUMN     "finalAmount" INTEGER;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "teamId" UUID;

-- CreateTable
CREATE TABLE "wallet_ledgers" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "direction" "WalletLedgerDirection" NOT NULL,
    "type" "WalletLedgerType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallet_ledgers_userId_createdAt_idx" ON "wallet_ledgers"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_ledgers_refType_refId_type_key" ON "wallet_ledgers"("refType", "refId", "type");

-- AddForeignKey
ALTER TABLE "wallet_ledgers" ADD CONSTRAINT "wallet_ledgers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

