/**
 * Icon + nhãn màu theo loại thông báo (F8) — dùng chung cho chuông dropdown
 * và Trung tâm thông báo; đảm bảo ĐỦ mọi giá trị NotificationType.
 */
import {
  AlarmClock,
  CalendarCheck2,
  CalendarX2,
  CreditCard,
  Store,
  TicketPercent,
  Trophy,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';

import { NotificationType } from '@sango/shared';

export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  { Icon: typeof AlarmClock; className: string }
> = {
  [NotificationType.BOOKING_CONFIRMED]: { Icon: CalendarCheck2, className: 'text-emerald-500' },
  [NotificationType.BOOKING_CANCELLED]: { Icon: CalendarX2, className: 'text-destructive' },
  [NotificationType.PAYMENT_RECEIVED]: { Icon: CreditCard, className: 'text-primary' },
  [NotificationType.NEW_BOOKING_OWNER]: { Icon: Store, className: 'text-sky-500' },
  [NotificationType.MATCH_JOINED]: { Icon: UserPlus, className: 'text-violet-500' },
  [NotificationType.MATCH_LEFT]: { Icon: UserMinus, className: 'text-amber-500' },
  [NotificationType.REMINDER]: { Icon: AlarmClock, className: 'text-orange-500' },
  // F8 wave-1 (roadmap v5): ví/voucher/dịch vụ/đội/giải đấu.
  [NotificationType.WALLET]: { Icon: Wallet, className: 'text-emerald-500' },
  [NotificationType.VOUCHER]: { Icon: TicketPercent, className: 'text-pink-500' },
  [NotificationType.SERVICE]: { Icon: Wrench, className: 'text-sky-500' },
  [NotificationType.TEAM]: { Icon: Users, className: 'text-violet-500' },
  [NotificationType.TOURNAMENT]: { Icon: Trophy, className: 'text-amber-500' },
};
