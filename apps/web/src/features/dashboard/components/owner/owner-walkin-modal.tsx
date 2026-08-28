import React from 'react';
import {
  type Court,
  type SportType,
} from '../../api/owner-api';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../components/ui/dialog';
import { formatVND } from '../../../../lib/utils';
import {
  UserPlus,
  Check,
} from 'lucide-react';

const SPORT_TYPE_LABELS: Record<SportType, string> = {
  FOOTBALL5: 'Bóng đá 5',
  FOOTBALL7: 'Bóng đá 7',
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
};

interface OwnerWalkInModalProps {
  walkInModalOpen: boolean;
  setWalkInModalOpen: (open: boolean) => void;
  courts: Court[];
  walkInCourtId: string;
  setWalkInCourtId: (id: string) => void;
  walkInStartHour: string;
  setWalkInStartHour: (hour: string) => void;
  walkInEndHour: string;
  setWalkInEndHour: (hour: string) => void;
  walkInCustomerName: string;
  setWalkInCustomerName: (name: string) => void;
  walkInCustomerPhone: string;
  setWalkInCustomerPhone: (phone: string) => void;
  walkInDeposit: number;
  setWalkInDeposit: (deposit: number) => void;
  walkInTotal: number;
  setWalkInTotal: (total: number) => void;
  walkInSubmitting: boolean;
  onWalkInSubmit: (e: React.FormEvent) => void;
}

export function OwnerWalkInModal({
  walkInModalOpen,
  setWalkInModalOpen,
  courts,
  walkInCourtId,
  setWalkInCourtId,
  walkInStartHour,
  setWalkInStartHour,
  walkInEndHour,
  setWalkInEndHour,
  walkInCustomerName,
  setWalkInCustomerName,
  walkInCustomerPhone,
  setWalkInCustomerPhone,
  walkInDeposit,
  setWalkInDeposit,
  walkInTotal,
  setWalkInTotal,
  walkInSubmitting,
  onWalkInSubmit,
}: OwnerWalkInModalProps): React.ReactElement {
  return (
    <Dialog open={walkInModalOpen} onOpenChange={setWalkInModalOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Tạo Đơn Đặt Sân Tại Quầy (Walk-in)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tạo đơn đặt nhanh cho khách vãng lai gọi điện hoặc đến sân trực tiếp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onWalkInSubmit} className="space-y-3.5 mt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Chọn Sân Con</label>
            <select
              value={walkInCourtId}
              onChange={(e) => setWalkInCourtId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-card border border-border text-xs font-semibold"
              required
            >
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name} ({SPORT_TYPE_LABELS[court.sportType]}) - {formatVND(court.defaultPricePerSlot)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Giờ Bắt Đầu</label>
              <Input
                type="time"
                value={walkInStartHour}
                onChange={(e) => setWalkInStartHour(e.target.value)}
                className="font-mono text-xs font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Giờ Kết Thúc</label>
              <Input
                type="time"
                value={walkInEndHour}
                onChange={(e) => setWalkInEndHour(e.target.value)}
                className="font-mono text-xs font-bold"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Tên Khách Hàng</label>
            <Input
              placeholder="Ví dụ: Anh Hoàng (Đội FC Tiger)..."
              value={walkInCustomerName}
              onChange={(e) => setWalkInCustomerName(e.target.value)}
              className="text-xs font-semibold"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Số Điện Thoại Khách</label>
            <Input
              placeholder="0912 345 678..."
              value={walkInCustomerPhone}
              onChange={(e) => setWalkInCustomerPhone(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Tiền Cọc Tại Quầy (VND)</label>
              <Input
                type="number"
                value={walkInDeposit}
                onChange={(e) => setWalkInDeposit(Number(e.target.value))}
                step={10000}
                className="font-mono text-xs font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Tổng Tiền Ca Đá (VND)</label>
              <Input
                type="number"
                value={walkInTotal}
                onChange={(e) => setWalkInTotal(Number(e.target.value))}
                step={10000}
                className="font-mono text-xs font-bold"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" onClick={() => setWalkInModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" loading={walkInSubmitting} className="font-bold gap-1 text-xs">
              <Check className="h-4 w-4" /> Xác Nhận Đặt Quầy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
