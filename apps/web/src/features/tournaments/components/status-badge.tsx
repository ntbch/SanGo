/** Badge trạng thái giải — dùng chung list + detail (F7). */
import type { ReactElement } from 'react';

import { Badge, type BadgeProps } from '../../../components/ui/badge';
import type { TournamentStatus } from '../types';

export function tournamentStatusBadge(status: TournamentStatus): {
  label: string;
  variant: BadgeProps['variant'];
} {
  if (status === 'REGISTRATION') return { label: 'Đang mở đăng ký', variant: 'success' };
  if (status === 'ONGOING') return { label: 'Đang diễn ra', variant: 'warning' };
  return { label: 'Đã kết thúc', variant: 'outline' };
}

export function TournamentStatusBadge({ status }: { status: TournamentStatus }): ReactElement {
  const badge = tournamentStatusBadge(status);
  return <Badge variant={badge.variant}>{badge.label}</Badge>;
}
