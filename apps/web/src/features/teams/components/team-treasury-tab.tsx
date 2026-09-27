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
  fundMsg: { type: 'success' | 'error'; text: string } | null;
  isContributing: boolean;
  onSubmitContribute: (e: React.FormEvent) => Promise<void>;
}

export function TeamTreasuryTab({
  treasury,
  fundAmount,
  onFundAmountChange,
  fundMsg,
  isContributing,
  onSubmitContribute,
}: TeamTreasuryTabProps): React.ReactElement {
  // Compute running balance for General Ledger Table
  const transactionsWithBalance = React.useMemo(() => {
    if (!treasury?.recentTransactions || treasury.recentTransactions.length === 0) {
      return [];
    }
    let currentBalance = treasury.balance;
    return treasury.recentTransactions.map((tx) => {
      const balance = tx.balanceAfter ?? currentBalance;
      // Step backwards for subsequent rows if reverse-chronological
      currentBalance =
        tx.type === 'INCOME'
          ? currentBalance - tx.amount
          : currentBalance + tx.amount;
      return {
        ...tx,
        balance,
      };
    });
  }, [treasury]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Balance & Contribute */}
      <Card className="lg:col-span-5 p-6 border border-border bg-card space-y-6 rounded-2xl">
        <div className="p-6 rounded-xl bg-secondary/30 border border-border space-y-2 text-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
            Số Dư Quỹ Đội Hiện Tại
          </span>
          <p className="font-mono-num font-black text-3xl sm:text-4xl text-primary tabular-nums">
            {formatVND(treasury?.balance || 0)}
          </p>
          <p className="text-[11px] text-muted-foreground">Thu chi công khai trong đội</p>
        </div>

        {/* Lỗi không được hiện trong khung xanh "thành công" — sẽ khiến người dùng
            tin tiền đã vào quỹ khi thực tế giao dịch chưa chắc đã thành công. */}
        {fundMsg?.type === 'success' && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{fundMsg.text}</span>
          </div>
        )}
        {fundMsg?.type === 'error' && (
          <p role="alert" className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold">
            {fundMsg.text}
          </p>
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

          <Button
            type="submit"
            disabled={isContributing}
            className="w-full font-bold text-xs cursor-pointer active:scale-[0.98] transition-transform"
          >
            {isContributing ? 'Đang đóng quỹ...' : 'Xác Nhận Đóng Quỹ'}
          </Button>
        </form>
      </Card>

      {/* Right Column: Financial General Ledger Table */}
      <Card className="lg:col-span-7 p-6 border border-border bg-card space-y-4 rounded-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="text-base font-bold text-foreground">
            Sổ Cái Thu Chi Quỹ Đội
          </h3>
          <span className="text-xs font-mono-num text-muted-foreground">
            {transactionsWithBalance.length} giao dịch
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[11px] text-muted-foreground font-semibold">
                <th className="py-2.5 px-3 text-left">Thời gian</th>
                <th className="py-2.5 px-3 text-left">Khoản mục diễn giải</th>
                <th className="py-2.5 px-3 text-left">Người thực hiện</th>
                <th className="py-2.5 px-3 text-right">Số tiền</th>
                <th className="py-2.5 px-3 text-right">Số dư</th>
              </tr>
            </thead>
            <tbody>
              {transactionsWithBalance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                    Chưa có giao dịch thu chi nào trong quỹ đội.
                  </td>
                </tr>
              ) : (
                transactionsWithBalance.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-3 text-xs font-mono-num text-muted-foreground whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-3 text-xs font-medium text-foreground">
                      {t.description}
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
                      {t.createdByName || 'Thành viên'}
                    </td>
                    <td
                      className={cn(
                        'py-3 px-3 text-xs font-mono-num font-bold tabular-nums text-right whitespace-nowrap',
                        t.type === 'INCOME'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-foreground',
                      )}
                    >
                      {t.type === 'INCOME' ? '+' : '-'}
                      {formatVND(t.amount)}
                    </td>
                    <td className="py-3 px-3 text-xs font-mono-num font-bold tabular-nums text-right text-foreground whitespace-nowrap">
                      {formatVND(t.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
