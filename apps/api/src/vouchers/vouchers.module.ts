import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';

/**
 * F3 Voucher module — SCAFFOLD CHƯA ĐĂNG KÝ vào app.module.ts.
 * Sẽ bật cùng lúc với bước nối payments.service đọc finalAmount từ hold
 * (chờ t4 N2 của be-core hoàn tất để tránh conflict file dùng chung).
 */
@Module({
  imports: [AuthModule], // JwtAuthGuard cho controller (cùng pattern PaymentsModule)
  controllers: [VouchersController],
  providers: [VouchersService],
})
export class VouchersModule {}
