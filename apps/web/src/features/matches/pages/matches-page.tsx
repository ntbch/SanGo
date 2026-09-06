import React from 'react';
import { listOpenMatchesApi, type OpenMatch } from '../api/matches-api';
import { MatchHeader } from '../components/match-header';
import { MatchFilterBar } from '../components/match-filter-bar';
import { MatchCard } from '../components/match-card';
import { PageContainer } from '../../../components/layout/page-container';
import { EmptyState } from '../../../components/feedback';

export function MatchesPage(): React.ReactElement {
  const [matches, setMatches] = React.useState<OpenMatch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [sportFilter, setSportFilter] = React.useState('ALL');
  const [searchCity, setSearchCity] = React.useState<string>('ALL');
  const [searchDistrict, setSearchDistrict] = React.useState<string>('ALL');

  const fetchMatches = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listOpenMatchesApi({
        sportType: sportFilter === 'ALL' ? undefined : sportFilter,
        city: searchCity === 'ALL' ? undefined : searchCity,
        district: searchDistrict === 'ALL' ? undefined : searchDistrict,
      });
      setMatches(Array.isArray(data) ? data : []);
    } catch {
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [sportFilter, searchCity, searchDistrict]);

  React.useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleResetFilters = () => {
    setSportFilter('ALL');
    setSearchCity('ALL');
    setSearchDistrict('ALL');
  };

  return (
    <PageContainer>
      <MatchHeader />

      <MatchFilterBar
        sportFilter={sportFilter}
        onSportFilterChange={setSportFilter}
        searchCity={searchCity}
        onSearchCityChange={setSearchCity}
        searchDistrict={searchDistrict}
        onSearchDistrictChange={setSearchDistrict}
      />

      {isLoading ? (
        <div
          data-testid="matches-skeleton-list"
          className="flex flex-col gap-3"
          aria-busy="true"
          aria-label="Đang tải danh sách kèo"
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-border bg-card gap-4"
            >
              <div className="space-y-2 min-w-[130px]">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-6 w-28 bg-muted rounded" />
              </div>
              <div className="flex-1 space-y-2 w-full">
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-muted rounded-md" />
                  <div className="h-5 w-20 bg-muted rounded-md" />
                </div>
                <div className="h-5 w-3/4 max-w-md bg-muted rounded" />
                <div className="h-4 w-1/2 max-w-sm bg-muted rounded" />
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="space-y-1">
                  <div className="h-5 w-20 bg-muted rounded" />
                  <div className="h-6 w-24 bg-muted rounded" />
                </div>
                <div className="h-9 w-24 bg-muted rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          title="Không tìm thấy kèo thi đấu phù hợp"
          description="Thử đổi môn thể thao, khu vực tìm kiếm hoặc tạo một kèo giao lưu mới."
          actionLabel="Đặt lại bộ lọc"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="flex flex-col gap-3" data-testid="matches-list">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
