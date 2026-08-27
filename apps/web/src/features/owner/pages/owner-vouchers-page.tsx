/** Trang 'Voucher của tôi' (F3) — tạo/bật-tắt/xoá mã giảm theo cửa sổ giờ thấp điểm. */
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Power, TicketPercent, Trash2, TrendingUp } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
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
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { minutesToTime, formatDate } from '../../public/format';
import { hhmmToMinutes, voucherFormSchema, type VoucherFormValues } from '../schemas';
import {
  useCreateOwnerVoucher,
  useDeleteOwnerVoucher,
  useOwnerVouchers,
  useUpdateOwnerVoucher,
} from '../queries';
import type { OwnerVoucher } from '../types';

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function windowLabel(voucher: OwnerVoucher): string {
  return (
    DAY_LABELS[voucher.dayOfWeek] +
    ' ' +
    minutesToTime(voucher.validFromMinute) +
    '–' +
    minutesToTime(voucher.validToMinute)
  );
}

function VoucherFormDialog(options: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): ReactElement {
  const { open, onOpenChange } = options;
  const createMutation = useCreateOwnerVoucher();
  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherFormSchema),
    defaultValues: {
      code: '',
      percentOff: 20,
      dayOfWeek: 3,
      fromTime: '14:00',
      toTime: '17:00',
      usageLimit: 100,
      perUserLimit: 1,
      expiresAt: '',
    },
  });

  function onSubmit(values: VoucherFormValues): void {
    createMutation.mutate(
      {
        code: values.code,
        percentOff: values.percentOff,
        dayOfWeek: values.dayOfWeek,
        validFromMinute: hhmmToMinutes(values.fromTime),
        validToMinute: hhmmToMinutes(values.toTime),
        usageLimit: values.usageLimit,
        perUserLimit: values.perUserLimit,
        ...(values.expiresAt ? { expiresAt: new Date(values.expiresAt).toISOString() } : {}),
      },
      {
        onSuccess: (created) => {
          toast({
            title: 'Đã tạo mã ' + created.code,
            description: 'Mã sẵn sàng cho khách áp tại checkout.',
          });
          form.reset();
          onOpenChange(false);
        },
        onError: (err) =>
          toast({
            variant: 'destructive',
            title: 'Tạo voucher thất bại',
            description: friendlyApiMessage(err),
          }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle>Tạo voucher giảm giá</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mã voucher</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: MUA50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="percentOff"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phần trăm giảm (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dayOfWeek"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thứ áp dụng</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none"
                      {...field}
                    >
                      {DAY_LABELS.map((label, index) => (
                        <option key={label} value={index}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-2 sm:col-span-1">
              <FormField
                control={form.control}
                name="fromTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Từ giờ</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="toTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đến giờ</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="usageLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giới hạn lượt</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="perUserLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lượt mỗi người</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={10} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Hạn dùng (tuỳ chọn)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full rounded-lg font-bold sm:col-span-2"
            >
              <TicketPercent className="size-4" aria-hidden /> Tạo mã
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function OwnerVouchersPage(): ReactElement {
  const vouchersQuery = useOwnerVouchers();
  const updateMutation = useUpdateOwnerVoucher();
  const deleteMutation = useDeleteOwnerVoucher();
  const [formOpen, setFormOpen] = useState(false);

  const items = vouchersQuery.data ?? [];

  function handleToggle(voucher: OwnerVoucher): void {
    updateMutation.mutate(
      { id: voucher.id, patch: { active: !voucher.active } },
      {
        onSuccess: () =>
          toast({
            title: voucher.active ? 'Đã tạm tắt ' + voucher.code : 'Đã bật lại ' + voucher.code,
          }),
        onError: (err) =>
          toast({
            variant: 'destructive',
            title: 'Cập nhật thất bại',
            description: friendlyApiMessage(err),
          }),
      },
    );
  }

  function handleDelete(voucher: OwnerVoucher): void {
    if (!window.confirm('Xoá voucher ' + voucher.code + '?')) return;
    deleteMutation.mutate(voucher.id, {
      onSuccess: () => toast({ title: 'Đã xoá ' + voucher.code }),
      onError: (err) =>
        toast({
          variant: 'destructive',
          title: 'Xoá thất bại',
          description: friendlyApiMessage(err),
        }),
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Voucher của tôi</h1>
          <p className="text-sm text-muted-foreground">
            Mã giảm theo cửa sổ giờ thấp điểm — khách áp trực tiếp khi thanh toán.
          </p>
        </div>
        <Button className="rounded-lg font-bold" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" aria-hidden /> Tạo voucher
        </Button>
      </header>

      {/* Dải tóm tắt Bento: tổng mã / đang chạy / lượt đã dùng */}
      <div className="grid gap-3 sm:grid-cols-3" data-testid="voucher-summary">
        <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
          <CardContent className="flex items-center justify-between gap-2 p-4">
            <div>
              <p className="font-score text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Tổng mã
              </p>
              <p className="font-score text-2xl font-extrabold tabular-nums tracking-tight">
                {items.length}
              </p>
            </div>
            <TicketPercent className="size-6 text-primary" aria-hidden />
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
          <CardContent className="flex items-center justify-between gap-2 p-4">
            <div>
              <p className="font-score text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Đang chạy
              </p>
              <p className="font-score text-2xl font-extrabold tabular-nums tracking-tight">
                {items.filter((v) => v.active).length}
              </p>
            </div>
            <Power className="size-6 text-primary" aria-hidden />
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
          <CardContent className="flex items-center justify-between gap-2 p-4">
            <div>
              <p className="font-score text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Lượt đã dùng
              </p>
              <p className="font-score text-2xl font-extrabold tabular-nums tracking-tight">
                {items.reduce((sum, v) => sum + (v._count?.redemptions ?? 0), 0)}
              </p>
            </div>
            <TrendingUp className="size-6 text-amber-500" aria-hidden />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-border/60 p-0">
        <CardContent className="p-0">
          {vouchersQuery.isPending ? (
            <div className="space-y-2 p-6">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <TicketPercent className="size-8 text-muted-foreground" aria-hidden />
              <p className="text-sm font-semibold">Chưa có voucher nào</p>
              <p className="text-xs text-muted-foreground">
                Tạo mã đầu tiên để thu hút khách trong khung giờ vắng.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Giảm</TableHead>
                  <TableHead>Cửa sổ</TableHead>
                  <TableHead>Lượt dùng</TableHead>
                  <TableHead>Hạn dùng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-score font-bold">{voucher.code}</TableCell>
                    <TableCell>{voucher.percentOff}%</TableCell>
                    <TableCell>{windowLabel(voucher)}</TableCell>
                    <TableCell>
                      {voucher._count?.redemptions ?? 0}/{voucher.usageLimit}
                      <span className="block text-[11px] text-muted-foreground">
                        tối đa {voucher.perUserLimit}/người
                      </span>
                    </TableCell>
                    <TableCell>
                      {voucher.expiresAt
                        ? formatDate(voucher.expiresAt)
                        : 'Không hạn'}
                    </TableCell>
                    <TableCell>
                      {voucher.active ? (
                        <Badge variant="success">Đang chạy</Badge>
                      ) : (
                        <Badge variant="warning">Tạm tắt</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={updateMutation.isPending}
                          onClick={() => handleToggle(voucher)}
                        >
                          <Power className="size-3.5" aria-hidden />
                          {voucher.active ? 'Tạm tắt' : 'Bật lại'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(voucher)}
                        >
                          <Trash2 className="size-3.5" aria-hidden /> Xoá
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <VoucherFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
