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
import { PrismaModule } from '../../src/prisma/prisma.module';
import { AuthModule } from '../../src/auth/auth.module';
import { TeamsModule } from '../../src/teams/teams.module';
import { TeamsService } from '../../src/teams/teams.service';
import { WalletsService } from '../../src/wallets/wallets.service';

const SUFFIX = Date.now().toString(36);

describe('Teams & ExpenseShare service (integration)', () => {
  let prisma: PrismaClient;
  let teams: TeamsService;
  let wallets: WalletsService;
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
      mkUser(`itteam-cap-${SUFFIX}@sango.vn`, 'Captain User'),
      mkUser(`itteam-m1-${SUFFIX}@sango.vn`, 'Member One'),
      mkUser(`itteam-m2-${SUFFIX}@sango.vn`, 'Member Two'),
      mkUser(`itteam-str-${SUFFIX}@sango.vn`, 'Stranger User'),
    ]);

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, TeamsModule],
    }).compile();
    teams = moduleRef.get(TeamsService);
    wallets = moduleRef.get(WalletsService);
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
      await prisma.walletLedger.deleteMany({ where: { userId: { in: ids } } });
      await prisma.walletBalance.deleteMany({ where: { userId: { in: ids } } });
      await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
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
  /** Khoản nợ đã trả qua ví ở PAY-1 — dùng lại cho ca replay PAY-3. */
  let walletPaidShareId!: string;

  /** Đọc số dư ví hiện tại từ wallet_balances (kho/cache đồng bộ của ledger). */
  const walletBalanceOf = async (userId: string): Promise<number> => {
    const rows = (await prisma.$queryRaw`SELECT balance FROM "wallet_balances" WHERE "userId" = ${userId}::uuid`) as Array<{ balance: number }>;
    return Number(rows[0]?.balance ?? 0);
  };

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

  /* ------------------- Phase 1 (T1.2): notification ghi nợ / xác nhận ------------------- */ 

  it('NOTIF-1 (Phase 1): bị ghi nợ (split + createExpenseShare) -> debtor nhận notification TEAM', async () => {
    if (!dbUp) return;
    // EXPENSE-1 đã split cho member1/member2 -> từng debtor phải có notification ghi nợ.
    const m2Notifs = await prisma.notification.findMany({
      where: { userId: member2.id, type: 'TEAM' },
    });
    expect(m2Notifs.length).toBeGreaterThan(0);
    expect(m2Notifs.some((n) => n.title === 'Bạn có khoản nợ chia tiền mới')).toBe(true);

    // Ghi nợ thủ công -> member1 nhận thêm đúng 1 notification TEAM mới.
    const before = await prisma.notification.count({ where: { userId: member1.id, type: 'TEAM' } });
    const share = await teams.createExpenseShare(createdTeamId, captain, {
      debtorId: member1.id,
      amount: 50_000,
      note: 'Nợ nước tuần này',
    });
    expect(share.status).toBe('UNPAID');
    const after = await prisma.notification.count({ where: { userId: member1.id, type: 'TEAM' } });
    expect(after).toBe(before + 1);
  });

  it('NOTIF-2 (Phase 1): share -> PAID sinh notification; sai quyền không nhận', async () => {
    if (!dbUp) return;
    const expenses = await teams.getTeamExpenses(createdTeamId, member2);
    const share = expenses.shares.find((s) => s.debtorId === member2.id && s.status === 'UNPAID');
    expect(share).toBeDefined();
    const countTeam = () =>
      prisma.notification.count({ where: { userId: member2.id, type: 'TEAM' } });
    const before = await countTeam();

    // member1 không phải payer/captain của share member2 -> 403, KHÔNG sinh notification.
    await expect(
      teams.updateExpenseShareStatus(createdTeamId, share!.id, member1, { status: 'PAID' }),
    ).rejects.toMatchObject({ response: { code: 'EXPENSE_FORBIDDEN' } });
    expect(await countTeam()).toBe(before);

    // Captain (đồng thời là payer) xác nhận -> debtor nhận notification xác nhận ĐÃ TRẢ.
    const updated = await teams.updateExpenseShareStatus(createdTeamId, share!.id, captain, {
      status: 'PAID',
    });
    expect(updated.status).toBe('PAID');
    expect(await countTeam()).toBe(before + 1);
  });

  /* ------------------- Phase 1 (T1.3): trả nợ qua ví ------------------- */

  it('PAY-1 (Phase 1): trả nợ qua ví thành công — debit debtor + credit payer + PAID', async () => {
    if (!dbUp) return;
    const expenses = await teams.getTeamExpenses(createdTeamId, member2);
    const share = expenses.shares.find((s) => s.debtorId === member2.id && s.status === 'UNPAID');
    expect(share).toBeDefined();
    walletPaidShareId = share!.id;

    // Nạp ví member2 1 triệu; ví captain (payer) bắt đầu từ 0.
    await wallets.credit({
      userId: member2.id,
      amount: 1_000_000,
      type: 'TOPUP',
      refType: 'TEST_TOPUP',
      refId: 'seed-m2-' + SUFFIX,
    });
    const m2Before = await walletBalanceOf(member2.id);
    const capBefore = await walletBalanceOf(captain.id);
    expect(m2Before).toBe(1_000_000);

    const paid = await teams.payExpenseShare(createdTeamId, share!.id, member2);
    expect(paid.status).toBe('PAID');

    // Số dư 2 ví đổi đúng: debtor bị trừ, payer được cộng đúng share.amount.
    expect(await walletBalanceOf(member2.id)).toBe(m2Before - share!.amount);
    expect(await walletBalanceOf(captain.id)).toBe(capBefore + share!.amount);

    // Đúng 1 cặp ledger EXPENSE_SHARE_PAYMENT theo shareId (UNIQUE chống ghi đôi).
    const ledgers = await prisma.walletLedger.findMany({
      where: { refType: 'EXPENSE_SHARE_PAYMENT', refId: share!.id },
    });
    expect(ledgers).toHaveLength(2);
    expect(
      ledgers.find((l) => l.direction === 'DEBIT' && l.type === 'PAYMENT' && l.userId === member2.id),
    ).toBeDefined();
    expect(
      ledgers.find((l) => l.direction === 'CREDIT' && l.type === 'REFUND' && l.userId === captain.id),
    ).toBeDefined();
  });

  it('PAY-2 (Phase 1): ví không đủ -> 409 WALLET_INSUFFICIENT_FUNDS, share vẫn UNPAID', async () => {
    if (!dbUp) return;
    // member1 còn khoản UNPAID nhưng ví = 0 -> bị chặn, không ghi ledger nào.
    const expenses = await teams.getTeamExpenses(createdTeamId, member1);
    const share = expenses.shares.find((s) => s.debtorId === member1.id && s.status === 'UNPAID');
    expect(share).toBeDefined();
    expect(await walletBalanceOf(member1.id)).toBe(0);

    await expect(
      teams.payExpenseShare(createdTeamId, share!.id, member1),
    ).rejects.toMatchObject({ response: { code: 'WALLET_INSUFFICIENT_FUNDS' } });

    const stillUnpaid = await prisma.expenseShare.findUnique({ where: { id: share!.id } });
    expect(stillUnpaid!.status).toBe('UNPAID');
    expect(
      await prisma.walletLedger.count({
        where: { refType: 'EXPENSE_SHARE_PAYMENT', refId: share!.id },
      }),
    ).toBe(0);
  });

  it('PAY-3 (Phase 1): replay trả lại lần 2 — idempotent, không trừ lần 2', async () => {
    if (!dbUp) return;
    const share = await prisma.expenseShare.findUnique({ where: { id: walletPaidShareId } });
    expect(share!.status).toBe('PAID');
    const m2Before = await walletBalanceOf(member2.id);
    const capBefore = await walletBalanceOf(captain.id);

    // Gọi lại trên share đã PAID: trả về kết quả hiện tại, không phát sinh ledger mới.
    const replayed = await teams.payExpenseShare(createdTeamId, walletPaidShareId, member2);
    expect(replayed.status).toBe('PAID');
    expect(await walletBalanceOf(member2.id)).toBe(m2Before);
    expect(await walletBalanceOf(captain.id)).toBe(capBefore);
    expect(
      await prisma.walletLedger.count({
        where: { refType: 'EXPENSE_SHARE_PAYMENT', refId: walletPaidShareId },
      }),
    ).toBe(2);
  });

  it('PAY-4 (Phase 1): người không phải debtor -> 403', async () => {
    if (!dbUp) return;
    // member1 còn khoản UNPAID (DEDUP) — member2 và stranger không được trả hộ.
    const expenses = await teams.getTeamExpenses(createdTeamId, member1);
    const share = expenses.shares.find((s) => s.debtorId === member1.id && s.status === 'UNPAID');
    expect(share).toBeDefined();

    await expect(
      teams.payExpenseShare(createdTeamId, share!.id, member2),
    ).rejects.toMatchObject({ response: { code: 'EXPENSE_FORBIDDEN' } });
    await expect(
      teams.payExpenseShare(createdTeamId, share!.id, stranger),
    ).rejects.toMatchObject({ response: { code: 'EXPENSE_FORBIDDEN' } });

    const stillUnpaid = await prisma.expenseShare.findUnique({ where: { id: share!.id } });
    expect(stillUnpaid!.status).toBe('UNPAID');
  });

  it('PAY-5 (R1): trả lại khoản đã trả qua ví nhưng bị PATCH mở lại UNPAID -> 409 EXPENSE_ALREADY_PAID', async () => {
    if (!dbUp) return;
    // member1 còn khoản UNPAID (PAY-2/PAY-4 không đụng vào) — dùng cho cả 2 lần trả trong ca này.
    const expenses = await teams.getTeamExpenses(createdTeamId, member1);
    const share = expenses.shares.find((s) => s.debtorId === member1.id && s.status === 'UNPAID');
    expect(share).toBeDefined();

    // Nạp đủ cho CẢ 2 lần trả (2x amount + buffer) để lần 2 rơi vào guard UNIQUE
    // chứ không phải WALLET_INSUFFICIENT (lần 1 đã tiêu amount).
    await wallets.credit({
      userId: member1.id,
      amount: share!.amount * 2 + 10_000,
      type: 'TOPUP',
      refType: 'TEST_TOPUP',
      refId: 'seed-m1-pay5-' + SUFFIX,
    });

    // Lần 1: trả thành công -> PAID + đúng 2 dòng ledger (DEBIT/PAYMENT + CREDIT/REFUND).
    const paid = await teams.payExpenseShare(createdTeamId, share!.id, member1);
    expect(paid.status).toBe('PAID');
    expect(
      await prisma.walletLedger.count({
        where: { refType: 'EXPENSE_SHARE_PAYMENT', refId: share!.id },
      }),
    ).toBe(2);

    const m1AfterFirst = await walletBalanceOf(member1.id);
    const capAfterFirst = await walletBalanceOf(captain.id);

    // PATCH mở lại UNPAID (captain là payer nên được quyền) — ledger cũ vẫn còn nguyên.
    await teams.updateExpenseShareStatus(createdTeamId, share!.id, captain, {
      status: 'UNPAID',
    });

    // Lần 2: recheck UNPAID đi qua nhưng insert debit va UNIQUE(refType, refId, type)
    // -> P2002 được bắt thành 409 EXPENSE_ALREADY_PAID (teams.service.ts:664), không vỡ 500.
    await expect(
      teams.payExpenseShare(createdTeamId, share!.id, member1),
    ).rejects.toMatchObject({ response: { code: 'EXPENSE_ALREADY_PAID' } });

    // Tx rollback sạch: không thêm ledger, số dư không đổi, share không chuyển PAID.
    expect(
      await prisma.walletLedger.count({
        where: { refType: 'EXPENSE_SHARE_PAYMENT', refId: share!.id },
      }),
    ).toBe(2);
    expect(await walletBalanceOf(member1.id)).toBe(m1AfterFirst);
    expect(await walletBalanceOf(captain.id)).toBe(capAfterFirst);
    const afterRetry = await prisma.expenseShare.findUnique({ where: { id: share!.id } });
    expect(afterRetry!.status).toBe('UNPAID');

    // Dọn trạng thái khớp ledger (khoản này thực tế đã được trả qua ví) — tránh nhiễu test sau.
    await prisma.expenseShare.update({
      where: { id: share!.id },
      data: { status: 'PAID' },
    });
  });
});
