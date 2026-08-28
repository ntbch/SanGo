import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../../components/ui/card';
import { SportType } from '../../../lib/constants';
import { ArrowRight, Activity } from 'lucide-react';

const SPORTS_DATA = [
  {
    type: SportType.FOOTBALL5,
    name: 'Bóng Đá Sân 5 & 7',
    spec: 'Cỏ nhân tạo FIFA Quality • Đèn LED cao áp',
    courts: '140+ Cụm sân',
    price: 'Từ 250.000đ',
    unit: '/ slot 90p',
    image: '/mock-football.svg',
    popular: true,
  },
  {
    type: SportType.PICKLEBALL,
    name: 'Pickleball Trong Nhà & Mái Che',
    spec: 'Mặt sân Acrylic 8 lớp chống trượt • Lưới thi đấu',
    courts: '60+ Cụm sân',
    price: 'Từ 120.000đ',
    unit: '/ giờ',
    image: '/mock-pickleball.svg',
    popular: true,
  },
  {
    type: SportType.BADMINTON,
    name: 'Cầu Lông Phong Trào & Bán Chuyên',
    spec: 'Thảm PVC chuẩn BWF • Ánh sáng chống chói mắt',
    courts: '95+ Cụm sân',
    price: 'Từ 80.000đ',
    unit: '/ giờ',
    image: '/mock-badminton.svg',
    popular: false,
  },
  {
    type: SportType.TENNIS,
    name: 'Tennis Sân Cứng Chuẩn ITF',
    spec: 'Hệ thống mặt sân sơn chuẩn quốc tế • Đầy đủ tiện ích',
    courts: '40+ Cụm sân',
    price: 'Từ 180.000đ',
    unit: '/ giờ',
    image: '/mock-tennis.svg',
    popular: false,
  },
];

export function HomeSportsCards(): React.ReactElement {
  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
            <Activity className="h-3.5 w-3.5" />
            <span>Danh mục thi đấu</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground mt-0.5">
            Khám Phá Theo Môn Thể Thao
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lọc nhanh các cụm sân chất lượng cao tại Hà Nội & TP. Hồ Chí Minh với mặt sân và khung giờ phù hợp.
          </p>
        </div>
        <Link
          to="/venues"
          className="text-xs font-bold text-primary hover:text-emerald-400 flex items-center gap-1 group transition-colors"
        >
          <span>Xem tất cả sân</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Sports Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SPORTS_DATA.map((sport) => (
          <Link key={sport.type} to={`/venues?sportType=${sport.type}`} className="group block">
            <Card className="overflow-hidden rounded-2xl border border-border/80 bg-card hover:border-primary/60 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between h-full">
              <div>
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
                      <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-mono-num font-bold shadow-xs">
                        Hot Trend
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                    <span className="text-xs font-mono-num font-semibold text-zinc-200">
                      {sport.courts}
                    </span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs transition-transform group-hover:translate-x-1 group-hover:bg-primary group-hover:text-primary-foreground">
                      <ArrowRight className="h-3.5 w-3.5 text-white" />
                    </span>
                  </div>
                </div>

                <CardContent className="p-4 space-y-1.5">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {sport.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {sport.spec}
                  </p>
                </CardContent>
              </div>

              <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-border/50">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Mức giá
                </span>
                <span className="text-xs font-mono-num font-bold text-primary">
                  {sport.price}{' '}
                  <span className="text-[10px] text-muted-foreground font-normal">{sport.unit}</span>
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
