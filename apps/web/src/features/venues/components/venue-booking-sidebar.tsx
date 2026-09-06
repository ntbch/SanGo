import React from 'react';
import { VenueItem } from '../api/venues-api';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatVND, formatMinutesToTime } from '../../../lib/utils';
import { Clock, ShieldCheck, Coins, ArrowRight, RotateCcw, CalendarCheck } from 'lucide-react';
import { useAuthStore } from '../../../lib/auth-store';
import { AuthModal } from '../../../components/auth/auth-modal';

export interface VenueBookingSidebarProps {
  venue: VenueItem;
}

export function VenueBookingSidebar({ venue }: VenueBookingSidebarProps): React.ReactElement {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  const priceFrom = venue.priceFrom ?? (venue.courts?.[0]?.defaultPricePerSlot || 250000);
  const priceTo = venue.priceTo ?? priceFrom;
  const bookingUrl = `/venues/${venue.slug || venue.id}/book`;

  const handleBookingClick = () => {
    const bookingEl = document.getElementById('booking');
    if (bookingEl) {
      bookingEl.scrollIntoView?.({ behavior: 'smooth' });
      if (!user) {
        setShowAuthModal(true);
      }
      return;
    }
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    navigate(bookingUrl);
  };

  return (
    <>
      <div className="sticky top-20 space-y-4">
        <Card className="border border-border/80 bg-card p-5 space-y-4 shadow-md">
          <div className="space-y-1 pb-3 border-b border-border/60">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Bảng Giá Thuê Sân
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-mono-num font-black text-primary">
                {formatVND(priceFrom)}
              </span>
              {priceTo > priceFrom && (
                <span className="text-xs font-mono-num text-muted-foreground font-semibold">
                  - {formatVND(priceTo)}
                </span>
              )}
              <span className="text-xs text-muted-foreground"> / slot</span>
            </div>
          </div>

          {/* Core Guarantees */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>
                Giữ chỗ <strong className="text-foreground">10:00 phút</strong> chống double-booking
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Coins className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Đặt cọc <strong className="text-foreground">{venue.depositPercent}%</strong> giá trị đơn
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground">
              <RotateCcw className="h-4 w-4 text-primary shrink-0" />
              <span>
                Hoàn <strong className="text-foreground">100% cọc</strong> khi hủy trước 12-24 giờ
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
              <span>
                Mở cửa: <strong className="text-foreground font-mono-num">{formatMinutesToTime(venue.openMinute ?? 360)} - {formatMinutesToTime(venue.closeMinute ?? 1380)}</strong>
              </span>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="pt-2">
            <Button
              size="lg"
              onClick={handleBookingClick}
              className="w-full font-bold gap-2 shadow-lg cursor-pointer"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>Xem Lịch & Đặt Sân Ngay</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-[11px] text-center text-muted-foreground">
            Thanh toán an toàn qua Ví SanGo hoặc Cổng VNPAY QR
          </p>
        </Card>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => navigate(bookingUrl)}
        title="Đăng Nhập Để Xem Lịch & Đặt Sân"
        subtitle={`đăng nhập tài khoản để chọn khung giờ và đặt sân tại "${venue.name}".`}
      />
    </>
  );
}
