import React from 'react';
import { DaySlotItem } from '../api/booking-api';
import { formatMinutesToTime, formatVND, cn } from '../../../lib/utils';
import {
  Check,
  Lock,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Flame,
  LayoutGrid,
  AlignLeft,
} from 'lucide-react';
import { Card } from '../../../components/ui/card';

export interface SelectedSlot {
  date: string;
  startMinute: number;
  endMinute: number;
  price: number;
  courtId?: string;
  courtName?: string;
}

export interface CourtWithSlots {
  courtId: string;
  courtName: string;
  sportType: string;
  slots: DaySlotItem[];
  defaultPrice: number;
}

export interface SlotMatrixProps {
  date: string; // YYYY-MM-DD
  slots: DaySlotItem[];
  defaultPrice: number;
  selectedSlot: SelectedSlot | null;
  onSelectSlot: (slot: SelectedSlot | null) => void;
  isLoading?: boolean;
  courtName?: string;
  allCourts?: CourtWithSlots[];
}

export function SlotMatrix({
  date,
  slots,
  defaultPrice,
  selectedSlot,
  onSelectSlot,
  isLoading = false,
  courtName = 'Sân con',
  allCourts,
}: SlotMatrixProps): React.ReactElement {
  const [activeShiftFilter, setActiveShiftFilter] = React.useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING'>('ALL');
  const [viewMode, setViewMode] = React.useState<'PODS' | 'TIMELINE'>('PODS');

  // Phân loại ca:
  // Sáng: 06:00 -> 12:00 (360 -> 720)
  // Chiều: 12:00 -> 17:00 (720 -> 1020)
  // Tối / Giờ vàng: 17:00 -> 23:00 (1020 -> 1380)
  const morningSlots = slots.filter((s) => s.startMinute < 720);
  const afternoonSlots = slots.filter((s) => s.startMinute >= 720 && s.startMinute < 1020);
  const eveningSlots = slots.filter((s) => s.startMinute >= 1020);

  // Nhận diện Giờ Vàng (Peak hours: 17:00 - 21:00 tương ứng 1020 - 1260)
  const isPeakHour = (startMinute: number) => startMinute >= 1020 && startMinute < 1260;

  const renderSlotCard = (slot: DaySlotItem, cName = courtName, cPrice = defaultPrice, cId?: string) => {
    const isSelected =
      selectedSlot?.date === date &&
      selectedSlot?.startMinute === slot.startMinute &&
      selectedSlot?.endMinute === slot.endMinute &&
      (!cId || selectedSlot?.courtId === cId || !selectedSlot?.courtId);

    const isAvailable = slot.state === 'AVAILABLE';
    const isBooked = slot.state === 'BOOKED';
    const isHeld = slot.state === 'HELD';
    const isMaintenance = slot.state === 'MAINTENANCE';
    const isPeak = isPeakHour(slot.startMinute);

    const timeLabel = `${formatMinutesToTime(slot.startMinute)} - ${formatMinutesToTime(slot.endMinute)}`;

    return (
      <button
        key={`${cId || 'c'}-${slot.startMinute}-${slot.endMinute}`}
        type="button"
        disabled={!isAvailable}
        onClick={() => {
          if (isSelected) {
            onSelectSlot(null);
          } else {
            onSelectSlot({
              date,
              startMinute: slot.startMinute,
              endMinute: slot.endMinute,
              price: cPrice,
              courtId: cId,
              courtName: cName,
            });
          }
        }}
        className={cn(
          'relative p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer group min-h-[92px]',
          // Trạng thái Đang Chọn
          isSelected &&
            'bg-primary text-primary-foreground border-primary shadow-xl shadow-emerald-500/25 ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02] z-10',
          // Trạng thái Giờ Vàng (Trống)
          isAvailable &&
            !isSelected &&
            isPeak &&
            'bg-card border-amber-400/40 hover:border-amber-400 hover:bg-amber-500/5 hover:shadow-md text-foreground',
          // Trạng thái Giờ Thường (Trống)
          isAvailable &&
            !isSelected &&
            !isPeak &&
            'bg-card border-border/80 hover:border-primary/60 hover:bg-secondary/40 hover:shadow-sm text-foreground',
          // Trạng thái Đã Đặt
          isBooked &&
            'bg-muted/30 border-border/40 text-muted-foreground/40 cursor-not-allowed opacity-60 line-through',
          // Trạng thái Đang Giữ Chỗ 10p
          isHeld &&
            'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 cursor-not-allowed opacity-80',
          // Trạng thái Bảo Trì
          isMaintenance &&
            'bg-rose-500/10 border-rose-500/20 text-rose-400 cursor-not-allowed opacity-60',
        )}
      >
        {/* Top Time and Status Badge */}
        <div className="flex items-center justify-between gap-1 w-full">
          <span className="font-mono-num font-extrabold text-xs sm:text-sm tracking-tight">
            {timeLabel}
          </span>
          {isSelected && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </div>
          )}
          {isHeld && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
              <Lock className="h-3 w-3 shrink-0" />
            </div>
          )}
          {isAvailable && !isSelected && isPeak && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 text-[9px] font-extrabold uppercase border border-amber-500/25">
              <Flame className="h-2.5 w-2.5" />
              <span>Vàng</span>
            </span>
          )}
        </div>

        {/* Bottom Price & Subtitle */}
        <div className="mt-2.5 flex items-baseline justify-between w-full">
          <span
            className={cn(
              'text-[10px] font-semibold',
              isSelected
                ? 'text-primary-foreground/80'
                : isPeak
                ? 'text-amber-500 dark:text-amber-400'
                : 'text-muted-foreground',
            )}
          >
            {isBooked
              ? 'Đã kín lịch'
              : isHeld
              ? 'Đang khóa 10p'
              : isMaintenance
              ? 'Bảo trì'
              : isPeak
              ? 'Giờ Vàng'
              : 'Trống'}
          </span>

          {isAvailable && (
            <span
              className={cn(
                'font-mono-num font-extrabold text-xs sm:text-sm',
                isSelected
                  ? 'text-white'
                  : isPeak
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-primary',
              )}
            >
              {formatVND(cPrice)}
            </span>
          )}
        </div>
      </button>
    );
  };

  const renderSection = (title: string, icon: React.ReactNode, sectionSlots: DaySlotItem[], desc: string) => {
    if (sectionSlots.length === 0) return null;

    return (
      <Card className="p-4 sm:p-5 border border-border/80 bg-card/60 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">{title}</h3>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
            </div>
          </div>
          <span className="text-[11px] font-mono-num font-semibold text-muted-foreground">
            {sectionSlots.filter((s) => s.state === 'AVAILABLE').length}/{sectionSlots.length} slot trống
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {sectionSlots.map((s) => renderSlotCard(s))}
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground">Đang cập nhật ma trận slot thời gian thực...</p>
      </div>
    );
  }

  if (slots.length === 0 && (!allCourts || allCourts.length === 0)) {
    return (
      <div className="py-16 text-center rounded-3xl border border-border/80 bg-card p-6 text-xs text-muted-foreground">
        Không tìm thấy khung giờ nào khả dụng trong ngày đã chọn.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Filter & View Mode Controls Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary/30 border border-border/60 p-2.5 rounded-2xl">
        {/* Quick Shift Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveShiftFilter('ALL')}
            className={cn(
              'px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0',
              activeShiftFilter === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
            )}
          >
            Tất cả ({slots.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveShiftFilter('MORNING')}
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0',
              activeShiftFilter === 'MORNING'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
            )}
          >
            <Sun className="h-3 w-3 text-amber-500" />
            <span>Sáng ({morningSlots.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveShiftFilter('AFTERNOON')}
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0',
              activeShiftFilter === 'AFTERNOON'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
            )}
          >
            <Sunset className="h-3 w-3 text-orange-500" />
            <span>Chiều ({afternoonSlots.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveShiftFilter('EVENING')}
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0',
              activeShiftFilter === 'EVENING'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
            )}
          >
            <Moon className="h-3 w-3 text-indigo-400" />
            <span>Tối - Giờ Vàng ({eveningSlots.length})</span>
          </button>
        </div>

        {/* View Switcher (Pods vs Timeline) */}
        {allCourts && allCourts.length > 1 && (
          <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => setViewMode('PODS')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                viewMode === 'PODS'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Lưới theo ca</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TIMELINE')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                viewMode === 'TIMELINE'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <AlignLeft className="h-3.5 w-3.5" />
              <span>Toàn cảnh cụm</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. Pods Mode (Default) */}
      {viewMode === 'PODS' && (
        <div className="space-y-4">
          {(activeShiftFilter === 'ALL' || activeShiftFilter === 'MORNING') &&
            renderSection('Ca Sáng (06:00 - 12:00)', <Sun className="h-4 w-4 text-amber-500" />, morningSlots, 'Khung giờ thoáng mát, giá tiết kiệm')}

          {(activeShiftFilter === 'ALL' || activeShiftFilter === 'AFTERNOON') &&
            renderSection('Ca Chiều (12:00 - 17:00)', <Sunset className="h-4 w-4 text-orange-500" />, afternoonSlots, 'Khung giờ giao lưu, thi đấu')}

          {(activeShiftFilter === 'ALL' || activeShiftFilter === 'EVENING') &&
            renderSection('Ca Tối & Giờ Vàng (17:00 - 23:00)', <Moon className="h-4 w-4 text-indigo-400" />, eveningSlots, 'Khung giờ cao điểm có đèn LED chiếu sáng')}
        </div>
      )}

      {/* 2. Timeline Multi-Court Mode */}
      {viewMode === 'TIMELINE' && allCourts && (
        <Card className="p-4 sm:p-5 border border-border/80 bg-card overflow-x-auto no-scrollbar space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div>
              <h3 className="text-sm font-bold text-foreground">Bản Đồ Slot Toàn Bộ Cụm Sân</h3>
              <p className="text-[11px] text-muted-foreground">So sánh và chọn slot trực tiếp giữa các sân con</p>
            </div>
          </div>

          <div className="min-w-[700px] space-y-4">
            {allCourts.map((c) => (
              <div key={c.courtId} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>{c.courtName} ({c.sportType})</span>
                  <span className="font-mono-num text-primary font-extrabold">{formatVND(c.defaultPrice)}/slot</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {c.slots.map((s) => renderSlotCard(s, c.courtName, c.defaultPrice, c.courtId))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Legend & Guarantees Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-md bg-card border border-border/80" />
            <span>Trống</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-md bg-card border border-amber-400" />
            <span className="text-amber-500 font-bold">Giờ Vàng (17h-21h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-md bg-primary border border-primary" />
            <span className="font-bold text-foreground">Đang chọn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-md bg-amber-500/20 border border-amber-500/40" />
            <span>Khóa 10p</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-md bg-muted/40 border border-border/40" />
            <span>Đã đặt</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-primary font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Tự động cập nhật thời gian thực</span>
        </div>
      </div>
    </div>
  );
}
