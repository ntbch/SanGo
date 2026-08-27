/** Trang 'Dịch vụ' của chủ sân (F4) — thêm món nước/đồ thuê, đổi giá, bật-tắt bán. */
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Power, ShoppingBag, Trash2, TrendingUp } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';

import { Label } from '../../../components/ui/label';
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
import { formatVnd } from '../../public/format';
import { SERVICE_TYPE_LABELS, serviceFormSchema, type ServiceFormValues } from '../schemas';
import {
  useCreateVenueService,
  useDeleteVenueService,
  useUpdateVenueService,
  useVenueServices,
  useMyVenues,
} from '../queries';
import type { VenueServiceRow, VenueServiceTypeValue } from '../types';

const SERVICE_TYPES: VenueServiceTypeValue[] = ['BEVERAGE', 'EQUIPMENT', 'OTHER'];

/** Dialog thêm/sửa một dòng menu — dùng chung cho cả hai chế độ. */
function ServiceFormDialog(options: {
  venueId: string;
  /** Có giá trị = đang sửa món này; undefined = tạo mới. */
  editing?: VenueServiceRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): ReactElement {
  const { venueId, editing, open, onOpenChange } = options;
  const createMutation = useCreateVenueService(venueId);
  const updateMutation = useUpdateVenueService(venueId);
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: editing
      ? {
          name: editing.name,
          price: editing.price,
          type: editing.type,
          isAvailable: editing.isAvailable,
        }
      : { name: '', price: 10000, type: 'BEVERAGE', isAvailable: true },
  });

  function onSubmit(values: ServiceFormValues): void {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, patch: values },
        {
          onSuccess: () => {
            toast({ title: 'Đã cập nhật "' + values.name + '"' });
            onOpenChange(false);
          },
          onError: (err) =>
            toast({
              variant: 'destructive',
              title: 'Cập nhật dịch vụ thất bại',
              description: friendlyApiMessage(err),
            }),
        },
      );
      return;
    }
    createMutation.mutate(values, {
      onSuccess: () => {
        toast({
          title: 'Đã thêm "' + values.name + '" vào menu',
          description: 'Khách có thể chọn kèm khi gọi thêm dịch vụ trong đơn.',
        });
        form.reset();
        onOpenChange(false);
      },
      onError: (err) =>
        toast({
          variant: 'destructive',
          title: 'Tạo dịch vụ thất bại',
          description: friendlyApiMessage(err),
        }),
    });
  }

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !editing) form.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên dịch vụ</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Nước suối 500ml" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá (đ)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1000} step={1000} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none"
                        {...field}
                      >
                        {SERVICE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {SERVICE_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      className="size-4 accent-primary"
                      id="service-available"
                    />
                  </FormControl>
                  <FormLabel htmlFor="service-available" className="!mt-0 font-normal">
                    Đang mở bán (khách thấy được trên menu)
                  </FormLabel>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={pending} className="w-full rounded-lg font-bold">
              <Plus className="size-4" aria-hidden /> {editing ? 'Lưu thay đổi' : 'Thêm vào menu'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/** Trang quản lý menu dịch vụ theo từng cụm sân của owner. */
export function VenueServicesPage(): ReactElement {
  const venuesQuery = useMyVenues();
  const [venueId, setVenueId] = useState('');
  const servicesQuery = useVenueServices(venueId === '' ? undefined : venueId);

  const updateMutation = useUpdateVenueService(venueId);
  const deleteMutation = useDeleteVenueService(venueId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenueServiceRow | undefined>(undefined);

  const items = servicesQuery.data ?? [];

  function handleToggle(service: VenueServiceRow): void {
    updateMutation.mutate(
      { id: service.id, patch: { isAvailable: !service.isAvailable } },
      {
        onSuccess: () =>
          toast({
            title: service.isAvailable ? 'Đã tắt bán ' + service.name : 'Đã mở bán ' + service.name,
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

  function handleDelete(service: VenueServiceRow): void {
    if (!window.confirm('Xoá dịch vụ ' + service.name + '?')) return;
    deleteMutation.mutate(service.id, {
      onSuccess: (res) =>
        toast(
          res.deleted
            ? { title: 'Đã xoá ' + service.name }
            : {
                title: 'Đã chuyển "' + service.name + '" sang tắt bán',
                description: 'Món đã phát sinh trong đơn đặt nên chỉ tắt để giữ lịch sử.',
              },
        ),
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
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Dịch vụ đi kèm</h1>
          <p className="text-sm text-muted-foreground">
            Menu nước uống & đồ thuê — khách chọn kèm sau khi đơn được xác nhận.
          </p>
        </div>
        <Button
          className="rounded-lg font-bold"
          disabled={venueId === ''}
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden /> Thêm dịch vụ
        </Button>
      </header>

      {/* Chọn cụm sân trước — menu là tài nguyên của từng cụm sân */}
      <div className="space-y-1.5 w-full max-w-56">
        <Label htmlFor="svc-venue">Cụm sân</Label>
        <select
          id="svc-venue"
          value={venueId}
          onChange={(event) => setVenueId(event.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">— Chọn cụm sân —</option>
          {(venuesQuery.data?.items ?? []).map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dải tóm tắt Bento menu dịch vụ */}
      {venueId !== '' && !servicesQuery.isPending && items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3" data-testid="services-summary">
          <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <CardContent className="flex items-center justify-between gap-2 p-4">
              <div>
                <p className="font-score text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Tổng món
                </p>
                <p className="font-score text-2xl font-extrabold tabular-nums tracking-tight">
                  {items.length}
                </p>
              </div>
              <ShoppingBag className="size-6 text-primary" aria-hidden />
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <CardContent className="flex items-center justify-between gap-2 p-4">
              <div>
                <p className="font-score text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Đang bán
                </p>
                <p className="font-score text-2xl font-extrabold tabular-nums tracking-tight">
                  {items.filter((s) => s.isAvailable).length}
                </p>
              </div>
              <Power className="size-6 text-primary" aria-hidden />
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <CardContent className="flex items-center justify-between gap-2 p-4">
              <div>
                <p className="font-score text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Tổng giá trị menu
                </p>
                <p className="font-score text-2xl font-extrabold tabular-nums tracking-tight">
                  {formatVnd(items.reduce((sum, s) => sum + s.price, 0))}
                </p>
              </div>
              <span className="flex size-6 items-center justify-center text-amber-500">
                <TrendingUp className="size-6" aria-hidden />
              </span>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card className="rounded-xl border-border/60 p-0">
        <CardContent className="p-0">
          {venueId === '' ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <ShoppingBag className="size-8 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Chọn một cụm sân để xem và quản lý menu dịch vụ.
              </p>
            </div>
          ) : servicesQuery.isPending ? (
            <div className="space-y-2 p-6">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <ShoppingBag className="size-8 text-muted-foreground" aria-hidden />
              <p className="text-sm font-semibold">Chưa có dịch vụ nào</p>
              <p className="text-xs text-muted-foreground">
                Thêm nước uống hoặc đồ thuê để tăng doanh thu mỗi trận đấu.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-bold">{service.name}</TableCell>
                    <TableCell>{SERVICE_TYPE_LABELS[service.type] ?? service.type}</TableCell>
                    <TableCell className="font-score">{formatVnd(service.price)}</TableCell>
                    <TableCell>
                      {service.isAvailable ? (
                        <Badge variant="success">Đang bán</Badge>
                      ) : (
                        <Badge variant="warning">Tạm tắt</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(service);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" aria-hidden /> Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={updateMutation.isPending}
                          onClick={() => handleToggle(service)}
                        >
                          <Power className="size-3.5" aria-hidden />
                          {service.isAvailable ? 'Tắt bán' : 'Mở bán'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(service)}
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

      <ServiceFormDialog
        key={editing?.id ?? 'new'}
        venueId={venueId}
        editing={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
