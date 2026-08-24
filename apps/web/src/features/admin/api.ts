import { apiFetch } from '../../lib/api/client';
import { endpoints } from '../../lib/api/endpoints';

import type { AdminVenueItem } from './types';

export interface AdminVenuesFilters {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  q?: string;
}

export function fetchAdminVenues(
  filters: AdminVenuesFilters = {},
): Promise<{ items: AdminVenueItem[]; total: number }> {
  return apiFetch<{ items: AdminVenueItem[]; total: number }>(
    endpoints.admin.venues({ ...filters, page: 1 }),
  );
}

export function approveVenue(id: string): Promise<AdminVenueItem> {
  return apiFetch<AdminVenueItem>(endpoints.admin.approve(id), { method: 'POST' });
}

/** Từ chối kèm lý do — lưu rejectReason để owner sửa và gửi lại. */
export function rejectVenue(id: string, reason: string): Promise<AdminVenueItem> {
  return apiFetch<AdminVenueItem>(endpoints.admin.reject(id), { method: 'POST', body: { reason } });
}
