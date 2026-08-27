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

export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 'tour-1',
    name: 'SanGo Championship 2026 - Cup Mùa Hè',
    sportType: 'FOOTBALL7',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    status: 'ONGOING',
    maxTeams: 8,
    prizePool: 25000000,
    entryFee: 500000,
    registrationDeadline: '2026-08-25',
    startDate: '2026-09-01',
    rules: 'Thi đấu loại trực tiếp (Single-Elimination), mỗi hiệp 25 phút. Không có kết quả hòa.',
    createdBy: 'u-host-1',
    teams: [
      {
        id: 'tt-1',
        tournamentId: 'tour-1',
        teamId: 'team-1',
        seed: 1,
        registeredAt: '2026-08-20',
        captainName: 'Trần Đức',
        contactPhone: '0912345678',
        team: { id: 'team-1', name: 'SanGo Warriors FC', captain: { id: 'u-1', fullName: 'Trần Đức', phoneNumber: '0912345678' } },
      },
      {
        id: 'tt-2',
        tournamentId: 'tour-1',
        teamId: 'team-2',
        seed: 2,
        registeredAt: '2026-08-21',
        captainName: 'Nguyễn Thành Long',
        contactPhone: '0988776655',
        team: { id: 'team-2', name: 'Cầu Giấy Thunder', captain: { id: 'u-2', fullName: 'Nguyễn Thành Long', phoneNumber: '0988776655' } },
      },
      {
        id: 'tt-3',
        tournamentId: 'tour-1',
        teamId: 'team-3',
        seed: 3,
        registeredAt: '2026-08-22',
        captainName: 'Phạm Minh Tuấn',
        contactPhone: '0977112233',
        team: { id: 'team-3', name: 'Thanh Xuân United', captain: { id: 'u-3', fullName: 'Phạm Minh Tuấn', phoneNumber: '0977112233' } },
      },
      {
        id: 'tt-4',
        tournamentId: 'tour-1',
        teamId: 'team-4',
        seed: 4,
        registeredAt: '2026-08-23',
        captainName: 'Lê Hoàng Nam',
        contactPhone: '0966445566',
        team: { id: 'team-4', name: 'Ba Đình Knights', captain: { id: 'u-4', fullName: 'Lê Hoàng Nam', phoneNumber: '0966445566' } },
      },
    ],
    matches: [
      // Tứ kết 1
      {
        id: 'm-1',
        tournamentId: 'tour-1',
        round: 1,
        position: 1,
        matchTime: '08:00 01/09/2026',
        homeTeamId: 'team-1',
        awayTeamId: 'team-4',
        homeScore: 3,
        awayScore: 1,
        winnerTeamId: 'team-1',
        nextMatchId: 'm-3',
        status: 'DONE',
        homeTeam: { id: 'team-1', name: 'SanGo Warriors FC', captainName: 'Trần Đức' },
        awayTeam: { id: 'team-4', name: 'Ba Đình Knights', captainName: 'Lê Hoàng Nam' },
        winnerTeam: { id: 'team-1', name: 'SanGo Warriors FC' },
      },
      // Tứ kết 2
      {
        id: 'm-2',
        tournamentId: 'tour-1',
        round: 1,
        position: 2,
        matchTime: '09:30 01/09/2026',
        homeTeamId: 'team-2',
        awayTeamId: 'team-3',
        homeScore: 2,
        awayScore: 0,
        winnerTeamId: 'team-2',
        nextMatchId: 'm-3',
        status: 'DONE',
        homeTeam: { id: 'team-2', name: 'Cầu Giấy Thunder', captainName: 'Nguyễn Thành Long' },
        awayTeam: { id: 'team-3', name: 'Thanh Xuân United', captainName: 'Phạm Minh Tuấn' },
        winnerTeam: { id: 'team-2', name: 'Cầu Giấy Thunder' },
      },
      // Chung kết
      {
        id: 'm-3',
        tournamentId: 'tour-1',
        round: 2,
        position: 1,
        matchTime: '16:00 02/09/2026',
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        homeScore: null,
        awayScore: null,
        winnerTeamId: null,
        status: 'READY',
        homeTeam: { id: 'team-1', name: 'SanGo Warriors FC', captainName: 'Trần Đức' },
        awayTeam: { id: 'team-2', name: 'Cầu Giấy Thunder', captainName: 'Nguyễn Thành Long' },
      },
    ],
  },
  {
    id: 'tour-2',
    name: 'Giải Pickleball Đôi Nam Nữ Mở Rộng TP.HCM 2026',
    sportType: 'PICKLEBALL',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    status: 'REGISTRATION',
    maxTeams: 8,
    prizePool: 15000000,
    entryFee: 300000,
    registrationDeadline: '2026-09-10',
    startDate: '2026-09-15',
    rules: 'Thi đấu loại trực tiếp, áp dụng luật USAPA 2026. Mỗi trận 3 set 11 điểm.',
    createdBy: 'u-host-2',
    teams: [
      {
        id: 'tt-5',
        tournamentId: 'tour-2',
        teamId: 'team-p1',
        seed: 1,
        registeredAt: '2026-08-25',
        captainName: 'Ngô Thuỳ Linh',
        contactPhone: '0909123456',
        team: { id: 'team-p1', name: 'Sài Gòn Dinks Club', captain: { id: 'u-5', fullName: 'Ngô Thuỳ Linh', phoneNumber: '0909123456' } },
      },
      {
        id: 'tt-6',
        tournamentId: 'tour-2',
        teamId: 'team-p2',
        seed: 2,
        registeredAt: '2026-08-26',
        captainName: 'Lê Quốc Bảo',
        contactPhone: '0909887766',
        team: { id: 'team-p2', name: 'Quận 1 Pickleballers', captain: { id: 'u-6', fullName: 'Lê Quốc Bảo', phoneNumber: '0909887766' } },
      },
    ],
    matches: [],
  },
  {
    id: 'tour-3',
    name: 'Đại Chiến Cầu Lông Hà Nội Super Series',
    sportType: 'BADMINTON',
    city: 'Hà Nội',
    district: 'Ba Đình',
    status: 'FINISHED',
    maxTeams: 8,
    prizePool: 10000000,
    entryFee: 200000,
    registrationDeadline: '2026-08-05',
    startDate: '2026-08-10',
    rules: '3 set 21 điểm tính lũy tiến BWF.',
    createdBy: 'u-host-3',
    championTeamId: 'team-b1',
    championTeam: { id: 'team-b1', name: 'Ba Đình Smashers' },
    teams: [
      {
        id: 'tt-7',
        tournamentId: 'tour-3',
        teamId: 'team-b1',
        seed: 1,
        registeredAt: '2026-08-01',
        captainName: 'Lê Hoàng Nam',
        team: { id: 'team-b1', name: 'Ba Đình Smashers' },
      },
    ],
    matches: [],
  },
];

