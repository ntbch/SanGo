import React from 'react';
import {
  type OwnerVenue,
  type VenueService,
  type ServiceType,
} from '../../api/owner-api';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
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
import { formatVND } from '../../../../lib/utils';
import {
  CupSoda,
  Plus,
  Power,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface OwnerServicesTabProps {
  selectedVenue: OwnerVenue | null;
  services: VenueService[];
  loadingServices: boolean;
  addServiceModalOpen: boolean;
  setAddServiceModalOpen: (open: boolean) => void;
  newServiceName: string;
  setNewServiceName: (name: string) => void;
  newServicePrice: number;
  setNewServicePrice: (price: number) => void;
  newServiceType: ServiceType;
  setNewServiceType: (type: ServiceType) => void;
  serviceActionLoading: boolean;
  onAddService: (e: React.FormEvent) => void;
  onToggleServiceAvailable: (service: VenueService) => void;
  onDeleteService: (serviceId: string) => void;
}

export function OwnerServicesTab({
  selectedVenue,
  services,
  loadingServices,
  addServiceModalOpen,
  setAddServiceModalOpen,
  newServiceName,
  setNewServiceName,
  newServicePrice,
  setNewServicePrice,
  newServiceType,
  setNewServiceType,
  serviceActionLoading,
  onAddService,
  onToggleServiceAvailable,
  onDeleteService,
}: OwnerServicesTabProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <CupSoda className="h-4 w-4 text-primary" /> Menu Dịch Vụ &amp; Tiện Ích Sân ({services.length} món)
          </h3>
          <p className="text-xs text-muted-foreground">
            Quản lý kho nước uống giải khát, thuê trang thiết bị thể thao và dịch vụ kèm theo.
          </p>
        </div>

        <Button onClick={() => setAddServiceModalOpen(true)} className="rounded-xl font-bold shadow-xs text-xs">
          <Plus className="h-4 w-4 mr-1" /> Thêm Mặt Hàng / Dịch Vụ
        </Button>
      </div>

      {loadingServices ? (
        <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span>Đang nạp menu dịch vụ...</span>
        </div>
      ) : services.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <CupSoda className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="font-semibold">Cụm sân này chưa có dịch vụ tiện ích nào.</p>
            <Button size="sm" onClick={() => setAddServiceModalOpen(true)} className="mt-2">
              Thêm mặt hàng đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} className="border-border/80 hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">{service.name}</CardTitle>
                  <Badge
                    variant={service.isAvailable ? 'available' : 'default'}
                    className="text-[10px]"
                  >
                    {service.isAvailable ? 'Đang mở bán' : 'Tạm hết'}
                  </Badge>
                </div>
                <Badge variant="outline" className="w-fit text-[10px]">
                  {service.type === 'BEVERAGE'
                    ? 'Nước giải khát'
                    : service.type === 'EQUIPMENT'
                    ? 'Thuê thiết bị'
                    : 'Dịch vụ khác'}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="text-xl font-extrabold text-foreground">
                  {formatVND(service.price)}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <Button
                    size="sm"
                    variant={service.isAvailable ? 'outline' : 'default'}
                    onClick={() => onToggleServiceAvailable(service)}
                    className="text-xs h-8 px-2.5 font-bold"
                  >
                    <Power className="h-3.5 w-3.5 mr-1" />
                    {service.isAvailable ? 'Tạm ngưng bán' : 'Mở bán lại'}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteService(service.id)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                    title="Xóa dịch vụ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Thêm Dịch Vụ */}
      <Dialog open={addServiceModalOpen} onOpenChange={setAddServiceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm Dịch Vụ / Tiện Ích Mới</DialogTitle>
            <DialogDescription className="text-xs">
              Thêm nước uống hoặc thiết bị cho thuê tại cụm sân {selectedVenue?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onAddService} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Tên dịch vụ (ví dụ: Nước Pocari, Thuê áo bib)</label>
              <Input
                placeholder="Nước điện giải Pocari..."
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Loại dịch vụ</label>
              <select
                value={newServiceType}
                onChange={(e) => setNewServiceType(e.target.value as ServiceType)}
                className="w-full h-10 px-3 rounded-xl bg-card border border-border text-sm font-semibold"
              >
                <option value="BEVERAGE">Nước giải khát / Đồ uống</option>
                <option value="EQUIPMENT">Thuê trang thiết bị (bóng, vợt, áo bib)</option>
                <option value="OTHER">Dịch vụ khác (trọng tài, tủ đồ VIP)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Đơn giá (VND)</label>
              <Input
                type="number"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(Number(e.target.value))}
                min={1000}
                step={1000}
                required
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setAddServiceModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" loading={serviceActionLoading} className="font-bold">
                Thêm Dịch Vụ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
