import React from 'react';
import { Button } from '../../../components/ui/button';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { SelectedSlot } from './slot-matrix';
import { formatMinutesToTime, formatVND } from '../../../lib/utils';

interface BookingSummaryBarProps {
  selectedSlot: SelectedSlot | null;
  courtName?: string;
  isPending: boolean;
  errorMessage?: string | null;
  onSubmitHold: () => void;
}

export function BookingSummaryBar({
  selectedSlot,
  courtName,
  isPending,
  errorMessage,
  onSubmitHold,
}: BookingSummaryBarProps): React.ReactElement | null {
  if (!selectedSlot) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-8 sm:right-8 lg:left-16 lg:right-16 z-40 animate-in slide-in-from-bottom-5 duration-200">
      <div className="rounded-3xl border border-border bg-card p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">
              {courtName} · {formatMinutesToTime(selectedSlot.startMinute)} - {formatMinutesToTime(selectedSlot.endMinute)}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono-num">
              Ngày {new Date(selectedSlot.date).toLocaleDateString('vi-VN')} · Tạm tính: <strong className="text-primary font-bold">{formatVND(selectedSlot.price)}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end w-full sm:w-auto gap-1.5">
          {errorMessage && (
            <p className="text-[11px] font-bold text-destructive text-center sm:text-right animate-in fade-in">
              {errorMessage}
            </p>
          )}
          <Button
            size="lg"
            disabled={isPending}
            onClick={onSubmitHold}
            className="w-full sm:w-auto font-bold gap-2 shadow-lg px-6 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{isPending ? 'Đang khóa slot...' : 'Giữ Chỗ 10 Phút & Thanh Toán'}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
