import React from 'react';
import { Card } from '../../../components/ui/card';
import { Link } from 'react-router-dom';
import { QrCode, Calendar, Sparkles, Wallet, ArrowRight } from 'lucide-react';

import { User } from '../../../lib/auth-store';

interface ProfileOverviewTabProps {
  user: User;
  avatarUrl: string;
  phone: string;
}

export function ProfileOverviewTab({
  user,
  avatarUrl,
  phone,
}: ProfileOverviewTabProps): React.ReactElement {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <Card className="relative overflow-hidden border border-border bg-card p-6 sm:p-8 shadow-sm rounded-3xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border/60">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-mono-num font-black text-2xl border border-primary/30 overflow-hidden">
              {user.avatarUrl || avatarUrl ? (
                <img src={user.avatarUrl || avatarUrl || ''} alt={user.fullName} className="h-full w-full object-cover" />
              ) : (
                user.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">
                SanGo Athlete Passport
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">{user.fullName}</h2>
              <p className="text-xs text-muted-foreground font-mono-num">{user.email} · {phone || '0987654321'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 border border-border/80 text-foreground">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-6 text-center">
          <div className="p-3 rounded-2xl bg-secondary/40 border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Uy Tín</span>
            <span className="font-mono-num font-black text-base sm:text-lg text-primary">100%</span>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/40 border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Số Trận Đã Đấu</span>
            <span className="font-mono-num font-black text-base sm:text-lg text-foreground">12 Trận</span>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/40 border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Đội Bóng</span>
            <span className="font-mono-num font-black text-base sm:text-lg text-foreground">2 CLB</span>
          </div>
        </div>
      </Card>

      {/* Quick Actions Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/venues" className="block">
          <Card className="p-4 border border-border/80 bg-card hover:border-primary/60 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Đặt Sân Mới</p>
                  <p className="text-[10px] text-muted-foreground">Chọn lịch 7 ngày</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>
        </Link>

        <Link to="/matches" className="block">
          <Card className="p-4 border border-border/80 bg-card hover:border-primary/60 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Ghép Kèo Tự Do</p>
                  <p className="text-[10px] text-muted-foreground">Tìm đối thủ giao hữu</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>
        </Link>

        <Link to="/wallet" className="block">
          <Card className="p-4 border border-border/80 bg-card hover:border-primary/60 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Ví Tiền SanGo</p>
                  <p className="text-[10px] text-muted-foreground">Nạp cọc giữ sân</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
