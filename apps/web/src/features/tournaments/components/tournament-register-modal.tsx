import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Swords, X } from 'lucide-react';
import { MyTeamMembership } from '../../teams/api/teams-api';

export interface TournamentRegisterModalProps {
  show: boolean;
  onClose: () => void;
  captainTeams: MyTeamMembership[];
  selectedTeamId: string;
  setSelectedTeamId: (id: string) => void;
  isRegistering: boolean;
  actionMsg: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function TournamentRegisterModal({
  show,
  onClose,
  captainTeams,
  selectedTeamId,
  setSelectedTeamId,
  isRegistering,
  actionMsg,
  onSubmit,
}: TournamentRegisterModalProps): React.ReactElement | null {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-black text-foreground">
              Đăng Ký Đội Tham Gia Giải Đấu
            </CardTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {actionMsg && (
            <div role="status" className="p-3 rounded-xl border border-border text-foreground text-xs font-bold">
              <span>{actionMsg}</span>
            </div>
          )}

          {captainTeams.length === 0 ? (
            <div className="p-6 text-center space-y-3 bg-secondary/30 rounded-2xl border border-border">
              <p className="text-xs text-muted-foreground">
                {actionMsg ? 'Chọn đóng để quay lại giải đấu.' : 'Bạn chưa có đội cùng môn đủ điều kiện đăng ký. Chỉ đội trưởng đang hoạt động có thể đăng ký đội chưa tham gia giải.'}
              </p>
              <Button size="sm" onClick={() => (window.location.href = '/teams')} className="text-xs font-bold">
                Quản lý đội
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Select Team */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Chọn Câu Lạc Bộ Của Bạn <span className="text-destructive">*</span>
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                >
                  {captainTeams.map((m) => (
                    <option key={m.team.id} value={m.team.id}>
                      {m.team.name} ({m.team.sportType}) - {m.team.memberCount ?? 0} thành viên
                    </option>
                  ))}
                </select>
              </div>


              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs font-bold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isRegistering || !selectedTeamId}
                  size="sm"
                  className="font-bold text-xs shadow-md"
                >
                  {isRegistering ? 'Đang đăng ký...' : 'Xác nhận đăng ký đội'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
