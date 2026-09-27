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
  const [teamSession, setTeamSession] = React.useState<{ userId: string; teams: MyTeamMembership[] } | null>(null);
  const [teamsError, setTeamsError] = React.useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  // Modals & Action States
  const [showRegisterModal, setShowRegisterModal] = React.useState(false);
  const [selectedTeamId, setSelectedTeamId] = React.useState('');
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
      setTournament(await getTournamentDetailApi(id));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);

  React.useEffect(() => {
    let active = true;
    setTeamSession(null);
    setSelectedTeamId('');
    setActionMsg(null);
    setTeamsError(null);
    if (!user?.id) {
      setShowRegisterModal(false);
      return;
    }
    const userId = user.id;
    listMyTeamsApi().then((teams) => {
      if (active) setTeamSession({ userId, teams });
    }).catch(() => {
      if (active) setTeamsError('Không tải được đội của bạn. Vui lòng tải lại trang để thử lại.');
    });
    return () => { active = false; };
  }, [user?.id]);

  const captainTeams = (teamSession?.userId === user?.id ? teamSession?.teams ?? [] : []).filter(
    (m) => m.status === 'ACTIVE' && m.role === 'CAPTAIN' && m.team.sportType === tournament?.sportType
      && !tournament?.teams?.some((entry) => entry.teamId === m.team.id),
  );
  const registrationTeamId = captainTeams.some((m) => m.team.id === selectedTeamId)
    ? selectedTeamId : captainTeams[0]?.team.id ?? '';

  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !registrationTeamId) return;

    setIsRegistering(true);
    try {
      const nameToRegister = captainTeams.find((m) => m.team.id === registrationTeamId)!.team.name;
      await registerTournamentTeamApi(id, { teamId: registrationTeamId });
      setActionMsg(`Đã đăng ký CLB "${nameToRegister}" thành công!`);
      await fetchTournamentData();
      setActiveTab('TEAMS');
    } catch {
      setActionMsg('Đăng ký không thành công, thử lại.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleStartTournament = async () => {
    if (!id || !window.confirm('Bắt đầu giải? Hệ thống sinh nhánh đấu tự động.')) return;
    await startTournamentApi(id);
    await fetchTournamentData();
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    const h = parseInt(homeScore, 10);
    const a = parseInt(awayScore, 10);
    if (h === a) {
      alert('Loại trực tiếp không nhận tỷ số hòa.');
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
        <div className="h-8 w-48 bg-muted rounded mx-auto" />
        <p className="text-xs text-muted-foreground">Đang tải thông tin giải đấu...</p>
      </div>
    );
  }

  const isManager = tournament.createdBy === user?.id || user?.role === UserRole.ADMIN;
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
          setActionMsg(null);
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
        onClose={() => {
          setActionMsg(null);
          setShowRegisterModal(false);
        }}
        captainTeams={captainTeams}
        selectedTeamId={registrationTeamId}
        setSelectedTeamId={setSelectedTeamId}
        isRegistering={isRegistering}
        actionMsg={actionMsg ?? teamsError ?? (user && teamSession?.userId !== user.id ? 'Đang tải đội của bạn...' : null)}
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
        onSuccess={() => {
          setActionMsg(null);
          setShowRegisterModal(true);
        }}
        title="Đăng Nhập Để Đăng Ký Giải Đấu"
        subtitle="đăng nhập tài khoản để đưa CLB tham gia giải."
      />
    </div>
  );
}