export async function listTournamentsApi(): Promise<Tournament[]> {
  try {
    const raw = await apiClient<Tournament[]>('/tournaments');
    return Array.isArray(raw) && raw.length > 0 ? raw : MOCK_TOURNAMENTS;
  } catch {
    return MOCK_TOURNAMENTS;
  }
}

export async function getTournamentDetailApi(id: string): Promise<Tournament> {
  try {
    const raw = await apiClient<Tournament>(`/tournaments/${id}`);
    if (raw && raw.id) return raw;
    const found = MOCK_TOURNAMENTS.find((t) => t.id === id);
    return found || MOCK_TOURNAMENTS[0];
  } catch {
    const found = MOCK_TOURNAMENTS.find((t) => t.id === id);
    return found || { ...MOCK_TOURNAMENTS[0], id };
  }
}

export async function createTournamentApi(data: CreateTournamentDto): Promise<Tournament> {
  try {
    const created = await apiClient<Tournament>('/tournaments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (created && created.id) {
      MOCK_TOURNAMENTS.unshift(created);
      return created;
    }
  } catch {
    // fallback
  }

  const newTour: Tournament = {
    id: `tour-${Date.now()}`,
    name: data.name,
    sportType: data.sportType,
    city: data.city,
    district: data.district || 'Cầu Giấy',
    status: 'REGISTRATION',
    maxTeams: data.maxTeams,
    prizePool: data.prizePool || 0,
    entryFee: data.entryFee || 0,
    registrationDeadline: data.registrationDeadline || '2026-09-05',
    startDate: data.startDate || '2026-09-10',
    rules: data.rules || 'Thi đấu loại trực tiếp (Single-Elimination)',
    createdBy: 'u-current',
    teams: [],
    matches: [],
  };
  MOCK_TOURNAMENTS.unshift(newTour);
  return newTour;
}

export async function registerTournamentTeamApi(
  tournamentId: string,
  data: RegisterTournamentTeamDto,
): Promise<any> {
  try {
    const res = await apiClient(`/tournaments/${tournamentId}/register`, {
      method: 'POST',
      body: JSON.stringify({ teamId: data.teamId }),
    });
    // Update in-memory state
    updateMockRegister(tournamentId, data);
    return res;
  } catch {
    updateMockRegister(tournamentId, data);
    return { success: true, message: 'Đăng ký tham gia giải thành công' };
  }
}

function updateMockRegister(tournamentId: string, data: RegisterTournamentTeamDto) {
  const tour = MOCK_TOURNAMENTS.find((t) => t.id === tournamentId);
  if (!tour) return;
  if (!tour.teams) tour.teams = [];
  const existing = tour.teams.find((t) => t.teamId === data.teamId);
  if (!existing) {
    const newSeed = tour.teams.length + 1;
    const entry: TournamentTeamEntry = {
      id: `tt-${Date.now()}`,
      tournamentId,
      teamId: data.teamId,
      seed: newSeed,
      registeredAt: new Date().toISOString().split('T')[0],
      captainName: data.captainName || 'Đội Trưởng',
      contactPhone: data.contactPhone || '0912345678',
      team: {
        id: data.teamId,
        name: data.teamName || `Đội ${newSeed}`,
        captain: {
          id: 'u-cap',
          fullName: data.captainName || 'Đội Trưởng',
          phoneNumber: data.contactPhone || '0912345678',
        },
      },
    };
    tour.teams.push(entry);
  }
}

