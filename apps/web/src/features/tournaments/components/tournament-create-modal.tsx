import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

interface TournamentCreateModalProps {
  show: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (name: string) => void;
  sportType: string;
  onSportTypeChange: (sport: string) => void;
  city: string;
  onCityChange: (city: string) => void;
  maxTeams: string;
  onMaxTeamsChange: (max: string) => void;
  prizePool: string;
  onPrizePoolChange: (prize: string) => void;
  entryFee: string;
  onEntryFeeChange: (fee: string) => void;
  registrationDeadline: string;
  onRegistrationDeadlineChange: (date: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  rules: string;
  onRulesChange: (rules: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function TournamentCreateModal({
  show,
  onClose,
  name,
  onNameChange,
  sportType,
  onSportTypeChange,
  city,
  onCityChange,
  maxTeams,
  onMaxTeamsChange,
  prizePool,
  onPrizePoolChange,
  entryFee,
  onEntryFeeChange,
  registrationDeadline,
  onRegistrationDeadlineChange,
  startDate,
  onStartDateChange,
  rules,
  onRulesChange,
  isSubmitting,
  onSubmit,
}: TournamentCreateModalProps): React.ReactElement | null {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between sticky top-0 bg-card z-10">
          <CardTitle className="text-base font-black text-foreground">Tạo Giải Đấu Thể Thao Mới</CardTitle>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Tên Giải Đấu <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="VD: SanGo Summer Cup 2026..."
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Bộ Môn</label>
                <select
                  value={sportType}
                  onChange={(e) => onSportTypeChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                >
                  <option value="FOOTBALL7">Bóng Đá Sân 7</option>
                  <option value="FOOTBALL5">Bóng Đá Sân 5</option>
                  <option value="PICKLEBALL">Pickleball</option>
                  <option value="BADMINTON">Cầu Lông</option>
                  <option value="TENNIS">Tennis</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Thành Phố</label>
                <select
                  value={city}
                  onChange={(e) => onCityChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                >
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Quy Mô Số Đội</label>
                <select
                  value={maxTeams}
                  onChange={(e) => onMaxTeamsChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                >
                  <option value="4">4 Đội (Bán Kết + Chung Kết)</option>
                  <option value="8">8 Đội (Tứ Kết đến Chung Kết)</option>
                  <option value="16">16 Đội (Vòng 1/8 đến Chung Kết)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Lệ Phí Đội (VND)</label>
                <Input
                  type="number"
                  value={entryFee}
                  onChange={(e) => onEntryFeeChange(e.target.value)}
                  className="h-10 text-xs font-mono-num"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Tổng Giải Thưởng (VND)</label>
                <Input
                  type="number"
                  value={prizePool}
                  onChange={(e) => onPrizePoolChange(e.target.value)}
                  className="h-10 text-xs font-mono-num"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Hạn Chót Đăng Ký</label>
                <Input
                  type="date"
                  value={registrationDeadline}
                  onChange={(e) => onRegistrationDeadlineChange(e.target.value)}
                  className="h-10 text-xs font-mono-num"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">Ngày Khai Mạc</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="h-10 text-xs font-mono-num"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">Thể Thức &amp; Điều Lệ</label>
              <Input
                value={rules}
                onChange={(e) => onRulesChange(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs font-bold cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                size="sm"
                className="font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo Giải Ngay'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
