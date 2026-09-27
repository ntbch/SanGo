import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { X } from 'lucide-react';

interface TournamentCreateModalProps {
  show: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (name: string) => void;
  sportType: string;
  onSportTypeChange: (sport: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
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
  description,
  onDescriptionChange,
  isSubmitting,
  onSubmit,
}: TournamentCreateModalProps): React.ReactElement | null {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between sticky top-0 bg-card z-10">
          <CardTitle className="text-base font-black text-foreground">Tạo Giải Đấu Thể Thao Mới</CardTitle>
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Tên Giải Đấu <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="VD: SanGo Summer Cup 2026..."
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                required
                minLength={3}
                maxLength={120}
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

            </div>

            <p className="text-xs text-muted-foreground">Giải loại trực tiếp, tối đa 8 đội. Cần ít nhất 5 đội để khởi tranh.</p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">Mô tả giải đấu</label>
              <Input value={description} onChange={(e) => onDescriptionChange(e.target.value)} maxLength={1000} className="h-10 text-xs" />
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
                {isSubmitting ? 'Đang tạo...' : 'Tạo Giải Ngay'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
