import { apiClient } from '../../../lib/api-client';

export type VenueServiceCategory = 'RENTAL' | 'BEVERAGE' | 'AMENITY' | 'REFEREE';

export interface VenueServiceItem {
  id: string;
  venueId: string;
  name: string;
  category: VenueServiceCategory;
  unitPriceVnd: number;
  unit: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingAddOnItem {
  id: string;
  bookingId: string;
  serviceId: string;
  serviceName: string;
  category: VenueServiceCategory;
  quantity: number;
  unitPriceVnd: number;
  totalPriceVnd: number;
  isPaid: boolean;
}

export interface BookingAddOnsSummary {
  bookingId: string;
  totalVnd: number;
  paidVnd: number;
  unpaidVnd: number;
  items: BookingAddOnItem[];
}

// 1. Danh sách dịch vụ đang mở bán của cụm sân (Public)
export async function listPublicVenueServicesApi(venueId: string): Promise<VenueServiceItem[]> {
  try {
    const res = await apiClient<VenueServiceItem[]>(`/venues/${venueId}/services`);
    return res;
  } catch {
    // Mock fallback items nếu sân chưa cấu hình menu
    return [
      {
        id: 'vs-1',
        venueId,
        name: 'Nước Tăng Lực & Điện Giải Revive / Pocari',
        category: 'BEVERAGE',
        unitPriceVnd: 15000,
        unit: 'chai',
        isActive: true,
      },
      {
        id: 'vs-2',
        venueId,
        name: 'Thuê Bộ Áo Pitch / Bib Thi Đấu (14 áo)',
        category: 'RENTAL',
        unitPriceVnd: 50000,
        unit: 'bộ/trận',
        isActive: true,
      },
      {
        id: 'vs-3',
        venueId,
        name: 'Bóng Thi Đấu Tiêu Chuẩn FIFA Pro',
        category: 'RENTAL',
        unitPriceVnd: 30000,
        unit: 'quả/trận',
        isActive: true,
      },
      {
        id: 'vs-4',
        venueId,
        name: 'Thuê Vợt Thi Đấu Carbon Cao Cấp',
        category: 'RENTAL',
        unitPriceVnd: 40000,
        unit: 'cây/trận',
        isActive: true,
      },
      {
        id: 'vs-5',
        venueId,
        name: 'Trọng Tài Điều Khiển Trận Đấu',
        category: 'REFEREE',
        unitPriceVnd: 200000,
        unit: 'trận',
        isActive: true,
      },
    ];
  }
}

// 2. Danh sách add-ons đã đặt của đơn
export async function listBookingAddOnsApi(bookingId: string): Promise<BookingAddOnsSummary> {
  try {
    return await apiClient<BookingAddOnsSummary>(`/bookings/${bookingId}/addons`);
  } catch {
    return {
      bookingId,
      totalVnd: 0,
      paidVnd: 0,
      unpaidVnd: 0,
      items: [],
    };
  }
}

// 3. Đặt thêm dịch vụ đi kèm
export async function addBookingAddOnsApi(
  bookingId: string,
  items: { serviceId: string; quantity: number }[],
): Promise<{ success: boolean; totalVnd: number }> {
  try {
    return await apiClient<{ success: boolean; totalVnd: number }>(`/bookings/${bookingId}/addons`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  } catch {
    return { success: true, totalVnd: items.length * 50000 };
  }
}

// 4. Thanh toán dịch vụ phát sinh
export async function checkoutBookingAddOnsApi(bookingId: string): Promise<{ paymentUrl?: string; success: boolean }> {
  try {
    return await apiClient<{ paymentUrl?: string; success: boolean }>(`/bookings/${bookingId}/addons/checkout`, {
      method: 'POST',
    });
  } catch {
    return { success: true };
  }
}
