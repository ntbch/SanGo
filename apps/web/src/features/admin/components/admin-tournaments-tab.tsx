import React from 'react';
import { Trophy, RefreshCw, Plus, Swords } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { cn } from '../../../lib/utils';
import { listTournamentsApi, createTournamentApi, startTournamentApi, type Tournament } from '../../tournaments/api/tournaments-api';
import { SportType } from '@sango/shared';

const SPORT_TYPE_LABELS: Record<string, string> = {
  FOOTBALL5: 'Bóng đá 5',
  FOOTBALL7: 'Bóng đá 7',
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
};

export function AdminTournamentsTab(): React.ReactElement {
  const [tournaments, setTournaments] = React.useState<Tournament[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [sportType, setSportType] = React.useState<SportType>(SportType.FOOTBALL5);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const fetchTournaments = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTournamentsApi();
      setTournaments(data);
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setActionLoading(true);
    setActionError(null);
    setActionLoading(true);
    try {
      await createTournamentApi({
        name: name.trim(),
        sportType,
      });
      setCreateModalOpen(false);
      setName('');
      await fetchTournaments();
    } catch (err) {
      console.error('Failed to create tournament:', err);
      setActionError(err instanceof Error ? err.message : 'Không thể tạo giải đấu.');
      setActionLoading(false);
    }
  };

  const handleStart = async (id: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await startTournamentApi(id);
      await fetchTournaments();
    } catch (err) {
      console.error('Start tournament failed:', err);
      setActionError(err instanceof Error ? err.message : 'Không thể khóa đăng ký và chia bảng.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" /> Điều Hành Giải Đấu Thể Thao
          </h1>
          <p className="text-xs text-muted-foreground">
            Tổ chức các giải đấu loại trực tiếp (Single-elimination), tự động chia bảng và cập nhật tỷ số.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTournaments} disabled={loading} className="gap-2 text-xs font-bold">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Làm mới
          </Button>
          <Button variant="default" size="sm" onClick={() => setCreateModalOpen(true)} className="gap-2 text-xs font-bold shadow-xs">
            <Plus className="h-3.5 w-3.5" /> Tạo Giải Đấu Mới
          </Button>
        </div>
      </div>

      {actionError && (
        <p role="alert" className="text-xs text-destructive">{actionError}</p>
      )}

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
            Đang tải danh sách giải đấu...
          </div>
        ) : tournaments.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
            Chưa có giải đấu nào. Bấm nút <strong>Tạo Giải Đấu Mới</strong> để khởi tạo giải đấu đầu tiên.
          </div>
        ) : (
          tournaments.map((t) => (
            <Card key={t.id} className="border-border/80 hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
                <div>
                  <Badge variant="outline" className="text-[10px] mb-1">
                    {SPORT_TYPE_LABELS[t.sportType] || t.sportType}
                  </Badge>
                  <CardTitle className="text-base font-bold line-clamp-1">{t.name}</CardTitle>
                </div>
                <Badge
                  variant={
                    t.status === 'FINISHED'
                      ? 'outline'
                      : t.status === 'ONGOING'
                      ? 'available'
                      : 'peak'
                  }
                  className="text-[9px] shrink-0"
                >
                  {t.status === 'FINISHED'
                    ? 'Đã kết thúc'
                    : t.status === 'ONGOING'
                    ? 'Đang diễn ra'
                    : 'Đang mở đăng ký'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Quy mô:</span>
                  <span className="font-bold text-foreground">{t._count?.teams ?? 0} / {t.maxTeams} Đội</span>
                </div>
                {t.status === 'FINISHED' && t.champion && <p>Quán quân: <strong>{t.champion.name}</strong></p>}

                {t.status === 'REGISTRATION' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleStart(t.id)}
                    className="w-full text-xs font-bold gap-1 text-primary border-primary/40 hover:bg-primary/10 mt-2"
                  >
                    <Swords className="h-3.5 w-3.5" /> Khóa Đăng Ký &amp; Chia Bảng
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Tournament Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" /> Tạo Giải Đấu Thể Thao Mới
              </DialogTitle>
              <DialogDescription className="text-xs">
                Thiết lập giải đấu loại trực tiếp (Single-elimination knockout).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Tên giải đấu *</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  placeholder="VD: SanGo Champions Cup 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border/80 text-foreground focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Môn thể thao</label>
                  <select
                    value={sportType}
                    onChange={(e) => setSportType(e.target.value as SportType)}
                    className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border/80 text-foreground focus:outline-hidden focus:border-primary"
                  >
                    {Object.entries(SPORT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-muted-foreground">Tối đa 8 đội. Cần ít nhất 5 đội để khởi tranh.</p>
              </div>

            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreateModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="default" size="sm" disabled={actionLoading} className="font-bold text-xs">
                {actionLoading ? 'Đang tạo...' : 'Tạo Giải Đấu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
