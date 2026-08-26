/** Trang Ví (F6) — chuẩn UI/UX Pro-Max: số dư font-mono, nút ẩn/hiện Eye toggle, bảng ledger màu sắc. */
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
import { formatVnd } from '../../public/format';
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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
            <span className="text-[10px] text-muted-foreground font-mono">#{entry.id.slice(0, 8)}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className={`text-right font-mono font-bold tracking-tight text-sm ${valueClass}`}>
        {isCredit ? '+' : '−'}
        {formatVnd(entry.amount)}
      </TableCell>
      <TableCell className="text-right font-mono text-xs text-muted-foreground">
        {formatVnd(entry.balanceAfter)}
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
                className="rounded-xl font-mono font-bold text-xs"
                onClick={() => form.setValue('amount', value, { shouldValidate: true })}
              >
                {formatVnd(value)}
              </Button>
            ))}
          </div>
        </FormItem>
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold">Hoặc nhập số tiền tùy ý (₫)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="VD: 200000"
                  className="rounded-xl font-mono font-semibold"
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
          {busy ? 'Đang tạo yêu cầu…' : 'Xác nhận nạp ví'}
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
      <Card className="overflow-hidden rounded-2xl border-border/70 bg-gradient-to-br from-card via-card to-muted/40 p-6 shadow-md">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Số dư khả dụng</p>
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
              <p className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-primary">
                {showBalance ? formatVnd(data?.balance ?? 0) : '•••••••• ₫'}
              </p>
            )}

            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>Ví cá nhân an toàn dùng để thanh toán cọc sân và nhận tiền hoàn tự động.</span>
            </p>
          </div>

          <div className="flex shrink-0">
            <Button
              size="lg"
              onClick={() => setTopupOpen(true)}
              className="w-full sm:w-auto rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="mr-1.5 size-4" aria-hidden /> Nạp tiền vào ví
            </Button>
          </div>
        </div>
      </Card>

      {/* Lịch sử giao dịch */}
      <Card className="rounded-2xl border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="border-b border-border/60 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Lịch sử biến động số dư</h2>
          {data ? (
            <span className="text-xs text-muted-foreground">Tổng cộng {data.total} giao dịch</span>
          ) : null}
        </div>

        {isLoading ? (
          <div className="space-y-2 p-6">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Wallet className="size-10 text-muted-foreground/40" aria-hidden />
            <p className="text-sm font-bold text-foreground">Chưa có giao dịch nào</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Nạp tiền lần đầu để bắt đầu thanh toán đặt sân và đóng quỹ đội nhanh chóng.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại giao dịch</TableHead>
                    <TableHead className="text-right">Biến động</TableHead>
                    <TableHead className="text-right">Số dư sau GD</TableHead>
                    <TableHead className="text-right">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((entry) => (
                    <WalletRow key={entry.id} entry={entry} />
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-border/60 px-6 py-3 text-sm">
                <span className="text-xs text-muted-foreground">
                  Trang {data.page} / {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-xl text-xs"
                  >
                    <ChevronLeft className="mr-1 size-3.5" aria-hidden /> Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-xl text-xs"
                  >
                    Sau <ChevronRight className="ml-1 size-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card>

      {/* Dialog nạp tiền */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Nạp tiền vào ví SanGo</DialogTitle>
          </DialogHeader>
          <TopupForm
            busy={topup.isPending}
            onSubmit={(amount) =>
              topup.mutate(
                { amount },
                {
                  onSuccess: () => setTopupOpen(false),
                  onError: (err) =>
                    toast({
                      title: 'Nạp tiền thất bại',
                      description: err.message,
                      variant: 'destructive',
                    }),
                },
              )
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}