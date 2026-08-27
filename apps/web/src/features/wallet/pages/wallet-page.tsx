/** Trang Ví (F6) — chuẩn UI/UX Pro-Max: số dư font-score, nút ẩn/hiện Eye toggle, bảng ledger màu sắc. */
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Plus, Wallet, ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { toast } from '../../../components/ui/use-toast';
import { formatDateTime } from '../../../lib/date-utils';
import { useMyWallet, useWalletTopup } from '../queries';
import { TopupFormSchema, type TopupFormValues } from '../schemas';
import type { WalletLedgerEntry } from '../types';

const PAGE_SIZE = 10;
const TOPUP_PRESETS = [100_000, 200_000, 500_000, 1_000_000];

const TYPE_META: Record<string, { label: string; isCredit: boolean }> = {
  TOPUP: { label: 'Nạp tiền ví', isCredit: true },
  PAYMENT: { label: 'Thanh toán đơn', isCredit: false },
  BOOKING_PAYMENT: { label: 'Thanh toán cọc', isCredit: false },
  REFUND: { label: 'Hoàn tiền huỷ', isCredit: true },
  CASHBACK: { label: 'Hoàn thưởng', isCredit: true },
  TEAM_FUND: { label: 'Đóng quỹ đội', isCredit: false },
  EXPENSE_SHARE: { label: 'Chia tiền sân', isCredit: false },
  ADDON_PAYMENT: { label: 'Dịch vụ thêm', isCredit: false },
};

function formatVndCompact(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}₫`;
}

function WalletRow({ entry }: { entry: WalletLedgerEntry }): ReactElement {
  const isCredit = entry.direction === 'CREDIT';
  const meta = TYPE_META[entry.type] ?? { label: entry.type, isCredit };
  const valueClass = isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive';

  return (
    <TableRow className="hover:bg-muted/40">
      <TableCell>
        <div className="flex items-center gap-2">
          <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
            isCredit ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-destructive/15 text-destructive'
          }`}>
            {isCredit ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
          </div>
          <div>
            <span className="font-semibold text-xs text-foreground block">{meta.label}</span>
            <span className="text-[10px] text-muted-foreground font-score">#{entry.id.slice(0, 8)}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className={`text-right font-score font-bold tracking-tight text-sm ${valueClass}`}>
        {isCredit ? '+' : '−'}
        {formatVndCompact(entry.amount)}
      </TableCell>
      <TableCell className="text-right font-score text-xs text-muted-foreground">
        {formatVndCompact(entry.balanceAfter)}
      </TableCell>
      <TableCell className="text-right text-xs text-muted-foreground">
        {formatDateTime(entry.createdAt)}
      </TableCell>
    </TableRow>
  );
}

interface TopupFormProps {
  busy: boolean;
  onSubmit: (amount: number) => void;
}

function TopupForm({ busy, onSubmit }: TopupFormProps): ReactElement {
  const form = useForm<TopupFormValues>({
    resolver: zodResolver(TopupFormSchema),
    defaultValues: { amount: TOPUP_PRESETS[0] },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(values.amount))} className="space-y-4">
        <FormItem>
          <FormLabel className="text-xs font-semibold">Chọn nhanh mệnh giá</FormLabel>
          <div className="grid grid-cols-2 gap-2">
            {TOPUP_PRESETS.map((value) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl font-score font-bold text-xs"
                onClick={() => form.setValue('amount', value, { shouldValidate: true })}
              >
                {formatVndCompact(value)}
              </Button>
            ))}
          </div>
        </FormItem>
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">Số tiền nạp (₫)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="VD: 200000"
                  className="rounded-xl font-score font-semibold"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-[11px] text-muted-foreground">
                Tối thiểu 10.000₫ · Tối đa 50.000.000₫
              </p>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={busy} className="w-full rounded-xl font-bold">
          {busy ? 'Đang tạo yêu cầu…' : 'Xác nhận nạp'}
        </Button>
      </form>
    </Form>
  );
}

export function WalletPage(): ReactElement {
  const [page, setPage] = useState(1);
  const [topupOpen, setTopupOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data, isLoading } = useMyWallet(page, PAGE_SIZE);
  const topup = useWalletTopup();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status !== 'SUCCESS' && status !== 'FAIL' && status !== 'FAILED') return;
    if (status === 'SUCCESS') {
      toast({ title: 'Nạp tiền thành công', description: 'Số dư ví đã được cập nhật.' });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    } else {
      toast({
        title: 'Nạp tiền thất bại',
        description: 'Giao dịch nạp ví chưa hoàn tất. Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, queryClient, setSearchParams]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header Thẻ Số dư */}
      <Card className="overflow-hidden rounded-2xl border-border/70 bg-gradient-to-br from-card via-card to-muted/40 p-6 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Số dư ví</p>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="text-muted-foreground hover:text-foreground transition p-0.5"
                title={showBalance ? 'Ẩn số dư' : 'Hiện số dư'}
              >
                {showBalance ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
            </div>

            {isLoading ? (
              <Skeleton className="h-10 w-52 rounded-xl" />
            ) : (
              <p className="font-score text-3xl sm:text-4xl font-extrabold tracking-tight text-primary">
                {showBalance ? formatVndCompact(data?.balance ?? 0) : '•••••••• ₫'}
              </p>
            )}

            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Ví SanGo Pay an toàn · Tự động hoàn tiền cọc khi huỷ đúng hạn
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              onClick={() => setTopupOpen(true)}
              className="gap-1.5 rounded-xl font-bold px-5 shadow-xs"
            >
              <Plus className="size-4" />
              Nạp tiền
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal Nạp tiền */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Wallet className="size-5 text-primary" />
              Nạp tiền vào ví SanGo Pay
            </DialogTitle>
          </DialogHeader>
          <TopupForm
            busy={topup.isPending}
            onSubmit={(amount) => {
              topup.mutate(
                { amount },
                {
                  onSuccess: (res) => {
                    setTopupOpen(false);
                    if (res?.paymentUrl) {
                      window.location.href = res.paymentUrl;
                    } else {
                      toast({
                        title: 'Tạo yêu cầu nạp thành công',
                        description: 'Vui lòng hoàn tất thanh toán.',
                      });
                      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
                    }
                  },
                  onError: () => {
                    toast({
                      title: 'Lỗi',
                      description: 'Không thể tạo yêu cầu nạp tiền.',
                      variant: 'destructive',
                    });
                  },
                },
              );
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Lịch sử giao dịch */}
      <Card className="rounded-2xl border-border/70 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
          <h2 className="text-base font-bold tracking-tight text-foreground">Lịch sử giao dịch</h2>
          <span className="text-xs text-muted-foreground font-score font-semibold">
            {data?.total ?? 0} giao dịch
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Chưa có biến động số dư nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Loại giao dịch</TableHead>
                  <TableHead className="text-right text-xs">Số tiền</TableHead>
                  <TableHead className="text-right text-xs">Số dư sau</TableHead>
                  <TableHead className="text-right text-xs">Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((entry) => (
                  <WalletRow key={entry.id} entry={entry} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4 text-xs">
            <span className="text-muted-foreground font-score">
              Trang {page} / {totalPages}
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-8 rounded-lg text-xs"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="h-8 rounded-lg text-xs"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}