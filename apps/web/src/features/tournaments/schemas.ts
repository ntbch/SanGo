/** Zod schemas cho form tạo giải đấu (F7). */
import { z } from 'zod';

export const createTournamentFormSchema = z.object({
  name: z.string().trim().min(3, 'Tên giải tối thiểu 3 ký tự').max(120),
  description: z.string().trim().max(1000).optional(),
  sportType: z.enum(['PICKLEBALL', 'BADMINTON', 'TENNIS', 'FOOTBALL5', 'FOOTBALL7']),
});
export type CreateTournamentFormValues = z.infer<typeof createTournamentFormSchema>;

export const matchScoreFormSchema = z.object({
  homeScore: z.number({ invalid_type_error: 'Nhập tỷ số' }).int().min(0).max(99),
  awayScore: z.number({ invalid_type_error: 'Nhập tỷ số' }).int().min(0).max(99),
});
export type MatchScoreFormValues = z.infer<typeof matchScoreFormSchema>;
