import { z } from 'zod';

/** GET /notifications?page= — phân trang đơn giản, mới nhất trước. */
export const ListNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});
export type ListNotificationsQueryDto = z.infer<typeof ListNotificationsQuerySchema>;

/** Chặn sớm param sai định dạng UUID -> 400 thay vì để Prisma ném 500. */
export const NotificationIdParamSchema = z.string().uuid('id không hợp lệ');
