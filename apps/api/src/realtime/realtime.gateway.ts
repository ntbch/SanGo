import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Server, type Socket } from 'socket.io';

/** Room theo userId — mỗi user chỉ nhận event của chính mình. */
export const REALTIME_ROOM_PREFIX = 'user:';
/**
 * Path socket.io đặt dưới tiền tố /api để tái dùng hạ tầng proxy sẵn có:
 * Vite dev proxy `/api` (apps/web/vite.config.ts) và reverse proxy cùng prefix
 * REST /api/v1 ở prod — không phải mở thêm cổng/đường proxy mới.
 */
export const REALTIME_PATH = '/api/socket.io';

type AuthenticatedSocket = Socket & { data: { userId?: string } };
type RealtimeNext = (err?: Error) => void;

/**
 * Phase 4 — Realtime gateway: socket.io gắn thẳng HTTP server của Nest (cùng cổng REST).
 * KHÔNG dùng decorator @WebSocketGateway để tránh thêm @nestjs/websockets +
 * @nestjs/platform-socket.io — phạm vi deps Phase 4 chỉ cho phép thêm `socket.io`.
 * Handshake bắt buộc verify JWT (cùng secret với JwtAuthGuard), sai/thiếu -> bị ngắt;
 * hợp lệ -> join room `user:<userId>`.
 */
@Injectable()
export class RealtimeGateway implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(RealtimeGateway.name);
  private io: Server | null = null;

  constructor(
    private readonly jwtService: JwtService,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  onApplicationBootstrap(): void {
    if (this.io) return;
    const httpServer = this.adapterHost.httpAdapter?.getHttpServer();
    if (!httpServer) {
      this.logger.warn('Không lấy được HTTP server — realtime WS không khởi động');
      return;
    }
    // CORS ws theo CORS_ORIGIN (chưa cấu hình -> reflect origin cho dev, như enableCors hiện tại).
    const io = new Server(httpServer, {
      path: REALTIME_PATH,
      cors: { origin: process.env.CORS_ORIGIN ?? true, credentials: true },
    });
    io.use((socket, next) => {
      void this.authenticate(socket, next);
    });
    io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.data.userId;
      if (userId) void socket.join(REALTIME_ROOM_PREFIX + userId);
    });
    this.io = io;
    this.logger.log(`Realtime gateway sẵn sàng (path ${REALTIME_PATH}, room ${REALTIME_ROOM_PREFIX}<userId>)`);
  }

  onApplicationShutdown(): void {
    // Chỉ ngắt client; KHÔNG io.close() vì sẽ đóng luôn HTTP server của Nest.
    this.io?.disconnectSockets(true);
    this.io = null;
  }

  /**
   * Fire-and-forget: emit 1 event vào room của user. Mọi lỗi chỉ log warn —
   * WS chỉ là gợi ý refetch (REST là nguồn sự thật), không được fail nghiệp vụ.
   */
  emitToUser(userId: string, event: string, payload: unknown): void {
    try {
      this.io?.to(REALTIME_ROOM_PREFIX + userId).emit(event, payload);
    } catch (e) {
      this.logger.warn(`Emit ${event} tới user ${userId} thất bại (bỏ qua): ${(e as Error).message}`);
    }
  }

  /** Verify JWT lúc handshake — token lấy từ handshake.auth.token hoặc Authorization header. */
  private async authenticate(socket: Socket, next: RealtimeNext): Promise<void> {
    try {
      const auth = socket.handshake.auth as { token?: string } | undefined;
      const header = socket.handshake.headers.authorization;
      const bearer = typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : undefined;
      const token = auth?.token || bearer;
      if (!token) throw new Error('Thiếu token');
      const payload = await this.jwtService.verifyAsync<{ sub?: string }>(token, {
        secret: process.env.JWT_SECRET,
      });
      if (!payload?.sub) throw new Error('Token thiếu sub');
      (socket as AuthenticatedSocket).data.userId = payload.sub;
      next();
    } catch {
      // Không leak chi tiết token — client chỉ nhận connect_error UNAUTHENTICATED.
      next(new Error('UNAUTHENTICATED'));
    }
  }
}
