import { z } from 'zod';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** GET /matches/open?sportType=&date=&page= — public (§3.11). */
export const OpenMatchesQuerySchema = z.object({
  sportType: z.enum(['FOOTBALL5', 'FOOTBALL7', 'PICKLEBALL', 'BADMINTON', 'TENNIS']).optional(),
  sportGroup: z.enum(['FOOTBALL', 'PICKLEBALL', 'BADMINTON', 'TENNIS']).optional(),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  level: z.enum(['FRIENDLY', 'CASUAL', 'SCRIM', 'SEMI_PRO']).optional(),
  fromMinute: z.coerce.number().int().min(0).max(1439).optional(),
  toMinute: z.coerce.number().int().min(0).max(1439).optional(),
  date: z.string().regex(DATE_RE, 'date phải là YYYY-MM-DD').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
export type OpenMatchesQueryDto = z.infer<typeof OpenMatchesQuerySchema>;

export const CreateJoinRequestSchema = z.object({
  position: z.string().trim().max(50).optional(),
  message: z.string().trim().max(300).optional(),
});
export type CreateJoinRequestDto = z.infer<typeof CreateJoinRequestSchema>;

export const ReviewJoinRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
export type ReviewJoinRequestDto = z.infer<typeof ReviewJoinRequestSchema>;

export const CreateMatchCommentSchema = z.object({
  content: z.string().trim().min(1, 'Nội dung bình luận không được rỗng').max(500),
});
export type CreateMatchCommentDto = z.infer<typeof CreateMatchCommentSchema>;

/** Một dòng trong danh sách ghép trận mở — phẳng, đủ thông tin cho card UI. */
export interface OpenMatchItem {
  bookingId: string;
  /** Mã đơn CH-YYYYMMDD-NNNN của chủ đơn. */
  code: string;
  courtName: string;
  sportType: 'FOOTBALL5' | 'FOOTBALL7' | 'PICKLEBALL' | 'BADMINTON' | 'TENNIS';
  /** YYYY-MM-DD */
  date: string;
  /** Phút bắt đầu trong ngày (vd 1020 = 17:00). */
  startMinute: number;
  endMinute: number;
  /** Tổng giá trị đơn (VND) — người tham gia trả chủ đơn NGOÀI hệ thống (giới hạn §3.11). */
  subtotal: number;
  depositAmount: number;
  /** Tên chủ đơn. */
  hostName: string;
  slotsNeeded: number;
  joinedCount: number;
}

export interface OpenMatchesResponse {
  items: OpenMatchItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
