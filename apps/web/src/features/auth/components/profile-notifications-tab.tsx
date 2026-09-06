import React from 'react';
import { Card } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';

interface ProfileNotificationsTabProps {
  notifyMatchReminder: boolean;
  onToggleMatchReminder: () => void;
  notifyMatchInvites: boolean;
  onToggleMatchInvites: () => void;
  notifyVouchers: boolean;
  onToggleVouchers: () => void;
}

export function ProfileNotificationsTab({
  notifyMatchReminder,
  onToggleMatchReminder,
  notifyMatchInvites,
  onToggleMatchInvites,
  notifyVouchers,
  onToggleVouchers,
}: ProfileNotificationsTabProps): React.ReactElement {
  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-5 animate-in fade-in-50 duration-200">
      <div className="pb-3 border-b border-border/50">
        <h3 className="text-base font-black text-foreground">Cài Đặt Thông Báo</h3>
        <p className="text-xs text-muted-foreground">Nhắc giờ thi đấu &amp; lời mời kèo.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40 border border-border/60">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-foreground">Nhắc nhở trước trận 60 phút</p>
            <p className="text-[11px] text-muted-foreground">Nhắc giờ xuất phát đến sân.</p>
          </div>
          <button
            type="button"
            onClick={onToggleMatchReminder}
            className={cn(
              'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
              notifyMatchReminder ? 'bg-primary' : 'bg-muted/80',
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5',
                notifyMatchReminder ? 'left-5' : 'left-0.5',
              )}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40 border border-border/60">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-foreground">Lời mời tham gia ghép trận</p>
            <p className="text-[11px] text-muted-foreground">Thông báo đội tìm đối gần bạn.</p>
          </div>
          <button
            type="button"
            onClick={onToggleMatchInvites}
            className={cn(
              'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
              notifyMatchInvites ? 'bg-primary' : 'bg-muted/80',
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5',
                notifyMatchInvites ? 'left-5' : 'left-0.5',
              )}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40 border border-border/60">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-foreground">Ưu đãi giờ vàng &amp; Voucher</p>
            <p className="text-[11px] text-muted-foreground">Nhận mã giảm từ sân bạn hay chơi.</p>
          </div>
          <button
            type="button"
            onClick={onToggleVouchers}
            className={cn(
              'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
              notifyVouchers ? 'bg-primary' : 'bg-muted/80',
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5',
                notifyVouchers ? 'left-5' : 'left-0.5',
              )}
            />
          </button>
        </div>
      </div>
    </Card>
  );
}
