import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { X } from 'lucide-react';

interface TeamCreateModalProps {
  show: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (name: string) => void;
  sportType: string;
  onSportTypeChange: (sport: string) => void;
  teamCity: string;
  onTeamCityChange: (city: string) => void;
  description: string;
  onDescriptionChange: (desc: string) => void;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function TeamCreateModal({
  show,
  onClose,
  name,
  onNameChange,
  sportType,
  onSportTypeChange,
  teamCity,
  onTeamCityChange,
  description,
  onDescriptionChange,
  isSubmitting,
  error,
  onSubmit,
}: TeamCreateModalProps): React.ReactElement | null {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-black text-foreground">Tạo Đội Thể Thao Mới</CardTitle>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Tên Đội Thể Thao <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Ví dụ: SanGo United FC, Pickleball Ba Đình..."
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Bộ Môn</label>
                <select
                  value={sportType}
                  onChange={(e) => onSportTypeChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                >
                  <option value="FOOTBALL5">Bóng Đá Sân 5</option>
                  <option value="FOOTBALL7">Bóng Đá Sân 7</option>
                  <option value="PICKLEBALL">Pickleball</option>
                  <option value="BADMINTON">Cầu Lông</option>
                  <option value="TENNIS">Tennis</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Thành Phố</label>
                <select
                  value={teamCity}
                  onChange={(e) => onTeamCityChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                >
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">Mô Tả Đội</label>
              <Input
                placeholder="Khu vực hoạt động, lịch đá cố định..."
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
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
                className="font-bold text-xs shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo Đội Ngay'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
