import { apiClient } from '../../../lib/api-client';

export type TournamentStatus = 'REGISTRATION' | 'ONGOING' | 'FINISHED';
export type TournamentMatchStatus = 'PENDING' | 'READY' | 'DONE';

export interface TournamentTeamEntry {
  id: string;
  tournamentId: string;
  teamId: string;
  seed?: number | null;
  registeredAt: string;
  contactPhone?: string;
  captainName?: string;
  team: {
    id: string;
    name: string;
    logoUrl?: string | null;
    captain?: {
      id: string;
      fullName: string;
      phoneNumber?: string;
    };
  };
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;
  position: number;
  matchTime?: string;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  winnerTeamId?: string | null;
  nextMatchId?: string | null;
  status: TournamentMatchStatus;
  homeTeam?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    captainName?: string;
  } | null;
  awayTeam?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    captainName?: string;
  } | null;
  winnerTeam?: {
    id: string;
    name: string;
  } | null;
}

export interface Tournament {
  id: string;
  name: string;
  sportType: string;
  city: string;
  district?: string;
  status: TournamentStatus;
  maxTeams: number;
  bannerUrl?: string | null;
  prizePool?: number;
  registrationDeadline?: string;
  startDate?: string;
  endDate?: string;
  rules?: string;
  entryFee?: number;
  createdBy: string;
  championTeamId?: string | null;
  championTeam?: {
    id: string;
    name: string;
  } | null;
  teams?: TournamentTeamEntry[];
  matches?: TournamentMatch[];
}

export interface CreateTournamentDto {
  name: string;
  sportType: string;
  city: string;
  district?: string;
  maxTeams: number;
  prizePool?: number;
  entryFee?: number;
  registrationDeadline?: string;
  startDate?: string;
  rules?: string;
}

export interface RegisterTournamentTeamDto {
  teamId: string;
  contactPhone?: string;
  captainName?: string;
  teamName?: string;
}

export interface UpdateMatchScoreDto {
  homeScore: number;
  awayScore: number;
}

export async function listTournamentsApi(): Promise<Tournament[]> {
  return apiClient<Tournament[]>('/tournaments');
}

export async function getTournamentDetailApi(id: string): Promise<Tournament> {
  return apiClient<Tournament>(`/tournaments/${id}`);
}

export async function createTournamentApi(data: CreateTournamentDto): Promise<Tournament> {
  return apiClient<Tournament>('/tournaments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function registerTournamentTeamApi(
  tournamentId: string,
  data: RegisterTournamentTeamDto,
): Promise<any> {
  return apiClient(`/tournaments/${tournamentId}/register`, {
    method: 'POST',
    body: JSON.stringify({ teamId: data.teamId }),
  });
}

export async function startTournamentApi(tournamentId: string): Promise<any> {
  return apiClient(`/tournaments/${tournamentId}/start`, {
    method: 'POST',
  });
}

export async function updateTournamentMatchScoreApi(
  matchId: string,
  data: UpdateMatchScoreDto,
): Promise<any> {
  return apiClient(`/matches/${matchId}/score`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
