import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Link, useParams } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Wallet,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Search,
} from 'lucide-react';
import {
  listMyTeamsApi,
  getTeamApi,
  createTeamApi,
  addMemberApi,
  removeMemberApi,
  splitBookingApi,
  getTeamExpensesApi,
  getTreasuryOverviewApi,
  contributeTreasuryApi,
  type MyTeamMembership,
  type Team,
  type ExpenseShare,
  type TreasuryOverview,
} from '../api/teams-api';
import { useAuthStore } from '../../../lib/auth-store';
import { formatVND, cn } from '../../../lib/utils';

export function TeamsPage(): React.ReactElement {
  const [memberships, setMemberships] = React.useState<MyTeamMembership[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [sportFilter, setSportFilter] = React.useState('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Form State
  const [name, setName] = React.useState('');
  const [sportType, setSportType] = React.useState('FOOTBALL');
  const [teamCity, setTeamCity] = React.useState('Hà Nội');
  const [description, setDescription] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchTeams = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listMyTeamsApi();
      setMemberships(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await createTeamApi({ name, sportType, description });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      fetchTeams();
    } finally {
      setIsSubmitting(false);
    }
  };

  const sportNameMap: Record<string, string> = {
    FOOTBALL: 'Bóng Đá',
    PICKLEBALL: 'Pickleball',
    BADMINTON: 'Cầu Lông',
    TENNIS: 'Tennis',
    BASKETBALL: 'Bóng Rổ',
  };

  const sportsFilterList = [
    { id: 'ALL', label: 'Tất Cả Môn' },
    { id: 'FOOTBALL', label: 'Bóng Đá' },
    { id: 'PICKLEBALL', label: 'Pickleball' },
    { id: 'BADMINTON', label: 'Cầu Lông' },
    { id: 'TENNIS', label: 'Tennis' },
    { id: 'BASKETBALL', label: 'Bóng Rổ' },
  ];

  const filteredMemberships = memberships.filter((m) => {
    const matchesSport = sportFilter === 'ALL' || m.team.sportType.includes(sportFilter);
    const matchesQuery =
      !searchQuery.trim() || m.team.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesQuery;
  });

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
            <Users className="h-4 w-4" />
            <span>Phòng Đội Thể Thao</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Đội Nhóm Của Bạn
          </h1>
          <p className="text-xs text-muted-foreground">
            Quản lý thành viên, chia tiền sân tự động và quỹ đội minh bạch.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20 self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tạo Đội Mới</span>
        </Button>
      </div>

      {/* Filter Bar: Sport Selector & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
        {/* Sport Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {sportsFilterList.map((sp) => {
            const isSelected = sportFilter === sp.id;
            return (
              <button
                type="button"
                key={sp.id}
                onClick={() => setSportFilter(sp.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground',
                )}
              >
                {sp.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm tên đội..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-4 animate-pulse">
              <div className="h-12 w-12 rounded-2xl bg-muted" />
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </Card>
          ))}
        </div>
      ) : filteredMemberships.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-border/80 space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary mx-auto">
            <Users className="h-7 w-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-foreground">
              {memberships.length === 0
                ? 'Chưa tham gia đội thể thao nào'
                : 'Không tìm thấy đội phù hợp với bộ lọc'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {memberships.length === 0
                ? 'Tạo đội mới để cùng bạn bè quản lý quỹ đội, lịch thi đấu và chia tiền sân thuận tiện.'
                : 'Thử chuyển sang bộ môn khác hoặc xóa từ khóa tìm kiếm.'}
            </p>
          </div>
          {memberships.length === 0 && (
            <Button onClick={() => setShowCreateModal(true)} size="sm" className="font-bold text-xs">
              Tạo Đội Đầu Tiên
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemberships.map((m) => {
            const t = m.team;
            return (
              <Card
                key={m.membershipId}
                className="group relative overflow-hidden border border-border/80 hover:border-primary/50 bg-card hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  {/* Top Row: Avatar & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary font-black text-xl border border-primary/25 shadow-sm group-hover:scale-105 transition-transform">
                      {t.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase border border-primary/20">
                        {sportNameMap[t.sportType] || t.sportType}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider',
                          m.role === 'CAPTAIN'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-secondary text-muted-foreground',
                        )}
                      >
                        {m.role === 'CAPTAIN' ? 'Đội Trưởng' : 'Thành Viên'}
                      </span>
                    </div>
                  </div>

                  {/* Team Info */}
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                      {t.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {t.description || 'Đội thể thao phong trào SanGo.'}
                    </p>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-center">
                    <div className="p-2 rounded-xl bg-secondary/40">
                      <span className="text-[10px] text-muted-foreground font-bold block">Thành viên</span>
                      <span className="font-mono-num font-black text-xs text-foreground">
                        {t.memberCount ?? 1} Cầu thủ
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-secondary/40">
                      <span className="text-[10px] text-muted-foreground font-bold block">Đội trưởng</span>
                      <span className="font-bold text-xs text-foreground truncate block">
                        {t.captain?.fullName || 'Bạn'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-6 py-3.5 bg-secondary/20 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground">Phòng điều hành đội</span>
                  <Link
                    to={`/teams/${t.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <span>Vào phòng đội</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Tạo Đội Mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150">
            <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-black text-foreground">Tạo Đội Thể Thao Mới</CardTitle>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Tên Đội Thể Thao <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Ví dụ: SanGo United FC, Pickleball Ba Đình..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-10 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Bộ Môn</label>
                    <select
                      value={sportType}
                      onChange={(e) => setSportType(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                    >
                      <option value="FOOTBALL">Bóng Đá Sân 7 / Sân 5</option>
                      <option value="PICKLEBALL">Pickleball</option>
                      <option value="BADMINTON">Cầu Lông</option>
                      <option value="TENNIS">Tennis</option>
                      <option value="BASKETBALL">Bóng Rổ</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Thành Phố</label>
                    <select
                      value={teamCity}
                      onChange={(e) => setTeamCity(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                    >
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Mô Tả Đội</label>
                  <Input
                    placeholder="Khu vực hoạt động, lịch đá cố định..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                    className="text-xs font-bold"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !name.trim()}
                    size="sm"
                    className="font-bold text-xs shadow-md shadow-emerald-500/20"
                  >
                    {isSubmitting ? 'Đang tạo...' : 'Tạo Đội Ngay'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export type TeamTab = 'MEMBERS' | 'SPLIT' | 'TREASURY' | 'SCHEDULE';

export function TeamDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [team, setTeam] = React.useState<Team | null>(null);
  const [expenses, setExpenses] = React.useState<ExpenseShare[]>([]);
  const [treasury, setTreasury] = React.useState<TreasuryOverview | null>(null);
  const [activeTab, setActiveTab] = React.useState<TeamTab>('MEMBERS');
  const [isLoading, setIsLoading] = React.useState(true);

  // Modals & form states
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteMsg, setInviteMsg] = React.useState<string | null>(null);

  // Split booking form
  const [splitBookingCode, setSplitBookingCode] = React.useState('SG-20260828-001');
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([]);
  const [splitMsg, setSplitMsg] = React.useState<string | null>(null);

  // Treasury contribute form
  const [fundAmount, setFundAmount] = React.useState('200000');
  const [fundMsg, setFundMsg] = React.useState<string | null>(null);

  const fetchTeamData = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [teamData, expData, trData] = await Promise.all([
        getTeamApi(id),
        getTeamExpensesApi(id),
        getTreasuryOverviewApi(id),
      ]);
      setTeam(teamData);
      setExpenses(expData);
      setTreasury(trData);
      if (teamData.members) {
        setSelectedMemberIds(teamData.members.map((m) => m.userId));
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inviteEmail) return;
    try {
      await addMemberApi(id, { email: inviteEmail, role: 'MEMBER' });
      setInviteMsg('Đã gửi lời mời tham gia đội!');
      setInviteEmail('');
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteMsg(null);
        fetchTeamData();
      }, 1200);
    } catch {
      setInviteMsg('Không thể thêm thành viên');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id || !window.confirm('Bạn có chắc muốn xoá thành viên này?')) return;
    await removeMemberApi(id, memberId);
    fetchTeamData();
  };

  const handleSplitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || selectedMemberIds.length === 0) return;
    try {
      await splitBookingApi(id, {
        bookingId: 'b-mock-1',
        memberIds: selectedMemberIds,
        note: `Chia tiền đơn ${splitBookingCode}`,
      });
      setSplitMsg(`Đã tạo khoản chia tiền thành công cho ${selectedMemberIds.length} người!`);
      setTimeout(() => {
        setSplitMsg(null);
        fetchTeamData();
      }, 1500);
    } catch {
      setSplitMsg('Chia tiền thất bại');
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const num = parseInt(fundAmount, 10);
    if (!num || num <= 0) return;
    try {
      await contributeTreasuryApi(id, { amount: num, note: 'Đóng quỹ tháng' });
      setFundMsg(`Đã đóng quỹ ${formatVND(num)} thành công!`);
      setTimeout(() => {
        setFundMsg(null);
        fetchTeamData();
      }, 1500);
    } catch {
      setFundMsg('Đóng quỹ thất bại');
    }
  };

  if (isLoading || !team) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12 text-center space-y-3">
        <div className="h-8 w-48 bg-muted rounded mx-auto animate-pulse" />
        <p className="text-xs text-muted-foreground">Đang nạp dữ liệu phòng đội...</p>
      </div>
    );
  }

  const isCaptain = team.captainId === user?.id || team.members?.find((m) => m.userId === user?.id)?.role === 'CAPTAIN';

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-10 space-y-8 max-w-7xl mx-auto">
      {/* Team Header Hero Banner */}
      <Card className="relative overflow-hidden border border-primary/30 bg-gradient-to-r from-card via-card to-primary/5 p-6 sm:p-8 shadow-xl rounded-3xl">
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
              onClick={() => setShowInviteModal(true)}
              size="sm"
              className="text-xs font-bold gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <UserPlus className="h-4 w-4" />
              <span>Mời Cầu Thủ</span>
            </Button>
            <Link to="/venues">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5">
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

      {/* Tabs Navigation */}
      <div className="flex border-b border-border/60 gap-4 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          aria-label="Danh Sách Đội Hình"
          onClick={() => setActiveTab('MEMBERS')}
          className={cn(
            'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
            activeTab === 'MEMBERS'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <Users className="h-4 w-4" />
          <span>Danh Sách Đội Hình ({team.members?.length || 0})</span>
        </button>

        <button
          type="button"
          aria-label="Chia Tiền Sân Tự Động"
          onClick={() => setActiveTab('SPLIT')}
          className={cn(
            'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
            activeTab === 'SPLIT'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <DollarSign className="h-4 w-4" />
          <span>Chia Tiền Sân Tự Động</span>
        </button>

        <button
          type="button"
          aria-label="Quỹ Đội Minh Bạch"
          onClick={() => setActiveTab('TREASURY')}
          className={cn(
            'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
            activeTab === 'TREASURY'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <Wallet className="h-4 w-4" />
          <span>Quỹ Đội Minh Bạch</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS */}
      {activeTab === 'MEMBERS' && (
        <Card className="p-6 border border-border/80 bg-card shadow-md space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div>
              <h3 className="text-base font-black text-foreground">Danh Sách Cầu Thủ Đội Hình</h3>
              <p className="text-xs text-muted-foreground">Tất cả thành viên chính thức của {team.name}.</p>
            </div>
            <Button onClick={() => setShowInviteModal(true)} size="sm" variant="outline" className="text-xs font-bold gap-1.5">
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
                    onClick={() => handleRemoveMember(m.id)}
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
      )}

      {/* TAB 2: SPLIT BOOKING EXPENSES */}
      {activeTab === 'SPLIT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: Split Booking */}
          <Card className="lg:col-span-6 p-6 border border-border/80 bg-card shadow-md space-y-5">
            <div className="pb-3 border-b border-border/50">
              <h3 className="text-base font-black text-foreground">Tạo Khoản Chia Tiền Sân</h3>
              <p className="text-xs text-muted-foreground">
                Tự động chia đều chi phí đơn đặt sân cho các thành viên tham gia.
              </p>
            </div>

            {splitMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{splitMsg}</span>
              </div>
            )}

            <form onSubmit={handleSplitBooking} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Mã Đơn Đặt Sân Cần Chia</label>
                <Input
                  value={splitBookingCode}
                  onChange={(e) => setSplitBookingCode(e.target.value)}
                  placeholder="Ví dụ: SG-20260828-001"
                  required
                  className="h-10 text-xs font-mono-num"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Chọn Cầu Thủ Tham Gia Trận Đấu ({selectedMemberIds.length} người)
                </label>
                <div className="p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-2 max-h-48 overflow-y-auto">
                  {team.members?.map((m) => {
                    const isChecked = selectedMemberIds.includes(m.userId);
                    return (
                      <label
                        key={m.userId}
                        className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMemberIds([...selectedMemberIds, m.userId]);
                            } else {
                              setSelectedMemberIds(selectedMemberIds.filter((id) => id !== m.userId));
                            }
                          }}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <span>{m.user?.fullName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <Button
                type="submit"
                disabled={selectedMemberIds.length === 0}
                className="w-full font-bold text-xs shadow-md shadow-emerald-500/20"
              >
                Chia Đều Tiền Sân Ngay
              </Button>
            </form>
          </Card>

          {/* Right List: Existing Expense Shares */}
          <Card className="lg:col-span-6 p-6 border border-border/80 bg-card shadow-md space-y-4">
            <h3 className="text-base font-black text-foreground pb-2 border-b border-border/50">
              Nhật Ký Các Khoản Chia Tiền
            </h3>

            <div className="space-y-3">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">
                      {exp.debtor?.fullName} nợ {exp.payer?.fullName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{exp.note || 'Tiền sân'}</p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="font-mono-num font-black text-xs text-foreground block">
                      {formatVND(exp.amount)}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block',
                        exp.status === 'PAID'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/15 text-amber-500',
                      )}
                    >
                      {exp.status === 'PAID' ? 'Đã Thanh Toán' : 'Chưa Trả'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: TREASURY */}
      {activeTab === 'TREASURY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Balance & Contribute */}
          <Card className="lg:col-span-5 p-6 border border-border/80 bg-card shadow-md space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-primary/10 to-transparent border border-primary/20 space-y-2 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Số Dư Quỹ Đội Hiện Tại
              </span>
              <p className="font-mono-num font-black text-3xl sm:text-4xl text-primary">
                {formatVND(treasury?.balance || 0)}
              </p>
              <p className="text-[11px] text-muted-foreground">Quản lý thu chi công khai giữa các thành viên</p>
            </div>

            {fundMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{fundMsg}</span>
              </div>
            )}

            <form onSubmit={handleContribute} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Đóng Quỹ Bằng Ví SanGo Cá Nhân
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['100000', '200000', '500000'].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setFundAmount(amt)}
                      className={cn(
                        'py-2 rounded-xl text-xs font-mono-num font-bold border transition-all cursor-pointer',
                        fundAmount === amt
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary/60 border-border/60 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {formatVND(parseInt(amt, 10))}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full font-bold text-xs shadow-md shadow-emerald-500/20">
                Xác Nhận Đóng Quỹ
              </Button>
            </form>
          </Card>

          {/* Right Column: Transaction Log */}
          <Card className="lg:col-span-7 p-6 border border-border/80 bg-card shadow-md space-y-4">
            <h3 className="text-base font-black text-foreground pb-2 border-b border-border/50">
              Nhật Ký Thu - Chi Quỹ Đội
            </h3>

            <div className="space-y-3">
              {treasury?.recentTransactions?.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-xl font-bold',
                        tx.type === 'INCOME' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500',
                      )}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {tx.createdByName} · {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'font-mono-num font-black text-xs',
                      tx.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500',
                    )}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {formatVND(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Modal Mời Cầu Thủ */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150">
            <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-black text-foreground">Mời Cầu Thủ Vào Đội</CardTitle>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-5">
              {inviteMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{inviteMsg}</span>
                </div>
              )}
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Email hoặc Số điện thoại cầu thủ <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="cauthu@sango.vn"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="h-10 text-xs"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInviteModal(false)}
                    className="text-xs font-bold"
                  >
                    Hủy
                  </Button>
                  <Button type="submit" size="sm" className="font-bold text-xs shadow-md shadow-emerald-500/20">
                    Gửi Lời Mời
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
