import React from 'react';
import {
  getClubRankingsApi,
  getAthleteRankingsApi,
  type ClubRankingItem,
  type AthleteRankingItem,
} from '../api/ranking-api';
import { RankingHeader } from '../components/ranking-header';
import { RankingFilterBar } from '../components/ranking-filter-bar';
import { RankingTabs } from '../components/ranking-tabs';
import { RankingPodium } from '../components/ranking-podium';
import { RankingLeaderboardTable } from '../components/ranking-leaderboard-table';
import { RankingSkeleton } from '../components/ranking-skeleton';
import { PageContainer } from '../../../components/layout/page-container';

export type RankingTab = 'CLUBS' | 'ATHLETES';

export function RankingPage(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<RankingTab>('CLUBS');
  const [sportFilter, setSportFilter] = React.useState('ALL');
  const [clubRankings, setClubRankings] = React.useState<ClubRankingItem[]>([]);
  const [athleteRankings, setAthleteRankings] = React.useState<AthleteRankingItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  // Phải phân biệt "hỏng mạng" với "không có dữ liệu": nếu không, lỗi tải sẽ hiện
  // empty state gợi ý đổi môn thể thao — hoàn toàn sai nguyên nhân.
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const handleResetFilters = React.useCallback(() => {
    setSportFilter('ALL');
  }, []);

  const fetchRankings = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [clubs, athletes] = await Promise.all([
        getClubRankingsApi({ sportType: sportFilter }),
        getAthleteRankingsApi({ sportType: sportFilter }),
      ]);
      setClubRankings(clubs);
      setAthleteRankings(athletes);
    } catch {
      setClubRankings([]);
      setAthleteRankings([]);
      setLoadError('Không tải được bảng xếp hạng. Vui lòng kiểm tra kết nối rồi thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [sportFilter]);

  React.useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return (
    <PageContainer>
      <RankingHeader />

      <RankingFilterBar
        sportFilter={sportFilter}
        onSportFilterChange={setSportFilter}
      />

      <RankingTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {isLoading ? (
        <RankingSkeleton />
      ) : loadError ? (
        <p role="alert" className="text-sm text-destructive">{loadError}</p>
      ) : (
        <div className="space-y-8">
          <RankingPodium
            type={activeTab}
            clubs={clubRankings}
            athletes={athleteRankings}
          />
          <RankingLeaderboardTable
            type={activeTab}
            clubRankings={clubRankings}
            athleteRankings={athleteRankings}
            onResetFilters={handleResetFilters}
          />
        </div>
      )}
    </PageContainer>
  );
}
