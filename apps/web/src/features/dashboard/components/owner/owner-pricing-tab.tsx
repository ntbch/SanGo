import React from 'react';
import {
  type Court,
  type PricingRule,
  type DayType,
  type SportType,
} from '../../api/owner-api';
import { Card, CardHeader, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { formatVND, formatMinutesToTime } from '../../../../lib/utils';
import {
  BadgePercent,
  CheckCircle2,
  Plus,
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

interface OwnerPricingTabProps {
  courts: Court[];
  selectedCourtForPricing: Court | null;
  setSelectedCourtForPricing: (court: Court | null) => void;
  pricingDayType: DayType;
  setPricingDayType: (dayType: DayType) => void;
  pricingRules: PricingRule[];
  loadingPricingRules: boolean;
  ruleStartHour: string;
  setRuleStartHour: (hour: string) => void;
  ruleEndHour: string;
  setRuleEndHour: (hour: string) => void;
  rulePrice: number;
  setRulePrice: (price: number) => void;
  savingPricing: boolean;
  onAddPricingRule: () => void;
  onRemovePricingRule: (index: number) => void;
  onSaveAllPricingRules: () => void;
}

export function OwnerPricingTab({
  courts,
  selectedCourtForPricing,
  setSelectedCourtForPricing,
  pricingDayType,
  setPricingDayType,
  pricingRules,
  loadingPricingRules,
  ruleStartHour,
  setRuleStartHour,
  ruleEndHour,
  setRuleEndHour,
  rulePrice,
  setRulePrice,
  savingPricing,
  onAddPricingRule,
  onRemovePricingRule,
  onSaveAllPricingRules,
}: OwnerPricingTabProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <BadgePercent className="h-4 w-4 text-primary" /> Cấu Hình Bảng Giá Giờ Vàng / Cao Điểm
          </h3>
          <p className="text-xs text-muted-foreground">
            Thiết lập mức giá linh hoạt ghi đè theo khung giờ cho ngày thường (WEEKDAY) và cuối tuần (WEEKEND).
          </p>
        </div>

        {/* Select Court */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Chọn sân:</span>
          <select
            value={selectedCourtForPricing?.id || ''}
            onChange={(e) => {
              const target = courts.find((c) => c.id === e.target.value) || null;
              setSelectedCourtForPricing(target);
            }}
            className="h-9 px-3 rounded-xl bg-card border border-border/80 text-xs font-bold text-foreground"
          >
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({SPORT_TYPE_LABELS[c.sportType]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pricing Config Card */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={pricingDayType === 'WEEKDAY' ? 'default' : 'outline'}
                onClick={() => setPricingDayType('WEEKDAY')}
                className="rounded-xl text-xs font-bold"
              >
                Ngày Thường (T2 - T6)
              </Button>
              <Button
                size="sm"
                variant={pricingDayType === 'WEEKEND' ? 'default' : 'outline'}
                onClick={() => setPricingDayType('WEEKEND')}
                className="rounded-xl text-xs font-bold"
              >
                Cuối Tuần (T7 - CN)
              </Button>
            </div>

            <Button
              onClick={onSaveAllPricingRules}
              loading={savingPricing}
              className="rounded-xl font-bold shadow-xs text-xs"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Lưu Toàn Bộ Bảng Giá
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Form thêm khung giờ mới */}
          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Giờ bắt đầu</label>
              <Input
                type="time"
                value={ruleStartHour}
                onChange={(e) => setRuleStartHour(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Giờ kết thúc</label>
              <Input
                type="time"
                value={ruleEndHour}
                onChange={(e) => setRuleEndHour(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Giá slot giờ vàng (VND)</label>
              <Input
                type="number"
                value={rulePrice}
                onChange={(e) => setRulePrice(Number(e.target.value))}
                step={10000}
                className="h-9 text-xs"
              />
            </div>

            <Button type="button" onClick={onAddPricingRule} variant="secondary" className="h-9 text-xs font-bold rounded-xl shrink-0">
              <Plus className="h-3.5 w-3.5 mr-1" /> Thêm Khung Giờ
            </Button>
          </div>

          {/* Rules List for current DayType */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Các Khung Giờ Đã Cài Đặt Cho {pricingDayType === 'WEEKDAY' ? 'Ngày Thường' : 'Cuối Tuần'}
            </h4>

            {loadingPricingRules ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                <span>Đang nạp bảng giá sân...</span>
              </div>
            ) : pricingRules.filter((r) => r.dayType === pricingDayType).length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center bg-card rounded-xl border border-border/40">
                Chưa có khung giờ ghi đè nào. Giá mặc định {formatVND(selectedCourtForPricing?.defaultPricePerSlot || 0)} sẽ được áp dụng cho toàn bộ các slot trong ngày.
              </p>
            ) : (
              <div className="space-y-2">
                {pricingRules
                  .filter((r) => r.dayType === pricingDayType)
                  .map((r, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 text-xs hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="peak" className="font-semibold">
                          Giờ Vàng
                        </Badge>
                        <span className="font-bold text-foreground">
                          {formatMinutesToTime(r.startMinute)} - {formatMinutesToTime(r.endMinute)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-extrabold text-primary text-sm">
                          {formatVND(r.pricePerSlot)} / slot
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemovePricingRule(idx)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
