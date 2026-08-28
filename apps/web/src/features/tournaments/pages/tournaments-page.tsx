import React from 'react';
import { Card } from '../../../components/ui/card';
import {
  listTournamentsApi,
  createTournamentApi,
  type Tournament,
} from '../api/tournaments-api';
import { useAuthStore } from '../../../lib/auth-store';
import { AuthModal } from '../../../components/auth/auth-modal';
import { TournamentHeader } from '../components/tournament-header';
import { TournamentFilterBar } from '../components/tournament-filter-bar';
import { TournamentCard } from '../components/tournament-card';
import { TournamentCreateModal } from '../components/tournament-create-modal';

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

  const filteredTournaments = tournaments.filter((t) => {
    const matchesSport = sportFilter === 'ALL' || t.sportType.includes(sportFilter);
    const matchesCity = cityFilter === 'ALL' || t.city === cityFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSport && matchesCity && matchesStatus;
  });

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-10 space-y-8 max-w-7xl mx-auto">
      <TournamentHeader
        onCreateTournament={() => {
          if (!user) {
            setShowAuthModal(true);
            return;
          }
          setShowCreateModal(true);
        }}
      />

      <TournamentFilterBar
        sportFilter={sportFilter}
        onSportFilterChange={setSportFilter}
        cityFilter={cityFilter}
        onCityFilterChange={setCityFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

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
          {filteredTournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}

      <TournamentCreateModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        name={name}
        onNameChange={setName}
        sportType={sportType}
        onSportTypeChange={setSportType}
        city={city}
        onCityChange={setCity}
        maxTeams={maxTeams}
        onMaxTeamsChange={setMaxTeams}
        prizePool={prizePool}
        onPrizePoolChange={setPrizePool}
        entryFee={entryFee}
        onEntryFeeChange={setEntryFee}
        registrationDeadline={registrationDeadline}
        onRegistrationDeadlineChange={setRegistrationDeadline}
        startDate={startDate}
        onStartDateChange={setStartDate}
        rules={rules}
        onRulesChange={setRules}
        isSubmitting={isSubmitting}
        onSubmit={handleCreateTournament}
      />

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
