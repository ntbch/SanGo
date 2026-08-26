import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '@sango/shared';
import { Prisma, TournamentMatchStatus, TournamentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotifyService } from '../notifications/notify.service';
import type {
  CreateTournamentDto,
  RegisterTeamDto,
  UpdateMatchScoreDto,
} from './dto/tournament.dto';

type ManagerUser = { id: string; role?: string };

/** Thứ tự seed chuẩn bracket power-of-2: [1,8,4,5,2,7,3,6] cho 8 slot — seed mạnh cách nhau. */
function buildSeedOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const n = order.length * 2;
    const next: number[] = [];
    for (const s of order) next.push(s, n + 1 - s);
    order = next;
  }
  return order.slice(0, size);
}

@Injectable()
export class TournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotifyService,
  ) {}

  /** Tạo giải (v1: maxTeams cố định 8 — demo-first, không nhận từ client). */
  async createTournament(user: ManagerUser, dto: CreateTournamentDto) {
    return this.prisma.tournament.create({
      data: {
        name: dto.name,
        description: dto.description,
        sportType: dto.sportType,
        maxTeams: 8,
        createdBy: user.id,
      },
    });
  }

  listTournaments() {
    return this.prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        champion: { select: { id: true, name: true, logoUrl: true } },
        _count: { select: { teams: true } },
      },
    });
  }

  /** Chi tiết giải + bảng đấu đầy đủ theo round/position để FE render bracket. */
  async getTournament(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        champion: { select: { id: true, name: true, logoUrl: true } },
        creator: { select: { id: true, fullName: true } },
        teams: {
          orderBy: [{ seed: { sort: 'asc', nulls: 'last' } }, { joinedAt: 'asc' }],
          include: { team: { select: { id: true, name: true, logoUrl: true } } },
        },
        matches: {
          orderBy: [{ round: 'asc' }, { position: 'asc' }],
          include: {
            homeTeam: { select: { id: true, name: true, logoUrl: true } },
            awayTeam: { select: { id: true, name: true, logoUrl: true } },
            winner: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!tournament) {
      throw new NotFoundException({
        message: 'Không tìm thấy giải đấu',
        code: 'TOURNAMENT_NOT_FOUND',
      });
    }
    return tournament;
  }

  /**
   * Đăng ký đội của CAPTAIN vào giải đang mở. Khoá dòng tournament trong transaction
   * để hai captain đăng ký song song không thể vượt maxTeams (bài học MAJOR-B Sprint 2);
   * UNIQUE(tournamentId, teamId) chặn trùng ở mức DB.
   */
  async registerTeam(user: ManagerUser, tournamentId: string, dto: RegisterTeamDto) {
    const team = await this.prisma.team.findUnique({ where: { id: dto.teamId } });
    if (!team) {
      throw new NotFoundException({ message: 'Không tìm thấy đội', code: 'TEAM_NOT_FOUND' });
    }
    if (team.captainId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException({
        message: 'Chỉ đội trưởng mới có thể đăng ký đội vào giải',
        code: 'TEAM_FORBIDDEN',
      });
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Khoá dòng giải để tuần tự hoá các đăng ký song song.
        await tx.$queryRaw`SELECT id FROM "tournaments" WHERE id = ${tournamentId}::uuid FOR UPDATE`;

        const tour = await tx.tournament.findUnique({ where: { id: tournamentId } });
        if (!tour) {
          throw new NotFoundException({
            message: 'Không tìm thấy giải đấu',
            code: 'TOURNAMENT_NOT_FOUND',
          });
        }
        if (tour.status !== TournamentStatus.REGISTRATION) {
          throw new ConflictException({
            message: 'Giải đã khóa đăng ký',
            code: 'REGISTRATION_CLOSED',
          });
        }
        // Đăng ký trùng ưu tiên báo đúng ALREADY_REGISTERED kể cả khi giải đã đủ đội.
        const existing = await tx.tournamentTeam.findUnique({
          where: { tournamentId_teamId: { tournamentId, teamId: dto.teamId } },
        });
        if (existing) {
          throw new ConflictException({
            message: 'Đội đã đăng ký giải này',
            code: 'ALREADY_REGISTERED',
          });
        }
        const count = await tx.tournamentTeam.count({ where: { tournamentId } });
        if (count >= tour.maxTeams) {
          throw new ConflictException({ message: 'Giải đã đủ đội', code: 'TOURNAMENT_FULL' });
        }
        return tx.tournamentTeam.create({
          data: { tournamentId, teamId: dto.teamId },
          include: { team: { select: { id: true, name: true, logoUrl: true } } },
        });
      });
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException({
          message: 'Đội đã đăng ký giải này',
          code: 'ALREADY_REGISTERED',
        });
      }
      throw e;
    }
  }

  /**
   * Khóa đăng ký + tự sinh bracket single-elimination 8 slot:
   * - Seed xếp theo thứ tự đăng ký, cặp chuẩn [1v8,4v5,2v7,3v6] để seed cao cách nhau.
   * - Slot trống (< maxTeams đội) là bye: trận chỉ có 1 đội tự DONE và đẩy đội sang vòng sau.
   * - Round 1 đủ 2 đội -> READY; vòng sau PENDING đến khi đủ cả hai đội.
   */
  async startTournament(user: ManagerUser, tournamentId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "tournaments" WHERE id = ${tournamentId}::uuid FOR UPDATE`;

      const tour = await tx.tournament.findUnique({
        where: { id: tournamentId },
        include: { teams: { orderBy: { joinedAt: 'asc' } } },
      });
      if (!tour) {
        throw new NotFoundException({
          message: 'Không tìm thấy giải đấu',
          code: 'TOURNAMENT_NOT_FOUND',
        });
      }
      if (!this.isManager(tour.createdBy, user)) {
        throw new ForbiddenException({
          message: 'Chỉ người tạo giải hoặc admin mới có thể bắt đầu giải',
          code: 'TOURNAMENT_FORBIDDEN',
        });
      }
      if (tour.status !== TournamentStatus.REGISTRATION) {
        throw new ConflictException({
          message: 'Giải đã bắt đầu',
          code: 'TOURNAMENT_ALREADY_STARTED',
        });
      }
      // MAJOR bye edge (t35): bye chỉ hỗ trợ khi ĐÃ kín hơn nửa slot. Nếu số đội
      // <= maxTeams/2, vòng-1 sẽ có ít nhất một cặp RỖNG (0 đội) — trận rỗng
      // không thể auto-DONE như bye 1 đội và sẽ kẹt PENDING vĩnh viễn.
      if (tour.teams.length <= tour.maxTeams / 2) {
        throw new BadRequestException({
          message: `Quá ít đội để bắt đầu giải: có ${tour.teams.length}/${tour.maxTeams} đội — bye chỉ hỗ trợ khi hơn nửa slot đã kín`,
          code: 'NOT_ENOUGH_TEAMS',
        });
      }

      // Gán seed theo thứ tự đăng ký (1 = top seed).
      const teamBySeed = new Map<number, string>();
      for (let i = 0; i < tour.teams.length; i++) {
        const seed = i + 1;
        teamBySeed.set(seed, tour.teams[i].teamId);
        await tx.tournamentTeam.update({ where: { id: tour.teams[i].id }, data: { seed } });
      }

      // Sinh toàn bộ match rỗng theo round/position rồi nối nextMatchId thành cây nhánh.
      const slots = tour.maxTeams;
      const totalRounds = Math.log2(slots);
      const matches = new Map<string, { id: string; round: number; position: number }>();
      for (let round = 1; round <= totalRounds; round++) {
        const countInRound = slots / 2 ** round;
        for (let position = 1; position <= countInRound; position++) {
          const created = await tx.tournamentMatch.create({
            data: { tournamentId, round, position },
          });
          matches.set(round + '-' + position, created);
        }
      }
      for (const m of matches.values()) {
        if (m.round < totalRounds) {
          const next = matches.get(m.round + 1 + '-' + Math.ceil(m.position / 2))!;
          await tx.tournamentMatch.update({ where: { id: m.id }, data: { nextMatchId: next.id } });
        }
      }

      // Đội vào slot theo thứ tự seed chuẩn; cặp thiếu đội là bye.
      const order = buildSeedOrder(slots);
      for (let pos = 1; pos <= slots / 2; pos++) {
        const homeTeamId = teamBySeed.get(order[(pos - 1) * 2]) ?? null;
        const awayTeamId = teamBySeed.get(order[(pos - 1) * 2 + 1]) ?? null;
        const roundOne = matches.get('1-' + pos)!;

        if (homeTeamId && awayTeamId) {
          await tx.tournamentMatch.update({
            where: { id: roundOne.id },
            data: { homeTeamId, awayTeamId, status: TournamentMatchStatus.READY },
          });
        } else if (homeTeamId || awayTeamId) {
          // Bye: đội duy nhất thắng suông và đi tiếp sang vòng sau.
          await this.advanceWinnerInTx(tx, roundOne.id, homeTeamId ?? awayTeamId!, pos);
        }
      }

      const tournament = await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: TournamentStatus.ONGOING },
      });
      return { tournament, matchCount: matches.size };
    });
  }

  /**
   * Nhập điểm tay (host/admin): xác định winner, DONE trận, đẩy đội sang nextMatchId;
   * chung kết set champion + FINISHED + broadcast thông báo TOURNAMENT cho các đội.
   */
  async updateMatchScore(user: ManagerUser, matchId: string, dto: UpdateMatchScoreDto) {
    const match = await this.prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      include: { tournament: true },
    });
    if (!match) {
      throw new NotFoundException({ message: 'Không tìm thấy trận đấu', code: 'MATCH_NOT_FOUND' });
    }
    if (!this.isManager(match.tournament.createdBy, user)) {
      throw new ForbiddenException({
        message: 'Chỉ người tạo giải hoặc admin mới được nhập điểm',
        code: 'MATCH_FORBIDDEN',
      });
    }
    if (match.status === TournamentMatchStatus.DONE) {
      throw new ConflictException({ message: 'Trận đã có kết quả', code: 'MATCH_ALREADY_DONE' });
    }
    if (match.status !== TournamentMatchStatus.READY || !match.homeTeamId || !match.awayTeamId) {
      throw new ConflictException({
        message: 'Trận chưa sẵn sàng để nhập điểm',
        code: 'MATCH_NOT_READY',
      });
    }
    if (dto.homeScore === dto.awayScore) {
      throw new BadRequestException({
        message: 'Loại trực tiếp phải có thắng/thua, không chấp nhận hòa',
        code: 'MATCH_REQUIRES_WINNER',
      });
    }

    const winnerTeamId = dto.homeScore > dto.awayScore ? match.homeTeamId : match.awayTeamId;
    const isFinal = !match.nextMatchId;

    const updated = await this.prisma.$transaction(async (tx) => {
      const done = await tx.tournamentMatch.update({
        where: { id: match.id },
        data: {
          homeScore: dto.homeScore,
          awayScore: dto.awayScore,
          winnerTeamId,
          status: TournamentMatchStatus.DONE,
        },
      });

      if (!isFinal) {
        const next = await tx.tournamentMatch.findUnique({ where: { id: match.nextMatchId! } });
        if (next) await this.placeIntoSlotInTx(tx, next, winnerTeamId, match.position);
      } else {
        await tx.tournament.update({
          where: { id: match.tournamentId },
          data: { championTeamId: winnerTeamId, status: TournamentStatus.FINISHED },
        });
      }
      return done;
    });

    if (isFinal) {
      // Broadcast SAU khi commit — best-effort, không chặn response.
      const entries = await this.prisma.tournamentTeam.findMany({
        where: { tournamentId: match.tournamentId },
        include: { team: { select: { captainId: true, name: true } } },
      });
      const championName =
        entries.find((t) => t.teamId === winnerTeamId)?.team.name ?? 'Đội vô địch';
      await this.notify
        .dispatchBroadcast(
          entries.map((t) => t.team.captainId),
          {
            type: NotificationType.TOURNAMENT,
            title: 'Kết quả giải đấu',
            body: `Giải "${match.tournament.name}" đã kết thúc — nhà vô địch: ${championName}.`,
            link: '/tournaments',
          },
        )
        .catch(() => undefined);
    }

    return updated;
  }

  private isManager(createdBy: string, user: ManagerUser): boolean {
    return user.role === 'ADMIN' || createdBy === user.id;
  }

  /**
   * Đẩy winner vào đúng slot của trận đích: feeder vị trí LẺ chiếm home, CHẴN chiếm away
   * (chuẩn bracket: feeders của trận pos k là pos 2k-1 và 2k). Đủ 2 đội -> READY.
   * Slot đã bị chiếm bởi đội khác => bracket sai cấu trúc, từ chối để không ghi đè lặng lẽ.
   */
  private async placeIntoSlotInTx(
    tx: Prisma.TransactionClient,
    target: { id: string; homeTeamId: string | null; awayTeamId: string | null },
    winnerTeamId: string,
    feederPosition: number,
  ) {
    const isHome = feederPosition % 2 === 1;
    const occupied = isHome ? target.homeTeamId : target.awayTeamId;
    if (occupied && occupied !== winnerTeamId) {
      throw new ConflictException({
        message: 'Bracket sai cấu trúc: slot vòng sau đã có đội khác',
        code: 'BRACKET_SLOT_CONFLICT',
      });
    }
    const homeTeamId = isHome ? winnerTeamId : target.homeTeamId;
    const awayTeamId = isHome ? target.awayTeamId : winnerTeamId;
    const full = Boolean(homeTeamId && awayTeamId);
    await tx.tournamentMatch.update({
      where: { id: target.id },
      data: {
        homeTeamId,
        awayTeamId,
        ...(full ? { status: TournamentMatchStatus.READY } : {}),
      },
    });
  }

  /** Bye khi sinh bracket: ghi DONE + winner ngay và đẩy đội sang vòng sau. */
  private async advanceWinnerInTx(
    tx: Prisma.TransactionClient,
    matchId: string,
    winnerTeamId: string,
    feederPosition: number,
  ) {
    const current = await tx.tournamentMatch.findUniqueOrThrow({
      where: { id: matchId },
      select: { nextMatchId: true },
    });
    await tx.tournamentMatch.update({
      where: { id: matchId },
      data: { homeTeamId: winnerTeamId, winnerTeamId, status: TournamentMatchStatus.DONE },
    });
    if (current.nextMatchId) {
      const next = await tx.tournamentMatch.findUnique({ where: { id: current.nextMatchId } });
      if (next) await this.placeIntoSlotInTx(tx, next, winnerTeamId, feederPosition);
    }
  }
}
