import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Receipt, CheckCircle2, Download, X } from 'lucide-react';
import { formatVND, cn } from '../../../lib/utils';
import { WalletLedgerItem } from '../api/wallet-api';

export interface WalletReceiptModalProps {
  receipt: WalletLedgerItem | null;
  onClose: () => void;
}

export function WalletReceiptModal({
  receipt,
  onClose,
}: WalletReceiptModalProps): React.ReactElement | null {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between bg-card z-10">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-black text-foreground">Biên Lai Điện Tử SanGo Pay</CardTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="text-center py-2 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Số Tiền Giao Dịch
            </span>
            <p
              className={cn(
                'text-2xl sm:text-3xl font-mono-num font-black',
                receipt.direction === 'CREDIT' ? 'text-emerald-500' : 'text-rose-500',
              )}
            >
              {receipt.direction === 'CREDIT' ? '+' : '-'}{formatVND(receipt.amount)}
            </p>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Giao dịch thành công</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Mã tham chiếu (Ref ID):</span>
              <span className="font-mono-num font-bold text-foreground">{receipt.refId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Loại biến động:</span>
              <span className="font-bold text-foreground">{receipt.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nguồn gốc / Dịch vụ:</span>
              <span className="font-mono-num font-bold text-primary">{receipt.refType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Thời gian ghi nhận:</span>
              <span className="font-mono-num text-foreground">
                {new Date(receipt.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <span className="text-muted-foreground">Số dư sau giao dịch:</span>
              <span className="font-mono-num font-black text-foreground">
                {formatVND(receipt.balanceAfter)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (typeof window !== 'undefined' && typeof window.print === 'function') {
                  window.print();
                }
              }}
              className="text-xs font-bold gap-1 active:scale-[0.98] transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Tải Biên Lai</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onClose}
              className="text-xs font-bold active:scale-[0.98] transition-colors"
            >
              Đóng
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
