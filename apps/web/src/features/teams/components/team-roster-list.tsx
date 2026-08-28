import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Team } from '../api/teams-api';

interface TeamRosterListProps {
  team: Team;
  isCaptain: boolean;
  onOpenInviteModal: () => void;
  onRemoveMember: (memberId: string) => Promise<void>;
}

export function TeamRosterList({
  team,
  isCaptain,
  onOpenInviteModal,
  onRemoveMember,
}: TeamRosterListProps): React.ReactElement {
  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div>
          <h3 className="text-base font-black text-foreground">Danh Sách Cầu Thủ Đội Hình</h3>
          <p className="text-xs text-muted-foreground">Tất cả thành viên chính thức của {team.name}.</p>
        </div>
        <Button
          onClick={onOpenInviteModal}
          size="sm"
          variant="outline"
          className="text-xs font-bold gap-1.5 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Thêm Thành Viên</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.members?.map((m) => (
          <div
            key={m.id}
            className="p-4 rounded-2xl bg-secondary/30 border border-border/60 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                {m.user?.fullName ? m.user.fullName.charAt(0).toUpperCase() : 'M'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-foreground">{m.user?.fullName || 'Thành viên'}</p>
                  {m.role === 'CAPTAIN' && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[9px] font-black uppercase">
                      Captain
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground font-mono-num">{m.user?.phone || m.user?.email}</p>
              </div>
            </div>

            {isCaptain && m.role !== 'CAPTAIN' && (
              <button
                type="button"
                onClick={() => onRemoveMember(m.id)}
                className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                title="Xoá thành viên khỏi đội"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
