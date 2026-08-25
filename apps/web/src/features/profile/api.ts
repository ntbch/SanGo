/** Lớp gọi API hồ sơ cá nhân (P1-F2) — PATCH /users/me. */
import { apiFetch } from '../../lib/api/client';
import { type AuthUser } from '../../lib/api/types';
import { endpoints } from '../../lib/api/endpoints';

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateProfileResponse {
  user: AuthUser;
}

/** Cập nhật hồ sơ — trả về user sau khi cập nhật (khớp contract PATCH /users/me). */
export function updateMe(payload: UpdateProfilePayload): Promise<UpdateProfileResponse> {
  return apiFetch<UpdateProfileResponse>(endpoints.users.updateMe(), {
    method: 'PATCH',
    body: payload,
  });
}