export async function startTournamentApi(tournamentId: string): Promise<any> {
  try {
    const res = await apiClient(`/tournaments/${tournamentId}/start`, {
      method: 'POST',
    });
    updateMockStart(tournamentId);
    return res;
  } catch {
    updateMockStart(tournamentId);
    return { success: true, message: 'Đã khởi tranh giải đấu và sinh nhánh cây' };
  }
}

function updateMockStart(tournamentId: string) {
  const tour = MOCK_TOURNAMENTS.find((t) => t.id === tournamentId);
  if (!tour) return;
  tour.status = 'ONGOING';
  if (!tour.teams || tour.teams.length === 0) return;

  const teamList = tour.teams;
  const numTeams = Math.max(teamList.length, 4);

  // Generate Round 1 (Tứ kết or Bán kết)
  const matches: TournamentMatch[] = [];
  if (numTeams <= 4) {
    // 2 Semi-finals + 1 Final
    matches.push({
      id: `m-${tournamentId}-1`,
      tournamentId,
      round: 1,
      position: 1,
      matchTime: '08:00 Ngày Khai Mạc',
      homeTeamId: teamList[0]?.teamId || null,
      awayTeamId: teamList[3]?.teamId || teamList[1]?.teamId || null,
      homeScore: null,
      awayScore: null,
      nextMatchId: `m-${tournamentId}-3`,
      status: 'READY',
      homeTeam: teamList[0] ? { id: teamList[0].teamId, name: teamList[0].team.name } : null,
      awayTeam: teamList[1] ? { id: teamList[1].teamId, name: teamList[1].team.name } : null,
    });
    matches.push({
      id: `m-${tournamentId}-2`,
      tournamentId,
      round: 1,
      position: 2,
      matchTime: '09:30 Ngày Khai Mạc',
      homeTeamId: teamList[1]?.teamId || null,
      awayTeamId: teamList[2]?.teamId || null,
      homeScore: null,
      awayScore: null,
      nextMatchId: `m-${tournamentId}-3`,
      status: 'READY',
      homeTeam: teamList[2] ? { id: teamList[2].teamId, name: teamList[2].team.name } : null,
      awayTeam: teamList[3] ? { id: teamList[3].teamId, name: teamList[3].team.name } : null,
    });
    // Final
    matches.push({
      id: `m-${tournamentId}-3`,
      tournamentId,
      round: 2,
      position: 1,
      matchTime: '15:00 Ngày Bế Mạc',
      homeTeamId: null,
      awayTeamId: null,
      homeScore: null,
      awayScore: null,
      status: 'PENDING',
    });
  }
  tour.matches = matches;
}

export async function updateTournamentMatchScoreApi(
  matchId: string,
  data: UpdateMatchScoreDto,
): Promise<any> {
  try {
    const res = await apiClient(`/matches/${matchId}/score`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    updateMockScore(matchId, data);
    return res;
  } catch {
    updateMockScore(matchId, data);
    return { success: true, message: 'Cập nhật tỷ số thành công' };
  }
}

function updateMockScore(matchId: string, data: UpdateMatchScoreDto) {
  for (const tour of MOCK_TOURNAMENTS) {
    if (!tour.matches) continue;
    const match = tour.matches.find((m) => m.id === matchId);
    if (match) {
      match.homeScore = data.homeScore;
      match.awayScore = data.awayScore;
      const winnerId = data.homeScore > data.awayScore ? match.homeTeamId : match.awayTeamId;
      const winnerName =
        data.homeScore > data.awayScore
          ? match.homeTeam?.name || 'Đội A'
          : match.awayTeam?.name || 'Đội B';

      match.winnerTeamId = winnerId;
      match.winnerTeam = { id: winnerId || '', name: winnerName };
      match.status = 'DONE';

      if (match.nextMatchId) {
        const nextMatch = tour.matches.find((m) => m.id === match.nextMatchId);
        if (nextMatch) {
          const isHome = match.position % 2 === 1;
          if (isHome) {
            nextMatch.homeTeamId = winnerId;
            nextMatch.homeTeam = { id: winnerId || '', name: winnerName };
          } else {
            nextMatch.awayTeamId = winnerId;
            nextMatch.awayTeam = { id: winnerId || '', name: winnerName };
          }
          if (nextMatch.homeTeamId && nextMatch.awayTeamId) {
            nextMatch.status = 'READY';
          }
        }
      } else {
        // Final match: set champion
        tour.championTeamId = winnerId;
        tour.championTeam = { id: winnerId || '', name: winnerName };
        tour.status = 'FINISHED';
      }
      break;
    }
  }
}
