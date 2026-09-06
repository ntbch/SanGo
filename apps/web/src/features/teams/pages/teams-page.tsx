import React from 'react';
import { Card } from '../../../components/ui/card';
import { EmptyState } from '../../../components/feedback';
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

      <div className="border-b border-border pb-4" data-testid="teams-roster-section">
        <TeamFilterBar
        sportFilter={sportFilter}
        onSportFilterChange={setSportFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-4 border border-border bg-card rounded-2xl">
              <div className="h-12 w-12 rounded-xl bg-muted/60" />
              <div className="h-4 w-3/4 bg-muted/60 rounded-md" />
              <div className="h-3 w-1/2 bg-muted/40 rounded-md" />
              <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-2">
                <div className="h-10 bg-secondary/40 rounded-xl" />
                <div className="h-10 bg-secondary/40 rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredMemberships.length === 0 ? (
        memberships.length === 0 ? (
          <EmptyState
            title="Chưa tham gia đội thể thao nào"
            description="Tạo đội mới để cùng quản lý quỹ, đặt lịch và chia tiền trận đấu."
            actionLabel="Tạo Đội Đầu Tiên"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <EmptyState
            title="Không tìm thấy đội phù hợp với bộ lọc"
            description="Thử chuyển sang bộ môn khác hoặc xóa từ khóa tìm kiếm."
            actionLabel="Xóa bộ lọc"
            onAction={() => {
              setSportFilter('ALL');
              setSearchQuery('');
            }}
          />
        )
      ) : (
        <div className="flex flex-col gap-2" data-testid="teams-roster-list">
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
