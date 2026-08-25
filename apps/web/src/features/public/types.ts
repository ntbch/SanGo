/**
 * Kiểu dữ liệu khớp phản hồi PUBLIC của backend t5 (venues.service.ts):
 * list trả { items, total, page, limit, pages }; mỗi venue kèm courts ACTIVE.
 * ratingAvg/ratingCount là trường mở rộng hiển thị (backend sẽ bổ sung khi
 * có endpoint review tổng hợp) — UI chỉ render khi có.
 */
export interface CourtCardInfo {
  id: string;
  name: string;
  sportType: string;
  slotMinutes: number;
  /** Số nguyên VND mỗi slot. */
  defaultPricePerSlot: number;
}

interface VenueBase {
  id: string;
  name: string;
  slug: string;
  address: string;
  city?: string;
  district?: string;
  lat: number;
  lng: number;
  images: string[];
  amenities: string[];
  /** Phần trăm cọc khi đặt sân (30 = 30%). */
  depositPercent: number;
  /** Giờ mở/đóng cửa tính bằng phút từ 00:00 (360 = 06:00). */
  openMinute: number;
  closeMinute: number;
  courts: CourtCardInfo[];
  /** Khoảng cách GPS tính theo Haversine (km) khi có toạ độ người dùng */
  distanceKm?: number;
}

export interface VenueListItem extends VenueBase {
  ratingAvg?: number;
  ratingCount?: number;
}

export type VenueDetail = VenueListItem;

export interface PaginatedVenues {
  items: VenueListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Một đánh giá — shape dự kiến của GET /venues/:slugOrId/reviews. */
export interface VenueReview {
  id?: string;
  author?: string;
  customer?: { fullName: string };
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface PaginatedReviews {
  items: VenueReview[];
  total: number;
  page: number;
  size: number;
  pages: number;
  avgRating?: number;
}
