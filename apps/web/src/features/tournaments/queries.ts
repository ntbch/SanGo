/** TanStack Query hooks cho F7 Giải đấu. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createTournament,
  fetchTournament,
  fetchTournaments,
  registerTeam,
  startTournament,
  updateMatchScore,
} from './api';

/** Danh sách giải đấu. */
export function useTournaments() {
  return useQuery({ queryKey: ['tournaments', 'list'], queryFn: fetchTournaments });
}

/** Chi tiết giải + bracket. */
export function useTournament(id: string | undefined) {
  return useQuery({
    queryKey: ['tournaments', 'detail', id],
    queryFn: () => fetchTournament(id as string),
    enabled: Boolean(id),
  });
}

function invalidateTournaments(qc: ReturnType<typeof useQueryClient>): void {
  void qc.invalidateQueries({ queryKey: ['tournaments'] });
}

/** Tạo giải mới (OWNER/ADMIN) — trả giải để điều hướng sang chi tiết. */
export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createTournament, onSuccess: () => invalidateTournaments(qc) });
}

/** Captain đăng ký đội vào giải REGISTRATION. */
export function useRegisterTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tournamentId, teamId }: { tournamentId: string; teamId: string }) =>
      registerTeam(tournamentId, teamId),
    onSuccess: () => invalidateTournaments(qc),
  });
}

/** Host/admin khóa đăng ký + sinh bracket. */
export function useStartTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => startTournament(id),
    onSuccess: () => invalidateTournaments(qc),
  });
}

/** Host/admin nhập tỷ số trận READY — winner tự đẩy sang vòng sau. */
export function useUpdateMatchScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      matchId,
      homeScore,
      awayScore,
    }: {
      matchId: string;
      homeScore: number;
      awayScore: number;
    }) => updateMatchScore(matchId, { homeScore, awayScore }),
    onSuccess: () => invalidateTournaments(qc),
  });
}
