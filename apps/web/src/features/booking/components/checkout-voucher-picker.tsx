import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Tag, Ticket, CheckCircle2, XCircle } from 'lucide-react';

interface CheckoutVoucherPickerProps {
  voucherCode: string;
  onVoucherCodeChange: (code: string) => void;
  isApplied: boolean;
  isPending: boolean;
  voucherSuccess: string | null;
  voucherError: string | null;
  onApplyVoucher: (code?: string) => void;
}

const DEFAULT_VOUCHER_SUGGESTIONS = [
  { code: 'SANGOVIP', desc: 'Giảm 50.000 đ' },
  { code: 'GIAM20', desc: 'Giảm 20%' },
  { code: 'SANGOHE2026', desc: 'Giảm 30.000 đ' },
];

export function CheckoutVoucherPicker({
  voucherCode,
  onVoucherCodeChange,
  isApplied,
  isPending,
  voucherSuccess,
  voucherError,
  onApplyVoucher,
}: CheckoutVoucherPickerProps): React.ReactElement {
  return (
    <Card className="p-5 border border-border/80 bg-card space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Tag className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Mã Ưu Đãi &amp; Voucher Giảm Giá</h3>
        </div>
        {isApplied && (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/30">
            Đã Áp Dụng
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Nhập mã voucher (ví dụ: SANGOVIP)"
            value={voucherCode}
            onChange={(e) => onVoucherCodeChange(e.target.value.toUpperCase())}
            className="h-9 text-xs uppercase font-mono-num bg-background pl-8"
          />
          <Ticket className="h-4 w-4 text-muted-foreground absolute left-2.5 top-2.5" />
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!voucherCode.trim() || isPending}
          onClick={() => onApplyVoucher()}
          className="h-9 px-4 text-xs font-bold shrink-0 cursor-pointer"
        >
          {isPending ? 'Đang kiểm tra...' : 'Áp Dụng'}
        </Button>
      </div>

      {/* Quick voucher suggestion chips */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] text-muted-foreground font-semibold block">Mã gợi ý cho bạn:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {DEFAULT_VOUCHER_SUGGESTIONS.map((v) => (
            <button
              key={v.code}
              type="button"
              onClick={() => onApplyVoucher(v.code)}
              className="px-2.5 py-1 rounded-lg bg-secondary/70 hover:bg-primary/15 hover:border-primary/40 border border-border text-[11px] font-bold text-foreground transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="font-mono-num text-primary">{v.code}</span>
              <span className="text-[9px] text-muted-foreground">({v.desc})</span>
            </button>
          ))}
        </div>
      </div>

      {voucherSuccess && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{voucherSuccess}</span>
        </div>
      )}

      {voucherError && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{voucherError}</span>
        </div>
      )}
    </Card>
  );
}
