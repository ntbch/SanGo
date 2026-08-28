import React from 'react';
import { useParams } from 'react-router-dom';
import {
  getTournamentDetailApi,
  registerTournamentTeamApi,
  startTournamentApi,
  updateTournamentMatchScoreApi,
  type Tournament,
  type TournamentMatch,
} from '../api/tournaments-api';
import { listMyTeamsApi, type MyTeamMembership } from '../../teams/api/teams-api';
import { useAuthStore } from '../../../lib/auth-store';
import { UserRole } from '../../../lib/constants';
import { AuthModal } from '../../../components/auth/auth-modal';
import { TournamentHeroHeader } from '../components/tournament-hero-header';
import { TournamentTabs } from '../components/tournament-tabs';
import { TournamentBracketTree } from '../components/tournament-bracket-tree';
import { TournamentRegisteredTeamsTab } from '../components/tournament-registered-teams-tab';
import { TournamentMatchesTab } from '../components/tournament-matches-tab';
import { TournamentRegisterModal } from '../components/tournament-register-modal';
import { TournamentScoreModal } from '../components/tournament-score-modal';

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
      <TournamentHeroHeader
        tournament={tournament}
        isManager={isManager}
        onOpenRegisterModal={() => {
          if (!user) {
            setShowAuthModal(true);
            return;
          }
          setShowRegisterModal(true);
        }}
        onStartTournament={handleStartTournament}
      />

      <TournamentTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        teamCount={tournament.teams?.length || 0}
      />

      {activeTab === 'BRACKET' && (
        <TournamentBracketTree
          rounds={rounds}
          matchesByRound={matchesByRound}
          isManager={isManager}
          onSelectMatchToScore={(m) => {
            setSelectedMatch(m);
            setHomeScore(String(m.homeScore ?? 0));
            setAwayScore(String(m.awayScore ?? 0));
          }}
        />
      )}

      {activeTab === 'TEAMS' && (
        <TournamentRegisteredTeamsTab teams={tournament.teams} />
      )}

      {activeTab === 'MATCHES' && (
        <TournamentMatchesTab
          matches={tournament.matches}
          isManager={isManager}
          onSelectMatchToScore={(m) => {
            setSelectedMatch(m);
            setHomeScore(String(m.homeScore ?? 0));
            setAwayScore(String(m.awayScore ?? 0));
          }}
        />
      )}

      <TournamentRegisterModal
        show={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        tournament={tournament}
        captainTeams={captainTeams}
        selectedTeamId={selectedTeamId}
        setSelectedTeamId={setSelectedTeamId}
        captainName={captainName}
        setCaptainName={setCaptainName}
        contactPhone={contactPhone}
        setContactPhone={setContactPhone}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        agreeTerms={agreeTerms}
        setAgreeTerms={setAgreeTerms}
        isRegistering={isRegistering}
        actionMsg={actionMsg}
        onSubmit={handleRegisterTeam}
      />

      <TournamentScoreModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        homeScore={homeScore}
        onHomeScoreChange={setHomeScore}
        awayScore={awayScore}
        onAwayScoreChange={setAwayScore}
        isUpdatingScore={isUpdatingScore}
        onSubmit={handleSaveScore}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowRegisterModal(true)}
        title="Đăng Nhập Để Đăng Ký Giải Đấu"
        subtitle="Vui lòng đăng nhập tài khoản để đưa câu lạc bộ của bạn tham gia giải đấu."
      />
    </div>
  );
}
