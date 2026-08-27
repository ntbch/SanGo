import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Swords, Clock, MapPin, Users, ArrowRight } from 'lucide-react';

const OPEN_MATCHES = [
  {
    id: 'm-1',
    title: 'Kèo Pickleball 2v2 Nam Nữ',
    sport: 'Pickleball',
    venue: 'Sân Pickleball Ngọc Khánh',
    district: 'Ba Đình, Hà Nội',
    time: '18:30 - 20:30 Hôm nay',
    level: 'Phong trào',
    missingPlayers: 2,
    host: 'Tuấn Vũ',
    feePerPerson: '45.000đ',
  },
  {
    id: 'm-2',
    title: 'Giao hữu Bóng đá Sân 7',
    sport: 'Bóng đá 7',
    venue: 'Sân Bóng Thành Đồng',
    district: 'Cầu Giấy, Hà Nội',
    time: '20:00 - 21:30 Tối mai',
    level: 'Bán chuyên',
    missingPlayers: 3,
    host: 'FC Brothers',
    feePerPerson: '50.000đ',
  },
  {
    id: 'm-3',
    title: 'Đánh Đôi Cầu Lông Buổi Sáng',
    sport: 'Cầu lông',
    venue: 'Sân Cầu Lông Đống Đa',
    district: 'Đống Đa, Hà Nội',
    time: '06:30 - 08:00 Thứ 7',
    level: 'Khá / Tốt',
    missingPlayers: 1,
    host: 'Minh Anh',
    feePerPerson: '35.000đ',
  },
];

export function HomeMatchesFeed(): React.ReactElement {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <Swords className="h-3.5 w-3.5" />
            <span>Ghép Trận Tự Do</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Kèo Ghép Đang Tìm Đối Thủ
          </h2>
        </div>
        <Link to="/matches" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
          <span>Xem tất cả kèo</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OPEN_MATCHES.map((match) => (
          <Card key={match.id} className="border border-border/80 bg-card hover:border-primary/50 transition-all p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-secondary text-[11px] font-bold text-foreground">
                  {match.sport}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[11px] font-bold border border-amber-500/20">
                  Thiếu {match.missingPlayers} người
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground line-clamp-1">{match.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span>{match.venue} ({match.district})</span>
                </p>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground pt-1 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono-num">{match.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Trình độ: <strong className="text-foreground">{match.level}</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block">Chi phí / người</span>
                <span className="font-mono-num font-bold text-xs text-primary">{match.feePerPerson}</span>
              </div>
              <Link to={`/matches`}>
                <Button size="sm" variant="default" className="text-xs font-bold h-8">
                  Tham gia kèo
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
