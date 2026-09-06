import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ArrowUpRight, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { formatVND } from '../../../lib/utils';

const BANK_OPTIONS = [
  { code: 'MB', name: 'MB Bank (Ngân hàng Quân Đội)' },
  { code: 'VCB', name: 'Vietcombank (Ngoại Thương Việt Nam)' },
  { code: 'TCB', name: 'Techcombank (Kỹ Thương Việt Nam)' },
  { code: 'ACB', name: 'ACB (Á Châu)' },
  { code: 'BIDV', name: 'BIDV (Đầu Tư & Phát Triển)' },
  { code: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
  { code: 'TPB', name: 'TPBank (Tiên Phong)' },
];

export interface WalletWithdrawModalProps {
  show: boolean;
  onClose: () => void;
  balance: number;
  withdrawAmount: string;
  setWithdrawAmount: (a: string) => void;
  selectedBank: string;
  setSelectedBank: (b: string) => void;
  bankAccountNo: string;
  setBankAccountNo: (no: string) => void;
  accountHolder: string;
  setAccountHolder: (h: string) => void;
  isWithdrawLoading: boolean;
  withdrawError: string | null;
  withdrawSuccessMsg: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function WalletWithdrawModal({
  show,
  onClose,
  balance,
  withdrawAmount,
  setWithdrawAmount,
  selectedBank,
  setSelectedBank,
  bankAccountNo,
  setBankAccountNo,
  accountHolder,
  setAccountHolder,
  isWithdrawLoading,
  withdrawError,
  withdrawSuccessMsg,
  onSubmit,
}: WalletWithdrawModalProps): React.ReactElement | null {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-rose-500" />
            <CardTitle className="text-base font-black text-foreground">Rút Tiền Về Tài Khoản Ngân Hàng</CardTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Số dư khả dụng hiện có:</span>
              <span className="font-mono-num font-black text-primary text-sm">{formatVND(balance)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Phí giao dịch rút tiền: <strong className="text-emerald-500 font-bold">0 đ (Miễn phí 100%)</strong>
            </p>
          </div>

          {withdrawError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{withdrawError}</span>
            </div>
          )}

          {withdrawSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{withdrawSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Select Bank */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Ngân Hàng Thụ Hưởng <span className="text-destructive">*</span>
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
              >
                {BANK_OPTIONS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bank Account No & Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Số Tài Khoản <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="0912345678"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  required
                  className="h-10 text-xs font-mono-num"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Tên Chủ Tài Khoản <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="NGUYEN VAN A"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                  required
                  className="h-10 text-xs uppercase"
                />
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Số Tiền Cần Rút (đ) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={50000}
                max={balance}
                step={10000}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
                className="h-10 text-sm font-mono-num font-bold"
              />
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Tối thiểu: 50.000 đ</span>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(balance))}
                  className="text-primary font-bold hover:underline cursor-pointer"
                >
                  Rút tất cả số dư
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs font-bold"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isWithdrawLoading || Number(withdrawAmount) > balance || Number(withdrawAmount) < 50000}
                size="sm"
                className="font-bold text-xs shadow-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isWithdrawLoading ? 'Đang rút tiền...' : 'Xác Nhận Rút Tiền'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
