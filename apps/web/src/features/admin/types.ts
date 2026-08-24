/** Kiểu dữ liệu khu admin — khớp phản hồi backend t5 (admin module). */

export interface AdminVenueItem {
  id: string;
  name: string;
  slug: string;
  address: string;
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
