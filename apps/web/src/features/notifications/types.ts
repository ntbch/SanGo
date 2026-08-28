export type NotificationType = 'ALL' | 'BOOKING' | 'MATCH' | 'TOURNAMENT' | 'WALLET' | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: Exclude<NotificationType, 'ALL'>;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
  metadata?: {
    bookingCode?: string;
    amount?: number;
    matchId?: string;
    tournamentId?: string;
    venueName?: string;
  };
}
