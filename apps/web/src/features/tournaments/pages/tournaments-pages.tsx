import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Link, useParams } from 'react-router-dom';
import {
  Trophy,
  PlusCircle,
  MapPin,
  Calendar,
  Users,
  Award,
  Swords,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Play,
  Crown,
  Clock,
  Phone,
  User,
  Wallet,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import {
  listTournamentsApi,
  getTournamentDetailApi,
  createTournamentApi,
  registerTournamentTeamApi,
  startTournamentApi,
  updateTournamentMatchScoreApi,
  type Tournament,
  type TournamentMatch,
} from '../api/tournaments-api';
import { listMyTeamsApi, type MyTeamMembership } from '../../teams/api/teams-api';
import { useAuthStore } from '../../../lib/auth-store';
import { UserRole, CITIES } from '../../../lib/constants';
import { formatVND, cn } from '../../../lib/utils';
import { AuthModal } from '../../../components/auth/auth-modal';

export function TournamentsPage(): React.ReactElement {
  const { user } = useAuthStore();
  const [tournaments, setTournaments] = React.useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [sportFilter, setSportFilter] = React.useState('ALL');
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [cityFilter, setCityFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  // Modal Create Tournament
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [name, setName] = React.useState('');
  const [sportType, setSportType] = React.useState('FOOTBALL7');
  const [city, setCity] = React.useState('Hà Nội');
  const [district] = React.useState('Cầu Giấy');
  const [maxTeams, setMaxTeams] = React.useState('8');
  const [prizePool, setPrizePool] = React.useState('25000000');
  const [entryFee, setEntryFee] = React.useState('500000');
  const [registrationDeadline, setRegistrationDeadline] = React.useState('2026-09-01');
  const [startDate, setStartDate] = React.useState('2026-09-05');
  const [rules, setRules] = React.useState('Thi đấu loại trực tiếp (Single-Elimination), không có kết quả hòa.');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchTournaments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listTournamentsApi();
      setTournaments(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await createTournamentApi({
        name,
        sportType,
        city,
        district,
        maxTeams: parseInt(maxTeams, 10) || 8,
        prizePool: parseInt(prizePool, 10) || 0,
        entryFee: parseInt(entryFee, 10) || 0,
        registrationDeadline,
        startDate,
        rules,
      });
      setShowCreateModal(false);
      setName('');
      fetchTournaments();
    } finally {
      setIsSubmitting(false);
    }
  };

  const sportsList = [
    { id: 'ALL', label: 'Tất Cả Môn' },
    { id: 'FOOTBALL', label: 'Bóng Đá' },
    { id: 'PICKLEBALL', label: 'Pickleball' },
    { id: 'BADMINTON', label: 'Cầu Lông' },
    { id: 'TENNIS', label: 'Tennis' },
  ];

  const filteredTournaments = tournaments.filter((t) => {
    const matchesSport = sportFilter === 'ALL' || t.sportType.includes(sportFilter);
    const matchesCity = cityFilter === 'ALL' || t.city === cityFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSport && matchesCity && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTRATION':
        return { label: 'Đang Mở Đăng Ký', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
      case 'ONGOING':
        return { label: 'Đang Diễn Ra', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
      case 'FINISHED':
        return { label: 'Đã Kết Thúc', className: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' };
      default:
        return { label: status, className: 'bg-secondary text-muted-foreground' };
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
            <Trophy className="h-4 w-4" />
            <span>Đấu Trường Thể Thao Phong Trào</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Giải Đấu & Cup Vô Địch
          </h1>
          <p className="text-xs text-muted-foreground">
            Tham gia tranh tài tại các giải đấu phong trào quy mô lớn tại Hà Nội và TP. Hồ Chí Minh.
          </p>
        </div>

        <Button
          onClick={() => {
            if (!user) {
              setShowAuthModal(true);
              return;
            }
            setShowCreateModal(true);
          }}
          size="sm"
          className="font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Tạo Giải Đấu</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
        {/* Sport Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          {sportsList.map((sp) => {
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

        {/* City & Status Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer shadow-xs"
          >
            <option value="ALL">Tất cả Thành phố</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer shadow-xs"
          >
            <option value="ALL">Tất cả Trạng thái</option>
            <option value="REGISTRATION">Đang Mở Đăng Ký</option>
            <option value="ONGOING">Đang Diễn Ra</option>
            <option value="FINISHED">Đã Kết Thúc</option>
          </select>
        </div>
      </div>

      {/* Tournaments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-4 animate-pulse">
              <div className="h-6 w-1/3 bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-10 bg-muted rounded-xl" />
            </Card>
          ))}
        </div>
      ) : filteredTournaments.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-border/80 space-y-3">
          <p className="text-sm font-bold text-foreground">Không tìm thấy giải đấu phù hợp</p>
          <p className="text-xs text-muted-foreground">Thử đổi môn thể thao, thành phố hoặc trạng thái tìm kiếm.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((t) => {
            const statusInfo = getStatusBadge(t.status);
            const teamCount = t.teams?.length || 0;

            return (
              <Card
                key={t.id}
                className="group relative overflow-hidden border border-border/80 hover:border-primary/50 bg-card hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase border border-primary/20">
                      {t.sportType}
                    </span>
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border',
                        statusInfo.className,
                      )}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {t.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {t.rules || 'Thi đấu loại trực tiếp cup vô địch.'}
                    </p>
                  </div>

                  {/* Location & Dates */}
                  <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{t.district ? `${t.district}, ${t.city}` : t.city}</span>
                    </div>
                    {t.registrationDeadline && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>Hạn đăng ký: {new Date(t.registrationDeadline).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>Khai mạc: {t.startDate ? new Date(t.startDate).toLocaleDateString('vi-VN') : 'Sắp diễn ra'}</span>
                    </div>
                  </div>

                  {/* Quick Stat Strip */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-center">
                    <div className="p-2 rounded-xl bg-secondary/40">
                      <span className="text-[10px] text-muted-foreground font-bold block">Đội Đã Ghi Danh</span>
                      <span className="font-mono-num font-black text-xs text-foreground">
                        {teamCount} / {t.maxTeams} Đội
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-secondary/40">
                      <span className="text-[10px] text-muted-foreground font-bold block">Tổng Giải Thưởng</span>
                      <span className="font-mono-num font-black text-xs text-primary">
                        {formatVND(t.prizePool || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Champion Display if finished */}
                  {t.status === 'FINISHED' && t.championTeam && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="text-[11px] text-muted-foreground">Quán quân:</span>
                        <strong className="text-foreground font-bold">{t.championTeam.name}</strong>
                      </div>
                      <Award className="h-4 w-4 text-amber-500 shrink-0" />
                    </div>
                  )}
                </div>

                {/* Footer Action Link */}
                <div className="px-6 py-3.5 bg-secondary/20 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground">Sơ đồ nhánh đấu & Lịch thi</span>
                  <Link
                    to={`/tournaments/${t.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <span>Xem bảng đấu</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Tạo Giải Đấu Mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between sticky top-0 bg-card z-10">
              <CardTitle className="text-base font-black text-foreground">Tạo Giải Đấu Thể Thao Mới</CardTitle>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleCreateTournament} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Tên Giải Đấu <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="VD: SanGo Summer Cup 2026..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-10 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Bộ Môn</label>
                    <select
                      value={sportType}
                      onChange={(e) => setSportType(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                    >
                      <option value="FOOTBALL7">Bóng Đá Sân 7</option>
                      <option value="FOOTBALL5">Bóng Đá Sân 5</option>
                      <option value="PICKLEBALL">Pickleball</option>
                      <option value="BADMINTON">Cầu Lông</option>
                      <option value="TENNIS">Tennis</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Thành Phố</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                    >
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Quy Mô Số Đội</label>
                    <select
                      value={maxTeams}
                      onChange={(e) => setMaxTeams(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                    >
                      <option value="4">4 Đội (Bán Kết + Chung Kết)</option>
                      <option value="8">8 Đội (Tứ Kết đến Chung Kết)</option>
                      <option value="16">16 Đội (Vòng 1/8 đến Chung Kết)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Lệ Phí Đội (VND)</label>
                    <Input
                      type="number"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      className="h-10 text-xs font-mono-num"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Tổng Giải Thưởng (VND)</label>
                    <Input
                      type="number"
                      value={prizePool}
                      onChange={(e) => setPrizePool(e.target.value)}
                      className="h-10 text-xs font-mono-num"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">Hạn Chót Đăng Ký</label>
                    <Input
                      type="date"
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                      className="h-10 text-xs font-mono-num"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Ngày Khai Mạc</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 text-xs font-mono-num"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Thể Thức & Điều Lệ</label>
                  <Input
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
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
                    {isSubmitting ? 'Đang tạo...' : 'Tạo Giải Ngay'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Auth Modal for Guests */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowCreateModal(true)}
        title="Đăng Nhập Để Tạo Giải Đấu"
        subtitle="Vui lòng đăng nhập tài khoản để khởi tạo và quản lý giải đấu thể thao phong trào."
      />
    </div>
  );
}

export type TournamentTab = 'BRACKET' | 'TEAMS' | 'MATCHES';

export function TournamentDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [tournament, setTournament] = React.useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = React.useState<TournamentTab>('BRACKET');
  const [isLoading, setIsLoading] = React.useState(true);
  const [myTeams, setMyTeams] = React.useState<MyTeamMembership[]>([]);
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  // Modals & Action States
  const [showRegisterModal, setShowRegisterModal] = React.useState(false);
  const [selectedTeamId, setSelectedTeamId] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<'WALLET' | 'QR'>('WALLET');
  const [contactPhone, setContactPhone] = React.useState('0912345678');
  const [captainName, setCaptainName] = React.useState(user?.fullName || 'Trần Đức');
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [actionMsg, setActionMsg] = React.useState<string | null>(null);

  // Score modal state
  const [selectedMatch, setSelectedMatch] = React.useState<TournamentMatch | null>(null);
  const [homeScore, setHomeScore] = React.useState('0');
  const [awayScore, setAwayScore] = React.useState('0');
  const [isUpdatingScore, setIsUpdatingScore] = React.useState(false);
  const [roundFilter, setRoundFilter] = React.useState<number | 'ALL'>('ALL');

  const fetchTournamentData = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [tourData, teamsData] = await Promise.all([
        getTournamentDetailApi(id),
        listMyTeamsApi().catch(() => []),
      ]);
      setTournament({ ...tourData });
      setMyTeams(teamsData);
      const captainTeams = teamsData.filter((m) => m.role === 'CAPTAIN');
      if (captainTeams.length > 0) {
        setSelectedTeamId(captainTeams[0].team.id);
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);

  const captainTeams = myTeams.filter((m) => m.role === 'CAPTAIN');
  const isUserCaptain = captainTeams.length > 0;

  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedTeamId) return;
    if (!agreeTerms) {
      alert('Vui lòng đồng ý với điều lệ và cam kết thi đấu fair-play.');
      return;
    }

    setIsRegistering(true);
    try {
      const registeredTeamObj = captainTeams.find((m) => m.team.id === selectedTeamId);
      const nameToRegister = registeredTeamObj?.team.name || 'Đội Bóng';

      await registerTournamentTeamApi(id, {
        teamId: selectedTeamId,
        teamName: nameToRegister,
        captainName,
        contactPhone,
      });

      const methodText = paymentMethod === 'WALLET' ? 'Ví SanGo' : 'Mã QR Ngân Hàng';
      setActionMsg(`Đã đặt cọc lệ phí qua ${methodText} và đăng ký CLB "${nameToRegister}" thành công!`);
      setTimeout(async () => {
        setShowRegisterModal(false);
        setActionMsg(null);
        await fetchTournamentData();
        setActiveTab('TEAMS');
      }, 1200);
    } catch {
      setActionMsg('Đăng ký không thành công, vui lòng thử lại.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleStartTournament = async () => {
    if (!id || !window.confirm('Khởi tranh giải đấu và tự động sinh nhánh cây bảng đấu?')) return;
    await startTournamentApi(id);
    await fetchTournamentData();
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    const h = parseInt(homeScore, 10);
    const a = parseInt(awayScore, 10);
    if (h === a) {
      alert('Thể thức loại trực tiếp yêu cầu phải có đội thắng / thua, không chấp nhận tỷ số hòa.');
      return;
    }
    setIsUpdatingScore(true);
    try {
      await updateTournamentMatchScoreApi(selectedMatch.id, { homeScore: h, awayScore: a });
      setSelectedMatch(null);
      await fetchTournamentData();
    } finally {
      setIsUpdatingScore(false);
    }
  };

  if (isLoading || !tournament) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12 text-center space-y-3">
        <div className="h-8 w-48 bg-muted rounded mx-auto animate-pulse" />
        <p className="text-xs text-muted-foreground">Đang tải thông tin giải đấu...</p>
      </div>
    );
  }

  const isManager = tournament.createdBy === user?.id || user?.role === UserRole.ADMIN || Boolean(user);
  const matchesByRound: Record<number, TournamentMatch[]> = {};
  tournament.matches?.forEach((m) => {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
    matchesByRound[m.round].push(m);
  });
  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-10 space-y-8 max-w-7xl mx-auto">
      {/* Tournament Hero Card */}
      <Card className="relative overflow-hidden border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-xl rounded-3xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border/60">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase border border-primary/20">
                {tournament.sportType}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] font-bold uppercase">
                {tournament.city}
              </span>
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border',
                  tournament.status === 'REGISTRATION'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : tournament.status === 'ONGOING'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
                )}
              >
                {tournament.status === 'REGISTRATION'
                  ? 'Mở Đăng Ký'
                  : tournament.status === 'ONGOING'
                  ? 'Đang Thi Đấu'
                  : 'Đã Trao Cúp'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {tournament.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-foreground font-semibold">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {tournament.district ? `${tournament.district}, ${tournament.city}` : tournament.city}
              </span>
              {tournament.registrationDeadline && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <Clock className="h-3.5 w-3.5" />
                  Hạn chót: {new Date(tournament.registrationDeadline).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tournament.status === 'REGISTRATION' && (
              <Button
                onClick={() => {
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  setShowRegisterModal(true);
                }}
                size="sm"
                className="font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Đăng Ký Đội Vào Giải</span>
              </Button>
            )}

            {tournament.status === 'REGISTRATION' && isManager && (
              <Button
                onClick={handleStartTournament}
                size="sm"
                variant="outline"
                className="font-bold text-xs gap-1.5 text-primary border-primary/40 hover:bg-primary/10"
              >
                <Play className="h-4 w-4" />
                <span>Khởi Tranh & Sinh Nhánh Đấu</span>
              </Button>
            )}
          </div>
        </div>

        {/* 4 Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-center">
          <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Đội Ghi Danh</span>
            <span className="font-mono-num font-black text-base text-foreground">
              {tournament.teams?.length || 0} / {tournament.maxTeams} Đội
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Tổng Tiền Thưởng</span>
            <span className="font-mono-num font-black text-base text-primary">
              {formatVND(tournament.prizePool || 0)}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Lệ Phí / Đội</span>
            <span className="font-mono-num font-black text-base text-foreground">
              {formatVND(tournament.entryFee || 500000)}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Khai Mạc</span>
            <span className="font-mono-num font-black text-base text-foreground">
              {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('vi-VN') : 'Sắp diễn ra'}
            </span>
          </div>
        </div>

        {/* Champion Trophy Display if finished */}
        {tournament.status === 'FINISHED' && tournament.championTeam && (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
                <Crown className="h-7 w-7" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest block">
                  Nhà Vô Địch Giải Đấu
                </span>
                <p className="text-lg font-black text-foreground">{tournament.championTeam.name}</p>
              </div>
            </div>
            <Award className="h-8 w-8 text-amber-500" />
          </div>
        )}
      </Card>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border/60 gap-4 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          aria-label="Sơ Đồ Nhánh Đấu"
          onClick={() => setActiveTab('BRACKET')}
          className={cn(
            'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
            activeTab === 'BRACKET'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <Swords className="h-4 w-4" />
          <span>Sơ Đồ Nhánh Đấu (Knockout Bracket)</span>
        </button>

        <button
          type="button"
          aria-label="Danh Sách Đội Tham Gia"
          onClick={() => setActiveTab('TEAMS')}
          className={cn(
            'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
            activeTab === 'TEAMS'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <Users className="h-4 w-4" />
          <span>Danh Sách Đội Ghi Danh ({tournament.teams?.length || 0})</span>
        </button>

        <button
          type="button"
          aria-label="Lịch Thi Đấu & Tỷ Số"
          onClick={() => setActiveTab('MATCHES')}
          className={cn(
            'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
            activeTab === 'MATCHES'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <Calendar className="h-4 w-4" />
          <span>Lịch Thi Đấu & Nhập Tỷ Số</span>
        </button>
      </div>

      {/* TAB 1: BRACKET TREE */}
      {activeTab === 'BRACKET' && (
        <Card className="p-6 border border-border/80 bg-card shadow-md space-y-6 overflow-x-auto no-scrollbar">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/50">
            <div>
              <h3 className="text-base font-black text-foreground">Sơ Đồ Cây Loại Trực Tiếp (Knockout Tree)</h3>
              <p className="text-xs text-muted-foreground">
                Đội chiến thắng mỗi trận sẽ tự động tiến vào vòng đấu tiếp theo để tranh cúp vô địch.
              </p>
            </div>
          </div>

          {rounds.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Swords className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
              <p className="text-xs font-bold text-foreground">Chưa khởi tranh sinh sơ đồ nhánh đấu</p>
              <p className="text-xs text-muted-foreground">
                Ban tổ chức sẽ bấm &quot;Khởi Tranh &amp; Sinh Nhánh Đấu&quot; sau khi đủ số lượng đội ghi danh.
              </p>
            </div>
          ) : (
            <div className="flex items-stretch gap-10 min-w-[760px] py-4">
              {rounds.map((r, rIdx) => {
                const roundMatches = matchesByRound[r] || [];
                const roundName =
                  rIdx === rounds.length - 1
                    ? 'Chung Kết'
                    : rIdx === rounds.length - 2
                    ? 'Bán Kết'
                    : `Vòng ${r}`;

                return (
                  <div key={r} className="flex-1 flex flex-col justify-around space-y-6">
                    <div className="text-center pb-2 border-b border-border/50">
                      <span className="text-xs font-black uppercase text-primary tracking-wider block">
                        {roundName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{roundMatches.length} Cặp Đấu</span>
                    </div>

                    <div className="flex flex-col justify-around gap-6 h-full">
                      {roundMatches.map((m) => {
                        const isDone = m.status === 'DONE';
                        const homeWon = isDone && m.winnerTeamId === m.homeTeamId;
                        const awayWon = isDone && m.winnerTeamId === m.awayTeamId;

                        return (
                          <div
                            key={m.id}
                            className={cn(
                              'p-3.5 rounded-2xl border bg-card space-y-2 transition-all shadow-md relative group',
                              isDone
                                ? 'border-border/80'
                                : m.status === 'READY'
                                ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                                : 'border-border/40 opacity-75',
                            )}
                          >
                            {/* Match Card Header */}
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pb-1.5 border-b border-border/40">
                              <span className="font-bold">Trận #{m.position}</span>
                              <span
                                className={cn(
                                  'font-black uppercase text-[9px] px-1.5 py-0.5 rounded',
                                  isDone
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : m.status === 'READY'
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-secondary text-muted-foreground',
                                )}
                              >
                                {isDone ? 'Đã Kết Thúc' : m.status === 'READY' ? 'Sẵn Sàng' : 'Chờ Đối Thủ'}
                              </span>
                            </div>

                            {/* Home Team */}
                            <div
                              className={cn(
                                'flex items-center justify-between p-2 rounded-xl text-xs transition-colors',
                                homeWon
                                  ? 'bg-emerald-500/15 font-black text-emerald-600 dark:text-emerald-400'
                                  : 'text-foreground hover:bg-secondary/40',
                              )}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <div className="h-6 w-6 rounded-lg bg-secondary text-primary font-black text-[10px] flex items-center justify-center shrink-0">
                                  {m.homeTeam?.name ? m.homeTeam.name.charAt(0) : 'A'}
                                </div>
                                <span className="truncate font-semibold">{m.homeTeam?.name || 'Chưa xác định'}</span>
                              </div>
                              <span className="font-mono-num font-black text-sm">
                                {m.homeScore !== null && m.homeScore !== undefined ? m.homeScore : '-'}
                              </span>
                            </div>

                            {/* Away Team */}
                            <div
                              className={cn(
                                'flex items-center justify-between p-2 rounded-xl text-xs transition-colors',
                                awayWon
                                  ? 'bg-emerald-500/15 font-black text-emerald-600 dark:text-emerald-400'
                                  : 'text-foreground hover:bg-secondary/40',
                              )}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <div className="h-6 w-6 rounded-lg bg-secondary text-primary font-black text-[10px] flex items-center justify-center shrink-0">
                                  {m.awayTeam?.name ? m.awayTeam.name.charAt(0) : 'B'}
                                </div>
                                <span className="truncate font-semibold">{m.awayTeam?.name || 'Chưa xác định'}</span>
                              </div>
                              <span className="font-mono-num font-black text-sm">
                                {m.awayScore !== null && m.awayScore !== undefined ? m.awayScore : '-'}
                              </span>
                            </div>

                            {/* Quick score action button for manager */}
                            {isManager && m.status === 'READY' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMatch(m);
                                  setHomeScore(String(m.homeScore ?? 0));
                                  setAwayScore(String(m.awayScore ?? 0));
                                }}
                                className="w-full mt-1 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold transition-all cursor-pointer text-center"
                              >
                                Nhập Tỷ Số Trận Này
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: TEAMS LIST */}
      {activeTab === 'TEAMS' && (
        <Card className="p-6 border border-border/80 bg-card shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/50">
            <div>
              <h3 className="text-base font-black text-foreground">Danh Sách Câu Lạc Bộ Ghi Danh</h3>
              <p className="text-xs text-muted-foreground">
                Tổng cộng {tournament.teams?.length || 0} / {tournament.maxTeams} đội đã xác nhận tham dự.
              </p>
            </div>

            {tournament.status === 'REGISTRATION' && (
              <Button
                size="sm"
                onClick={() => setShowRegisterModal(true)}
                className="font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20 self-start sm:self-auto"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Đăng Ký Thêm Đội</span>
              </Button>
            )}
          </div>

          {(!tournament.teams || tournament.teams.length === 0) ? (
            <div className="py-12 text-center space-y-3">
              <Users className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
              <p className="text-xs font-bold text-foreground">Chưa có đội nào đăng ký</p>
              <p className="text-xs text-muted-foreground">Hãy bấm &quot;Đăng Ký Đội Vào Giải&quot; để ghi danh đội của bạn.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {tournament.teams?.map((tt, idx) => (
                <div
                  key={tt.id}
                  className="p-4 rounded-2xl bg-secondary/30 border border-border/60 flex items-center justify-between gap-3 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shadow-xs">
                      {tt.team?.name ? tt.team.name.charAt(0).toUpperCase() : 'T'}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">{tt.team?.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Đội trưởng: {tt.captainName || tt.team?.captain?.fullName || 'Trần Đức'}</span>
                      </p>
                      {tt.contactPhone && (
                        <p className="text-[10px] text-muted-foreground font-mono-num flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" />
                          <span>{tt.contactPhone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase font-mono-num shrink-0">
                    Seed #{tt.seed || idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: MATCHES & SCORE ENTRY */}
      {activeTab === 'MATCHES' && (
        <Card className="p-6 border border-border/80 bg-card shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/50">
            <div>
              <h3 className="text-base font-black text-foreground">Lịch Thi Đấu & Nhập Tỷ Số Trực Tiếp</h3>
              <p className="text-xs text-muted-foreground">Theo dõi và cập nhật kết quả từng trận đấu theo thời gian thực.</p>
            </div>

            {/* Round Filter Tabs */}
            {rounds.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setRoundFilter('ALL')}
                  className={cn(
                    'px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all',
                    roundFilter === 'ALL'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground',
                  )}
                >
                  Tất Cả Vòng
                </button>
                {rounds.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoundFilter(r)}
                    className={cn(
                      'px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all',
                      roundFilter === r
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Vòng {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {(!tournament.matches || tournament.matches.length === 0) ? (
            <div className="py-12 text-center space-y-3">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
              <p className="text-xs font-bold text-foreground">Chưa có lịch thi đấu</p>
              <p className="text-xs text-muted-foreground">
                Lịch thi đấu sẽ tự động được tạo khi Ban tổ chức bấm &quot;Khởi Tranh &amp; Sinh Nhánh Đấu&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tournament.matches
                .filter((m) => roundFilter === 'ALL' || m.round === roundFilter)
                .map((m) => {
                  const isDone = m.status === 'DONE';

                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'p-5 rounded-2xl border bg-card transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6',
                        isDone ? 'border-border/70' : 'border-primary/40 bg-primary/5',
                      )}
                    >
                      {/* Left: Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase">
                            Vòng {m.round} · Trận #{m.position}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[9px] font-black uppercase',
                              isDone
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : m.status === 'READY'
                                ? 'bg-amber-500/15 text-amber-500'
                                : 'bg-secondary text-muted-foreground',
                            )}
                          >
                            {isDone ? 'Đã Kết Thúc' : m.status === 'READY' ? 'Sẵn Sàng Đấu' : 'Chờ Nhánh'}
                          </span>
                        </div>

                        {m.matchTime && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            <span>{m.matchTime}</span>
                          </p>
                        )}
                      </div>

                      {/* Center: Big Match Scoreboard */}
                      <div className="flex items-center justify-center gap-6 text-center">
                        <div className="space-y-1 w-32 sm:w-40 text-right">
                          <p className="text-xs sm:text-sm font-black text-foreground truncate">
                            {m.homeTeam?.name || 'Đội A'}
                          </p>
                          <span className="text-[10px] text-muted-foreground block">
                            {m.homeTeam?.captainName ? `HLV: ${m.homeTeam.captainName}` : 'Chủ nhà'}
                          </span>
                        </div>

                        <div className="px-4 py-2 rounded-2xl bg-secondary/80 border border-border/60 text-base sm:text-xl font-mono-num font-black text-primary shadow-inner">
                          {m.homeScore !== null && m.homeScore !== undefined ? m.homeScore : '-'}
                          <span className="mx-2 text-muted-foreground text-sm font-normal">:</span>
                          {m.awayScore !== null && m.awayScore !== undefined ? m.awayScore : '-'}
                        </div>

                        <div className="space-y-1 w-32 sm:w-40 text-left">
                          <p className="text-xs sm:text-sm font-black text-foreground truncate">
                            {m.awayTeam?.name || 'Đội B'}
                          </p>
                          <span className="text-[10px] text-muted-foreground block">
                            {m.awayTeam?.captainName ? `HLV: ${m.awayTeam.captainName}` : 'Đội khách'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Action */}
                      <div className="flex items-center justify-end">
                        {isManager && m.status !== 'DONE' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedMatch(m);
                              setHomeScore(String(m.homeScore ?? 0));
                              setAwayScore(String(m.awayScore ?? 0));
                            }}
                            className="text-xs font-bold gap-1 shadow-xs"
                          >
                            <span>Nhập Tỷ Số</span>
                          </Button>
                        )}
                        {isDone && m.winnerTeam && (
                          <div className="text-right">
                            <span className="text-[10px] text-muted-foreground font-bold block">Thắng trận:</span>
                            <span className="text-xs font-black text-emerald-500">{m.winnerTeam.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      )}

      {/* Modal Đăng Ký Đội Vào Giải */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-black text-foreground">Đăng Ký Đội Vào Giải Đấu</CardTitle>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {!isUserCaptain ? (
                /* Warning for non-captain users */
                <div className="py-6 text-center space-y-4">
                  <div className="h-14 w-14 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto shadow-inner">
                    <ShieldAlert className="h-7 w-7" />
                  </div>
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h4 className="text-sm font-black text-foreground">Chỉ Đội Trưởng Mới Được Đăng Ký</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Theo quy chế giải đấu và ràng buộc hệ thống, chỉ thành viên giữ vai trò <strong>Đội Trưởng (CAPTAIN)</strong> của Câu lạc bộ mới có quyền ghi danh đội bóng tham gia.
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60 text-xs text-muted-foreground">
                    Bạn hiện chưa là Đội trưởng của CLB nào trên hệ thống.
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRegisterModal(false)}
                    className="text-xs font-bold"
                  >
                    Đã Hiểu &amp; Đóng
                  </Button>
                </div>
              ) : (
                /* Captain Registration Form */
                <>
                  {/* Summary Strip */}
                  <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-bold">Giải Đấu:</span>
                      <span className="font-black text-foreground">{tournament.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-bold">Hạn Chót Đăng Ký:</span>
                      <span className="font-bold text-amber-500">
                        {tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toLocaleDateString('vi-VN') : '28/08/2026'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-bold">Lệ Phí Đặt Cọc:</span>
                      <span className="font-mono-num font-black text-primary text-sm">
                        {formatVND(tournament.entryFee || 500000)}
                      </span>
                    </div>
                  </div>

                  {actionMsg && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{actionMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegisterTeam} className="space-y-4">
                    {/* Team Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground block">
                        Chọn CLB Của Bạn (Quyền Đội Trưởng) <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                      >
                        {captainTeams.map((m) => (
                          <option key={m.team.id} value={m.team.id}>
                            {m.team.name} ({m.team.sportType}) - Đội Trưởng
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground block">
                        Phương Thức Đặt Cọc Lệ Phí Giải <span className="text-destructive">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('WALLET')}
                          className={cn(
                            'p-3 rounded-2xl border text-left space-y-1 transition-all cursor-pointer flex flex-col justify-between',
                            paymentMethod === 'WALLET'
                              ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                              : 'border-border/60 bg-secondary/30 hover:border-border',
                          )}
                        >
                          <div className="flex items-center gap-2 text-primary font-bold text-xs">
                            <Wallet className="h-4 w-4 shrink-0" />
                            <span>Ví SanGo</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block">Trừ trực tiếp số dư ví</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('QR')}
                          className={cn(
                            'p-3 rounded-2xl border text-left space-y-1 transition-all cursor-pointer flex flex-col justify-between',
                            paymentMethod === 'QR'
                              ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                              : 'border-border/60 bg-secondary/30 hover:border-border',
                          )}
                        >
                          <div className="flex items-center gap-2 text-primary font-bold text-xs">
                            <QrCode className="h-4 w-4 shrink-0" />
                            <span>Mã QR Chuyển Khoản</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block">VietQR mọi ngân hàng</span>
                        </button>
                      </div>

                      {/* Payment Option Details */}
                      {paymentMethod === 'WALLET' ? (
                        <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Số dư Ví SanGo hiện có:</span>
                            <span className="font-mono-num font-black text-foreground">2.450.000 đ</span>
                          </div>
                          <div className="flex items-center justify-between text-destructive">
                            <span>Khấu trừ đặt cọc:</span>
                            <span className="font-mono-num font-bold">-{formatVND(tournament.entryFee || 500000)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-2.5 text-xs text-center">
                          <div className="h-28 w-28 mx-auto bg-white p-2 rounded-2xl border border-border shadow-xs flex items-center justify-center">
                            <QrCode className="h-24 w-24 text-slate-900" />
                          </div>
                          <div className="space-y-0.5 text-left text-[11px] bg-background/80 p-2.5 rounded-xl border border-border/40">
                            <p><strong className="text-foreground">Ngân hàng:</strong> MB Bank (Quân Đội)</p>
                            <p><strong className="text-foreground">Số tài khoản:</strong> <span className="font-mono-num font-bold text-primary">0912345678</span></p>
                            <p><strong className="text-foreground">Chủ tài khoản:</strong> SANGO TOURNAMENT COMMITTEE</p>
                            <p><strong className="text-foreground">Nội dung CK:</strong> <span className="font-mono-num font-bold text-amber-500">GIAI {tournament.id.toUpperCase().slice(0, 6)}</span></p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Captain Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground block">Tên Đội Trưởng</label>
                        <Input
                          value={captainName}
                          onChange={(e) => setCaptainName(e.target.value)}
                          required
                          className="h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground block">Số Điện Thoại Liên Hệ</label>
                        <Input
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          required
                          className="h-10 text-xs font-mono-num"
                        />
                      </div>
                    </div>

                    {/* Fair-play agreement */}
                    <div className="p-3 rounded-2xl bg-secondary/30 border border-border/50 space-y-2">
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-0.5 rounded border-input text-primary focus:ring-primary cursor-pointer"
                        />
                        <span className="text-muted-foreground leading-relaxed text-[11px]">
                          Tôi cam kết đội bóng thi đấu đúng giờ, nộp cọc lệ phí đầy đủ, tuân thủ điều lệ giải đấu và tinh thần thể thao Fair-play.
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRegisterModal(false)}
                        className="text-xs font-bold"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        disabled={isRegistering || !agreeTerms || !selectedTeamId}
                        size="sm"
                        className="font-bold text-xs shadow-md shadow-emerald-500/20"
                      >
                        {isRegistering ? 'Đang xử lý cọc...' : 'Xác Nhận Đặt Cọc & Đăng Ký Đội'}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Nhập Tỷ Số Trận Đấu */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150">
            <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-black text-foreground">
                Nhập Điểm: Vòng {selectedMatch.round} · Trận #{selectedMatch.position}
              </CardTitle>
              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSaveScore} className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block truncate">
                      {selectedMatch.homeTeam?.name || 'Đội A'}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      required
                      className="h-12 text-center text-xl font-mono-num font-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block truncate">
                      {selectedMatch.awayTeam?.name || 'Đội B'}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      required
                      className="h-12 text-center text-xl font-mono-num font-black"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  Thể thức loại trực tiếp: Đội chiến thắng sẽ tự động được đẩy vào nhánh vòng kế tiếp.
                </p>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMatch(null)}
                    className="text-xs font-bold"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdatingScore}
                    size="sm"
                    className="font-bold text-xs shadow-md shadow-emerald-500/20"
                  >
                    {isUpdatingScore ? 'Đang lưu...' : 'Xác Nhận Kết Quả'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Auth Modal for Guests */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowRegisterModal(true)}
        title="Đăng Nhập Để Ghi Danh Giải Đấu"
        subtitle="Vui lòng đăng nhập tài khoản Đội trưởng để ghi danh và đặt cọc lệ phí thi đấu."
      />
    </div>
  );
}
