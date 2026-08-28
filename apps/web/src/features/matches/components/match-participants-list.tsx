import React from 'react';
import { Card } from '../../../components/ui/card';
import { MatchParticipant } from '../api/matches-api';

interface MatchParticipantsListProps {
  participants?: MatchParticipant[];
}

export function MatchParticipantsList({
  participants = [],
}: MatchParticipantsListProps): React.ReactElement {
  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <h3 className="text-base font-black text-foreground">
          Đội Hình Đã Tham Gia ({participants.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {participants.map((p) => (
          <div
            key={p.id}
            className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                {p.user?.fullName ? p.user.fullName.charAt(0).toUpperCase() : 'P'}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{p.user?.fullName || 'Cầu thủ'}</p>
                <p className="text-[11px] text-muted-foreground">Vị trí: {p.preferredPosition || 'Tự do'}</p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase">
              Đã Duyệt
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
