/** Trang Ví (F6) — số dư lớn, nạp tiền qua cổng mock, lịch sử ledger phân trang. */
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight, Plus, Wallet } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { Badge, type BadgeProps } from '../../../components/ui/badge';
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
const TOPUP_PRESETS = [100_000, 200_000, 500_000];

const TYPE_META: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  TOPUP: { label: 'Nạp tiền', variant: 'success' },
  PAYMENT: { label: 'Thanh toán', variant: 'secondary' },
  REFUND: { label: 'Hoàn tiền', variant: 'warning' },
  CASHBACK: { label: 'Hoàn thưởng', variant: 'warning' },
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
  const meta = TYPE_META[entry.type] ?? { label: entry.type, variant: 'secondary' as const };
  const isCredit = entry.direction === 'CREDIT';
  const valueClass = isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive';

  return (
    <TableRow>
      <TableCell>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </TableCell>
      <TableCell className={'text-right font-score font-bold ' + valueClass}>
        {isCredit ? '+' : '−'}
        {formatVnd(entry.amount)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {formatVnd(entry.balanceAfter)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
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
          <FormLabel>Số tiền nhanh</FormLabel>
          <div className="grid grid-cols-3 gap-2">
            {TOPUP_PRESETS.map((value) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg font-semibold"
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
              <FormLabel>Số tiền nạp (₫)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="VD: 200000"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Tối thiểu 10.000₫ · Tối đa 50.000.000₫
              </p>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={busy} className="w-full rounded-lg font-bold">
          {busy ? 'Đang tạo yêu cầu…' : 'Xác nhận nạp'}
        </Button>
      </form>
    </Form>
  );
}

export function WalletPage(): ReactElement {
  const [page, setPage] = useState(1);
  const [topupOpen, setTopupOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data, isLoading } = useMyWallet(page, PAGE_SIZE);
  const topup = useWalletTopup();

  // Quay lại từ cổng mock (?status=...) -> toast kết quả + làm mới số dư.
  // wallets.service.redirect trả SUCCESS | FAIL; FAILED là biến thể của luồng payments.
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
      {/* Số dư */}
      <Card className="rounded-xl border-border/60 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Số dư ví</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-9 w-44" />
            ) : (
              <p className="font-score text-3xl font-extrabold tracking-tight text-primary">
                {formatVnd(data?.balance ?? 0)}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Dùng để thanh toán đơn và nhận hoàn tiền tức thì.
            </p>
          </div>
          <Button onClick={() => setTopupOpen(true)} className="rounded-lg font-bold">
            <Plus className="size-4" aria-hidden /> Nạp tiền
          </Button>
        </div>
      </Card>

      {/* Lịch sử giao dịch */}
      <Card className="rounded-xl border-border/60 p-0">
        <div className="border-b border-border/60 px-6 py-4">
          <h2 className="text-base font-bold">Lịch sử giao dịch</h2>
        </div>
        {isLoading ? (
          <div className="space-y-2 p-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Wallet className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-semibold">Chưa có giao dịch nào</p>
            <p className="text-xs text-muted-foreground">
              Nạp tiền lần đầu để bắt đầu thanh toán bằng ví.
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead className="text-right">Giá trị</TableHead>
                  <TableHead className="text-right">Số dư sau</TableHead>
                  <TableHead className="text-right">Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((entry) => (
                  <WalletRow key={entry.id} entry={entry} />
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-border/60 px-6 py-3 text-sm">
                <span className="text-muted-foreground">
                  Trang {data.page}/{totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" aria-hidden /> Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Sau <ChevronRight className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card>

      {/* Dialog nạp tiền */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Nạp tiền vào ví</DialogTitle>
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
