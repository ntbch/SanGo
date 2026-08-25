/**
 * Schema form hồ sơ cá nhân (P1-F2) — khớp UpdateProfileSchema của backend
 * (apps/api/src/users/dto/user.dto.ts): phone VN ^0\d{8,10}$, avatarUrl là URL,
 * bỏ trống = xoá trắng (gửi null).
 */
import { z } from 'zod';

/** Tiền xử lý chung: chuỗi chỉ toàn khoảng trắng -> null (xoá trắng). */
function emptyToNull(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? null : value;
}

export const profileFormSchema = z.object({
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(80),
  phone: z.preprocess(
    emptyToNull,
    z
      .string()
      .regex(/^0\d{8,10}$/, 'Số điện thoại Việt Nam không hợp lệ (vd: 0901234567)')
      .nullish(),
  ),
  avatarUrl: z.preprocess(
    emptyToNull,
    z.string().url('URL ảnh đại diện không hợp lệ').max(500).nullish(),
  ),
});

export type ProfileFormValues = {
  fullName: string;
  phone: string;
  avatarUrl: string;
};
