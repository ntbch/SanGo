import { z } from 'zod';

/** GET /reputation/leaderboard?limit=N — mặc định 10, chặn trần 50 để đỡ nặng compute-on-read. */
export const LeaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type LeaderboardQueryDto = z.infer<typeof LeaderboardQuerySchema>;
