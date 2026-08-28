import React from 'react';
import {
  type OwnerVenue,
  type Court,
  type SportType,
} from '../../api/owner-api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
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
import { formatVND, formatMinutesToTime } from '../../../../lib/utils';
import {
  Building2,
  Layers,
  Plus,
  Power,
  Trash2,
  RefreshCw,
} from 'lucide-react';

const SPORT_TYPE_LABELS: Record<SportType, string> = {
  FOOTBALL5: 'Bóng đá 5',
  FOOTBALL7: 'Bóng đá 7',
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
};

interface OwnerCourtsTabProps {
  selectedVenue: OwnerVenue | null;
  courts: Court[];
  loadingCourts: boolean;
  addCourtModalOpen: boolean;
  setAddCourtModalOpen: (open: boolean) => void;
  newCourtName: string;
  setNewCourtName: (name: string) => void;
  newCourtSport: SportType;
  setNewCourtSport: (sport: SportType) => void;
  newCourtSlotMinutes: number;
  setNewCourtSlotMinutes: (min: number) => void;
  newCourtDefaultPrice: number;
  setNewCourtDefaultPrice: (price: number) => void;
  courtActionLoading: boolean;
  onAddCourt: (e: React.FormEvent) => void;
  onToggleCourtMaintenance: (court: Court) => void;
  onDeleteCourt: (courtId: string) => void;
}

export function OwnerCourtsTab({
  selectedVenue,
  courts,
  loadingCourts,
  addCourtModalOpen,
  setAddCourtModalOpen,
  newCourtName,
  setNewCourtName,
  newCourtSport,
  setNewCourtSport,
  newCourtSlotMinutes,
  setNewCourtSlotMinutes,
  newCourtDefaultPrice,
  setNewCourtDefaultPrice,
  courtActionLoading,
  onAddCourt,
  onToggleCourtMaintenance,
  onDeleteCourt,
}: OwnerCourtsTabProps): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Selected Venue Details Card */}
      {selectedVenue && (
        <Card className="border-border/80">
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  {selectedVenue.name}
                  <Badge
                    variant={
                      selectedVenue.status === 'APPROVED'
                        ? 'available'
                        : selectedVenue.status === 'PENDING'
                        ? 'peak'
                        : 'destructive'
                    }
                  >
                    {selectedVenue.status}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedVenue.address}, {selectedVenue.district}, {selectedVenue.city}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Đặt cọc: {selectedVenue.depositPercent}%
              </Badge>
              <Badge variant="outline" className="text-xs">
                Mở cửa: {formatMinutesToTime(selectedVenue.openMinute)} - {formatMinutesToTime(selectedVenue.closeMinute)}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Courts List Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Danh Sách Sân Con ({courts.length} sân)
          </h3>
          <p className="text-xs text-muted-foreground">
            Quản lý từng sân thi đấu, thời lượng slot và trạng thái bảo trì.
          </p>
        </div>

        <Button onClick={() => setAddCourtModalOpen(true)} className="rounded-xl font-bold shadow-xs text-xs">
          <Plus className="h-4 w-4 mr-1" /> Thêm Sân Con
        </Button>
      </div>

      {/* Courts Grid */}
      {loadingCourts ? (
        <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span>Đang nạp danh sách sân con...</span>
        </div>
      ) : courts.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <Layers className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="font-semibold">Cụm sân này chưa có sân con nào.</p>
            <Button size="sm" onClick={() => setAddCourtModalOpen(true)} className="mt-2">
              Thêm sân con đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((court) => (
            <Card key={court.id} className="border-border/80 hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">{court.name}</CardTitle>
                  <Badge
                    variant={court.status === 'ACTIVE' ? 'available' : 'maintenance'}
                    className="text-[10px]"
                  >
                    {court.status === 'ACTIVE' ? 'Hoạt động' : 'Bảo trì'}
                  </Badge>
                </div>
                <Badge variant="outline" className="w-fit text-[10px]">
                  {SPORT_TYPE_LABELS[court.sportType]}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Giá cơ bản / slot:</span>
                    <span className="font-extrabold text-foreground">{formatVND(court.defaultPricePerSlot)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Thời lượng slot:</span>
                    <span className="font-semibold text-foreground">{court.slotMinutes} phút</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <Button
                    size="sm"
                    variant={court.status === 'ACTIVE' ? 'outline' : 'default'}
                    onClick={() => onToggleCourtMaintenance(court)}
                    className="text-xs h-8 px-2.5 font-bold"
                  >
                    <Power className="h-3.5 w-3.5 mr-1" />
                    {court.status === 'ACTIVE' ? 'Tạm ngưng (Bảo trì)' : 'Mở lại hoạt động'}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteCourt(court.id)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                    title="Xóa sân con"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Thêm Sân Con */}
      <Dialog open={addCourtModalOpen} onOpenChange={setAddCourtModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm Sân Con Mới</DialogTitle>
            <DialogDescription className="text-xs">
              Thêm sân con vào cụm sân {selectedVenue?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onAddCourt} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Tên sân con (ví dụ: Sân 1, Sân VIP)</label>
              <Input
                placeholder="Sân 1..."
                value={newCourtName}
                onChange={(e) => setNewCourtName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Môn thể thao</label>
              <select
                value={newCourtSport}
                onChange={(e) => setNewCourtSport(e.target.value as SportType)}
                className="w-full h-10 px-3 rounded-xl bg-card border border-border text-sm font-semibold"
              >
                <option value="FOOTBALL5">Bóng đá 5 người</option>
                <option value="FOOTBALL7">Bóng đá 7 người</option>
                <option value="PICKLEBALL">Pickleball</option>
                <option value="BADMINTON">Cầu lông</option>
                <option value="TENNIS">Tennis</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Thời lượng slot (phút)</label>
                <select
                  value={newCourtSlotMinutes}
                  onChange={(e) => setNewCourtSlotMinutes(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-card border border-border text-sm font-semibold"
                >
                  <option value={30}>30 phút</option>
                  <option value={60}>60 phút</option>
                  <option value={90}>90 phút</option>
                  <option value={120}>120 phút</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Giá cơ bản / slot (VND)</label>
                <Input
                  type="number"
                  value={newCourtDefaultPrice}
                  onChange={(e) => setNewCourtDefaultPrice(Number(e.target.value))}
                  min={10000}
                  step={10000}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setAddCourtModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" loading={courtActionLoading} className="font-bold">
                Tạo Sân Con
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
