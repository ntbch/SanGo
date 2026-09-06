import React from 'react';
import { Card } from '../../../components/ui/card';
import { TrendingUp, TrendingDown, Gift } from 'lucide-react';
import { formatVND } from '../../../lib/utils';

export interface WalletStatsCardProps {
  totalTopupMonth: number;
  totalSpentMonth: number;
  totalRewardMonth: number;
}

export function WalletStatsCard({
  totalTopupMonth,
  totalSpentMonth,
  totalRewardMonth,
}: WalletStatsCardProps): React.ReactElement {
  return (
    <Card className="border border-border/80 bg-card p-6 flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <span className="text-xs font-bold text-foreground">Tổng quan dữ liệu đã tải</span>
          <span className="text-[11px] font-mono-num text-muted-foreground">Không gắn kỳ cố định</span>
        </div>

        <div className="space-y-3.5 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs text-muted-foreground">Tổng Nạp Tiền</span>
            </div>
            <span className="font-mono-num font-bold text-xs text-emerald-500">
              +{formatVND(totalTopupMonth)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <TrendingDown className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs text-muted-foreground">Chi Tiêu Đặt Sân</span>
            </div>
            <span className="font-mono-num font-bold text-xs text-rose-500">
              -{formatVND(totalSpentMonth)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Gift className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs text-muted-foreground">Hoàn Cọc &amp; Thưởng</span>
            </div>
            <span className="font-mono-num font-bold text-xs text-amber-500">
              +{formatVND(totalRewardMonth)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/50 space-y-1 text-xs">
        <span className="font-bold text-foreground block">Hạn mức giao dịch:</span>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Tối đa <strong className="text-foreground">50.000.000 đ/giao dịch</strong>. Miễn 100% phí nạp rút và chuyển tiền nội bộ.
        </p>
      </div>
    </Card>
  );
}
