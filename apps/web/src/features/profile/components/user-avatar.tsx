/** Avatar người dùng: ảnh nếu có URL, fallback chữ cái đầu của họ tên (P1-F2). */
import type { ReactElement } from 'react';

export function getInitials(fullName: string): string {
  const trimmed = fullName.trim();
  return trimmed === '' ? '?' : trimmed.charAt(0).toUpperCase();
}

interface UserAvatarProps {
  fullName: string;
  avatarUrl?: string;
  /** Đường viền bo tròn kích thước px (mặc định 64). */
  size?: number;
}

export function UserAvatar({ fullName, avatarUrl, size = 64 }: UserAvatarProps): ReactElement {
  const initials = getInitials(fullName);

  if (avatarUrl !== undefined && avatarUrl !== '') {
    return (
      <img
        src={avatarUrl}
        alt={'Ảnh đại diện của ' + fullName}
        width={size}
        height={size}
        className="shrink-0 rounded-full border object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      data-testid="avatar-fallback"
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initials}
    </span>
  );
}
