import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { DollarSign, CheckCircle2 } from 'lucide-react';
import { TreasuryOverview } from '../api/teams-api';
import { formatVND, cn } from '../../../lib/utils';

interface TeamTreasuryTabProps {
  treasury: TreasuryOverview | null;
  fundAmount: string;
  onFundAmountChange: (amount: string) => void;
  fundMsg: string | null;
  onSubmitContribute: (e: React.FormEvent) => Promise<void>;
}

export function TeamTreasuryTab({
  treasury,
  fundAmount,
  onFundAmountChange,
  fundMsg,
  onSubmitContribute,
}: TeamTreasuryTabProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Balance & Contribute */}
      <Card className="lg:col-span-5 p-6 border border-border/80 bg-card shadow-md space-y-6">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-primary/10 to-transparent border border-primary/20 space-y-2 text-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Số Dư Quỹ Đội Hiện Tại
          </span>
          <p className="font-mono-num font-black text-3xl sm:text-4xl text-primary">
            {formatVND(treasury?.balance || 0)}
          </p>
          <p className="text-[11px] text-muted-foreground">Quản lý thu chi công khai giữa các thành viên</p>
        </div>

        {fundMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{fundMsg}</span>
          </div>
        )}

        <form onSubmit={onSubmitContribute} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Đóng Quỹ Bằng Ví SanGo Cá Nhân
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={fundAmount}
                onChange={(e) => onFundAmountChange(e.target.value)}
                step="50000"
                min="10000"
                required
                className="pl-10 h-10 text-xs font-mono-num"
              />
            </div>
          </div>

          <Button type="submit" className="w-full font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer">
            Xác Nhận Đóng Quỹ
          </Button>
        </form>
      </Card>

      {/* Right Column: Treasury Transaction History */}
      <Card className="lg:col-span-7 p-6 border border-border/80 bg-card shadow-md space-y-4">
        <h3 className="text-base font-black text-foreground pb-2 border-b border-border/50">
          Lịch Sử Thu Chi Quỹ Đội
        </h3>

        <div className="space-y-3">
          {treasury?.recentTransactions?.map((t) => (
            <div
              key={t.id}
              className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-xs font-bold text-foreground">{t.description}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(t.createdAt).toLocaleDateString('vi-VN')} · Bởi: {t.createdByName || 'Thành viên'}
                </p>
              </div>

              <span
                className={cn(
                  'font-mono-num font-black text-xs',
                  t.type === 'INCOME'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-500',
                )}
              >
                {t.type === 'INCOME' ? '+' : '-'}
                {formatVND(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
