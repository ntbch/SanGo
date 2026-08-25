import { z } from 'zod';

const phoneSchema = z
  .string()
  .regex(/^0\d{8,10}$/, 'Số điện thoại Việt Nam không hợp lệ (vd: 0901234567)');

/** PATCH /users/me — mọi trường tùy chọn; phone/avatarUrl nhận null để xóa trắng. */
export const UpdateProfileSchema = z
  .object({
    fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(80).optional(),
    phone: phoneSchema.nullable().optional(),
    avatarUrl: z.string().url('URL ảnh đại diện không hợp lệ').max(500).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Không có trường nào để cập nhật' });
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
