import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Link } from 'react-router-dom';
import { UserPlus, Calendar } from 'lucide-react';
import { Team, ExpenseShare, TreasuryOverview } from '../api/teams-api';
import { formatVND } from '../../../lib/utils';

interface TeamHeroHeaderProps {
  team: Team;
  isCaptain: boolean;
  expenses: ExpenseShare[];
  treasury: TreasuryOverview | null;
  onOpenInviteModal: () => void;
}

export function TeamHeroHeader({
  team,
  isCaptain,
  expenses,
  treasury,
  onOpenInviteModal,
}: TeamHeroHeaderProps): React.ReactElement {
  return (
    <Card className="relative overflow-hidden border border-border bg-card p-6 sm:p-8 shadow-sm rounded-3xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border/60">
        <div className="flex items-center gap-4">
          <div className="h-18 w-18 rounded-3xl bg-primary/20 text-primary flex items-center justify-center font-black text-3xl border-2 border-primary/40 shadow-md">
            {team.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase border border-primary/20">
                {team.sportType}
              </span>
              {isCaptain && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[9px] font-black uppercase">
                  Bạn là Đội Trưởng
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{team.name}</h1>
            <p className="text-xs text-muted-foreground">
              Đội trưởng: <strong>{team.captain?.fullName || 'Trần Đức'}</strong> · {team.members?.length || 1} Thành viên
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onOpenInviteModal}
            size="sm"
            className="text-xs font-bold gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Mời Cầu Thủ</span>
          </Button>
          <Link to="/venues">
            <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 cursor-pointer">
              <Calendar className="h-4 w-4" />
              <span>Đặt Sân Ngay</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Quick Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-center">
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Thành Viên</span>
          <span className="font-mono-num font-black text-base text-foreground">{team.members?.length || 1} Người</span>
        </div>
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Quỹ Khả Dụng</span>
          <span className="font-mono-num font-black text-base text-primary">
            {formatVND(treasury?.balance || 0)}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Khoản Chia Tiền</span>
          <span className="font-mono-num font-black text-base text-foreground">{expenses.length} Khoản</span>
        </div>
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Trận Đã Đấu</span>
          <span className="font-mono-num font-black text-base text-foreground">8 Trận</span>
        </div>
      </div>
    </Card>
  );
}
