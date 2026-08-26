/**
 * Integration test Tournaments (F7-BE Sprint 3) — Postgres thật, tự bỏ qua khi không có DB.
 * Phủ:
 *  1. Tạo giải (OWNER/ADMIN), đăng ký đội theo CAPTAIN, chặn trùng/quá slot/sai người.
 *  2. Start giải: sinh đúng bracket single-elimination 8 slot (7 trận), seed theo thứ tự đăng ký.
 *  3. Bye khi < 8 đội: trận thiếu đối thủ tự DONE và đẩy đội sang vòng sau.
 *  4. Nhập điểm: winner propagate tới chung kết, chặn hòa/chưa READY/đã DONE.
 *  5. Chung kết set champion + FINISHED + broadcast NotificationType.TOURNAMENT.
 */
import { Test } from '@nestjs/testing';
import { NotificationType, SportType, PrismaClient, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamsModule } from '../teams/teams.module';
import { TeamsService } from '../teams/teams.service';
import { TournamentsModule } from './tournaments.module';
import { TournamentsService } from './tournaments.service';

const SUFFIX = Date.now().toString(36);

describe('Tournaments single-elimination bracket (integration)', () => {
  let prisma: PrismaClient;
  let teams: TeamsService;
  let tournaments: TournamentsService;
  let dbUp = false;

  let admin!: User;
  let owner!: User;
  let intruder!: User;
  const captains: User[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua tournaments integration');
      return;
    }

    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    const mkUser = (role: User['role'], email: string, fullName: string): Promise<User> =>
      prisma.user.create({ data: { email, passwordHash: hash, fullName, role } });

    admin = await mkUser('ADMIN', 'ittour-admin-' + SUFFIX + '@courthub.vn', 'Tour Admin');
    owner = await mkUser('OWNER', 'ittour-owner-' + SUFFIX + '@courthub.vn', 'Tour Owner');
    intruder = await mkUser('CUSTOMER', 'ittour-intruder-' + SUFFIX + '@courthub.vn', 'Intruder');
    for (let i = 1; i <= 9; i++) {
      captains.push(
        await mkUser('CUSTOMER', 'ittour-cap-' + i + '-' + SUFFIX + '@courthub.vn', 'Captain ' + i),
      );
    }

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, NotificationsModule, TeamsModule, TournamentsModule],
    }).compile();

    teams = moduleRef.get(TeamsService);
    tournaments = moduleRef.get(TournamentsService);
  });

  /** Tạo đội cho captain i (1-based) và trả về teamId. */
  async function mkTeam(i: number): Promise<string> {
    const team = await teams.createTeam(captains[i - 1], {
      name: 'Tour Team ' + i + ' ' + SUFFIX,
      sportType: SportType.FOOTBALL5,
    });
    return team.id;
  }

  it('Giải đủ 8 đội: bracket chuẩn, winner propagate tới chung kết, champion + broadcast', async () => {
    if (!dbUp) return;

    // 1. Tạo giải bằng ADMIN
    const tour = await tournaments.createTournament(admin, {
      name: 'CourtHub Cup IT ' + SUFFIX,
      sportType: SportType.FOOTBALL5,
    });
    expect(tour.maxTeams).toBe(8);
    expect(tour.status).toBe('REGISTRATION');

    // 2. 8 đội đăng ký, mỗi đội do chính captain của đội đó gọi
    const teamIds: string[] = [];
    for (let i = 1; i <= 8; i++) teamIds.push(await mkTeam(i));
    for (let i = 0; i < 8; i++) {
      const reg = await tournaments.registerTeam(captains[i], tour.id, { teamId: teamIds[i] });
      expect(reg.teamId).toBe(teamIds[i]);
    }

    // 3. Chặn: người lạ/captain khác đăng ký hộ đội không phải của mình
    await expect(
      tournaments.registerTeam(captains[1], tour.id, { teamId: teamIds[0] }),
    ).rejects.toMatchObject({ response: { code: 'TEAM_FORBIDDEN' } });
    // captain tự đăng ký lại chính đội của mình -> chặn trùng ở mức UNIQUE
    await expect(
      tournaments.registerTeam(captains[0], tour.id, { teamId: teamIds[0] }),
    ).rejects.toMatchObject({ response: { code: 'ALREADY_REGISTERED' } });

    const team9 = await mkTeam(9);
    await expect(
      tournaments.registerTeam(captains[8], tour.id, { teamId: team9 }),
    ).rejects.toMatchObject({ response: { code: 'TOURNAMENT_FULL' } });

    // captains[8] không phải captain của teamIds[0]
    await expect(
      tournaments.registerTeam(intruder, tour.id, { teamId: teamIds[0] }),
    ).rejects.toMatchObject({ response: { code: 'TEAM_FORBIDDEN' } });

    // 4. Người lạ không start được; start thành công bởi admin
    await expect(tournaments.startTournament(intruder, tour.id)).rejects.toMatchObject({
      response: { code: 'TOURNAMENT_FORBIDDEN' },
    });
    const started = await tournaments.startTournament(admin, tour.id);
    expect(started.matchCount).toBe(7);
    expect(started.tournament.status).toBe('ONGOING');

    // 5. Cấu trúc bracket: QF cặp [1v8,4v5,2v7,3v6]; SF + Final PENDING
    const detail = await tournaments.getTournament(tour.id);
    expect(detail.teams.map((t) => t.seed)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    const qf = detail.matches.filter((m) => m.round === 1);
    expect(qf).toHaveLength(4);
    expect(qf.every((m) => m.status === 'READY')).toBe(true);
    expect(qf.map((m) => m.homeTeam!.id)).toEqual([teamIds[0], teamIds[3], teamIds[1], teamIds[2]]);
    expect(qf.map((m) => m.awayTeam!.id)).toEqual([teamIds[7], teamIds[4], teamIds[6], teamIds[5]]);
    const sf = detail.matches.filter((m) => m.round === 2);
    expect(sf).toHaveLength(2);
    expect(sf.every((m) => m.status === 'PENDING' && !m.homeTeam && !m.awayTeam)).toBe(true);
    const finalMatch = detail.matches.find((m) => m.round === 3)!;
    expect(finalMatch.nextMatchId).toBeNull();

    // 6. Chặn nhập điểm khi trận chưa READY
    await expect(
      tournaments.updateMatchScore(admin, sf[0].id, { homeScore: 1, awayScore: 0 }),
    ).rejects.toMatchObject({ response: { code: 'MATCH_NOT_READY' } });

    // 7. Chặn hòa
    await expect(
      tournaments.updateMatchScore(admin, qf[0].id, { homeScore: 1, awayScore: 1 }),
    ).rejects.toMatchObject({ response: { code: 'MATCH_REQUIRES_WINNER' } });

    // 8. Chơi 4 QF: thắng lần lượt seed 1, 5, 2, 6
    await tournaments.updateMatchScore(admin, qf[0].id, { homeScore: 3, awayScore: 1 });
    await tournaments.updateMatchScore(admin, qf[1].id, { homeScore: 1, awayScore: 2 });
    await tournaments.updateMatchScore(admin, qf[2].id, { homeScore: 2, awayScore: 0 });
    await tournaments.updateMatchScore(admin, qf[3].id, { homeScore: 0, awayScore: 2 });

    // Winner đã đẩy sang SF đúng slot home/away
    const afterQf = await tournaments.getTournament(tour.id);
    const sfReady = afterQf.matches.filter((m) => m.round === 2);
    expect(sfReady.find((m) => m.position === 1)!.homeTeam!.id).toBe(teamIds[0]);
    expect(sfReady.find((m) => m.position === 1)!.awayTeam!.id).toBe(teamIds[4]);
    expect(sfReady.find((m) => m.position === 2)!.homeTeam!.id).toBe(teamIds[1]);
    expect(sfReady.find((m) => m.position === 2)!.awayTeam!.id).toBe(teamIds[5]);
    expect(sfReady.every((m) => m.status === 'READY')).toBe(true);

    // 9. Chặn sửa lại trận đã DONE
    await expect(
      tournaments.updateMatchScore(admin, qf[0].id, { homeScore: 9, awayScore: 0 }),
    ).rejects.toMatchObject({ response: { code: 'MATCH_ALREADY_DONE' } });

    // 10. SF: team 1 và team 2 (đội thứ nhất & nhì đăng ký) vào chung kết
    await tournaments.updateMatchScore(admin, sfReady[0].id, { homeScore: 2, awayScore: 1 });
    await tournaments.updateMatchScore(admin, sfReady[1].id, { homeScore: 1, awayScore: 3 });
    const preFinal = await tournaments.getTournament(tour.id);
    const fm = preFinal.matches.find((m) => m.round === 3)!;
    expect(fm.status).toBe('READY');
    expect(fm.homeTeam!.id).toBe(teamIds[0]);
    expect(fm.awayTeam!.id).toBe(teamIds[5]); // SF2: away (seed 6) thắng 1-3

    // 11. Chung kết: champion + FINISHED + broadcast cho 8 captain
    await tournaments.updateMatchScore(admin, fm.id, { homeScore: 4, awayScore: 2 });
    const finished = await tournaments.getTournament(tour.id);
    expect(finished.status).toBe('FINISHED');
    expect(finished.championTeamId).toBe(teamIds[0]);
    const notices = await prisma.notification.count({
      where: {
        type: NotificationType.TOURNAMENT,
        userId: { in: captains.slice(0, 8).map((c) => c.id) },
      },
    });
    expect(notices).toBeGreaterThanOrEqual(8);

    // 12. Giải FINISHED chặn đăng ký mới
    await expect(
      tournaments.registerTeam(captains[8], tour.id, { teamId: team9 }),
    ).rejects.toMatchObject({ response: { code: 'REGISTRATION_CLOSED' } });
  });

  it('Giải 6 đội: bye tự động cho top seed, vẫn chơi đủ tới champion', async () => {
    if (!dbUp) return;

    // Owner tạo giải (không phải admin) — đúng quyền manager
    const tour = await tournaments.createTournament(owner, {
      name: 'Bye Cup IT ' + SUFFIX,
      sportType: SportType.PICKLEBALL,
    });

    const teamIds: string[] = [];
    for (let i = 1; i <= 6; i++) teamIds.push(await mkTeam(i));
    for (let i = 0; i < 6; i++) {
      await tournaments.registerTeam(captains[i], tour.id, { teamId: teamIds[i] });
    }

    const started = await tournaments.startTournament(owner, tour.id);
    expect(started.matchCount).toBe(7);

    const detail = await tournaments.getTournament(tour.id);
    const qf = detail.matches.filter((m) => m.round === 1);
    // Slot [1,8,4,5,2,7,3,6] với 6 đội: QF1 bye seed1, QF2 = 4v5, QF3 bye seed2, QF4 = 3v6
    const byes = qf.filter((m) => m.status === 'DONE');
    const live = qf.filter((m) => m.status === 'READY');
    expect(byes).toHaveLength(2);
    expect(live).toHaveLength(2);
    expect(byes.map((m) => m.winner!.id).sort()).toEqual([teamIds[0], teamIds[1]].sort());

    // SF đang chỉ có 1 đội từ bye -> PENDING, chặn nhập điểm
    const sf = detail.matches.filter((m) => m.round === 2);
    expect(sf.every((m) => m.status === 'PENDING')).toBe(true);
    await expect(
      tournaments.updateMatchScore(owner, sf[0].id, { homeScore: 1, awayScore: 0 }),
    ).rejects.toMatchObject({ response: { code: 'MATCH_NOT_READY' } });

    // Chơi nốt: QF2 (4v5 -> seed 4 thắng), QF4 (3v6 -> seed 6 thắng)
    await tournaments.updateMatchScore(owner, live[0].id, { homeScore: 2, awayScore: 1 });
    await tournaments.updateMatchScore(owner, live[1].id, { homeScore: 0, awayScore: 3 });
    const afterQf = await tournaments.getTournament(tour.id);
    const sfReady = afterQf.matches.filter((m) => m.round === 2);
    expect(sfReady.every((m) => m.status === 'READY')).toBe(true);

    await tournaments.updateMatchScore(owner, sfReady[0].id, { homeScore: 2, awayScore: 0 });
    await tournaments.updateMatchScore(owner, sfReady[1].id, { homeScore: 1, awayScore: 2 });
    const preFinal = await tournaments.getTournament(tour.id);
    const fm = preFinal.matches.find((m) => m.round === 3)!;
    expect(fm.status).toBe('READY');

    await tournaments.updateMatchScore(owner, fm.id, { homeScore: 3, awayScore: 1 });
    const finished = await tournaments.getTournament(tour.id);
    expect(finished.status).toBe('FINISHED');
    expect(finished.championTeamId).not.toBeNull();
  });
});
