import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Check, X } from 'lucide-react';
import { MatchParticipant } from '../api/matches-api';

interface MatchPendingRequestsCardProps {
  requests: MatchParticipant[];
  onReviewRequest: (requestId: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
}

export function MatchPendingRequestsCard({
  requests,
  onReviewRequest,
}: MatchPendingRequestsCardProps): React.ReactElement {
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-4">
      <h3 className="text-base font-black text-foreground pb-2 border-b border-border/50">
        Yêu Cầu Chờ Duyệt ({pendingRequests.length})
      </h3>

      <div className="space-y-3">
        {pendingRequests.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Không có yêu cầu chờ duyệt nào.</p>
        ) : (
          pendingRequests.map((r) => (
            <div
              key={r.id}
              className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{r.user?.fullName}</span>
                <span className="text-[10px] text-primary font-bold">Vị trí: {r.preferredPosition}</span>
              </div>
              {r.note && <p className="text-[11px] text-muted-foreground italic">"{r.note}"</p>}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onReviewRequest(r.id, 'APPROVED')}
                  className="flex-1 text-[11px] font-bold h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                >
                  <Check className="h-3 w-3" />
                  <span>Duyệt</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onReviewRequest(r.id, 'REJECTED')}
                  className="flex-1 text-[11px] font-bold h-8 gap-1 text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                  <span>Từ chối</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
