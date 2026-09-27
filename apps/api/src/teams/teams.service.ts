import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  FundDriveScope,
  FundDriveStatus,
  TeamFundEntryType,
  type ExpenseShare,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { NotificationType } from '@sango/shared';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { NotifyService } from '../notifications/notify.service';
import type {
  CreateExpenseShareDto,
  CreateFundDriveDto,
  ContributeFundDto,
  CreateTeamExpenseDto,
  CreateTeamDto,
  InviteMemberDto,
  SplitBookingExpenseDto,
  UpdateExpenseShareStatusDto,
  UpdateTeamDto,
} from './dto/team.dto';

/**
 * Kết quả trả về cho lời mời — CỐ TÌNH không chứa userId/thành viên để không
 * lộ ra việc email có tồn tại hay không (chống dò tài khoản).
 */
const INVITE_RESULT = {
  status: 'PENDING' as const,
  message: 'Đã gửi lời mời. Nếu tài khoản tồn tại, thành viên sẽ thấy yêu cầu trong đội.',
};

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletsService,
    private readonly notify: NotifyService,
  ) {}

  /**
   * Phase 1 (T1.2): notification TEAM cho debtor — LUÔN gọi SAU khi transaction
   * nghiệp vụ commit (pattern notifyAfterConfirm — bookings.service.ts). Lỗi notify
   * chỉ được log, KHÔNG BAO GIỜ làm fail nghiệp vụ chia tiền (fire-and-forget).
   */
  private async notifyTeamSafe(input: {
    userId: string;
    title: string;
    body: string;
    link?: string;
  }): Promise<void> {
    try {
      await this.notify.dispatch({
        userId: input.userId,
        type: NotificationType.TEAM,
        title: input.title,
        body: input.body,
        link: input.link,
      });
    } catch (e) {
      this.logger.warn(`Gửi notification TEAM thất bại (bỏ qua): ${(e as Error).message}`);
    }
  }

  /** Tạo đội thể thao mới: người tạo tự động là CAPTAIN và thành viên ACTIVE đầu tiên. */
  async createTeam(user: { id: string }, dto: CreateTeamDto) {
    return this.prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: dto.name,
          logoUrl: dto.logoUrl || null,
          description: dto.description || null,
          sportType: dto.sportType,
          captainId: user.id,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: user.id,
          role: 'CAPTAIN',
          status: 'ACTIVE',
        },
      });

      return team;
    });
  }

  /** Chi tiết và liên hệ chỉ dành cho thành viên ACTIVE hoặc người được mời. */
  async getTeam(teamId: string, user: { id: string }) {
    const membership = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: user.id, status: { in: ['ACTIVE', 'PENDING'] } },
    });
    if (!membership) {
      throw new ForbiddenException({ message: 'Bạn không có quyền xem đội này', code: 'TEAM_FORBIDDEN' });
    }
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        captain: {
          select: { id: true, fullName: true, avatarUrl: true, email: true, phone: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true, email: true, phone: true },
            },
          },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
      },
    });

    if (!team) {
      throw new NotFoundException({
        message: 'Không tìm thấy đội thể thao',
        code: 'TEAM_NOT_FOUND',
      });
    }

    return team;
  }

  /** Danh sách các đội của tôi: các đội tôi tham gia (ACTIVE hoặc PENDING). */
  async listMyTeams(user: { id: string }) {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            captain: { select: { id: true, fullName: true, avatarUrl: true } },
            _count: { select: { members: { where: { status: 'ACTIVE' } } } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      team: {
        ...m.team,
        memberCount: m.team._count.members,
      },
    }));
  }

  /** Cập nhật thông tin đội: chỉ CAPTAIN của đội mới được phép. */
  async updateTeam(teamId: string, user: { id: string }, dto: UpdateTeamDto) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException({
        message: 'Không tìm thấy đội thể thao',
        code: 'TEAM_NOT_FOUND',
      });
    }
    if (team.captainId !== user.id) {
      throw new ForbiddenException({
        message: 'Chỉ đội trưởng mới có quyền chỉnh sửa đội',
        code: 'TEAM_FORBIDDEN',
      });
    }

    return this.prisma.team.update({
      where: { id: teamId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl || null } : {}),
        ...(dto.description !== undefined ? { description: dto.description || null } : {}),
        ...(dto.sportType ? { sportType: dto.sportType } : {}),
      },
    });
  }

  /** Mời thành viên vào đội (tạo TeamMember PENDING). Chỉ CAPTAIN được mời. */
  async inviteMember(teamId: string, user: { id: string }, dto: InviteMemberDto) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException({
        message: 'Không tìm thấy đội thể thao',
        code: 'TEAM_NOT_FOUND',
      });
    }
    if (team.captainId !== user.id) {
      throw new ForbiddenException({
        message: 'Chỉ đội trưởng mới có quyền mời thành viên',
        code: 'TEAM_FORBIDDEN',
      });
    }

    // Chống dò email (đúng convention auth.service.ts:96,205): KHÔNG phân biệt được
    // "email không tồn tại" với "đã là thành viên" — cả hai trả cùng một kết quả.
    // users.email là cột case-sensitive và dữ liệu cũ có thể lưu Nguyễn.VanA@Gmail.com,
    // nên tra cứu mode insensitive thay vì so khớp chính xác.
    const target = dto.userId
      ? { id: dto.userId }
      : await this.prisma.user.findFirst({
          where: { email: { equals: dto.email ?? '', mode: 'insensitive' } },
          select: { id: true },
        });
    // Không tìm thấy user -> UUID ngẫu nhiên để create hỏng FK (P2003), y hệt trường
    // hợp email có thật nhưng đã là thành viên (P2002).
    const targetUserId = target?.id ?? randomUUID();

    try {
      await this.prisma.teamMember.create({
        data: {
          teamId,
          userId: targetUserId,
          role: 'MEMBER',
          status: 'PENDING',
        },
      });
    } catch (e) {
      const code = (e as Prisma.PrismaClientKnownRequestError).code;
      if (code === 'P2002' || code === 'P2003') return INVITE_RESULT;
      throw e;
    }
    return INVITE_RESULT;
  }

  /** Chấp nhận hoặc từ chối lời mời vào đội. */
  async respondInvite(teamId: string, user: { id: string }, accept: boolean) {
    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: user.id } },
    });

    if (!member || member.status !== 'PENDING') {
      throw new NotFoundException({
        message: 'Không tìm thấy lời mời vào đội này',
        code: 'INVITE_NOT_FOUND',
      });
    }

    if (accept) {
      return this.prisma.teamMember.update({
        where: { id: member.id },
        data: { status: 'ACTIVE', joinedAt: new Date() },
      });
    } else {
      return this.prisma.teamMember.delete({ where: { id: member.id } });
    }
  }

  /** Xoá thành viên khỏi đội: CAPTAIN xoá member hoặc member tự rời đội. */
  async removeMember(teamId: string, memberUserId: string, user: { id: string }) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException({
        message: 'Không tìm thấy đội thể thao',
        code: 'TEAM_NOT_FOUND',
      });
    }

    const isSelf = user.id === memberUserId;
    const isCaptain = team.captainId === user.id;

    if (!isSelf && !isCaptain) {
      throw new ForbiddenException({
        message: 'Bạn không có quyền xoá thành viên này khỏi đội',
        code: 'TEAM_FORBIDDEN',
      });
    }

    if (isSelf && isCaptain) {
      throw new BadRequestException({
        message: 'Đội trưởng không thể tự rời đội. Vui lòng chuyển nhượng đội trước',
        code: 'CAPTAIN_CANNOT_LEAVE',
      });
    }

    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: memberUserId } },
    });
    if (!member) {
      throw new NotFoundException({
        message: 'Thành viên không tồn tại trong đội',
        code: 'MEMBER_NOT_FOUND',
      });
    }

    await this.prisma.teamMember.delete({ where: { id: member.id } });
    return { success: true, message: 'Đã xoá thành viên khỏi đội' };
  }

  /* ------------------- QUỸ ĐỘI / EXPENSE SHARE (TRACK-ONLY) ------------------- */

  /** Tạo một khoản ghi nợ thủ công giữa 2 thành viên trong đội. */
  async createExpenseShare(teamId: string, user: { id: string }, dto: CreateExpenseShareDto) {
    const isMember = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: user.id, status: 'ACTIVE' },
    });
    if (!isMember) {
      throw new ForbiddenException({
        message: 'Bạn phải là thành viên chính thức của đội mới có thể tạo khoản chia tiền',
        code: 'TEAM_FORBIDDEN',
      });
    }

    const isDebtorMember = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: dto.debtorId, status: 'ACTIVE' },
    });
    if (!isDebtorMember) {
      throw new BadRequestException({
        message: 'Người nhận nợ phải là thành viên chính thức của đội',
        code: 'DEBTOR_NOT_MEMBER',
      });
    }

    const share = await this.prisma.expenseShare.create({
      data: {
        teamId,
        bookingId: dto.bookingId || null,
        payerId: user.id,
        debtorId: dto.debtorId,
        amount: dto.amount,
        note: dto.note || null,
        status: 'UNPAID',
      },
    });

    // Phase 1 (T1.2): debtor bị ghi nợ -> notification TEAM sau khi CREATE commit.
    await this.notifyTeamSafe({
      userId: share.debtorId,
      title: 'Bạn có khoản nợ chia tiền mới',
      body: `Bạn bị ghi nợ ${share.amount.toLocaleString('vi-VN')}đ trong đội${share.note ? ` — ${share.note}` : ''}`,
      link: `/teams/${teamId}`,
    });

    return share;
  }

  /** Chia tiền đã thanh toán của booking; người đặt sân là người ứng tiền. */
  async splitBookingExpense(teamId: string, user: { id: string }, dto: SplitBookingExpenseDto) {
    const split = await this.prisma.$transaction(async (tx) => {
      const reference = await tx.booking.findUnique({
        where: dto.bookingId ? { id: dto.bookingId } : { code: dto.bookingCode },
        select: { id: true },
      });
      if (!reference) {
        throw new NotFoundException({ message: 'Không tìm thấy đơn đặt sân', code: 'BOOKING_NOT_FOUND' });
      }
      await tx.$queryRaw`SELECT id FROM "bookings" WHERE id = ${reference.id}::uuid FOR UPDATE`;
      const booking = await tx.booking.findUniqueOrThrow({
        where: { id: reference.id }, include: { payments: true },
      });
      const team = await tx.team.findUnique({ where: { id: teamId } });
      if (!team) {
        throw new NotFoundException({ message: 'Không tìm thấy đội thể thao', code: 'TEAM_NOT_FOUND' });
      }
      if (booking.customerId !== user.id && team.captainId !== user.id) {
        throw new ForbiddenException({ message: 'Chỉ người đặt sân hoặc đội trưởng mới có thể chia tiền đơn này', code: 'FORBIDDEN_SPLIT' });
      }
      if (booking.teamId !== teamId) {
        throw new BadRequestException({ message: 'Đơn đặt sân không thuộc đội này', code: 'BOOKING_TEAM_MISMATCH' });
      }
      const payerId = booking.customerId;
      if (!payerId || booking.status === 'CANCELLED') {
        throw new BadRequestException({ message: 'Đơn không có người ứng tiền hợp lệ hoặc đã hủy', code: 'BOOKING_NOT_SPLITTABLE' });
      }
      const memberIds = [...new Set(dto.memberIds)];
      const requiredIds = [...new Set([...memberIds, payerId, user.id])];
      const activeMembers = await tx.teamMember.findMany({
        where: { teamId, userId: { in: requiredIds }, status: 'ACTIVE' },
        select: { userId: true },
      });
      if (activeMembers.length !== requiredIds.length) {
        throw new BadRequestException({ message: 'Có thành viên không thuộc đội hoặc chưa ACTIVE', code: 'MEMBER_NOT_ACTIVE' });
      }
      const totalToSplit = booking.payments
        .filter((p) => p.status === 'PAID' && (p.type === 'DEPOSIT' || p.type === 'FULL'))
        .reduce((sum, p) => sum + p.amount, 0);
      if (totalToSplit <= 0) {
        throw new BadRequestException({ message: 'Đơn chưa có khoản thanh toán được xác nhận', code: 'BOOKING_NOT_PAID' });
      }
      if (memberIds.length === 0 || memberIds.every((id) => id === payerId)) {
        throw new BadRequestException({ message: 'Chọn ít nhất một thành viên khác người ứng tiền', code: 'EMPTY_DEBTORS' });
      }
      const existingShare = await tx.expenseShare.findFirst({
        where: { teamId, bookingId: booking.id }, select: { id: true },
      });
      if (existingShare) {
        throw new ConflictException({ message: 'Đơn này đã được chia tiền trong đội rồi', code: 'BOOKING_ALREADY_SPLIT' });
      }
      const sharePerPerson = Math.floor(totalToSplit / memberIds.length);
      if (sharePerPerson === 0) {
        throw new BadRequestException({ message: 'Số tiền không đủ để chia cho các thành viên', code: 'SPLIT_AMOUNT_TOO_SMALL' });
      }
      const remainder = totalToSplit % memberIds.length;
      const createdShares = [];
      for (const [index, debtorId] of memberIds.entries()) {
        if (debtorId === payerId) continue;
        createdShares.push(await tx.expenseShare.create({
          data: {
            teamId, bookingId: booking.id, payerId, debtorId,
            amount: sharePerPerson + (index < remainder ? 1 : 0),
            note: dto.note || `Chia tiền sân đơn ${booking.code}`, status: 'UNPAID',
          },
        }));
      }
      return {
        bookingId: booking.id, bookingCode: booking.code, totalAmount: totalToSplit,
        sharePerPerson, sharesCreated: createdShares.length, shares: createdShares,
      };
    });

    // Phase 1 (T1.2): SAU khi tx commit — từng debtor bị ghi nợ nhận notification TEAM.
    for (const share of split.shares) {
      await this.notifyTeamSafe({
        userId: share.debtorId,
        title: 'Bạn có khoản nợ chia tiền mới',
        body: `Đơn ${split.bookingCode} đã được chia đều — bạn nợ ${share.amount.toLocaleString('vi-VN')}đ`,
        link: `/teams/${teamId}`,
      });
    }

    return split;
  }

  /** Xem danh sách khoản chia tiền của đội + tổng quan nợ. */
  async getTeamExpenses(teamId: string, user: { id: string }) {
    const isMember = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: user.id, status: 'ACTIVE' },
    });
    if (!isMember) {
      throw new ForbiddenException({
        message: 'Chỉ thành viên chính thức mới có thể xem quỹ đội',
        code: 'TEAM_FORBIDDEN',
      });
    }

    const shares = await this.prisma.expenseShare.findMany({
      where: { teamId },
      include: {
        payer: { select: { id: true, fullName: true, avatarUrl: true } },
        debtor: { select: { id: true, fullName: true, avatarUrl: true } },
        booking: { select: { id: true, code: true, date: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalUnpaid = shares
      .filter((s) => s.status === 'UNPAID')
      .reduce((sum, s) => sum + s.amount, 0);

    const myOwed = shares
      .filter((s) => s.debtorId === user.id && s.status === 'UNPAID')
      .reduce((sum, s) => sum + s.amount, 0);

    const myReceivable = shares
      .filter((s) => s.payerId === user.id && s.status === 'UNPAID')
      .reduce((sum, s) => sum + s.amount, 0);

    // Tính treasury metrics & fundLogs cho FE tab Quỹ đội
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalContributions, monthContributions, expenses] = await Promise.all([
      this.prisma.fundContribution.aggregate({
        where: { fundDrive: { teamId } },
        _sum: { amount: true },
      }),
      this.prisma.fundContribution.aggregate({
        where: { fundDrive: { teamId }, paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.teamExpense.findMany({
        where: { teamId },
        include: { recorder: { select: { fullName: true } } },
        orderBy: { occurredAt: 'desc' },
      }),
    ]);

    let totalExpenseLogged = 0;
    let totalOtherIncome = 0;
    let monthlyExpense = 0;
    let monthlyIncome = monthContributions._sum.amount ?? 0;

    for (const exp of expenses) {
      if (exp.type === TeamFundEntryType.EXPENSE) {
        totalExpenseLogged += exp.amount;
        if (exp.occurredAt >= startOfMonth) {
          monthlyExpense += exp.amount;
        }
      } else {
        totalOtherIncome += exp.amount;
        if (exp.occurredAt >= startOfMonth) {
          monthlyIncome += exp.amount;
        }
      }
    }

    const totalIncome = (totalContributions._sum.amount ?? 0) + totalOtherIncome;
    const treasuryBalance = totalIncome - totalExpenseLogged;

    const fundLogs = expenses.map((e) => ({
      id: e.id,
      teamId: e.teamId,
      type: e.type,
      title: e.reason,
      amount: e.amount,
      creatorName: e.recorder.fullName,
      billImageUrl: e.receiptUrl,
      createdAt: e.occurredAt.toISOString(),
    }));

    return {
      treasuryBalance,
      monthlyIncome,
      monthlyExpense,
      totalUnpaid,
      myOwed,
      myReceivable,
      shares,
      fundLogs,
    };
  }

  /** Đánh dấu khoản chia tiền là ĐÃ TRẢ (PAID) hoặc CHƯA TRẢ (UNPAID). Chỉ payer hoặc captain được cập nhật. */
  async updateExpenseShareStatus(
    teamId: string,
    shareId: string,
    user: { id: string },
    dto: UpdateExpenseShareStatusDto,
  ) {
    const { updated, transitioned, isPayer } = await this.prisma.$transaction(async (tx) => {
      // Dùng cùng khóa với payExpenseShare: không thể mở nợ giữa debit/credit và PAID.
      await tx.$queryRaw`SELECT id FROM "expense_shares" WHERE id = ${shareId}::uuid FOR UPDATE`;
      const share = await tx.expenseShare.findUnique({ where: { id: shareId }, include: { team: true } });
      if (!share || share.teamId !== teamId) {
        throw new NotFoundException({ message: 'Không tìm thấy khoản chia tiền', code: 'EXPENSE_NOT_FOUND' });
      }
      const isPayer = share.payerId === user.id;
      if (!isPayer && share.team.captainId !== user.id) {
        throw new ForbiddenException({ message: 'Chỉ người ứng tiền hoặc đội trưởng mới được xác nhận', code: 'EXPENSE_FORBIDDEN' });
      }
      if (dto.status === 'UNPAID') {
        const settlement = await tx.walletLedger.findFirst({
          where: { refType: 'EXPENSE_SHARE_PAYMENT', refId: share.id }, select: { id: true },
        });
        if (settlement) {
          throw new ConflictException({ message: 'Khoản đã thanh toán qua ví không thể mở lại', code: 'EXPENSE_ALREADY_PAID' });
        }
      }
      const updated = await tx.expenseShare.update({ where: { id: shareId }, data: { status: dto.status } });
      return { updated, isPayer, transitioned: dto.status === 'PAID' && share.status !== 'PAID' };
    });

    if (transitioned) {
      await this.notifyTeamSafe({
        userId: updated.debtorId,
        title: 'Khoản nợ đã được xác nhận trả',
        body: `Khoản ${updated.amount.toLocaleString('vi-VN')}đ đã được ${isPayer ? 'người ứng tiền' : 'đội trưởng'} xác nhận ĐÃ TRẢ`,
        link: `/teams/${teamId}`,
      });
    }

    return updated;
  }

  /**
   * Phase 1 (T1.3): debtor tự trả nợ chia tiền bằng Ví nội bộ — MỘT transaction: 
   * FOR UPDATE khoá dòng share + recheck UNPAID -> debit debtor + credit payer
   * (ledger refType EXPENSE_SHARE_PAYMENT, refId shareId — UNIQUE(refType, refId, type)
   * chặn ghi đôi/replay) -> status PAID. Replay trên share đã PAID trả về kết quả
   * hiện tại (idempotent — KHÔNG trừ ví lần 2). Ví thiếu tiền -> 409 WALLET_INSUFFICIENT_FUNDS.
   */
  async payExpenseShare(teamId: string, shareId: string, user: { id: string }) {
    let settled: { share: ExpenseShare; replay: boolean };
    try {
      settled = await this.prisma.$transaction(async (tx) => {
        // Khoá dòng share: hai lần trả song song xếp hàng, recheck dưới lock luôn đúng trạng thái.
        await tx.$queryRaw`SELECT id FROM "expense_shares" WHERE id = ${shareId}::uuid FOR UPDATE`;
        const share = await tx.expenseShare.findUnique({ where: { id: shareId } });
        if (!share || share.teamId !== teamId) {
          throw new NotFoundException({
            message: 'Không tìm thấy khoản chia tiền',
            code: 'EXPENSE_NOT_FOUND',
          });
        }
        // Chỉ debtor được tự trả nợ.
        if (share.debtorId !== user.id) {
          throw new ForbiddenException({
            message: 'Chỉ người nợ (debtor) mới được trả khoản này qua ví',
            code: 'EXPENSE_FORBIDDEN',
          });
        }
        // Idempotent: share đã PAID -> trả lại kết quả hiện tại, KHÔNG trừ ví lần 2.
        if (share.status === 'PAID') {
          return { share, replay: true };
        }

        // Debit trước: thiếu tiền ném 409 ngay, credit chưa kịp ghi (cùng tx -> rollback sạch).
        await this.wallets.applyInTx(tx, {
          userId: share.debtorId,
          amount: share.amount,
          direction: 'DEBIT',
          type: 'PAYMENT',
          refType: 'EXPENSE_SHARE_PAYMENT',
          refId: share.id,
        });
        // Payer được hoàn tiền ứng trước — type REFUND khác PAYMENT nên
        // UNIQUE(refType, refId, type) của ledger không va chạm giữa 2 dòng.
        await this.wallets.applyInTx(tx, {
          userId: share.payerId,
          amount: share.amount,
          direction: 'CREDIT',
          type: 'REFUND',
          refType: 'EXPENSE_SHARE_PAYMENT',
          refId: share.id,
        });

        const updated = await tx.expenseShare.update({
          where: { id: share.id },
          data: { status: 'PAID' },
        });
        return { share: updated, replay: false };
      });
    } catch (e) {
      // Ledger UNIQUE trúng (khoản đã trả qua ví trước đó nhưng bị PATCH mở lại UNPAID)
      // -> chặn trả lần 2 bằng 409 thay vì để P2002 vỡ 500.
      if ((e as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        throw new ConflictException({
          message: 'Khoản này đã được thanh toán qua ví trước đó',
          code: 'EXPENSE_ALREADY_PAID',
        });
      }
      throw e;
    }

    // SAU khi tx commit: debtor nhận xác nhận — lỗi notify không fail business.
    if (!settled.replay) {
      await this.notifyTeamSafe({
        userId: settled.share.debtorId,
        title: 'Trả nợ qua ví thành công',
        body: `Bạn đã trả ${settled.share.amount.toLocaleString('vi-VN')}đ cho khoản chia tiền bằng ví`,
        link: `/teams/${teamId}`,
      });
    }
    return settled.share;
  }

  // ================================================================
  // P5: TEAM TREASURY
  // ================================================================

  /** Tổng quan quỹ đội: số dư, thu/chi tháng này, danh sách đợt thu đang mở */
  async getTreasuryOverview(teamId: string, user: { id: string }) {
    return this.prisma.$transaction(async (tx) => {
      const isMember = await tx.teamMember.findFirst({
        where: { teamId, userId: user.id, status: 'ACTIVE' },
      });
      if (!isMember) {
        throw new ForbiddenException({ message: 'Chỉ thành viên chính thức mới có thể xem quỹ đội', code: 'TEAM_FORBIDDEN' });
      }
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const [expenses, contributions, activeDrives] = await Promise.all([
        tx.teamExpense.findMany({
          where: { teamId }, include: { recorder: { select: { fullName: true } } },
        }),
        tx.fundContribution.findMany({
          where: { fundDrive: { teamId } },
          include: { user: { select: { fullName: true } }, fundDrive: { select: { title: true } } },
        }),
        tx.fundDrive.findMany({
          where: { teamId, status: FundDriveStatus.ACTIVE },
          include: {
            _count: { select: { contributions: true } },
            contributions: { where: { userId: user.id }, select: { id: true, amount: true, paidAt: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);
      const recentTransactions = [
        ...expenses.map((e) => ({
          id: `expense:${e.id}`, type: e.type, amount: e.amount,
          description: e.reason, createdAt: e.occurredAt.toISOString(), createdByName: e.recorder.fullName,
        })),
        ...contributions.map((c) => ({
          id: `contribution:${c.id}`, type: TeamFundEntryType.INCOME, amount: c.amount,
          description: `Đóng quỹ: ${c.fundDrive.title}${c.note ? ` (${c.note})` : ''}`,
          createdAt: c.paidAt.toISOString(), createdByName: c.user.fullName,
        })),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
      let totalIncome = 0;
      let totalExpense = 0;
      let monthIncome = 0;
      let monthExpense = 0;
      for (const entry of recentTransactions) {
        const thisMonth = new Date(entry.createdAt) >= startOfMonth;
        if (entry.type === TeamFundEntryType.INCOME) {
          totalIncome += entry.amount;
          if (thisMonth) monthIncome += entry.amount;
        } else {
          totalExpense += entry.amount;
          if (thisMonth) monthExpense += entry.amount;
        }
      }
      return {
        teamId, balance: totalIncome - totalExpense, monthIncome, monthExpense,
        totalIncome, totalExpense, recentTransactions,
        activeDrives: activeDrives.map((d) => ({
          id: d.id, title: d.title, description: d.description, scope: d.scope,
          targetAmount: d.targetAmount, amountPerMember: d.amountPerMember,
          status: d.status, deadline: d.deadline,
          contributionsCount: d._count.contributions, myContribution: d.contributions[0] ?? null,
        })),
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  /** Tạo đợt thu quỹ (chỉ Captain) */
  async createFundDrive(teamId: string, user: { id: string }, dto: CreateFundDriveDto) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException({ message: 'Không tìm thấy đội', code: 'TEAM_NOT_FOUND' });
    }
    if (team.captainId !== user.id) {
      throw new ForbiddenException({
        message: 'Chỉ đội trưởng mới có quyền tạo đợt thu quỹ',
        code: 'CAPTAIN_ONLY',
      });
    }

    return this.prisma.fundDrive.create({
      data: {
        teamId,
        title: dto.title,
        description: dto.description ?? null,
        scope: dto.scope as FundDriveScope,
        targetAmount: dto.targetAmount,
        amountPerMember: dto.amountPerMember,
        bookingId: dto.bookingId ?? null,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        status: FundDriveStatus.ACTIVE,
      },
    });
  }

  /** Thành viên đóng quỹ — TRỪ VÍ CÁ NHÂN (transactional qua wallets.debit) */
  async contributeFund(teamId: string, driveId: string, user: { id: string }, dto: ContributeFundDto) {
    const drive = await this.prisma.fundDrive.findUnique({
      where: { id: driveId },
      include: { team: true },
    });
    if (!drive || drive.teamId !== teamId) {
      throw new NotFoundException({
        message: 'Không tìm thấy đợt thu quỹ',
        code: 'FUND_DRIVE_NOT_FOUND',
      });
    }
    if (drive.status !== FundDriveStatus.ACTIVE) {
      throw new ConflictException({
        message: 'Đợt thu quỹ này đã đóng',
        code: 'FUND_DRIVE_CLOSED',
      });
    }

    const isMember = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: user.id, status: 'ACTIVE' },
    });
    if (!isMember) {
      throw new ForbiddenException({
        message: 'Chỉ thành viên đội mới có thể đóng quỹ',
        code: 'TEAM_FORBIDDEN',
      });
    }

    // M2 fix: ghi quỹ + trừ ví trong MỘT transaction — hết lệch sổ khi crash
    // giữa chừng (bỏ compensation xoá-bản-ghi ngoài tx).
    return this.prisma.$transaction(async (tx) => {
      const contribution = await tx.fundContribution.create({
        data: {
          fundDriveId: driveId,
          userId: user.id,
          amount: dto.amount,
          note: dto.note ?? null,
        },
      });

      await this.wallets.applyInTx(tx, {
        userId: user.id,
        amount: dto.amount,
        type: 'PAYMENT',
        direction: 'DEBIT',
        refType: 'FUND_CONTRIBUTION',
        refId: contribution.id,
      });

      return contribution;
    });
  }

  /** Thành viên đóng quỹ trực tiếp vào quỹ đội (P5 — Frontend alias) */
  async contributeDirect(teamId: string, user: { id: string }, dto: ContributeFundDto) {
    const isMember = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: user.id, status: 'ACTIVE' },
    });
    if (!isMember) {
      throw new ForbiddenException({
        message: 'Chỉ thành viên đội mới có thể đóng quỹ',
        code: 'TEAM_FORBIDDEN',
      });
    }

    // M2 fix: ghi INCOME + trừ ví trong MỘT transaction (atomic, hết compensation).
    const created = await this.prisma.$transaction(async (tx) => {
      const expense = await tx.teamExpense.create({
        data: {
          teamId,
          type: TeamFundEntryType.INCOME,
          amount: dto.amount,
          reason: dto.note ? `Đóng quỹ: ${dto.note}` : 'Đóng quỹ đội',
          recordedBy: user.id,
          occurredAt: new Date(),
        },
        include: { recorder: { select: { fullName: true } } },
      });

      await this.wallets.applyInTx(tx, {
        userId: user.id,
        amount: dto.amount,
        type: 'PAYMENT',
        direction: 'DEBIT',
        refType: 'TEAM_EXPENSE_INCOME',
        refId: expense.id,
      });

      return expense;
    });

    // Post-commit: lấy số dư mới của quỹ đội cho phản hồi.
    const overview = await this.getTreasuryOverview(teamId, user);
    return {
      success: true,
      newBalance: overview.balance,
      log: {
        id: created.id,
        teamId: created.teamId,
        type: created.type,
        title: created.reason,
        amount: created.amount,
        creatorName: created.recorder.fullName,
        billImageUrl: null,
        createdAt: created.occurredAt.toISOString(),
      },
    };
  }

  /** Danh sách nhật ký thu–chi quỹ đội */
  async listTeamExpenses(teamId: string, user: { id: string }) {
    const isMember = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: user.id, status: 'ACTIVE' },
    });
    if (!isMember) {
      throw new ForbiddenException({
        message: 'Chỉ thành viên chính thức mới có thể xem thu chi',
        code: 'TEAM_FORBIDDEN',
      });
    }

    return this.prisma.teamExpense.findMany({
      where: { teamId },
      include: {
        recorder: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { occurredAt: 'desc' },
    });
  }

  /** Thêm nhật ký thu–chi quỹ: chỉ đội trưởng được ghi sổ. */
  async createTeamExpense(teamId: string, user: { id: string }, dto: CreateTeamExpenseDto) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException({ message: 'Không tìm thấy đội', code: 'TEAM_NOT_FOUND' });
    }
    if (team.captainId !== user.id) {
      throw new ForbiddenException({
        message: 'Chỉ đội trưởng mới có thể ghi nhật ký thu chi',
        code: 'TEAM_FORBIDDEN',
      });
    }

    const expenseReason = dto.title || dto.reason || 'Khoản chi quỹ đội';
    const expenseReceipt = dto.billImageUrl || dto.receiptUrl || null;

    const created = await this.prisma.teamExpense.create({
      data: {
        teamId,
        type: (dto.type ?? 'EXPENSE') as TeamFundEntryType,
        amount: dto.amount,
        reason: expenseReason,
        receiptUrl: expenseReceipt,
        recordedBy: user.id,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      },
      include: {
        recorder: { select: { fullName: true } },
      },
    });

    return {
      id: created.id,
      teamId: created.teamId,
      type: created.type,
      title: created.reason,
      amount: created.amount,
      creatorName: created.recorder.fullName,
      billImageUrl: created.receiptUrl,
      createdAt: created.occurredAt.toISOString(),
    };
  }
}
