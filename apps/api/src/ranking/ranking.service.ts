import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SportType } from '@prisma/client';
import { ReputationService } from '../reputation/reputation.service';

export interface ClubRankingItem {
  rank: number;
  teamId: string;
  teamName: string;
  sportType: string;
  eloScore: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  titlesCount: number;
}

export interface AthleteRankingItem {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  sportType: string;
  reputationScore: number;
  matchesPlayed: number;
  fairPlayBadge: string;
}

@Injectable()
export class RankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reputationService: ReputationService,
  ) {}

  async getClubRankings(sportType?: string): Promise<ClubRankingItem[]> {
    if (sportType && !Object.values(SportType).includes(sportType as SportType)) {
      throw new BadRequestException('Môn thể thao không hợp lệ');
    }
    const where: Prisma.TeamWhereInput = sportType ? { sportType: sportType as SportType } : {};

    const teams = await this.prisma.team.findMany({
      where,
      include: {
        captain: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        championOf: {
          select: { id: true },
        },
        matchWins: {
          select: { id: true },
        },
        matchHome: {
          select: { id: true, homeScore: true, awayScore: true, status: true },
        },
        matchAway: {
          select: { id: true, homeScore: true, awayScore: true, status: true },
        },
      },
    });

    const items: ClubRankingItem[] = teams.map((t) => {
      const finishedHome = t.matchHome.filter((m) => m.status === 'DONE');
      const finishedAway = t.matchAway.filter((m) => m.status === 'DONE');
      const totalMatches = finishedHome.length + finishedAway.length;
      const wins = t.matchWins.length;
      const titlesCount = t.championOf.length;

      let draws = 0;
      let losses = 0;

      for (const m of finishedHome) {
        if (m.homeScore !== null && m.awayScore !== null) {
          if (m.homeScore === m.awayScore) draws++;
          else if (m.homeScore < m.awayScore) losses++;
        }
      }
      for (const m of finishedAway) {
        if (m.homeScore !== null && m.awayScore !== null) {
          if (m.awayScore === m.homeScore) draws++;
          else if (m.awayScore < m.homeScore) losses++;
        }
      }

      const winRate = totalMatches > 0 ? Number(((wins / totalMatches) * 100).toFixed(1)) : 0;
      const eloScore = 1500 + wins * 30 + draws * 10 - losses * 15 + titlesCount * 100;

      return {
        rank: 0,
        teamId: t.id,
        teamName: t.name,
        sportType: t.sportType,
        eloScore,
        matchesPlayed: totalMatches,
        wins,
        draws,
        losses,
        winRate,
        titlesCount,
      };
    });

    items.sort((a, b) => b.eloScore - a.eloScore || b.wins - a.wins || a.teamName.localeCompare(b.teamName, 'vi'));

    return items.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }

  async getAthleteRankings(sportType?: string): Promise<AthleteRankingItem[]> {
    if (sportType && !Object.values(SportType).includes(sportType as SportType)) {
      throw new BadRequestException('Môn thể thao không hợp lệ');
    }
    const users = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        ...(sportType ? { favoriteSports: { has: sportType as SportType } } : {}),
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        favoriteSports: true,
        bookings: {
          where: { status: { in: ['CHECKED_IN', 'COMPLETED'] } },
          select: { id: true },
        },
      },
    });

    const items: AthleteRankingItem[] = [];

    for (const u of users) {
      const rep = await this.reputationService.getMyReputation(u.id);
      const matchesPlayed = u.bookings.length;
      const sport = sportType || u.favoriteSports[0] || '';

      let fairPlayBadge = 'Thành viên mới';
      if (rep.score >= 90) fairPlayBadge = 'Fair-play Kim Cương 💎';
      else if (rep.score >= 80) fairPlayBadge = 'Fair-play Vàng 🥇';
      else if (rep.score >= 60) fairPlayBadge = 'Fair-play Bạc 🥈';

      items.push({
        rank: 0,
        userId: u.id,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        sportType: sport,
        reputationScore: rep.score,
        matchesPlayed,
        fairPlayBadge,
      });
    }

    items.sort((a, b) => b.reputationScore - a.reputationScore || b.matchesPlayed - a.matchesPlayed || a.fullName.localeCompare(b.fullName, 'vi'));

    return items.slice(0, 50).map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }
}
