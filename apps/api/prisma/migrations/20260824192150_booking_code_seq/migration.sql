-- CreateTable
CREATE TABLE "booking_code_seq" (
    "date" DATE NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "booking_code_seq_pkey" PRIMARY KEY ("date")
);
