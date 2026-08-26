import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import {
  CreateJoinRequestSchema,
  CreateMatchCommentSchema,
  OpenMatchesQuerySchema,
  ReviewJoinRequestSchema,
  type CreateJoinRequestDto,
  type CreateMatchCommentDto,
  type OpenMatchesQueryDto,
  type ReviewJoinRequestDto,
} from './dto/open-match.dto';
import { MatchesService } from './matches.service';
import { z } from 'zod';

const UuidParamSchema = z.string().uuid('id không hợp lệ');

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('open')
  @ApiOperation({
    summary:
      '[Public] Ghép trận mở: lọc theo môn, nhóm môn, khu vực, level, khung giờ, ngày',
  })
  open(@Query(new ZodValidationPipe(OpenMatchesQuerySchema)) query: OpenMatchesQueryDto) {
    return this.matchesService.listOpen(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Public / Auth] Chi tiết 1 kèo ghép trận' })
  getDetail(@Param('id', new ZodValidationPipe(UuidParamSchema)) id: string) {
    return this.matchesService.getMatchDetail(id);
  }

  @Post(':id/requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gửi yêu cầu xin tham gia kèo (vị trí, lời nhắn)' })
  createJoinRequest(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
    @Body(new ZodValidationPipe(CreateJoinRequestSchema)) dto: CreateJoinRequestDto,
  ) {
    return this.matchesService.createJoinRequest(id, user, dto);
  }

  @Get(':id/requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Chủ kèo] Xem danh sách yêu cầu xin tham gia' })
  listJoinRequests(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
  ) {
    return this.matchesService.listJoinRequests(id, user);
  }

  @Patch(':id/requests/:requestId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Chủ kèo] Duyệt (APPROVED) hoặc Từ chối (REJECTED) yêu cầu' })
  reviewJoinRequest(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
    @Param('requestId', new ZodValidationPipe(UuidParamSchema)) requestId: string,
    @Body(new ZodValidationPipe(ReviewJoinRequestSchema)) dto: ReviewJoinRequestDto,
  ) {
    return this.matchesService.reviewJoinRequest(id, requestId, user, dto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: '[Public] Xem bình luận trong kèo' })
  listComments(@Param('id', new ZodValidationPipe(UuidParamSchema)) id: string) {
    return this.matchesService.listComments(id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng bình luận vào kèo' })
  createComment(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
    @Body(new ZodValidationPipe(CreateMatchCommentSchema)) dto: CreateMatchCommentDto,
  ) {
    return this.matchesService.createComment(id, user, dto);
  }
}
