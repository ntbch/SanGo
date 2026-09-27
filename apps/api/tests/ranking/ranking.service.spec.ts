import { RankingService } from '../../src/ranking/ranking.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ReputationService } from '../../src/reputation/reputation.service';

describe('RankingService athlete standings', () => {
  it('filters by the selected sport and ranks all eligible athletes before limiting to 50', async () => {
    const users = Array.from({ length: 52 }, (_, i) => ({
      id: String(i),
      fullName: `Athlete ${String(i).padStart(2, '0')}`,
      avatarUrl: null,
      status: 'ACTIVE',
      favoriteSports: i === 0 ? ['TENNIS'] : ['FOOTBALL5'],
      bookings: [],
    }));
    const prisma = {
      user: {
        findMany: async ({ where, take }: { where: { favoriteSports?: { has: string } }; take?: number }) => {
          const eligible = users.filter((user) => !where.favoriteSports || user.favoriteSports.includes(where.favoriteSports.has));
          return take === undefined ? eligible : eligible.slice(0, take);
        },
      },
    };
    const reputation = {
      getMyReputation: async (id: string) => ({ score: id === '51' ? 100 : id === '0' ? 99 : 50 }),
    };
    const service = new RankingService(prisma as unknown as PrismaService, reputation as unknown as ReputationService);
    const result = await service.getAthleteRankings('FOOTBALL5');
    expect(result).toHaveLength(50);
    expect(result[0]).toMatchObject({ userId: '51', rank: 1, reputationScore: 100, sportType: 'FOOTBALL5' });
    expect(result.some((item) => item.userId === '0')).toBe(false);
    expect(result[49].rank).toBe(50);
  });
});
