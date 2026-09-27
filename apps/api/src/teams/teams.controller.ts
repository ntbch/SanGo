import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import {
  CreateExpenseShareSchema,
  CreateFundDriveSchema,
  ContributeFundSchema,
  CreateTeamExpenseSchema,
  CreateTeamSchema,
  InviteMemberSchema,
  RespondInviteSchema,
  SplitBookingExpenseSchema,
  UpdateExpenseShareStatusSchema,
  UpdateTeamSchema,
  type CreateExpenseShareDto,
  type CreateFundDriveDto,
  type ContributeFundDto,
  type CreateTeamExpenseDto,
  type CreateTeamDto,
  type InviteMemberDto,
  type RespondInviteDto,
  type SplitBookingExpenseDto,
  type UpdateExpenseShareStatusDto,
  type UpdateTeamDto,
} from './dto/team.dto';
import { TeamsService } from './teams.service';

@ApiTags('teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: '[S2-F1] Tạo đội thể thao mới (người tạo là CAPTAIN)' })
  @ApiResponse({ status: 201, description: 'Đội vừa tạo' })
  createTeam(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateTeamSchema)) dto: CreateTeamDto,
  ) {
    return this.teamsService.createTeam(user, dto);
  }

  @Get('my-teams')
  @ApiOperation({ summary: '[S2-F1] Danh sách đội tôi tham gia (ACTIVE hoặc PENDING)' })
  listMyTeams(@CurrentUser() user: AuthUser) {
    return this.teamsService.listMyTeams(user);
  }

  @Get(':id')
  @ApiOperation({ summary: '[S2-F1] Chi tiết đội thể thao và danh sách thành viên' })
  getTeam(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.teamsService.getTeam(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: '[S2-F1] Chỉnh sửa thông tin đội (chỉ CAPTAIN)' })
  updateTeam(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(UpdateTeamSchema)) dto: UpdateTeamDto,
  ) {
    return this.teamsService.updateTeam(id, user, dto);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: '[S2-F1] Mời thành viên vào đội (tạo PENDING invite, chỉ CAPTAIN)' })
  inviteMember(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(InviteMemberSchema)) dto: InviteMemberDto,
  ) {
    return this.teamsService.inviteMember(id, user, dto);
  }

  @Post(':id/respond-invite')
  @ApiOperation({
    summary: '[S2-F1] Chấp nhận (accept=true) hoặc từ chối (accept=false) lời mời vào đội',
  })
  respondInvite(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(RespondInviteSchema)) dto: RespondInviteDto,
  ) {
    return this.teamsService.respondInvite(id, user, dto.accept);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: '[S2-F1] Xoá thành viên (CAPTAIN xoá hoặc member tự rời đội)' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.teamsService.removeMember(id, userId, user);
  }

  /* ---------------- QUỸ ĐỘI / EXPENSE SHARE ---------------- */

  @Get(':id/expenses')
  @ApiOperation({ summary: '[S2-F1] Xem danh sách khoản chia tiền và tổng quan nợ của đội' })
  getTeamExpenses(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.teamsService.getTeamExpenses(id, user);
  }

  @Post(':id/expenses')
  @ApiOperation({ summary: '[S2-F1] Tạo khoản chia tiền thủ công trong đội' })
  createExpenseShare(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateExpenseShareSchema)) dto: CreateExpenseShareDto,
  ) {
    return this.teamsService.createExpenseShare(id, user, dto);
  }

  @Post(':id/expenses/split-booking')
  @ApiOperation({ summary: '[S2-F1] Chia đều tiền sân cho các thành viên trong đội' })
  splitBooking(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(SplitBookingExpenseSchema)) dto: SplitBookingExpenseDto,
  ) {
    return this.teamsService.splitBookingExpense(id, user, dto);
  }

  @Patch(':id/expenses/:shareId/status')
  @ApiOperation({
    summary: '[S2-F1] Cập nhật trạng thái thanh toán khoản nợ (UNPAID -> PAID, chỉ payer/captain)',
  })
  updateExpenseStatus(
    @Param('id') id: string,
    @Param('shareId') shareId: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(UpdateExpenseShareStatusSchema)) dto: UpdateExpenseShareStatusDto,
  ) {
    return this.teamsService.updateExpenseShareStatus(id, shareId, user, dto);
  }

  // Phase 1 (T1.3): trả nợ qua ví — atomic + idempotent
  @Post(':id/expenses/:shareId/pay')
  @ApiOperation({
    summary: '[Phase 1] Debtor trả nợ chia tiền qua ví — 1 tx debit/credit + PAID, idempotent',
  })
  payExpenseShareFromWallet(
    @Param('id') id: string,
    @Param('shareId') shareId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.teamsService.payExpenseShare(id, shareId, user);
  }

  // ================================================================
  // P5: TEAM TREASURY
  // ================================================================

  @Get(':id/treasury')
  @ApiOperation({ summary: 'Tổng quan quỹ đội: số dư, thu/chi tháng này, các đợt thu đang mở' })
  getTreasuryOverview(
    @CurrentUser() user: AuthUser,
    @Param('id') teamId: string,
  ) {
    return this.teamsService.getTreasuryOverview(teamId, user);
  }

  @Post(':id/treasury/contribute')
  @ApiOperation({ summary: '[Frontend P5] Thành viên đóng quỹ đội bằng Ví cá nhân' })
  contributeDirect(
    @CurrentUser() user: AuthUser,
    @Param('id') teamId: string,
    @Body(new ZodValidationPipe(ContributeFundSchema)) dto: ContributeFundDto,
  ) {
    return this.teamsService.contributeDirect(teamId, user, dto);
  }

  @Post(':id/treasury/expense')
  @ApiOperation({ summary: '[Frontend P5] Đội trưởng ghi khoản chi quỹ kèm ảnh hóa đơn' })
  createTreasuryExpense(
    @CurrentUser() user: AuthUser,
    @Param('id') teamId: string,
    @Body(new ZodValidationPipe(CreateTeamExpenseSchema)) dto: CreateTeamExpenseDto,
  ) {
    return this.teamsService.createTeamExpense(teamId, user, dto);
  }

  @Post(':id/fund-drives')
  @ApiOperation({ summary: 'Tạo đợt thu quỹ mới (theo tháng hoặc theo trận) — chỉ Đội trưởng' })
  createFundDrive(
    @CurrentUser() user: AuthUser,
    @Param('id') teamId: string,
    @Body(new ZodValidationPipe(CreateFundDriveSchema)) dto: CreateFundDriveDto,
  ) {
    return this.teamsService.createFundDrive(teamId, user, dto);
  }

  @Post(':id/fund-drives/:driveId/contribute')
  @ApiOperation({ summary: 'Thành viên đóng quỹ — trừ tiền trực tiếp từ ví cá nhân' })
  contributeFund(
    @CurrentUser() user: AuthUser,
    @Param('id') teamId: string,
    @Param('driveId') driveId: string,
    @Body(new ZodValidationPipe(ContributeFundSchema)) dto: ContributeFundDto,
  ) {
    return this.teamsService.contributeFund(teamId, driveId, user, dto);
  }

  @Get(':id/fund-expenses')
  @ApiOperation({ summary: 'Xem danh sách nhật ký thu - chi quỹ kèm ảnh hóa đơn' })
  listTeamExpenses(
    @CurrentUser() user: AuthUser,
    @Param('id') teamId: string,
  ) {
    return this.teamsService.listTeamExpenses(teamId, user);
  }

  @Post(':id/fund-expenses')
  @ApiOperation({ summary: 'Thêm dòng thu - chi quỹ đội kèm ảnh hóa đơn' })
  createTeamExpense(
    @CurrentUser() user: AuthUser,
    @Param('id') teamId: string,
    @Body(new ZodValidationPipe(CreateTeamExpenseSchema)) dto: CreateTeamExpenseDto,
  ) {
    return this.teamsService.createTeamExpense(teamId, user, dto);
  }
}
