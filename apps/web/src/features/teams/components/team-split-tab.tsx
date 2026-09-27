import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { CheckCircle2, Wallet } from 'lucide-react';
import { Team, ExpenseShare } from '../api/teams-api';
import { formatVND, cn } from '../../../lib/utils';

interface TeamSplitTabProps {
  team: Team;
  expenses: ExpenseShare[];
  splitBookingCode: string;
  onSplitBookingCodeChange: (code: string) => void;
  selectedMemberIds: string[];
  onSelectedMemberIdsChange: (ids: string[]) => void;
  splitMsg: string | null;
  onSubmitSplit: (e: React.FormEvent) => Promise<void>;
  /** Phase 1 (T1.1/T1.3): id user hiện tại — quyết định nút xác nhận / trả qua ví. */
  currentUserId: string | null;
  walletBalance: number | null;
  actionMsg: string | null;
  onMarkPaid: (shareId: string) => Promise<void>;
  onPayViaWallet: (shareId: string) => Promise<void>;
}

export function TeamSplitTab({
  team,
  expenses,
  splitBookingCode,
  onSplitBookingCodeChange,
  selectedMemberIds,
  onSelectedMemberIdsChange,
  splitMsg,
  onSubmitSplit,
  currentUserId,
  walletBalance,
  actionMsg,
  onMarkPaid,
  onPayViaWallet,
}: TeamSplitTabProps): React.ReactElement {
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const handleMarkPaid = async (shareId: string) => {
    setBusyId(shareId);
    try {
      await onMarkPaid(shareId);
    } finally {
      setBusyId(null);
    }
  };

  const handlePayViaWallet = async (shareId: string) => {
    setBusyId(shareId);
    try {
      await onPayViaWallet(shareId);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Form: Split Booking */}
      <Card className="lg:col-span-6 p-6 border border-border/80 bg-card shadow-md space-y-5">
        <div className="pb-3 border-b border-border/50">
          <h3 className="text-base font-black text-foreground">Tạo Khoản Chia Tiền Sân</h3>
          <p className="text-xs text-muted-foreground">
            Tự động chia đều chi phí đơn đặt sân cho các thành viên tham gia.
          </p>
        </div>

        {splitMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{splitMsg}</span>
          </div>
        )}

        <form onSubmit={onSubmitSplit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">Mã Đơn Đặt Sân Cần Chia</label>
            <Input
              value={splitBookingCode}
              onChange={(e) => onSplitBookingCodeChange(e.target.value)}
              placeholder="Ví dụ: SG-20260828-001"
              required
              className="h-10 text-xs font-mono-num"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Chọn Cầu Thủ Tham Gia Trận Đấu ({selectedMemberIds.length} người)
            </label>
            <div className="p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-2 max-h-48 overflow-y-auto">
              {team.members?.filter((m) => m.status === 'ACTIVE').map((m) => {
                const isChecked = selectedMemberIds.includes(m.userId);
                return (
                  <label
                    key={m.userId}
                    className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectedMemberIdsChange([...selectedMemberIds, m.userId]);
                        } else {
                          onSelectedMemberIdsChange(selectedMemberIds.filter((id) => id !== m.userId));
                        }
                      }}
                      className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <span>{m.user?.fullName}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            disabled={selectedMemberIds.length === 0}
            className="w-full font-bold text-xs shadow-md cursor-pointer"
          >
            Chia Đều Tiền Sân Ngay
          </Button>
        </form>
      </Card>

      {/* Right List: Existing Expense Shares */}
      <Card className="lg:col-span-6 p-6 border border-border/80 bg-card shadow-md space-y-4">
        <h3 className="text-base font-black text-foreground pb-2 border-b border-border/50">
          Nhật Ký Các Khoản Chia Tiền
        </h3>

        {actionMsg && (
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/30 text-xs font-bold text-foreground">
            {actionMsg}
          </div>
        )}

        <div className="space-y-3">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 flex items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">
                  {exp.debtor?.fullName} nợ {exp.payer?.fullName}
                </p>
                <p className="text-[11px] text-muted-foreground">{exp.note || 'Tiền sân'}</p>
              </div>

              <div className="text-right space-y-1.5 shrink-0">
                <span className="font-mono-num font-black text-xs text-foreground block">
                  {formatVND(exp.amount)}
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block',
                    exp.status === 'PAID'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/15 text-amber-500',
                  )}
                >
                  {exp.status === 'PAID' ? 'Đã Thanh Toán' : 'Chưa Trả'}
                </span>

                {exp.status === 'UNPAID' && (
                  <div className="flex flex-col items-end gap-1.5 pt-1">
                    {/* T1.1: chỉ payer hoặc captain được xác nhận đã nhận tiền */} 
                    {(currentUserId === exp.payerId || currentUserId === team.captainId) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyId === exp.id}
                        onClick={() => handleMarkPaid(exp.id)}
                        className="h-7 px-2.5 text-[10px] font-black cursor-pointer"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Xác nhận đã nhận
                      </Button>
                    )}
                    {/* T1.3: debtor trả nợ qua ví — hiển thị số dư để đối chiếu */}
                    {currentUserId === exp.debtorId && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          disabled={
                            busyId === exp.id ||
                            (walletBalance !== null && walletBalance < exp.amount)
                          }
                          onClick={() => handlePayViaWallet(exp.id)}
                          title={
                            walletBalance !== null
                              ? `Số dư ví: ${formatVND(walletBalance)}`
                              : undefined
                          }
                          className="h-7 px-2.5 text-[10px] font-black cursor-pointer"
                        >
                          <Wallet className="h-3 w-3" />
                          Trả qua ví
                        </Button>
                        {walletBalance !== null && (
                          <span className="text-[9px] text-muted-foreground">
                            Ví: {formatVND(walletBalance)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
