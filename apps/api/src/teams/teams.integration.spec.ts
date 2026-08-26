/**
 * Integration test Teams & ExpenseShares (S2-F1) — Postgres thật.
 * Chứng minh:
 *  - Tạo team: người tạo tự động là CAPTAIN + ACTIVE member đầu tiên.
 *  - Mời thành viên (PENDING) -> chỉ CAPTAIN được mời -> UNIQUE(teamId, userId) chặn trùng.
 *  - Chấp nhận lời mời -> status chuyển ACTIVE.
 *  - Quỹ đội (ExpenseShare - track-only): chia tiền đơn đặt sân cho thành viên trong đội.
 *  - Xem tổng quan quỹ đội (totalUnpaid, myOwed, myReceivable) và cập nhật trạng thái PAID.
 */
import { Test } from '@nestjs/testing';
// exceptions checked via toMatchObject
import { PrismaClient, SportType, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TeamsModule } from './teams.module';
import { TeamsService } from './teams.service';

const SUFFIX = Date.now().toString(36);

describe('Teams & ExpenseShare service (integration)', () => {
  let prisma: PrismaClient;
  let teams: TeamsService;
  let dbUp = false;

  let captain!: User;
  let member1!: User;
  let member2!: User;
  let stranger!: User;

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua teams integration');
      return;
    }

    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    const mkUser = (email: string, fullName: string) =>
      prisma.user.create({
        data: { email, passwordHash: hash, fullName, role: 'CUSTOMER' },
      });

    [captain, member1, member2, stranger] = await Promise.all([
      mkUser(`itteam-cap-${SUFFIX}@courthub.vn`, 'Captain User'),
      mkUser(`itteam-m1-${SUFFIX}@courthub.vn`, 'Member One'),
      mkUser(`itteam-m2-${SUFFIX}@courthub.vn`, 'Member Two'),
      mkUser(`itteam-str-${SUFFIX}@courthub.vn`, 'Stranger User'),
    ]);

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, TeamsModule],
    }).compile();
    teams = moduleRef.get(TeamsService);
  });

  afterAll(async () => {
    if (dbUp) {
      const users = await prisma.user.findMany({
        where: { email: { contains: `itteam-` } },
        select: { id: true },
      });
      const ids = users.map((u) => u.id);
      await prisma.expenseShare.deleteMany({
        where: { OR: [{ payerId: { in: ids } }, { debtorId: { in: ids } }] },
      });
      await prisma.teamMember.deleteMany({ where: { userId: { in: ids } } });
      await prisma.payment.deleteMany({ where: { booking: { customerId: { in: ids } } } });
      await prisma.booking.deleteMany({ where: { customerId: { in: ids } } });
      await prisma.team.deleteMany({ where: { captainId: { in: ids } } });
      const venues = await prisma.venue.findMany({
        where: { ownerId: { in: ids } },
        select: { id: true },
      });
      const vIds = venues.map((v) => v.id);
      await prisma.court.deleteMany({ where: { venueId: { in: vIds } } });
      await prisma.venue.deleteMany({ where: { id: { in: vIds } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
      await prisma.$disconnect();
    }
  });

  let createdTeamId: string;
  /** Booking đã chia tiền ở EXPENSE-1 — dùng lại cho các ca scoping MAJOR-A. */
  let expenseBookingId!: string;

  it('TEAM-1: tạo team -> người tạo là CAPTAIN và thành viên ACTIVE', async () => {
    if (!dbUp) return;
    const team = await teams.createTeam(captain, {
      name: 'FC Chiến Binh ' + SUFFIX,
      description: 'Đội bóng phong trào',
      sportType: SportType.FOOTBALL5,
    });

    expect(team.id).toBeDefined();
    expect(team.captainId).toBe(captain.id);
    createdTeamId = team.id;

    const detail = await teams.getTeam(team.id);
    expect(detail.members.length).toBe(1);
    expect(detail.members[0].userId).toBe(captain.id);
    expect(detail.members[0].role).toBe('CAPTAIN');
    expect(detail.members[0].status).toBe('ACTIVE');
  });

  it('TEAM-2: mời thành viên (PENDING) -> chỉ CAPTAIN được mời -> UNIQUE chặn mời trùng', async () => {
    if (!dbUp) return;
    // Người ngoài hoặc member thường không được mời
    await expect(
      teams.inviteMember(createdTeamId, stranger, { userId: member1.id, role: 'MEMBER' }),
    ).rejects.toMatchObject({ response: { code: 'TEAM_FORBIDDEN' } });

    // Captain mời member1
    const invite = await teams.inviteMember(createdTeamId, captain, {
      userId: member1.id,
      role: 'MEMBER',
    });
    expect(invite.status).toBe('PENDING');
    expect(invite.userId).toBe(member1.id);

    // Mời lại member1 -> ConflictException (P2002)
    await expect(
      teams.inviteMember(createdTeamId, captain, { userId: member1.id, role: 'MEMBER' }),
    ).rejects.toMatchObject({ response: { code: 'TEAM_MEMBER_EXISTS' } });
  });

  it('TEAM-3: thành viên chấp nhận lời mời -> status chuyển ACTIVE', async () => {
    if (!dbUp) return;
    const accepted = await teams.respondInvite(createdTeamId, member1, true);
    expect(accepted.status).toBe('ACTIVE');

    const myTeams = await teams.listMyTeams(member1);
    expect(myTeams.some((t) => t.team.id === createdTeamId && t.status === 'ACTIVE')).toBe(true);

    // Mời tiếp member2 và chấp nhận
    await teams.inviteMember(createdTeamId, captain, { userId: member2.id, role: 'MEMBER' });
    await teams.respondInvite(createdTeamId, member2, true);

    const team = await teams.getTeam(createdTeamId);
    expect(team.members.filter((m) => m.status === 'ACTIVE').length).toBe(3);
  });

  it('EXPENSE-1: chia tiền đơn đặt sân cho thành viên trong đội (track-only ExpenseShare)', async () => {
    if (!dbUp) return;
    // Tạo fixture venue, court và booking cho captain
    const venue = await prisma.venue.create({
      data: {
        name: 'Venue Team ' + SUFFIX,
        slug: 'venue-team-' + SUFFIX,
        address: '123 Test St',
        lat: 21.03,
        lng: 105.84,
        openMinute: 360,
        closeMinute: 1320,
        ownerId: captain.id,
        status: 'APPROVED',
      },
    });
    const court = await prisma.court.create({
      data: {
        venueId: venue.id,
        name: 'Sân Team',
        sportType: SportType.FOOTBALL5,
        slotMinutes: 60,
        defaultPricePerSlot: 300_000,
      },
    });
    const dateObj = new Date(Date.now() + 86_400_000);
    const booking = await prisma.booking.create({
      data: {
        code: `CH-${SUFFIX}-TEAM`,
        customerId: captain.id,
        courtId: court.id,
        date: dateObj,
        startMinute: 600,
        endMinute: 660,
        subtotal: 300_000,
        depositAmount: 300_000,
        status: 'CONFIRMED',
        teamId: createdTeamId,
      },
    });
    expenseBookingId = booking.id;

    // Chia đều 300k cho 3 người: captain, member1, member2 (mỗi người 100k)
    // Người trả là captain -> tạo 2 khoản nợ cho member1 và member2 (mỗi người 100k)
    const split = await teams.splitBookingExpense(createdTeamId, captain, {
      bookingId: booking.id,
      memberIds: [captain.id, member1.id, member2.id],
      note: 'Tiền sân giao hữu cuối tuần',
    });

    expect(split.totalAmount).toBe(300_000);
    expect(split.sharePerPerson).toBe(100_000);
    expect(split.sharesCreated).toBe(2);
    expect(split.shares.every((s) => s.amount === 100_000 && s.status === 'UNPAID')).toBe(true);

    // Xem tổng quan quỹ đội từ phía member1
    const summaryM1 = await teams.getTeamExpenses(createdTeamId, member1);
    expect(summaryM1.totalUnpaid).toBe(200_000);
    expect(summaryM1.myOwed).toBe(100_000);
    expect(summaryM1.myReceivable).toBe(0);

    // Xem từ phía captain (người đã ứng tiền)
    const summaryCap = await teams.getTeamExpenses(createdTeamId, captain);
    expect(summaryCap.myReceivable).toBe(200_000);
    expect(summaryCap.myOwed).toBe(0);
  });

  it('EXPENSE-2: xác nhận thanh toán khoản nợ (UNPAID -> PAID)', async () => {
    if (!dbUp) return;
    const expenses = await teams.getTeamExpenses(createdTeamId, captain);
    const shareM1 = expenses.shares.find((s) => s.debtorId === member1.id);
    expect(shareM1).toBeDefined();

    // Người nợ không tự đánh dấu PAID được nếu không phải captain/payer
    await expect(
      teams.updateExpenseShareStatus(createdTeamId, shareM1!.id, member1, { status: 'PAID' }),
    ).rejects.toMatchObject({ response: { code: 'EXPENSE_FORBIDDEN' } });

    // Captain (payer) xác nhận member1 đã trả tiền
    const updated = await teams.updateExpenseShareStatus(createdTeamId, shareM1!.id, captain, {
      status: 'PAID',
    });
    expect(updated.status).toBe('PAID');

    const summaryAfter = await teams.getTeamExpenses(createdTeamId, captain);
    expect(summaryAfter.totalUnpaid).toBe(100_000); // chỉ còn member2 nợ 100k
    expect(summaryAfter.myReceivable).toBe(100_000);
  });

  it('SCOPE-A (MAJOR-A): splitBookingExpense chặn đơn không thuộc đội trên route', async () => {
    if (!dbUp) return;
    const otherTeam = await teams.createTeam(captain, {
      name: 'FC Đối Thủ ' + SUFFIX,
      sportType: SportType.FOOTBALL5,
    });

    // Captain là captain của otherTeam nên qua được gate quyền, nhưng booking
    // thuộc createdTeamId -> phải bị chặn vì lệch đội trên route param.
    await expect(
      teams.splitBookingExpense(otherTeam.id, captain, {
        bookingId: expenseBookingId,
        memberIds: [member1.id],
      }),
    ).rejects.toMatchObject({ response: { code: 'BOOKING_TEAM_MISMATCH' } });
  });

  it('SCOPE-B (MAJOR-A): chặn chia trùng cùng booking trong một đội', async () => {
    if (!dbUp) return;
    await expect(
      teams.splitBookingExpense(createdTeamId, captain, {
        bookingId: expenseBookingId,
        memberIds: [captain.id, member1.id, member2.id],
      }),
    ).rejects.toMatchObject({ response: { code: 'BOOKING_ALREADY_SPLIT' } });
  });

  it('SCOPE-C (MAJOR-A): chặn chia cho người không phải thành viên ACTIVE', async () => {
    if (!dbUp) return;
    // Booking mới của captain trong team, chưa từng được chia.
    const venue = await prisma.venue.create({
      data: {
        name: 'Venue Scope ' + SUFFIX,
        slug: 'venue-scope-' + SUFFIX,
        address: '456 Scope St',
        lat: 21.03,
        lng: 105.84,
        openMinute: 360,
        closeMinute: 1320,
        ownerId: captain.id,
        status: 'APPROVED',
      },
    });
    const court = await prisma.court.create({
      data: {
        venueId: venue.id,
        name: 'Sân Scope',
        sportType: SportType.FOOTBALL5,
        slotMinutes: 60,
        defaultPricePerSlot: 200_000,
      },
    });
    const booking = await prisma.booking.create({
      data: {
        code: `CH-${SUFFIX}-SCOP`,
        customerId: captain.id,
        courtId: court.id,
        date: new Date(Date.now() + 86_400_000),
        startMinute: 720,
        endMinute: 780,
        subtotal: 200_000,
        depositAmount: 200_000,
        status: 'CONFIRMED',
        teamId: createdTeamId,
      },
    });

    // stranger không phải member; PENDING cũng bị chặn vì lọc status ACTIVE.
    await expect(
      teams.splitBookingExpense(createdTeamId, captain, {
        bookingId: booking.id,
        memberIds: [stranger.id],
      }),
    ).rejects.toMatchObject({ response: { code: 'MEMBER_NOT_ACTIVE' } });

    // Hợp lệ: chỉ chia cho các ACTIVE member thật sự.
    const split = await teams.splitBookingExpense(createdTeamId, captain, {
      bookingId: booking.id,
      memberIds: [member2.id],
    });
    expect(split.sharesCreated).toBe(1);
  });

  it('DEDUP (charter C): memberIds trùng nhau chỉ tạo MỘT khoản nợ cho debtor', async () => {
    if (!dbUp) return;
    // Fixture booking mới của captain trong team, chưa từng được chia.
    const venue = await prisma.venue.create({
      data: {
        name: 'Venue Dedup ' + SUFFIX,
        slug: 'venue-dedup-' + SUFFIX,
        address: '321 Dedup St',
        lat: 21.03,
        lng: 105.84,
        openMinute: 360,
        closeMinute: 1320,
        ownerId: captain.id,
        status: 'APPROVED',
      },
    });
    const court = await prisma.court.create({
      data: {
        venueId: venue.id,
        name: 'Sân Dedup',
        sportType: SportType.FOOTBALL5,
        slotMinutes: 60,
        defaultPricePerSlot: 240_000,
      },
    });
    const booking = await prisma.booking.create({
      data: {
        code: `CH-${SUFFIX}-DDUP`,
        customerId: captain.id,
        courtId: court.id,
        date: new Date(Date.now() + 86_400_000),
        startMinute: 840,
        endMinute: 900,
        subtotal: 240_000,
        depositAmount: 240_000,
        status: 'CONFIRMED',
        teamId: createdTeamId,
      },
    });

    // member1 bị lặp 2 lần trong danh sách -> dedup về 1, chia đều cho 1 người.
    const split = await teams.splitBookingExpense(createdTeamId, captain, {
      bookingId: booking.id,
      memberIds: [member1.id, member1.id],
    });
    expect(split.sharesCreated).toBe(1);
    expect(split.sharePerPerson).toBe(240_000);
    expect(split.shares[0].debtorId).toBe(member1.id);
    expect(split.shares[0].amount).toBe(240_000);
  });
});
