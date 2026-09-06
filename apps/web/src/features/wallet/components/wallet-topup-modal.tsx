import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { PlusCircle, CheckCircle2, QrCode, CreditCard, X } from 'lucide-react';
import { formatVND, cn } from '../../../lib/utils';
import { User } from '../../../lib/auth-store';

const PRESET_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

export interface WalletTopupModalProps {
  user: User | null;
  show: boolean;
  onClose: () => void;
  topupAmount: number;
  setTopupAmount: (a: number) => void;
  customTopupText: string;
  setCustomTopupText: (t: string) => void;
  topupMethod: 'VIETQR' | 'VNPAY' | 'INSTANT';
  setTopupMethod: (m: 'VIETQR' | 'VNPAY' | 'INSTANT') => void;
  isTopupLoading: boolean;
  topupSuccessMsg: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function WalletTopupModal({
  user,
  show,
  onClose,
  topupAmount,
  setTopupAmount,
  customTopupText,
  setCustomTopupText,
  topupMethod,
  setTopupMethod,
  isTopupLoading,
  topupSuccessMsg,
  onSubmit,
}: WalletTopupModalProps): React.ReactElement | null {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-black text-foreground">Nạp Tiền Vào Ví SanGo</CardTitle>
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
          {topupSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{topupSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Preset Amounts Grid */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Chọn Nhanh Mệnh Giá Nạp
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setTopupAmount(amt);
                      setCustomTopupText(String(amt));
                    }}
                    className={cn(
                      'py-2 rounded-xl border text-xs font-mono-num font-bold transition-all cursor-pointer text-center',
                      topupAmount === amt
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {formatVND(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Hoặc Nhập Số Tiền Tùy Ý (đ)
              </label>
              <Input
                type="number"
                min={10000}
                max={50000000}
                step={10000}
                value={customTopupText}
                onChange={(e) => {
                  setCustomTopupText(e.target.value);
                  setTopupAmount(Number(e.target.value) || 0);
                }}
                required
                className="h-10 text-sm font-mono-num font-bold"
              />
              <span className="text-[11px] text-muted-foreground block">
                Tối thiểu 10.000 đ - Tối đa 50.000.000 đ
              </span>
            </div>

            {/* Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">
                Phương Thức Thanh Toán
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTopupMethod('VIETQR')}
                  className={cn(
                    'p-3 rounded-2xl border text-left space-y-1 transition-all cursor-pointer',
                    topupMethod === 'VIETQR'
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border/60 bg-secondary/30 hover:border-border',
                  )}
                >
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <QrCode className="h-4 w-4 shrink-0" />
                    <span>Mã QR VietQR</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block">Quét từ mọi App ngân hàng</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTopupMethod('VNPAY')}
                  className={cn(
                    'p-3 rounded-2xl border text-left space-y-1 transition-all cursor-pointer',
                    topupMethod === 'VNPAY'
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border/60 bg-secondary/30 hover:border-border',
                  )}
                >
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <CreditCard className="h-4 w-4 shrink-0" />
                    <span>Cổng VNPAY QR</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block">Thẻ ATM / Visa / Master</span>
                </button>
              </div>
            </div>

            {/* VietQR View details */}
            {topupMethod === 'VIETQR' && (
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-2 text-xs">
                <div className="h-28 w-28 mx-auto bg-white p-2 rounded-2xl border border-border shadow-xs flex items-center justify-center">
                  <QrCode className="h-24 w-24 text-slate-900" />
                </div>
                <div className="space-y-0.5 text-[11px] bg-background/80 p-2.5 rounded-xl border border-border/40">
                  <p><strong className="text-foreground">Ngân hàng:</strong> MB Bank (Quân Đội)</p>
                  <p><strong className="text-foreground">Số tài khoản:</strong> <span className="font-mono-num font-bold text-primary">0912345678</span></p>
                  <p><strong className="text-foreground">Chủ tài khoản:</strong> SANGO VIETNAM JSC</p>
                  <p><strong className="text-foreground">Số tiền:</strong> <span className="font-mono-num font-bold text-emerald-500">{formatVND(topupAmount)}</span></p>
                  <p><strong className="text-foreground">Nội dung CK:</strong> <span className="font-mono-num font-bold text-amber-500">SANGO TOPUP {user?.id?.slice(0, 6) || 'TEST'}</span></p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs font-bold"
              >
                Đóng
              </Button>
              <Button
                type="submit"
                disabled={isTopupLoading || topupAmount < 10000}
                size="sm"
                className="font-bold text-xs shadow-md"
              >
                {isTopupLoading ? 'Đang xử lý nạp...' : `Xác Nhận Nạp ${formatVND(topupAmount)}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
