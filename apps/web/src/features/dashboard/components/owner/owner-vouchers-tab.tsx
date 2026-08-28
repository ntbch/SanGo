import React from 'react';
import {
  type OwnerVoucher,
} from '../../api/owner-api';
import { Card, CardHeader, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../components/ui/dialog';
import { formatMinutesToTime } from '../../../../lib/utils';
import {
  TicketPercent,
  Plus,
  Power,
  Trash2,
  RefreshCw,
} from 'lucide-react';

const DAY_OF_WEEK_LABELS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

interface OwnerVouchersTabProps {
  vouchers: OwnerVoucher[];
  loadingVouchers: boolean;
  addVoucherModalOpen: boolean;
  setAddVoucherModalOpen: (open: boolean) => void;
  newVoucherCode: string;
  setNewVoucherCode: (code: string) => void;
  newVoucherPercent: number;
  setNewVoucherPercent: (percent: number) => void;
  newVoucherDay: number;
  setNewVoucherDay: (day: number) => void;
  newVoucherFromHour: string;
  setNewVoucherFromHour: (hour: string) => void;
  newVoucherToHour: string;
  setNewVoucherToHour: (hour: string) => void;
  newVoucherLimit: number;
  setNewVoucherLimit: (limit: number) => void;
  voucherActionLoading: boolean;
  onAddVoucher: (e: React.FormEvent) => void;
  onToggleVoucherActive: (voucher: OwnerVoucher) => void;
  onDeleteVoucher: (voucherId: string) => void;
}

export function OwnerVouchersTab({
  vouchers,
  loadingVouchers,
  addVoucherModalOpen,
  setAddVoucherModalOpen,
  newVoucherCode,
  setNewVoucherCode,
  newVoucherPercent,
  setNewVoucherPercent,
  newVoucherDay,
  setNewVoucherDay,
  newVoucherFromHour,
  setNewVoucherFromHour,
  newVoucherToHour,
  setNewVoucherToHour,
  newVoucherLimit,
  setNewVoucherLimit,
  voucherActionLoading,
  onAddVoucher,
  onToggleVoucherActive,
  onDeleteVoucher,
}: OwnerVouchersTabProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <TicketPercent className="h-4 w-4 text-primary" /> Chương Trình Voucher Kích Cầu Giờ Thấp Điểm ({vouchers.length} mã)
          </h3>
          <p className="text-xs text-muted-foreground">
            Tạo mã giảm giá theo % áp dụng tự động cho các ca vắng khách trong ngày.
          </p>
        </div>

        <Button onClick={() => setAddVoucherModalOpen(true)} className="rounded-xl font-bold shadow-xs text-xs">
          <Plus className="h-4 w-4 mr-1" /> Tạo Mã Giảm Giá Mới
        </Button>
      </div>

      {loadingVouchers ? (
        <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span>Đang nạp danh sách voucher...</span>
        </div>
      ) : vouchers.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <TicketPercent className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="font-semibold">Bạn chưa tạo mã giảm giá nào.</p>
            <Button size="sm" onClick={() => setAddVoucherModalOpen(true)} className="mt-2">
              Tạo mã khuyến mãi đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map((voucher) => (
            <Card key={voucher.id} className="border-border/80 hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-base tracking-wider text-primary">
                    {voucher.code}
                  </span>
                  <Badge variant={voucher.active ? 'available' : 'default'} className="text-[10px]">
                    {voucher.active ? 'Đang kích hoạt' : 'Tạm tắt'}
                  </Badge>
                </div>
                <Badge variant="peak" className="w-fit text-[10px]">
                  Giảm {voucher.percentOff}% giá slot
                </Badge>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Thứ trong tuần:</span>
                    <span className="font-bold text-foreground">{DAY_OF_WEEK_LABELS[voucher.dayOfWeek]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Khung giờ áp dụng:</span>
                    <span className="font-bold text-primary">
                      {formatMinutesToTime(voucher.validFromMinute)} - {formatMinutesToTime(voucher.validToMinute)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lượt đã sử dụng:</span>
                    <span className="font-semibold text-foreground">
                      {voucher.usedCount} / {voucher.usageLimit} lượt
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <Button
                    size="sm"
                    variant={voucher.active ? 'outline' : 'default'}
                    onClick={() => onToggleVoucherActive(voucher)}
                    className="text-xs h-8 px-2.5 font-bold"
                  >
                    <Power className="h-3.5 w-3.5 mr-1" />
                    {voucher.active ? 'Tạm dừng mã' : 'Bật kích hoạt'}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteVoucher(voucher.id)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                    title="Xóa mã voucher"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Tạo Voucher Mới */}
      <Dialog open={addVoucherModalOpen} onOpenChange={setAddVoucherModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo Mã Khuyến Mãi Mới</DialogTitle>
            <DialogDescription className="text-xs">
              Tạo mã giảm giá theo % áp dụng cho các khung giờ thấp điểm.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onAddVoucher} className="space-y-3.5 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Mã CODE (viết hoa)</label>
                <Input
                  placeholder="OFF30SANG..."
                  value={newVoucherCode}
                  onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase())}
                  className="font-mono font-bold uppercase"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">% Giảm giá (1-100)</label>
                <Input
                  type="number"
                  value={newVoucherPercent}
                  onChange={(e) => setNewVoucherPercent(Number(e.target.value))}
                  min={1}
                  max={100}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Áp dụng cho ngày trong tuần</label>
              <select
                value={newVoucherDay}
                onChange={(e) => setNewVoucherDay(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl bg-card border border-border text-sm font-semibold"
              >
                {DAY_OF_WEEK_LABELS.map((label, idx) => (
                  <option key={idx} value={idx}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Giờ bắt đầu áp dụng</label>
                <Input
                  type="time"
                  value={newVoucherFromHour}
                  onChange={(e) => setNewVoucherFromHour(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Giờ kết thúc áp dụng</label>
                <Input
                  type="time"
                  value={newVoucherToHour}
                  onChange={(e) => setNewVoucherToHour(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Số lượt sử dụng tối đa toàn sàn</label>
              <Input
                type="number"
                value={newVoucherLimit}
                onChange={(e) => setNewVoucherLimit(Number(e.target.value))}
                min={1}
                max={10000}
                required
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setAddVoucherModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" loading={voucherActionLoading} className="font-bold">
                Tạo Mã Voucher
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
