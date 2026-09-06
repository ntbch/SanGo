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
    const res = await apiClient<any[]>(`/venues/${venueId}/services`);
    // BE trả {price, type, isAvailable} — normalize sang shape FE (category/unitPriceVnd/isActive)
    return (res ?? []).map((s) => ({
      ...s,
      category: s.type ?? 'AMENITY',
      unitPriceVnd: s.price ?? 0,
      unit: s.unit ?? 'phục vụ',
      isActive: s.isAvailable ?? false,
    }));
  } catch {
    return [];
  }
}

// 2. Danh sách add-ons đã đặt của đơn
export async function listBookingAddOnsApi(bookingId: string): Promise<BookingAddOnsSummary> {
  try {
    const raw = await apiClient<any>(`/bookings/${bookingId}/addons`);
    // BE trả {items:[{unitPrice, quantity, service:{name, type}}], totalCost, paidAmount, unpaidAmount}
    return {
      bookingId: raw.bookingId,
      totalVnd: raw.totalCost ?? 0,
      paidVnd: raw.paidAmount ?? 0,
      unpaidVnd: raw.unpaidAmount ?? 0,
      items: (raw.items ?? []).map((i: any) => ({
        id: i.id,
        bookingId: i.bookingId,
        serviceId: i.serviceId,
        serviceName: i.service?.name ?? '',
        category: i.service?.type ?? 'AMENITY',
        quantity: i.quantity,
        unitPriceVnd: i.unitPrice ?? 0,
        totalPriceVnd: (i.unitPrice ?? 0) * (i.quantity ?? 0),
        isPaid: (raw.unpaidAmount ?? 0) === 0,
      })),
    };
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
  } catch (err) {
    throw err;
  }
}

// 4. Thanh toán dịch vụ phát sinh
export async function checkoutBookingAddOnsApi(bookingId: string): Promise<{ paymentUrl?: string; success: boolean }> {
  try {
    return await apiClient<{ paymentUrl?: string; success: boolean }>(`/bookings/${bookingId}/addons/checkout`, {
      method: 'POST',
    });
  } catch (err) {
    throw err;
  }
}
