import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Users } from 'lucide-react';
import {
  listMyTeamsApi,
  createTeamApi,
  type MyTeamMembership,
} from '../api/teams-api';
import { TeamHeader } from '../components/team-header';
import { TeamFilterBar } from '../components/team-filter-bar';
import { TeamCard } from '../components/team-card';
import { TeamCreateModal } from '../components/team-create-modal';
import { PageContainer } from '../../../components/layout/page-container';

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

  const filteredMemberships = memberships.filter((m) => {
    const matchesSport = sportFilter === 'ALL' || m.team.sportType.includes(sportFilter);
    const matchesQuery =
      !searchQuery.trim() || m.team.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesQuery;
  });

  return (
    <PageContainer>
      <TeamHeader onCreateTeam={() => setShowCreateModal(true)} />

      <TeamFilterBar
        sportFilter={sportFilter}
        onSportFilterChange={setSportFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

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
          {filteredMemberships.map((m) => (
            <TeamCard key={m.membershipId} membership={m} />
          ))}
        </div>
      )}

      <TeamCreateModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        name={name}
        onNameChange={setName}
        sportType={sportType}
        onSportTypeChange={setSportType}
        teamCity={teamCity}
        onTeamCityChange={setTeamCity}
        description={description}
        onDescriptionChange={setDescription}
        isSubmitting={isSubmitting}
        onSubmit={handleCreateTeam}
      />
    </PageContainer>
  );
}
