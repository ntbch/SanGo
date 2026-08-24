/** Kiểu dữ liệu khu owner — khớp phản hồi thật của backend (t4+t5). */

export interface CourtRow {
  id: string;
  venueId?: string;
  name: string;
  sportType: string;
  slotMinutes: number;
  defaultPricePerSlot: number;
  status?: 'ACTIVE' | 'MAINTENANCE';
}

export interface OwnerVenue {
  id: string;
  name: string;
  slug: string;
  address: string;
  lat: number;
  lng: number;
  images: string[];
  amenities: string[];
  depositPercent: number | null;
  openMinute: number;
  closeMinute: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string | null;
  createdAt?: string;
  courtsCount?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Một quy tắc giá ghi đè — REPLACE-ALL qua PUT /courts/:id/pricing-rules. */
export interface PricingRule {
  dayType: 'WEEKDAY' | 'WEEKEND';
  startMinute: number;
  endMinute: number;
  pricePerSlot: number;
}

export type OwnerBookingStatus =
  'PENDING_PAYMENT' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface OwnerBooking {
  id: string;
  code: string;
  courtName: string;
  customerName: string;
  date: string;
  startMinute: number;
  endMinute: number;
  status: OwnerBookingStatus;
  amountPaid: number;
}
