import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Trophy, Calendar, ArrowRight } from 'lucide-react';

const TOURNAMENTS = [
  {
    id: 't-1',
    title: 'Giải Pickleball Mùa Thu SanGo Open 2026',
    sport: 'Pickleball',
    prizePool: '25.000.000 VNĐ',
    teamsCount: '32 Đôi nam nữ',
    registrationDeadline: '15/09/2026',
    venue: 'Cụm Sân Pickleball Cầu Giấy',
    status: 'Đang mở đăng ký',
  },
  {
    id: 't-2',
    title: 'Cúp Bóng Đá Doanh Nghiệp Hà Nội League',
    sport: 'Bóng đá sân 7',
    prizePool: '50.000.000 VNĐ',
    teamsCount: '16 Đội bóng',
    registrationDeadline: '20/09/2026',
    venue: 'Sân Vận Động Ngọc Khánh',
    status: 'Còn 4 suất',
  },
];

export function HomeTournamentsSpotlight(): React.ReactElement {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
            <Trophy className="h-3.5 w-3.5 fill-amber-500" />
            <span>Sự Kiện & Giải Đấu</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Giải Đấu Thể Thao Đang Mở Đăng Ký
          </h2>
        </div>
        <Link to="/tournaments" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
          <span>Xem tất cả giải đấu</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOURNAMENTS.map((t) => (
          <Card key={t.id} className="border border-border bg-card p-5 space-y-4 hover:border-amber-500/40 transition-all shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/20">
                  {t.status}
                </span>
                <h3 className="text-base font-bold text-foreground">{t.title}</h3>
                <p className="text-xs text-muted-foreground">{t.venue}</p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Trophy className="h-5 w-5" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl bg-card border border-border/50 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">Tổng giải thưởng</span>
                <span className="font-mono-num font-bold text-primary text-xs sm:text-sm">{t.prizePool}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Quy mô</span>
                <span className="font-semibold text-foreground">{t.teamsCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Hạn đăng ký</span>
                <span className="font-mono-num text-muted-foreground">{t.registrationDeadline}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Bốc thăm & Khai mạc cuối tuần này</span>
              </span>
              <Link to="/tournaments">
                <Button size="sm" className="font-bold text-xs">
                  Đăng ký đội
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
