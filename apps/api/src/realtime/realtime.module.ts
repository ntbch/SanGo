import { Injectable, Logger, Module, type OnApplicationBootstrap } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletsModule } from '../wallets/wallets.module';
import { WalletsService } from '../wallets/wallets.service';
import { RealtimeGateway } from './realtime.gateway';

/**
 * Facade realtime cho business services: emit event vào room của user,
 * mọi lỗi nuốt ở gateway (fire-and-forget). Phase 4 bọc thêm 2 method
 * TOP-LEVEL `credit()`/`debit()` của WalletsService để emit `wallet:updated`
 * SAU KHI `$transaction` resolve (= đã commit) — mà KHÔNG đụng
 * apps/api/src/wallets/** (ngoài phạm vi task Phase 4). Các đường ghi ví tự
 * mở transaction riêng (topup callback, trả quỹ team qua applyInTx) không emit
 * tại đây; REST/refetch vẫn là nguồn sự thật.
 */
// F1 (review t5): BẮT BUỘC @Injectable() — thiếu decorator thì TS không emit
// design:paramtypes -> Nest inject undefined cho (gateway, wallets) -> crash
// 'Cannot convert undefined or null to object' trong onApplicationBootstrap trước khi listen.
@Injectable()
export class RealtimeService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RealtimeService.name);
  private walletWrapped = false;

  constructor(
    private readonly gateway: RealtimeGateway,
    private readonly wallets: WalletsService,
  ) {}

  onApplicationBootstrap(): void {
    this.wrapWalletTopLevel();
  }

  /** Ủy quyền cho gateway — giữ 1 điểm emit duy nhất cho các service nghiệp vụ. */
  emitToUser(userId: string, event: string, payload: unknown): void {
    this.gateway.emitToUser(userId, event, payload);
  }

  /**
   * Bọc top-level credit/debit ĐÚNG MỘT LẦN trên mỗi instance WalletsService
   * (hasOwnProperty để idempotent khi app khởi động lại lifecycle trong 1 process).
   * Wrapper chỉ emit khi gốc THÀNH CÔNG: throw (vd P2002 chống ghi đôi) -> không emit.
   */
  private wrapWalletTopLevel(): void {
    if (this.walletWrapped) return;
    this.walletWrapped = true;

    type WalletEntry = Parameters<WalletsService['credit']>[0];
    const target = this.wallets as WalletsService & Record<'credit' | 'debit', unknown>;

    if (!Object.prototype.hasOwnProperty.call(target, 'credit')) {
      const original = this.wallets.credit.bind(this.wallets);
      target.credit = async (entry: WalletEntry) => {
        const res = await original(entry); // resolve = transaction CREDIT đã commit
        this.gateway.emitToUser(entry.userId, 'wallet:updated', {
          balanceAfter: res.balanceAfter,
          type: entry.type,
          refType: entry.refType,
          refId: entry.refId,
        });
        return res;
      };
    }
    if (!Object.prototype.hasOwnProperty.call(target, 'debit')) {
      const original = this.wallets.debit.bind(this.wallets);
      target.debit = async (entry: WalletEntry) => {
        const res = await original(entry); // resolve = transaction DEBIT đã commit
        this.gateway.emitToUser(entry.userId, 'wallet:updated', {
          balanceAfter: res.balanceAfter,
          type: entry.type,
          refType: entry.refType,
          refId: entry.refId,
        });
        return res;
      };
    }
    this.logger.log('RealtimeService đã bọc WalletsService.credit/debit — emit wallet:updated sau commit');
  }
}

/**
 * Realtime module Phase 4: gateway WS + facade emit.
 * - AuthModule: JwtService verify token handshake.
 * - WalletsModule: bọc top-level credit/debit emit wallet:updated.
 */
@Module({
  imports: [AuthModule, WalletsModule],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeGateway, RealtimeService],
})
export class RealtimeModule {}
