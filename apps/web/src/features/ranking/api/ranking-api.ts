import { apiClient } from '../../../lib/api-client';

export interface ClubRankingItem {
  rank: number;
  teamId: string;
  teamName: string;
  sportType: string;
  city: string;
  eloScore: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  titlesCount: number;
}

export interface AthleteRankingItem {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  sportType: string;
  city: string;
  reputationScore: number;
  matchesPlayed: number;
  mvpCount: number;
  fairPlayBadge: string;
}

export interface RankingFilterParams {
  sportType?: string;
  city?: string;
}

export async function getClubRankingsApi(params?: RankingFilterParams): Promise<ClubRankingItem[]> {
  const queryParams = new URLSearchParams();
  if (params?.sportType && params.sportType !== 'ALL') {
    queryParams.append('sportType', params.sportType);
  }
  const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiClient<ClubRankingItem[]>(`/ranking/clubs${qs}`);
}

export async function getAthleteRankingsApi(params?: RankingFilterParams): Promise<AthleteRankingItem[]> {
  const queryParams = new URLSearchParams();
  if (params?.sportType && params.sportType !== 'ALL') {
    queryParams.append('sportType', params.sportType);
  }
  const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiClient<AthleteRankingItem[]>(`/ranking/athletes${qs}`);
}
