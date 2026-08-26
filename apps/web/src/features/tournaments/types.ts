/**
 * Kiểu dữ liệu F7 Giải đấu (Sprint 3) — khớp tournaments.controller.ts:
 * 8 đội single-elimination tự sinh bracket, nhập điểm tay host/admin,
 * v1 KHÔNG gắn booking sân.
 */

export type TournamentStatus = 'REGISTRATION' | 'ONGOING' | 'FINISHED';
export type TournamentMatchStatus = 'PENDING' | 'READY' | 'DONE';

/** Thông tin đội rút gọn trong bracket/danh sách. */
export interface TeamBrief {
  id: string;
  name: string;
  logoUrl?: string | null;
}

/** Một dòng danh sách giải — _count.teams được map thành teamCount ở api.ts. */
export interface TournamentListItem {
  id: string;
  name: string;
  description?: string | null;
  sportType: string;
  maxTeams: number;
  status: TournamentStatus;
  createdAt: string;
  champion: TeamBrief | null;
  teamCount: number;
}

/** Lượt đăng ký đội kèm hạt giống bảng đấu. */
export interface TournamentTeamEntry {
  id: string;
  seed: number | null;
  joinedAt: string;
  team: TeamBrief;
}

/** Một trận trong bracket — round 1..3 (QF/SF/F) của giải 8 đội. */
export interface TournamentMatchItem {
  id: string;
  round: number;
  position: number;
  homeTeam: TeamBrief | null;
  awayTeam: TeamBrief | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerTeamId?: string | null;
  status: TournamentMatchStatus;
}

/** GET /tournaments/:id — chi tiết giải + bảng đấu đầy đủ. */
export interface TournamentDetail {
  id: string;
  name: string;
  description?: string | null;
  sportType: string;
  maxTeams: number;
  status: TournamentStatus;
  createdAt: string;
  createdBy: { id: string; fullName: string };
  champion: TeamBrief | null;
  teams: TournamentTeamEntry[];
  matches: TournamentMatchItem[];
}
