import React from 'react';
import { CourtItem } from '../api/venues-api';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SPORT_LABELS, SportType } from '../../../lib/constants';
import { formatVND } from '../../../lib/utils';
import { Grid, Clock, ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useAuthStore } from '../../../lib/auth-store';
import { AuthModal } from '../../../components/auth/auth-modal';

export interface VenueCourtsListProps {
  courts?: CourtItem[];
  venueSlugOrId: string;
}

export function VenueCourtsList({ courts = [], venueSlugOrId }: VenueCourtsListProps): React.ReactElement {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = React.useState<string>('');
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [targetCourtId, setTargetCourtId] = React.useState<string | null>(null);

  // Lấy danh sách các môn thể thao duy nhất có trong cụm sân
  const uniqueSports = Array.from(new Set(courts.map((c) => c.sportType)));

  const filteredCourts = selectedSport
    ? courts.filter((c) => c.sportType === selectedSport)
    : courts;

  const handleSelectCourt = (courtId: string) => {
    const url = `/venues/${venueSlugOrId}/book?courtId=${courtId}`;
    if (!user) {
      setTargetCourtId(courtId);
      setShowAuthModal(true);
      return;
    }
    navigate(url);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Grid className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Danh Sách Sân Con ({courts.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Chọn sân để xem bảng giờ và tiến hành giữ chỗ
              </p>
            </div>
          </div>

          {/* Sport Filter Pills */}
          {uniqueSports.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedSport('')}
                className={cn(
                  'px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                  !selectedSport
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-secondary text-muted-foreground hover:text-foreground',
                )}
              >
                Tất cả ({courts.length})
              </button>
              {uniqueSports.map((s) => {
                const count = courts.filter((c) => c.sportType === s).length;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSport(s)}
                    className={cn(
                      'px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                      selectedSport === s
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {SPORT_LABELS[s as SportType] || s} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {filteredCourts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredCourts.map((court) => (
              <Card
                key={court.id}
                className="p-4 border border-border/80 bg-card hover:border-primary/50 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-secondary text-[11px] font-bold text-foreground border border-border/40">
                      {SPORT_LABELS[court.sportType] || court.sportType}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono-num">
                      <Clock className="h-3 w-3 text-primary" />
                      <span>{court.slotMinutes || 60} phút / slot</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-foreground">{court.name}</h3>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Giá niêm yết</span>
                    <span className="font-mono-num font-extrabold text-sm text-primary">
                      {formatVND(court.defaultPricePerSlot)}
                      <span className="text-[10px] font-normal text-muted-foreground"> / slot</span>
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleSelectCourt(court.id)}
                    className="h-8 text-xs font-bold gap-1 px-3 shadow-xs cursor-pointer"
                  >
                    <span>Chọn lịch đặt</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-border/60 bg-card/40 text-xs text-muted-foreground">
            Không có sân con nào thuộc môn này.
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setTargetCourtId(null);
        }}
        onSuccess={() => {
          if (targetCourtId) {
            navigate(`/venues/${venueSlugOrId}/book?courtId=${targetCourtId}`);
          }
        }}
        title="Đăng Nhập Để Chọn Lịch Đặt Sân"
        subtitle="Vui lòng đăng nhập tài khoản để xem chi tiết lịch thi đấu và đặt sân."
      />
    </>
  );
}
