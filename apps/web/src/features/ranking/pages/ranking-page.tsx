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

export type RankingTab = 'CLUBS' | 'ATHLETES';

export function RankingPage(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<RankingTab>('CLUBS');
  const [sportFilter, setSportFilter] = React.useState('ALL');
  const [cityFilter, setCityFilter] = React.useState('ALL');
  const [clubRankings, setClubRankings] = React.useState<ClubRankingItem[]>([]);
  const [athleteRankings, setAthleteRankings] = React.useState<AthleteRankingItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchRankings = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [clubs, athletes] = await Promise.all([
        getClubRankingsApi({ sportType: sportFilter, city: cityFilter }),
        getAthleteRankingsApi({ sportType: sportFilter, city: cityFilter }),
      ]);
      setClubRankings(clubs);
      setAthleteRankings(athletes);
    } finally {
      setIsLoading(false);
    }
  }, [sportFilter, cityFilter]);

  React.useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-10 space-y-8 max-w-7xl mx-auto">
      <RankingHeader />

      <RankingFilterBar
        sportFilter={sportFilter}
        onSportFilterChange={setSportFilter}
        cityFilter={cityFilter}
        onCityFilterChange={setCityFilter}
      />

      <RankingTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {isLoading ? (
        <RankingSkeleton />
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
          />
        </div>
      )}
    </div>
  );
}
