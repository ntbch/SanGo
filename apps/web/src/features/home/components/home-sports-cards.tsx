import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../../components/ui/card';
import { SportType } from '../../../lib/constants';
import { ArrowRight } from 'lucide-react';

const SPORTS_DATA = [
  {
    type: SportType.FOOTBALL5,
    name: 'Bóng Đá Sân 5 & 7',
    spec: 'Cỏ nhân tạo tiêu chuẩn, đèn LED cao áp',
    courts: '140+ Cụm sân',
    price: 'Từ 250.000đ',
    unit: '/ slot 90p',
    image: '/mock-football.svg',
    popular: true,
  },
  {
    type: SportType.PICKLEBALL,
    name: 'Pickleball Trong Nhà & Mái Che',
    spec: 'Mặt sân Acrylic chống trượt, lưới thi đấu',
    courts: '60+ Cụm sân',
    price: 'Từ 120.000đ',
    unit: '/ giờ',
    image: '/mock-pickleball.svg',
    popular: true,
  },
  {
    type: SportType.BADMINTON,
    name: 'Cầu Lông',
    spec: 'Thảm PVC tiêu chuẩn, ánh sáng chống chói',
    courts: '95+ Cụm sân',
    price: 'Từ 80.000đ',
    unit: '/ giờ',
    image: '/mock-badminton.svg',
    popular: false,
  },
  {
    type: SportType.TENNIS,
    name: 'Tennis Sân Cứng',
    spec: 'Mặt sân tiêu chuẩn quốc tế, đầy đủ tiện ích',
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
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Khám phá theo môn thể thao
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lọc nhanh các cụm sân chất lượng cao tại Hà Nội và TP. Hồ Chí Minh theo môn thi đấu.
          </p>
        </div>
        <Link
          to="/venues"
          className="text-xs font-semibold text-foreground hover:text-primary flex items-center gap-1 group transition-colors"
        >
          <span>Xem tất cả sân</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Sports Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SPORTS_DATA.map((sport) => (
          <Link key={sport.type} to={`/venues?sportType=${sport.type}`} className="group block">
            <Card className="overflow-hidden rounded-2xl border border-border bg-card hover:shadow-md transition-shadow flex flex-col justify-between h-full">
              <div>
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  <img
                    src={sport.image}
                    alt={sport.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-black/40" />

                  {sport.popular && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-mono-num font-bold shadow-xs">
                        Phổ biến
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                    <span className="text-xs font-mono-num font-semibold text-zinc-100">
                      {sport.courts}
                    </span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <ArrowRight className="h-3.5 w-3.5" />
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

              <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-border">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Mức giá
                </span>
                <span className="text-xs font-mono-num font-bold text-foreground">
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
