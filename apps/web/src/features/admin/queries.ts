import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { approveVenue, fetchAdminVenues, rejectVenue, type AdminVenuesFilters } from './api';
import type { AdminVenueItem } from './types';

export function useAdminVenues(
  filters: AdminVenuesFilters,
): ReturnType<typeof useQuery<{ items: AdminVenueItem[]; total: number }>> {
  return useQuery({
    queryKey: ['admin', 'venues', filters],
    queryFn: () => fetchAdminVenues(filters),
  });
}

function useInvalidateAdmin(): () => void {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['admin'] });
    void qc.invalidateQueries({ queryKey: ['public'] });
  };
}

export function useApproveVenue() {
  const invalidate = useInvalidateAdmin();
  return useMutation({ mutationFn: (id: string) => approveVenue(id), onSuccess: invalidate });
}

export function useRejectVenue() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectVenue(id, reason),
    onSuccess: invalidate,
  });
}
