import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import {
  ListNotificationsQuerySchema,
  NotificationIdParamSchema,
  type ListNotificationsQueryDto,
} from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Hộp thư thông báo của tôi — mới nhất trước, kèm unreadCount',
  })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', minimum: 1, default: 1 } })
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(ListNotificationsQuerySchema)) query: ListNotificationsQueryDto,
  ) {
    return this.notificationsService.list(user.id, query.page);
  }

  /** Khai báo trước ':id/read' để khớp tường minh (2 route không đè nhau). */
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu toàn bộ thông báo chưa đọc là đã đọc' })
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu một thông báo đã đọc (404 nếu không thuộc sở hữu)' })
  markRead(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(NotificationIdParamSchema)) id: string,
  ) {
    return this.notificationsService.markRead(user.id, id);
  }
}
