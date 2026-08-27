import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../../components/ui/card';
import { SportType } from '../../../lib/constants';
import { ArrowRight } from 'lucide-react';

const SPORTS_DATA = [
  {
    type: SportType.FOOTBALL5,
    name: 'Bóng Đá Sân 5 & 7',
    courts: '140+ Cụm sân',
    price: 'Từ 250.000đ / giờ',
    image:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    popular: true,
  },
  {
    type: SportType.PICKLEBALL,
    name: 'Pickleball',
    courts: '60+ Cụm sân',
    price: 'Từ 120.000đ / giờ',
    image:
      'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=800&q=80',
    popular: true,
  },
  {
    type: SportType.BADMINTON,
    name: 'Cầu Lông',
    courts: '95+ Cụm sân',
    price: 'Từ 80.000đ / giờ',
    image:
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    popular: false,
  },
  {
    type: SportType.TENNIS,
    name: 'Tennis',
    courts: '40+ Cụm sân',
    price: 'Từ 180.000đ / giờ',
    image:
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
    popular: false,
  },
];

export function HomeSportsCards(): React.ReactElement {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Khám Phá Theo Môn Thể Thao
          </h2>
          <p className="text-xs text-muted-foreground">
            Lựa chọn môn thể thao yêu thích và tìm kiếm sân trống gần bạn.
          </p>
        </div>
        <Link to="/venues" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
          <span>Xem tất cả sân</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SPORTS_DATA.map((sport) => (
          <Link key={sport.type} to={`/venues?sportType=${sport.type}`} className="group block">
            <Card className="overflow-hidden border border-border/80 bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                <img
                  src={sport.image}
                  alt={sport.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {sport.popular && (
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold shadow-xs">
                      Phổ biến
                    </span>
                  </div>
                )}

                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                  <span className="text-xs font-semibold text-zinc-300">{sport.courts}</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs transition-transform group-hover:translate-x-1">
                    <ArrowRight className="h-3.5 w-3.5 text-white" />
                  </span>
                </div>
              </div>

              <CardContent className="p-4 space-y-1">
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {sport.name}
                </h3>
                <p className="text-xs text-muted-foreground font-mono-num font-medium">
                  {sport.price}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
