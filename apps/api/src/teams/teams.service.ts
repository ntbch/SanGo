import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateExpenseShareDto,
  CreateTeamDto,
  InviteMemberDto,
  SplitBookingExpenseDto,
  UpdateExpenseShareStatusDto,
  UpdateTeamDto,
} from './dto/team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

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

  /** Chi tiết đội: kèm danh sách thành viên ACTIVE + thông tin cơ bản đội trưởng. */
  async getTeam(teamId: string) {
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

    const targetUser = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!targetUser) {
      throw new NotFoundException({ message: 'Người dùng không tồn tại', code: 'USER_NOT_FOUND' });
    }

    try {
      return await this.prisma.teamMember.create({
        data: {
          teamId,
          userId: dto.userId,
          role: dto.role,
          status: 'PENDING',
        },
      });
    } catch (e) {
      if ((e as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        throw new ConflictException({
          message: 'Người dùng này đã ở trong đội hoặc đã được mời trước đó',
          code: 'TEAM_MEMBER_EXISTS',
        });
      }
      throw e;
    }
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

    return this.prisma.expenseShare.create({
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
  }

  /**
   * Chia đều tiền một đơn đặt sân (Booking) cho các thành viên trong đội:
   * Tổng tiền = booking.subtotal (hoặc depositAmount nếu chỉ cọc), chia đều cho danh sách memberIds (gồm cả người trả hoặc không).
   * Tạo các bản ghi ExpenseShare UNPAID cho từng debtor.
   */
  async splitBookingExpense(teamId: string, user: { id: string }, dto: SplitBookingExpenseDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { payments: true },
    });
    if (!booking) {
      throw new NotFoundException({
        message: 'Không tìm thấy đơn đặt sân',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    // Người chia tiền phải là người đặt sân (customerId) hoặc captain của đội
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException({
        message: 'Không tìm thấy đội thể thao',
        code: 'TEAM_NOT_FOUND',
      });
    }

    if (booking.customerId !== user.id && team.captainId !== user.id) {
      throw new ForbiddenException({
        message: 'Chỉ người đặt sân hoặc đội trưởng mới có thể chia tiền đơn này',
        code: 'FORBIDDEN_SPLIT',
      });
    }

    // MAJOR-A(2a): đơn phải thuộc đúng đội trên route param — chặn gắn khoản nợ
    // của đội này vào booking của đội khác.
    if (booking.teamId !== teamId) {
      throw new BadRequestException({
        message: 'Đơn đặt sân không thuộc đội này',
        code: 'BOOKING_TEAM_MISMATCH',
      });
    }

    // Tính tổng tiền cần chia: tổng số tiền đã thanh toán (PAID) của đơn
    const paidAmount = booking.payments
      .filter((p) => p.status === 'PAID' && (p.type === 'DEPOSIT' || p.type === 'FULL'))
      .reduce((sum, p) => sum + p.amount, 0);

    const totalToSplit = paidAmount > 0 ? paidAmount : booking.subtotal;
    // Charter C (S3): dedup memberIds — trùng debtor không được sinh 2 khoản nợ
    // giống nhau trong một lần chia tiền.
    dto.memberIds = [...new Set(dto.memberIds)];
    const count = dto.memberIds.length;
    if (count === 0) {
      throw new BadRequestException({
        message: 'Danh sách thành viên chia tiền không được rỗng',
        code: 'EMPTY_MEMBERS',
      });
    }

    // MAJOR-A(2c): mọi người được chia phải là TeamMember ACTIVE của đúng đội này.
    const activeMembers = await this.prisma.teamMember.findMany({
      where: { teamId, userId: { in: dto.memberIds }, status: 'ACTIVE' },
      select: { userId: true },
    });
    if (activeMembers.length !== new Set(dto.memberIds).size) {
      throw new BadRequestException({
        message: 'Có thành viên không thuộc đội hoặc chưa ACTIVE',
        code: 'MEMBER_NOT_ACTIVE',
      });
    }

    const sharePerPerson = Math.floor(totalToSplit / count);

    // Tạo các ExpenseShare cho các thành viên (loại trừ chính người trả nếu có trong danh sách)
    const debtors = dto.memberIds.filter((id) => id !== user.id);

    return this.prisma.$transaction(async (tx) => {
      // MAJOR-A(2b): một booking chỉ được chia tiền MỘT lần trong đội —
      // kiểm tra lại trong transaction để hạn chế double-submit.
      const existingShare = await tx.expenseShare.findFirst({
        where: { teamId, bookingId: booking.id },
        select: { id: true },
      });
      if (existingShare) {
        throw new ConflictException({
          message: 'Đơn này đã được chia tiền trong đội rồi',
          code: 'BOOKING_ALREADY_SPLIT',
        });
      }

      const createdShares = [];
      for (const debtorId of debtors) {
        const share = await tx.expenseShare.create({
          data: {
            teamId,
            bookingId: booking.id,
            payerId: user.id,
            debtorId,
            amount: sharePerPerson,
            note: dto.note || `Chia tiền sân đơn ${booking.code}`,
            status: 'UNPAID',
          },
        });
        createdShares.push(share);
      }

      return {
        bookingId: booking.id,
        bookingCode: booking.code,
        totalAmount: totalToSplit,
        sharePerPerson,
        sharesCreated: createdShares.length,
        shares: createdShares,
      };
    });
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

    return {
      totalUnpaid,
      myOwed,
      myReceivable,
      shares,
    };
  }

  /** Đánh dấu khoản chia tiền là ĐÃ TRẢ (PAID) hoặc CHƯA TRẢ (UNPAID). Chỉ payer hoặc captain được cập nhật. */
  async updateExpenseShareStatus(
    teamId: string,
    shareId: string,
    user: { id: string },
    dto: UpdateExpenseShareStatusDto,
  ) {
    const share = await this.prisma.expenseShare.findUnique({
      where: { id: shareId },
      include: { team: true },
    });
    if (!share || share.teamId !== teamId) {
      throw new NotFoundException({
        message: 'Không tìm thấy khoản chia tiền',
        code: 'EXPENSE_NOT_FOUND',
      });
    }

    const isPayer = share.payerId === user.id;
    const isCaptain = share.team.captainId === user.id;

    if (!isPayer && !isCaptain) {
      throw new ForbiddenException({
        message: 'Chỉ người đã ứng tiền (payer) hoặc đội trưởng mới được xác nhận đã thanh toán',
        code: 'EXPENSE_FORBIDDEN',
      });
    }

    return this.prisma.expenseShare.update({
      where: { id: shareId },
      data: { status: dto.status },
    });
  }
}
