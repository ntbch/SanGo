import React from 'react';
import { Activity, Clock, CheckCircle2, Swords } from 'lucide-react';

const LIVE_EVENTS = [
  {
    id: '1',
    user: 'Trần H.',
    action: 'vừa đặt cọc Sân Bóng Ngọc Khánh',
    timeSlot: '20:00 - 21:30',
    type: 'booking',
  },
  {
    id: '2',
    user: 'CLB Vợt Vàng',
    action: 'mở kèo ghép Pickleball 2v2',
    timeSlot: '18:30 hôm nay',
    type: 'match',
  },
  {
    id: '3',
    user: 'Sân Cầu Lông Ba Đình',
    action: 'vừa mở thêm 3 slot giờ vàng',
    timeSlot: '19:00 - 20:30',
    type: 'slot',
  },
  {
    id: '4',
    user: 'Lê Minh T.',
    action: 'vừa xác nhận vé Sân Tennis Hồ Tây',
    timeSlot: '07:00 ngày mai',
    type: 'booking',
  },
];

export function HomeLiveStream(): React.ReactElement {
  return (
    <div className="w-full rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-3 sm:p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold text-foreground">Hoạt động trực tiếp</span>
        </div>

        {/* Live Event Pills */}
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-2.5">
          {LIVE_EVENTS.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-1 rounded-xl bg-secondary/70 border border-border/40 text-[11px] whitespace-nowrap shrink-0"
            >
              {item.type === 'booking' && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
              {item.type === 'match' && <Swords className="h-3.5 w-3.5 text-amber-400" />}
              {item.type === 'slot' && <Clock className="h-3.5 w-3.5 text-blue-400" />}
              <span className="font-bold text-foreground">{item.user}</span>
              <span className="text-muted-foreground">{item.action}</span>
              <span className="font-mono-num font-semibold text-primary/90">({item.timeSlot})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
