import { z } from 'zod';
import { SportType } from '@prisma/client';

export const CreateTournamentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Tên giải tối thiểu 3 ký tự')
    .max(120, 'Tên giải tối đa 120 ký tự'),
  description: z.string().trim().max(1000, 'Mô tả tối đa 1000 ký tự').optional(),
  sportType: z.nativeEnum(SportType, { errorMap: () => ({ message: 'sportType không hợp lệ' }) }),
}).strict();
export type CreateTournamentDto = z.infer<typeof CreateTournamentSchema>;

export const RegisterTeamSchema = z.object({
  teamId: z.string().uuid('teamId phải là UUID'),
}).strict();
export type RegisterTeamDto = z.infer<typeof RegisterTeamSchema>;

/** Nhập điểm tay (host/admin) — loại trực tiếp bắt buộc có thắng/thua. */
export const UpdateMatchScoreSchema = z.object({
  homeScore: z.number().int().min(0, 'homeScore phải là số nguyên >= 0'),
  awayScore: z.number().int().min(0, 'awayScore phải là số nguyên >= 0'),
});
export type UpdateMatchScoreDto = z.infer<typeof UpdateMatchScoreSchema>;
