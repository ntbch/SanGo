/** Lớp gọi API F7 Giải đấu — khớp tournaments.controller.ts + match controller. */
import { apiFetch } from '../../lib/api/client';
import { endpoints } from '../../lib/api/endpoints';
import type { TournamentDetail, TournamentListItem, TournamentMatchItem } from './types';

/** GET /tournaments — danh sách giải kèm champion và số đội. */
export async function fetchTournaments(): Promise<TournamentListItem[]> {
  const raw = await apiFetch<
    Array<TournamentListItem & { _count?: { teams?: number }; teamCount?: number }>
  >(endpoints.tournaments.list());
  return raw.map((t) => ({ ...t, teamCount: t.teamCount ?? t._count?.teams ?? 0 }));
}

/** GET /tournaments/:id — chi tiết giải + bracket đầy đủ. */
export function fetchTournament(id: string): Promise<TournamentDetail> {
  return apiFetch<TournamentDetail>(endpoints.tournaments.detail(id));
}

/** POST /tournaments — tạo giải (OWNER/ADMIN). */
export function createTournament(payload: {
  name: string;
  description?: string;
  sportType: string;
}): Promise<TournamentListItem> {
  return apiFetch<TournamentListItem>(endpoints.tournaments.create(), {
    method: 'POST',
    body: payload,
  });
}

/** POST /tournaments/:id/register — captain đăng ký đội (REGISTRATION). */
export function registerTeam(tournamentId: string, teamId: string): Promise<unknown> {
  return apiFetch(endpoints.tournaments.register(tournamentId), {
    method: 'POST',
    body: { teamId },
  });
}

/** POST /tournaments/:id/start — khóa đăng ký + sinh bracket (host/admin). */
export function startTournament(id: string): Promise<TournamentDetail> {
  return apiFetch<TournamentDetail>(endpoints.tournaments.start(id), { method: 'POST' });
}

/** PATCH /matches/:id/score — nhập tỷ số trận READY (host/admin). */
export function updateMatchScore(
  matchId: string,
  payload: { homeScore: number; awayScore: number },
): Promise<TournamentMatchItem> {
  return apiFetch<TournamentMatchItem>(endpoints.tournamentMatches.updateScore(matchId), {
    method: 'PATCH',
    body: payload,
  });
}
