import React from 'react';
import { Card } from '../../../components/ui/card';
import { listOpenMatchesApi, type OpenMatch } from '../api/matches-api';
import { MatchHeader } from '../components/match-header';
import { MatchFilterBar } from '../components/match-filter-bar';
import { MatchCard } from '../components/match-card';
import { PageContainer } from '../../../components/layout/page-container';

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-4 animate-pulse">
              <div className="h-6 w-1/3 bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-10 bg-muted rounded-xl" />
            </Card>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-border/80 space-y-3">
          <p className="text-sm font-bold text-foreground">Không tìm thấy kèo thi đấu phù hợp</p>
          <p className="text-xs text-muted-foreground">Thử đổi môn hoặc khu vực.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
