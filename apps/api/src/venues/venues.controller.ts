import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import {
  CreateVenueSchema,
  OwnerVenueListQuerySchema,
  ReviewsQuerySchema,
  UpdateVenueSchema,
  VenueListQuerySchema,
  type CreateVenueDto,
  type OwnerVenueListQueryDto,
  type ReviewsQueryDto,
  type UpdateVenueDto,
  type VenueListQueryDto,
} from './dto/venue.dto';
import { VenuesService } from './venues.service';

const venueListQueryDocs = {
  sportType: {
    schema: { enum: ['FOOTBALL5', 'FOOTBALL7', 'PICKLEBALL', 'BADMINTON', 'TENNIS'] },
    description: 'Lọc theo loại sân',
  },
  q: {
    schema: { type: 'string' },
    description: 'Tìm kiếm theo tên sân (không phân biệt hoa thường)',
  },
  city: {
    schema: { type: 'string' },
    description: 'Lọc theo thành phố (mặc định Hà Nội)',
  },
  district: {
    schema: { type: 'string' },
    description: 'Lọc theo quận/huyện',
  },
  userLat: {
    schema: { type: 'number' },
    description: 'Vĩ độ GPS của người dùng để tính cự ly',
  },
  userLng: {
    schema: { type: 'number' },
    description: 'Kinh độ GPS của người dùng để tính cự ly',
  },
  radiusKm: {
    schema: { type: 'number' },
    description: 'Bán kính tìm kiếm (km)',
  },
  sortBy: {
    schema: { enum: ['distance', 'price_asc', 'price_desc'] },
    description: 'Tiêu chí sắp xếp kết quả',
  },
  page: { schema: { type: 'integer', minimum: 1, default: 1 } },
  limit: { schema: { type: 'integer', minimum: 1, maximum: 50, default: 12 } },
} as unknown as Record<string, object>;

@ApiTags('venues')
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  @ApiOperation({
    summary: '[Public] Tìm kiếm sân: chỉ hiện APPROVED, lọc sportType + tìm tên + phân trang',
  })
  @ApiQuery(venueListQueryDocs as never)
  list(@Query(new ZodValidationPipe(VenueListQuerySchema)) query: VenueListQueryDto) {
    return this.venuesService.listPublic(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[OWNER] Danh sách sân của tôi (mọi trạng thái)' })
  mine(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(OwnerVenueListQuerySchema)) query: OwnerVenueListQueryDto,
  ) {
    return this.venuesService.listMine(user, query);
  }

  @Get(':idOrSlug/reviews')
  @ApiOperation({
    summary: '[Public] Đánh giá của sân: phân trang + điểm trung bình aggregate (§3.8)',
  })
  reviews(
    @Param('idOrSlug') idOrSlug: string,
    @Query(new ZodValidationPipe(ReviewsQuerySchema)) query: ReviewsQueryDto,
  ) {
    return this.venuesService.listReviews(idOrSlug, query);
  }

  @Get(':idOrSlug')
  @ApiOperation({
    summary: '[Public] Chi tiết sân theo slug/id kèm courts[] — 404 nếu chưa APPROVED',
  })
  detail(@Param('idOrSlug') idOrSlug: string) {
    return this.venuesService.getPublicByIdOrSlug(idOrSlug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[OWNER] Đăng ký cụm sân mới — luôn ở trạng thái PENDING chờ duyệt' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'address', 'lat', 'lng', 'openMinute', 'closeMinute'],
      properties: {
        name: { type: 'string', example: 'Sân thể thao Ngọc Khánh' },
        address: { type: 'string' },
        city: { type: 'string', example: 'Hà Nội' },
        district: { type: 'string', example: 'Ba Đình' },
        lat: { type: 'number', example: 21.0283 },
        lng: { type: 'number', example: 105.8342 },
        openMinute: {
          type: 'integer',
          example: 360,
          description: 'Phút từ 00:00 giờ VN, 360 = 06:00',
        },
        closeMinute: { type: 'integer', example: 1410 },
        depositPercent: { type: 'integer', minimum: 0, maximum: 100, default: 30 },
        images: { type: 'array', items: { type: 'string', format: 'uri' } },
        amenities: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateVenueSchema)) dto: CreateVenueDto,
  ) {
    return this.venuesService.create(user, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[OWNER] Cập nhật sân của mình — owner khác sẽ bị chặn 403 VENUE_FORBIDDEN',
  })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateVenueSchema)) dto: UpdateVenueDto,
  ) {
    return this.venuesService.update(id, user, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[OWNER] Xóa sân (phải không còn sân con)' })
  @ApiResponse({ status: 409, description: 'VENUE_HAS_COURTS' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.venuesService.remove(id, user);
  }
}
