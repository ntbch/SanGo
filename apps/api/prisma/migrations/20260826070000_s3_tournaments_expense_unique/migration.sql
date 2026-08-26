-- S3-T0: foundation migration Sprint 3 — Tournament/TournamentTeam/TournamentMatch
-- + dọn nợ MINOR S2: partial unique (teamId, bookingId) trên expense_shares.
--   bookingId nullable -> chỉ áp cho dòng ghi nợ phát sinh từ đặt sân;
--   app-level check BOOKING_ALREADY_SPLIT vẫn giữ để trả lỗi thân thiện.

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('REGISTRATION', 'ONGOING', 'FINISHED');

-- CreateEnum
CREATE TYPE "TournamentMatchStatus" AS ENUM ('PENDING', 'READY', 'DONE');

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sportType" "SportType" NOT NULL,
    "maxTeams" INTEGER NOT NULL DEFAULT 8,
    "status" "TournamentStatus" NOT NULL DEFAULT 'REGISTRATION',
    "createdBy" UUID NOT NULL,
    "championTeamId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_teams" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "seed" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_matches" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "homeTeamId" UUID,
    "awayTeamId" UUID,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "winnerTeamId" UUID,
    "nextMatchId" UUID,
    "status" "TournamentMatchStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournaments_status_idx" ON "tournaments"("status");

-- CreateIndex
CREATE INDEX "tournament_teams_teamId_idx" ON "tournament_teams"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_teams_tournamentId_teamId_key" ON "tournament_teams"("tournamentId", "teamId");

-- CreateIndex
CREATE INDEX "tournament_matches_tournamentId_status_idx" ON "tournament_matches"("tournamentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_matches_tournamentId_round_position_key" ON "tournament_matches"("tournamentId", "round", "position");

-- CreateIndex
CREATE INDEX "expense_shares_teamId_bookingId_idx" ON "expense_shares"("teamId", "bookingId");

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_championTeamId_fkey" FOREIGN KEY ("championTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "tournament_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- MAJOR dọn nợ S2: chặn chia trùng một booking trong một đội ở mức DB.
CREATE UNIQUE INDEX "expense_shares_team_booking_unique" ON "expense_shares"("teamId","bookingId") WHERE "bookingId" IS NOT NULL;
