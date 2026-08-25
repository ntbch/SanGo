/**
 * API giả lập trong bộ nhớ — dùng khi chưa có backend thật (VITE_USE_MOCK=true).
 * Mô phỏng đúng hợp đồng REST của module auth (đặc tả §3.1) và shape lỗi
 * thống nhất { statusCode, message, code } để UI chạy đứng yên không lỗi.
 */
import { calculateHaversineDistanceKm, UserRole } from '@courthub/shared';

import { ApiError } from './api-error';
import { type AuthUser } from './types';

/** Độ trễ giả lập giúp trạng thái loading của UI nhìn thấy được. */
export const MOCK_LATENCY_MS = 150;

interface MockAccount extends AuthUser {
  password: string;
}

const accounts: MockAccount[] = [
  {
    id: 'u-customer-01',
    email: 'customer@courthub.vn',
    password: 'Courthub@2026',
    fullName: 'Nguyễn Văn Bình',
    phone: '0901234567',
    role: UserRole.CUSTOMER,
  },
  {
    id: 'u-owner-01',
    email: 'owner@courthub.vn',
    password: 'Courthub@2026',
    fullName: 'Trần Thị Cẩm Lan',
    phone: '0912345678',
    role: UserRole.OWNER,
  },
  {
    id: 'u-admin-01',
    email: 'admin@courthub.vn',
    password: 'Courthub@2026',
    fullName: 'Phạm Quốc Dũng',
    role: UserRole.ADMIN,
  },
];

/** Phiên đăng nhập hiện tại của mock — mô phỏng refresh cookie phía server. */
let sessionEmail: string | null = null;

/** Token đặt lại mật khẩu đang chờ dùng (P1-F2) — token -> email, TTL giả lập 30 phút. */
const MOCK_RESET_TOKENS = new Map<string, string>();

/** Số tin nhắn AI đã gửi trong phiên — demo throttle 20 tin/h (§3.12). */
let MOCK_AI_CALLS = 0;

/** Xoá phiên mock (dùng trong unit test để cách ly trạng thái giữa các case). */
export function resetMockSession(): void {
  sessionEmail = null;
  MOCK_AI_CALLS = 0;
  // Token quên mật khẩu cũng phải reset để cách ly giữa các case (P1-F2).
  for (const token of Array.from(MOCK_RESET_TOKENS.keys())) {
    MOCK_RESET_TOKENS.delete(token);
  }
  // Holds cũng phải reset để các case slot-state không nhiễm nhau (t11).
  for (const holdId of Array.from(MOCK_HOLDS.keys())) {
    MOCK_HOLDS.delete(holdId);
  }
}

function toAuthUser(account: MockAccount): AuthUser {
  return {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    ...(account.phone !== undefined ? { phone: account.phone } : {}),
    ...(account.avatarUrl !== undefined && account.avatarUrl !== ''
      ? { avatarUrl: account.avatarUrl }
      : {}),
    role: account.role,
  };
}

function makeAccessToken(email: string): string {
  return 'mock-access-' + btoa(email).replace(/=/g, '') + '-' + Date.now().toString(36);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requireString(payload: Record<string, unknown>, key: string): string {
  return typeof payload[key] === 'string' ? (payload[key] as string) : '';
}

/* ------------------------------------------------------------------ */
/* Dữ liệu sân public cho demo khi VITE_USE_MOCK — khớp shape phản hồi */
/* của backend t5 (venues.service.ts).                                 */
/* ------------------------------------------------------------------ */

interface MockVenue {
  id: string;
  name: string;
  slug: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string | null;
  ownerId?: string;
  address: string;
  city?: string;
  district?: string;
  lat: number;
  lng: number;
  images: string[];
  amenities: string[];
  depositPercent: number;
  openMinute: number;
  closeMinute: number;
  ratingAvg?: number;
  ratingCount?: number;
  courts: Array<{
    id: string;
    name: string;
    sportType: string;
    slotMinutes: number;
    defaultPricePerSlot: number;
    status?: 'ACTIVE' | 'MAINTENANCE';
  }>;
  reviews: Array<{
    id: string;
    author: string;
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
}

const img = (seed: string): string => `https://picsum.photos/seed/${seed}/800/450`;

export const MOCK_VENUES: MockVenue[] = [
  {
    id: 'v-1',
    status: 'APPROVED',
    ownerId: 'u-owner',
    name: 'Sân Pickleball Saigon',
    slug: 'san-pickleball-saigon',
    city: 'TP.HCM',
    district: 'Gò Vấp',
    address: '12 Nguyễn Văn Bảo, P.4, Q. Gò Vấp, TP.HCM',
    lat: 10.8205,
    lng: 106.6894,
    images: [img('pickle-a'), img('pickle-b'), img('pickle-c')],
    amenities: ['Toilet', 'Ánh sáng', 'Trạm nước', 'Bãi xe'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.8,
    ratingCount: 36,
    courts: [
      {
        id: 'c-1',
        name: 'Sân 1',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 120000,
      },
      {
        id: 'c-2',
        name: 'Sân 2',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 120000,
      },
      {
        id: 'c-3',
        name: 'Sân 3',
        sportType: 'FOOTBALL5',
        slotMinutes: 90,
        defaultPricePerSlot: 400000,
      },
    ],
    reviews: [
      {
        id: 'rv-1',
        author: 'Minh T.',
        rating: 5,
        comment: 'Sân mới, bóng đẹp, staff thân thiện.',
        createdAt: '12/08/2026',
      },
      {
        id: 'rv-2',
        author: 'Lan H.',
        rating: 4,
        comment: 'Ánh sáng tốt nhưng cuối tuần đông.',
        createdAt: '02/08/2026',
      },
    ],
  },
  {
    id: 'v-2',
    status: 'PENDING',
    ownerId: 'u-owner',
    name: 'Cụm Cầu lông Thủ Đức',
    slug: 'cum-cau-long-thu-duc',
    city: 'TP.HCM',
    district: 'Thủ Đức',
    address: '456 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM',
    lat: 10.8539,
    lng: 106.7614,
    images: [img('badminton-a'), img('badminton-b')],
    amenities: ['Toilet', 'Phòng tắm', 'Nước uống miễn phí'],
    depositPercent: 30,
    openMinute: 300,
    closeMinute: 1410,
    ratingAvg: 4.6,
    ratingCount: 21,
    courts: [
      {
        id: 'c-4',
        name: 'Sân A1',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 90000,
      },
      {
        id: 'c-5',
        name: 'Sân A2',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 90000,
      },
      {
        id: 'c-6',
        name: 'Sân Pickle',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 100000,
      },
    ],
    reviews: [
      {
        id: 'rv-3',
        author: 'Hoàng N.',
        rating: 5,
        comment: 'Sàn BWF chuẩn, giá hợp lý.',
        createdAt: '19/08/2026',
      },
    ],
  },
  {
    id: 'v-3',
    status: 'REJECTED',
    rejectReason: 'Ảnh chưa rõ mặt sân, vui lòng bổ sung tối thiểu 3 ảnh thật.',
    ownerId: 'u-owner',
    name: 'Tennis Bình Thạnh',
    slug: 'tennis-binh-thanh',
    city: 'TP.HCM',
    district: 'Bình Thạnh',
    address: '78 Ngo Sĩ Liên, P.11, Q. Bình Thạnh, TP.HCM',
    lat: 10.8017,
    lng: 106.7066,
    images: [img('tennis-a'), img('tennis-b'), img('tennis-c'), img('tennis-d')],
    amenities: ['Toilet', 'Ánh sáng LED', 'Bãi xe'],
    depositPercent: 50,
    openMinute: 330,
    closeMinute: 1380,
    courts: [
      {
        id: 'c-7',
        name: 'Sân chính',
        sportType: 'TENNIS',
        slotMinutes: 90,
        defaultPricePerSlot: 350000,
      },
    ],
    reviews: [],
  },
  {
    id: 'v-hn-1',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Sân Thể Thao Quần Ngựa',
    slug: 'san-the-thao-quan-ngua',
    city: 'Hà Nội',
    district: 'Ba Đình',
    address: '30 Văn Cao, Liễu Giai, Ba Đình, Hà Nội',
    lat: 21.0384,
    lng: 105.8152,
    images: [
      'https://picsum.photos/seed/quan-ngua-1/800/500',
      'https://picsum.photos/seed/quan-ngua-2/800/500',
    ],
    amenities: ['Bãi đỗ xe', 'Phòng thay đồ', 'Căng tin', 'Wifi'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.5,
    ratingCount: 15,
    courts: [
      {
        id: 'c-hn-101',
        name: 'Sân Pickleball Quần Ngựa 1',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 130000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-102',
        name: 'Sân Cầu Lông Quần Ngựa',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 100000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-103',
        name: 'Sân Tennis Quần Ngựa',
        sportType: 'TENNIS',
        slotMinutes: 90,
        defaultPricePerSlot: 350000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-1',
        author: 'Nguyễn Văn A',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Ba Đình.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-2',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Cụm Sân Bóng Đá Hoàng Hoa Thám',
    slug: 'cum-san-bong-da-hoang-hoa-tham',
    city: 'Hà Nội',
    district: 'Ba Đình',
    address: '250 Hoàng Hoa Thám, Thụy Khuê, Ba Đình, Hà Nội',
    lat: 21.0421,
    lng: 105.8236,
    images: ['https://picsum.photos/seed/hoang-hoa-tham-1/800/500'],
    amenities: ['Bãi xe máy', 'Đèn chiếu sáng ban đêm', 'Nước uống'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.6,
    ratingCount: 18,
    courts: [
      {
        id: 'c-hn-104',
        name: 'Sân 5 Hoàng Hoa Thám A',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 450000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-105',
        name: 'Sân 7 Hoàng Hoa Thám B',
        sportType: 'FOOTBALL7',
        slotMinutes: 90,
        defaultPricePerSlot: 850000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-2',
        author: 'Nguyễn Văn B',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Ba Đình.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-3',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Tổ Hợp Thể Thao Cầu Giấy',
    slug: 'to-hop-the-thao-cau-giay',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    address: '35 Trần Quý Kiên, Dịch Vọng, Cầu Giấy, Hà Nội',
    lat: 21.0368,
    lng: 105.7925,
    images: [
      'https://picsum.photos/seed/to-hop-cau-giay-1/800/500',
      'https://picsum.photos/seed/to-hop-cau-giay-2/800/500',
    ],
    amenities: ['Bãi xe ô tô', 'Phòng tắm nóng lạnh', 'Cho thuê vợt', 'Wifi'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1410,
    ratingAvg: 4.7,
    ratingCount: 21,
    courts: [
      {
        id: 'c-hn-106',
        name: 'Sân Cầu Lông Số 1',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 90000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-107',
        name: 'Sân Cầu Lông Số 2',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 90000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-108',
        name: 'Sân Pickleball Cầu Giấy',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 130000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-109',
        name: 'Sân Tennis Cầu Giấy',
        sportType: 'TENNIS',
        slotMinutes: 90,
        defaultPricePerSlot: 320000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-3',
        author: 'Nguyễn Văn C',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Cầu Giấy.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-4',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Sân Bóng Đá & Pickleball Trung Kính',
    slug: 'san-bong-da-pickleball-trung-kinh',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    address: '218 Trung Kính, Yên Hòa, Cầu Giấy, Hà Nội',
    lat: 21.0182,
    lng: 105.7938,
    images: ['https://picsum.photos/seed/trung-kinh-1/800/500'],
    amenities: ['Bãi đỗ xe', 'Căng tin', 'Tủ đồ'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.8,
    ratingCount: 24,
    courts: [
      {
        id: 'c-hn-110',
        name: 'Sân Bóng Đá 5 Trung Kính',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 420000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-111',
        name: 'Sân Pickleball Trung Kính',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 120000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-4',
        author: 'Nguyễn Văn D',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Cầu Giấy.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-5',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Sân thể thao Ngọc Khánh',
    slug: 'san-the-thao-ngoc-khanh',
    city: 'Hà Nội',
    district: 'Đống Đa',
    address: 'Số 12 Nguyễn Chí Thanh, Láng Thượng, Đống Đa, Hà Nội',
    lat: 21.0283,
    lng: 105.8142,
    images: [
      'https://picsum.photos/seed/courthub-ngoc-khanh-1/800/500',
      'https://picsum.photos/seed/courthub-ngoc-khanh-2/800/500',
    ],
    amenities: ['Phòng thay đồ', 'Bãi xe miễn phí', 'Nước uống miễn phí', 'Wifi'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1410,
    ratingAvg: 4.9,
    ratingCount: 27,
    courts: [
      {
        id: 'c-hn-112',
        name: 'Sân bóng đá 5 người A',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 400000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-113',
        name: 'Sân bóng đá 5 người B',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 400000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-114',
        name: 'Sân Pickleball trong nhà',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 120000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-5',
        author: 'Nguyễn Văn E',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Đống Đa.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-6',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Cụm Sân Thể Thao Hoàng Cầu',
    slug: 'cum-san-the-thao-hoang-cau',
    city: 'Hà Nội',
    district: 'Đống Đa',
    address: 'Số 1 Ngõ 69 Hoàng Cầu, Ô Chợ Dừa, Đống Đa, Hà Nội',
    lat: 21.0185,
    lng: 105.8234,
    images: ['https://picsum.photos/seed/hoang-cau-1/800/500'],
    amenities: ['Ven hồ thoáng mát', 'Bãi xe', 'Căng tin giải khát'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.5,
    ratingCount: 30,
    courts: [
      {
        id: 'c-hn-115',
        name: 'Sân Cầu Lông Hoàng Cầu',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 95000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-116',
        name: 'Sân Tennis Hoàng Cầu',
        sportType: 'TENNIS',
        slotMinutes: 90,
        defaultPricePerSlot: 300000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-117',
        name: 'Sân Bóng Đá 5 Hoàng Cầu',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 400000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-6',
        author: 'Nguyễn Văn F',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Đống Đa.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-7',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Cụm Sân Thể Thao Bách Khoa',
    slug: 'cum-san-the-thao-bach-khoa',
    city: 'Hà Nội',
    district: 'Hai Bà Trưng',
    address: 'Số 1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội',
    lat: 21.0068,
    lng: 105.8452,
    images: ['https://picsum.photos/seed/bach-khoa-1/800/500'],
    amenities: ['Bãi đỗ xe lớn', 'Khán đài', 'Phòng thay đồ'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.6,
    ratingCount: 33,
    courts: [
      {
        id: 'c-hn-118',
        name: 'Sân 5 Bách Khoa 1',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 400000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-119',
        name: 'Sân 7 Bách Khoa Pro',
        sportType: 'FOOTBALL7',
        slotMinutes: 90,
        defaultPricePerSlot: 800000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-120',
        name: 'Sân Cầu Lông Nhà Thi Đấu BK',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 85000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-7',
        author: 'Nguyễn Văn G',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Hai Bà Trưng.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-8',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'CLB Pickleball & Tennis Tuổi Trẻ',
    slug: 'clb-pickleball-tennis-tuoi-tre',
    city: 'Hà Nội',
    district: 'Hai Bà Trưng',
    address: 'Công viên Tuổi Trẻ, Võ Thị Sáu, Thanh Nhàn, Hai Bà Trưng, Hà Nội',
    lat: 21.0041,
    lng: 105.8562,
    images: ['https://picsum.photos/seed/tuoi-tre-1/800/500'],
    amenities: ['Không gian xanh', 'Bãi xe ô tô', 'Huấn luyện viên'],
    depositPercent: 25,
    openMinute: 360,
    closeMinute: 1350,
    ratingAvg: 4.7,
    ratingCount: 36,
    courts: [
      {
        id: 'c-hn-121',
        name: 'Sân Pickleball Tuổi Trẻ 1',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 110000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-122',
        name: 'Sân Pickleball Tuổi Trẻ 2',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 110000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-123',
        name: 'Sân Tennis Tuổi Trẻ',
        sportType: 'TENNIS',
        slotMinutes: 90,
        defaultPricePerSlot: 280000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-8',
        author: 'Nguyễn Văn H',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Hai Bà Trưng.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-9',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Sân Thể Thao Phúc Tân',
    slug: 'san-the-thao-phuc-tan',
    city: 'Hà Nội',
    district: 'Hoàn Kiếm',
    address: 'Khu thể thao Phúc Tân, Phúc Tân, Hoàn Kiếm, Hà Nội',
    lat: 21.0315,
    lng: 105.8592,
    images: ['https://picsum.photos/seed/phuc-tan-1/800/500'],
    amenities: ['Bãi xe máy', 'Gần phố cổ', 'Nước uống'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.8,
    ratingCount: 39,
    courts: [
      {
        id: 'c-hn-124',
        name: 'Sân Bóng Đá 5 Phúc Tân',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 420000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-125',
        name: 'Sân Cầu Lông Phúc Tân',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 95000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-9',
        author: 'Nguyễn Văn I',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Hoàn Kiếm.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-10',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Trung Tâm Thể Thao Hàng Chiếu',
    slug: 'trung-tam-the-thao-hang-chieu',
    city: 'Hà Nội',
    district: 'Hoàn Kiếm',
    address: '42 Hàng Chiếu, Đồng Xuân, Hoàn Kiếm, Hà Nội',
    lat: 21.0378,
    lng: 105.8515,
    images: ['https://picsum.photos/seed/hang-chieu-1/800/500'],
    amenities: ['Trung tâm phố cổ', 'Điều hòa', 'Tủ đồ an toàn'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1320,
    ratingAvg: 4.9,
    ratingCount: 42,
    courts: [
      {
        id: 'c-hn-126',
        name: 'Sân Pickleball Phố Cổ',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 140000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-127',
        name: 'Sân Cầu Lông Hàng Chiếu',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 110000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-10',
        author: 'Nguyễn Văn J',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Hoàn Kiếm.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-11',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Cụm Sân Không Quân Lê Trọng Tấn',
    slug: 'cum-san-khong-quan-le-trong-tan',
    city: 'Hà Nội',
    district: 'Thanh Xuân',
    address: '168 Lê Trọng Tấn, Khương Mai, Thanh Xuân, Hà Nội',
    lat: 20.9985,
    lng: 105.8285,
    images: ['https://picsum.photos/seed/khong-quan-1/800/500'],
    amenities: ['Bãi xe ô tô cực rộng', 'Căng tin', 'Hệ thống đèn tiêu chuẩn'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1410,
    ratingAvg: 4.5,
    ratingCount: 45,
    courts: [
      {
        id: 'c-hn-128',
        name: 'Sân Bóng Đá 5 Không Quân',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 420000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-129',
        name: 'Sân Bóng Đá 7 Không Quân',
        sportType: 'FOOTBALL7',
        slotMinutes: 90,
        defaultPricePerSlot: 850000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-130',
        name: 'Sân Tennis Phòng Không',
        sportType: 'TENNIS',
        slotMinutes: 90,
        defaultPricePerSlot: 300000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-11',
        author: 'Nguyễn Văn K',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Thanh Xuân.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-12',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'CLB Pickleball & Cầu Lông Thanh Xuân',
    slug: 'clb-pickleball-cau-long-thanh-xuan',
    city: 'Hà Nội',
    district: 'Thanh Xuân',
    address: '15 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội',
    lat: 20.9952,
    lng: 105.8012,
    images: ['https://picsum.photos/seed/thanh-xuan-1/800/500'],
    amenities: ['Mặt thảm chuẩn thi đấu', 'Phòng thay đồ', 'Wifi tốc độ cao'],
    depositPercent: 25,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.6,
    ratingCount: 48,
    courts: [
      {
        id: 'c-hn-131',
        name: 'Sân Pickleball Thanh Xuân A',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 120000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-132',
        name: 'Sân Pickleball Thanh Xuân B',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 120000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-133',
        name: 'Sân Cầu Lông Thanh Xuân 1',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 90000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-12',
        author: 'Nguyễn Văn L',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Thanh Xuân.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-13',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'D-Sports Quảng An',
    slug: 'd-sports-quang-an',
    city: 'Hà Nội',
    district: 'Tây Hồ',
    address: '50 Đặng Thai Mai, Quảng An, Tây Hồ, Hà Nội',
    lat: 21.0645,
    lng: 105.8282,
    images: ['https://picsum.photos/seed/quang-an-1/800/500'],
    amenities: ['View Hồ Tây', 'Cafe sang trọng', 'Phòng tắm nóng lạnh', 'Bãi xe ô tô'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.7,
    ratingCount: 51,
    courts: [
      {
        id: 'c-hn-134',
        name: 'Sân Pickleball View Hồ',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 150000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-135',
        name: 'Sân Pickleball Pro Tây Hồ',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 150000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-136',
        name: 'Sân Tennis D-Sports',
        sportType: 'TENNIS',
        slotMinutes: 90,
        defaultPricePerSlot: 380000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-13',
        author: 'Nguyễn Văn M',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Tây Hồ.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-14',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Cụm Sân Thể Thao An Dương',
    slug: 'cum-san-the-thao-an-duong',
    city: 'Hà Nội',
    district: 'Tây Hồ',
    address: 'Ngõ 76 An Dương, Yên Phụ, Tây Hồ, Hà Nội',
    lat: 21.0512,
    lng: 105.8395,
    images: ['https://picsum.photos/seed/an-duong-1/800/500'],
    amenities: ['Bãi xe máy rộng', 'Đèn LED cao cấp', 'Nước ngọt'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.8,
    ratingCount: 54,
    courts: [
      {
        id: 'c-hn-137',
        name: 'Sân 5 An Dương 1',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 400000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-138',
        name: 'Sân 7 An Dương',
        sportType: 'FOOTBALL7',
        slotMinutes: 90,
        defaultPricePerSlot: 800000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-139',
        name: 'Sân Cầu Lông An Dương',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 90000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-14',
        author: 'Nguyễn Văn N',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Tây Hồ.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-15',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Trung tâm cầu lông & Pickleball Hoàng Mai',
    slug: 'cau-long-pickleball-hoang-mai',
    city: 'Hà Nội',
    district: 'Hoàng Mai',
    address: 'KĐT Linh Đàm, Hoàng Liệt, Hoàng Mai, Hà Nội',
    lat: 20.9845,
    lng: 105.8541,
    images: [
      'https://picsum.photos/seed/courthub-hoang-mai-1/800/500',
      'https://picsum.photos/seed/courthub-hoang-mai-2/800/500',
    ],
    amenities: ['Phòng thay đồ', 'Bãi xe có mái che', 'Thuê vợt/cầu'],
    depositPercent: 25,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.9,
    ratingCount: 57,
    courts: [
      {
        id: 'c-hn-140',
        name: 'Sân cầu lông 1',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 90000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-141',
        name: 'Sân cầu lông 2',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 90000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-142',
        name: 'Sân bóng đá 7 người',
        sportType: 'FOOTBALL7',
        slotMinutes: 90,
        defaultPricePerSlot: 800000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-143',
        name: 'Sân Pickleball ngoài trời',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 100000,
        status: 'MAINTENANCE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-15',
        author: 'Nguyễn Văn O',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Hoàng Mai.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-16',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Sân Bóng Đá Định Công',
    slug: 'san-bong-da-dinh-cong',
    city: 'Hà Nội',
    district: 'Hoàng Mai',
    address: 'Định Công Thượng, Định Công, Hoàng Mai, Hà Nội',
    lat: 20.9852,
    lng: 105.8341,
    images: ['https://picsum.photos/seed/dinh-cong-1/800/500'],
    amenities: ['Bãi xe máy & ô tô', 'Khán đài mini', 'Căng tin'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.5,
    ratingCount: 60,
    courts: [
      {
        id: 'c-hn-144',
        name: 'Sân 5 Định Công A',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 380000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-145',
        name: 'Sân 7 Định Công B',
        sportType: 'FOOTBALL7',
        slotMinutes: 90,
        defaultPricePerSlot: 750000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-16',
        author: 'Nguyễn Văn P',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Hoàng Mai.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-17',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Cụm Sân Thể Thao Bồ Đề',
    slug: 'cum-san-the-thao-bo-de',
    city: 'Hà Nội',
    district: 'Long Biên',
    address: 'Phố Hồng Tiến, Bồ Đề, Long Biên, Hà Nội',
    lat: 21.0385,
    lng: 105.8752,
    images: ['https://picsum.photos/seed/bo-de-1/800/500'],
    amenities: ['Bãi xe ô tô', 'Sân cỏ nhân tạo mới', 'Hệ thống đèn LED', 'Wifi'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1410,
    ratingAvg: 4.6,
    ratingCount: 63,
    courts: [
      {
        id: 'c-hn-146',
        name: 'Sân Bóng Đá 5 Bồ Đề',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 400000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-147',
        name: 'Sân Pickleball Bồ Đề',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 110000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-148',
        name: 'Sân Tennis Bồ Đề',
        sportType: 'TENNIS',
        slotMinutes: 90,
        defaultPricePerSlot: 290000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-17',
        author: 'Nguyễn Văn Q',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Long Biên.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-18',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Trung Tâm Pickleball & Cầu Lông Việt Hưng',
    slug: 'trung-tam-pickleball-cau-long-viet-hung',
    city: 'Hà Nội',
    district: 'Long Biên',
    address: 'KĐT Việt Hưng, Giang Biên, Long Biên, Hà Nội',
    lat: 21.0615,
    lng: 105.9085,
    images: ['https://picsum.photos/seed/viet-hung-1/800/500'],
    amenities: ['Nhà thi đấu có máy lạnh', 'Phòng tắm sạch', 'Cho thuê dụng cụ'],
    depositPercent: 25,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.7,
    ratingCount: 66,
    courts: [
      {
        id: 'c-hn-149',
        name: 'Sân Pickleball Việt Hưng 1',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 120000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-150',
        name: 'Sân Pickleball Việt Hưng 2',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 120000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-151',
        name: 'Sân Cầu Lông Việt Hưng',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 85000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-18',
        author: 'Nguyễn Văn R',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Long Biên.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-19',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Cụm Sân Thể Thao Văn Quán',
    slug: 'cum-san-the-thao-van-quan',
    city: 'Hà Nội',
    district: 'Hà Đông',
    address: 'KĐT Văn Quán, Văn Quán, Hà Đông, Hà Nội',
    lat: 20.9785,
    lng: 105.7892,
    images: ['https://picsum.photos/seed/van-quan-1/800/500'],
    amenities: ['Ven hồ Văn Quán', 'Bãi xe ô tô', 'Căng tin đồ uống', 'Tủ đồ'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1410,
    ratingAvg: 4.8,
    ratingCount: 69,
    courts: [
      {
        id: 'c-hn-152',
        name: 'Sân Bóng Đá 5 Văn Quán',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 380000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-153',
        name: 'Sân Pickleball Văn Quán',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 110000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-154',
        name: 'Sân Cầu Lông Văn Quán',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 80000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-19',
        author: 'Nguyễn Văn S',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Hà Đông.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-20',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Sân Tennis & Pickleball Dương Nội',
    slug: 'san-tennis-pickleball-duong-noi',
    city: 'Hà Nội',
    district: 'Hà Đông',
    address: 'KĐT Dương Nội, Dương Nội, Hà Đông, Hà Nội',
    lat: 20.9652,
    lng: 105.7525,
    images: ['https://picsum.photos/seed/duong-noi-1/800/500'],
    amenities: ['Bãi đỗ xe', 'Hệ thống đèn LED', 'Nước uống'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1350,
    ratingAvg: 4.9,
    ratingCount: 72,
    courts: [
      {
        id: 'c-hn-155',
        name: 'Sân Tennis Dương Nội 1',
        sportType: 'TENNIS',
        slotMinutes: 90,
        defaultPricePerSlot: 270000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-156',
        name: 'Sân Pickleball Dương Nội',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 100000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-20',
        author: 'Nguyễn Văn T',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Hà Đông.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-21',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Cụm Sân Tân Mỹ - Mỹ Đình',
    slug: 'cum-san-tan-my-my-dinh',
    city: 'Hà Nội',
    district: 'Nam Từ Liêm',
    address: 'Đường Tân Mỹ, Mỹ Đình 1, Nam Từ Liêm, Hà Nội',
    lat: 21.0252,
    lng: 105.7685,
    images: ['https://picsum.photos/seed/tan-my-1/800/500'],
    amenities: ['Gần SVĐ Quốc Gia', 'Bãi xe cực lớn', 'Cỏ nhân tạo đạt chuẩn', 'Wifi'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1410,
    ratingAvg: 4.5,
    ratingCount: 75,
    courts: [
      {
        id: 'c-hn-157',
        name: 'Sân Bóng Đá 5 Tân Mỹ 1',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 400000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-158',
        name: 'Sân Bóng Đá 7 Tân Mỹ Pro',
        sportType: 'FOOTBALL7',
        slotMinutes: 90,
        defaultPricePerSlot: 850000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-159',
        name: 'Sân Pickleball Mỹ Đình',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 120000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-21',
        author: 'Nguyễn Văn U',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Nam Từ Liêm.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-22',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Sân Bóng Đá & Cầu Lông Mễ Trì',
    slug: 'san-bong-da-cau-long-me-tri',
    city: 'Hà Nội',
    district: 'Nam Từ Liêm',
    address: 'Đường Mễ Trì Hạ, Mễ Trì, Nam Từ Liêm, Hà Nội',
    lat: 21.0112,
    lng: 105.7815,
    images: ['https://picsum.photos/seed/me-tri-1/800/500'],
    amenities: ['Bãi đỗ xe máy & ô tô', 'Phòng thay đồ', 'Căng tin'],
    depositPercent: 25,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.6,
    ratingCount: 78,
    courts: [
      {
        id: 'c-hn-160',
        name: 'Sân Bóng Đá 5 Mễ Trì',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 400000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-161',
        name: 'Sân Cầu Lông Mễ Trì',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 85000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-22',
        author: 'Nguyễn Văn V',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Nam Từ Liêm.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-23',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'Cụm Sân Thể Thao Cổ Nhuế',
    slug: 'cum-san-the-thao-co-nhue',
    city: 'Hà Nội',
    district: 'Bắc Từ Liêm',
    address: 'Đường Cổ Nhuế, Cổ Nhuế 2, Bắc Từ Liêm, Hà Nội',
    lat: 21.0685,
    lng: 105.7725,
    images: ['https://picsum.photos/seed/co-nhue-1/800/500'],
    amenities: ['Bãi đỗ xe', 'Hệ thống đèn LED', 'Nước uống'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.7,
    ratingCount: 81,
    courts: [
      {
        id: 'c-hn-162',
        name: 'Sân Bóng Đá 5 Cổ Nhuế',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 380000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-163',
        name: 'Sân Bóng Đá 7 Cổ Nhuế',
        sportType: 'FOOTBALL7',
        slotMinutes: 90,
        defaultPricePerSlot: 750000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-164',
        name: 'Sân Cầu Lông Cổ Nhuế',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 80000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-23',
        author: 'Nguyễn Văn W',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Bắc Từ Liêm.',
        createdAt: '20/08/2026',
      },
    ],
  },
  {
    id: 'v-hn-24',
    status: 'APPROVED',
    ownerId: 'u-owner-hn',
    name: 'CLB Pickleball & Tennis Xuân Đỉnh',
    slug: 'clb-pickleball-tennis-xuan-dinh',
    city: 'Hà Nội',
    district: 'Bắc Từ Liêm',
    address: 'Đường Xuân Đỉnh, Xuân Đỉnh, Bắc Từ Liêm, Hà Nội',
    lat: 21.0745,
    lng: 105.7885,
    images: ['https://picsum.photos/seed/xuan-dinh-1/800/500'],
    amenities: ['Khuôn viên rộng', 'Bãi xe ô tô', 'HLV chuyên nghiệp', 'Phòng tắm nóng lạnh'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.8,
    ratingCount: 84,
    courts: [
      {
        id: 'c-hn-165',
        name: 'Sân Pickleball Xuân Đỉnh 1',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 120000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-166',
        name: 'Sân Pickleball Xuân Đỉnh 2',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 120000,
        status: 'ACTIVE',
      },
      {
        id: 'c-hn-167',
        name: 'Sân Tennis Xuân Đỉnh',
        sportType: 'TENNIS',
        slotMinutes: 90,
        defaultPricePerSlot: 300000,
        status: 'ACTIVE',
      },
    ],
    reviews: [
      {
        id: 'rv-hn-24',
        author: 'Nguyễn Văn X',
        rating: 5,
        comment: 'Cụm sân đẹp, vị trí thuận tiện tại Bắc Từ Liêm.',
        createdAt: '20/08/2026',
      },
    ],
  },
];

/** Map venue mock -> phản hồi listMine của owner (kèm _count.courts). */
function toOwnerVenue(venue: MockVenue): Record<string, unknown> {
  return {
    ...venue,
    status: venue.status ?? 'APPROVED',
    depositPercent: venue.depositPercent,
    rejectReason: venue.rejectReason ?? null,
    createdAt: new Date().toISOString(),
    _count: { courts: venue.courts.length },
  };
}

/** Map venue mock -> item hàng chờ admin. */
interface AdminVenueRow extends MockVenue {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  _count: { courts: number };
}

function toAdminVenue(venue: MockVenue): AdminVenueRow {
  return {
    ...venue,
    status: venue.status ?? 'APPROVED',
    createdAt: new Date().toISOString(),
    _count: { courts: venue.courts.length },
  };
}

/** Bảng giá REPLACE-ALL theo court — bộ nhớ tạm của mock. */
const MOCK_PRICING = new Map<
  string,
  Array<{
    dayType: 'WEEKDAY' | 'WEEKEND';
    startMinute: number;
    endMinute: number;
    pricePerSlot: number;
  }>
>();

interface MockOwnerBooking {
  id: string;
  code: string;
  venueId: string;
  courtName: string;
  customerName: string;
  date: string;
  startMinute: number;
  endMinute: number;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  amountPaid: number;
  /** Ghép trận mở (§3.11). */
  isPublicMatch?: boolean;
  slotsNeeded?: number | null;
  matchFull?: boolean;
}

/** Đơn mẫu hôm nay — deterministic để test ổn định. */
let MOCK_BOOKINGS_CACHE: MockOwnerBooking[] | null = null;
function today(): string {
  const now = new Date();
  return (
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0')
  );
}
function mockOwnerBookings(): MockOwnerBooking[] {
  if (MOCK_BOOKINGS_CACHE !== null) return MOCK_BOOKINGS_CACHE;
  const date = today();
  MOCK_BOOKINGS_CACHE = [
    {
      id: 'b-1',
      code: 'CH-' + date.replace(/-/g, '') + '-0001',
      venueId: 'v-1',
      courtName: 'Sân 1',
      customerName: 'Minh T.',
      date,
      startMinute: 360,
      endMinute: 420,
      status: 'CONFIRMED',
      amountPaid: 36000,
      // §3.11: đơn công khai đang tìm người ghép (badge + modal chủ đơn).
      isPublicMatch: true,
      slotsNeeded: 4,
      matchFull: false,
    },
    {
      id: 'b-2',
      code: 'CH-' + date.replace(/-/g, '') + '-0002',
      venueId: 'v-1',
      courtName: 'Sân 2',
      customerName: 'Lan H.',
      date,
      startMinute: 540,
      endMinute: 600,
      status: 'CONFIRMED',
      amountPaid: 36000,
    },
    {
      id: 'b-3',
      code: 'CH-' + date.replace(/-/g, '') + '-0003',
      venueId: 'v-2',
      courtName: 'Sân A1',
      customerName: 'Hoàng N.',
      date,
      startMinute: 660,
      endMinute: 720,
      status: 'CHECKED_IN',
      amountPaid: 90000,
    },
    {
      id: 'b-4',
      code: 'CH-' + date.replace(/-/g, '') + '-0004',
      venueId: 'v-2',
      courtName: 'Sân Pickle',
      customerName: 'Phúc D.',
      date,
      startMinute: 780,
      endMinute: 840,
      status: 'PENDING_PAYMENT',
      amountPaid: 0,
    },
    {
      id: 'b-5',
      code: 'CH-' + date.replace(/-/g, '') + '-0005',
      venueId: 'v-1',
      courtName: 'Sân 3',
      customerName: 'Tuấn K.',
      date,
      startMinute: 900,
      endMinute: 990,
      status: 'COMPLETED',
      amountPaid: 400000,
    },
  ];
  return MOCK_BOOKINGS_CACHE;
}

/* ------------------------------------------------------------------ */
/* Thống kê owner (§3.10): sinh chuỗi ngày deterministic từ seed       */
/* venueId+days — cùng phiên luôn trả cùng số liệu, test ổn định.      */
/* ------------------------------------------------------------------ */

/** PRNG mulberry32 khởi tạo từ chuỗi — không phụ thuộc thứ tự gọi. */
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ngày địa phương cách hôm nay n ngày, định dạng YYYY-MM-DD. */
function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

interface MockAnalyticsPayload {
  meta: { venueId: string; venueName: string; days: number; from: string; to: string };
  summary: {
    revenueConfirmed: number;
    totalBookings: number;
    cancelledCount: number;
    noShowCount: number;
    cancelRate: number;
  };
  series: Array<{ date: string; bookings: number; revenue: number }>;
  topCourts: Array<{ courtId: string; courtName: string; bookings: number; revenue: number }>;
}

/** Cache theo 'venueId:days' để nhiều lần gọi trong phiên nhất quán. */
const MOCK_ANALYTICS = new Map<string, MockAnalyticsPayload>();

function buildMockAnalytics(venueId: string, days: number): MockAnalyticsPayload | null {
  const venue = MOCK_VENUES.find((item) => item.id === venueId);
  if (venue === undefined) return null;
  const cacheKey = venueId + ':' + String(days);
  const cached = MOCK_ANALYTICS.get(cacheKey);
  if (cached !== undefined) return cached;

  const rand = seededRandom(cacheKey);
  const series: MockAnalyticsPayload['series'] = [];
  let totalBookings = 0;
  let totalRevenue = 0;
  for (let i = days - 1; i >= 0; i--) {
    const date = isoDaysAgo(i);
    const weekday = new Date(date + 'T00:00:00').getDay();
    const weekend = weekday === 0 || weekday === 6;
    // Cuối tuần cao hơn + dao động dài hạn + nhiễu ngẫu nhiên ổn định.
    const wave = Math.sin((days - i) / 4.5) * 0.5 + 0.5;
    const base = weekend ? 6 : 4;
    const bookings = Math.max(0, Math.round(base * (0.5 + rand()) * (0.55 + wave * 0.9)));
    const avgPrice = 90000 + Math.floor(rand() * 5) * 30000; // 90k..210k/slot
    const revenue = bookings * avgPrice;
    totalBookings += bookings;
    totalRevenue += revenue;
    series.push({ date, bookings, revenue });
  }

  const cancelledCount = Math.round(totalBookings * (0.05 + rand() * 0.06));
  const noShowCount = Math.round(totalBookings * (0.01 + rand() * 0.03));
  const combined = totalBookings > 0 ? cancelledCount + noShowCount : 0;

  // Chia đều có trọng số cho các sân con; giữ đúng tổng để khớp summary.
  const courts =
    venue.courts.length > 0
      ? venue.courts.map((court) => ({ id: court.id, name: court.name }))
      : [{ id: venueId + '-main', name: 'Sân chính' }];
  const weights = courts.map(() => 0.4 + rand());
  const weightSum = weights.reduce((acc, value) => acc + value, 0);
  let leftBookings = totalBookings;
  let leftRevenue = totalRevenue;
  const ranked = courts.map((court, index) => {
    const isLast = index === courts.length - 1;
    const bookings = isLast
      ? leftBookings
      : Math.round((totalBookings * weights[index]) / weightSum);
    const revenue = isLast ? leftRevenue : Math.round((totalRevenue * weights[index]) / weightSum);
    leftBookings -= bookings;
    leftRevenue -= revenue;
    return { courtId: court.id, courtName: court.name, bookings, revenue };
  });
  ranked.sort(
    (a, b) =>
      b.bookings - a.bookings || b.revenue - a.revenue || a.courtName.localeCompare(b.courtName),
  );

  const payload: MockAnalyticsPayload = {
    meta: {
      venueId,
      venueName: venue.name,
      days,
      from: series[0]?.date ?? isoDaysAgo(days - 1),
      to: today(),
    },
    summary: {
      revenueConfirmed: totalRevenue,
      totalBookings,
      cancelledCount,
      noShowCount,
      cancelRate: totalBookings > 0 ? Math.round((combined / totalBookings) * 10000) / 10000 : 0,
    },
    series,
    topCourts: ranked.filter((row) => row.bookings > 0),
  };
  MOCK_ANALYTICS.set(cacheKey, payload);
  return payload;
}

/* ------------------------------------------------------------------ */
/* Ghép trận mở (§3.11): dữ liệu mẫu + trạng thái tham gia theo phiên. */
/* ------------------------------------------------------------------ */

interface MockOpenMatch {
  bookingId: string;
  code: string;
  courtName: string;
  sportType: 'FOOTBALL5' | 'FOOTBALL7' | 'PICKLEBALL' | 'BADMINTON' | 'TENNIS';
  date: string;
  startMinute: number;
  endMinute: number;
  subtotal: number;
  depositAmount: number;
  hostName: string;
  slotsNeeded: number;
  /** Số người đã tham gia ban đầu; tăng/giảm khi join/leave trong phiên. */
  joinedCount: number;
}

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

/** Danh sách trận mở mẫu — deterministic, đủ nhiều loại sân để test filter. */
const MOCK_OPEN_MATCHES: MockOpenMatch[] = [
  {
    bookingId: 'om-1',
    code: 'CH-' + today().replace(/-/g, '') + '-0090',
    courtName: 'Sân Pickleball Saigon · Sân 1',
    sportType: 'PICKLEBALL',
    date: futureDate(1),
    startMinute: 1080,
    endMinute: 1200,
    subtotal: 480000,
    depositAmount: 144000,
    hostName: 'Trần Thị Cẩm Lan',
    slotsNeeded: 4,
    joinedCount: 2,
  },
  {
    bookingId: 'om-2',
    code: 'CH-' + today().replace(/-/g, '') + '-0091',
    courtName: 'Cụm Cầu lông Thủ Đức · Sân A1',
    sportType: 'BADMINTON',
    date: futureDate(2),
    startMinute: 1080,
    endMinute: 1170,
    subtotal: 360000,
    depositAmount: 108000,
    hostName: 'Lê Quốc Hoàng',
    slotsNeeded: 3,
    joinedCount: 1,
  },
  {
    bookingId: 'om-3',
    code: 'CH-' + today().replace(/-/g, '') + '-0092',
    courtName: 'Sân Bóng Đá Gò Vấp · Sân 5',
    sportType: 'FOOTBALL5',
    date: futureDate(3),
    startMinute: 1020,
    endMinute: 1110,
    subtotal: 900000,
    depositAmount: 270000,
    hostName: 'Phạm Quốc Dũng',
    slotsNeeded: 9,
    joinedCount: 5,
  },
];

/** bookingId đã được người dùng hiện tại tham gia (demo một người dùng). */
const MOCK_JOINED = new Set<string>();

interface MockHoldStore {
  id: string;
  courtId: string;
  courtName: string;
  venueName: string;
  date: string;
  slots: Array<{ startMinute: number; endMinute: number }>;
  subtotal: number;
  depositPercent: number;
  expiresAt: string;
  /** Ghép trận mở (§3.11) — giữ lựa chọn để hiển thị lại ở checkout. */
  isPublicMatch?: boolean;
  slotsNeeded?: number | null;
}

const MOCK_HOLDS = new Map<string, MockHoldStore>();

interface MockCustomerBookingItem {
  id: string;
  code: string;
  venueId: string;
  venueName: string;
  courtName: string;
  sportType: string;
  date: string;
  startMinute: number;
  endMinute: number;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  amountPaid: number;
  totalPrice: number;
  paymentType: 'DEPOSIT' | 'FULL';
  depositPercent: number;
  hasReviewed?: boolean;
  review?: { rating: number; comment?: string };
  createdAt: string;
  /** Ghép trận mở (§3.11). */
  isPublicMatch?: boolean;
  slotsNeeded?: number | null;
  matchFull?: boolean;
}

const MOCK_CUSTOMER_BOOKINGS: MockCustomerBookingItem[] = [
  {
    id: 'cb-1',
    code: 'CH-20260828-0001',
    venueId: 'v-1',
    venueName: 'Sân Pickleball Saigon',
    courtName: 'Sân 1',
    sportType: 'PICKLEBALL',
    date: '2026-08-28',
    startMinute: 1080,
    endMinute: 1200,
    status: 'CONFIRMED',
    amountPaid: 72000,
    totalPrice: 240000,
    paymentType: 'DEPOSIT',
    depositPercent: 30,
    // §3.11: đơn công khai đang tìm người ghép.
    isPublicMatch: true,
    slotsNeeded: 4,
    matchFull: false,
    createdAt: '2026-08-24T10:00:00.000Z',
  },
  {
    id: 'cb-2',
    code: 'CH-20260820-0002',
    venueId: 'v-2',
    venueName: 'Cụm Cầu lông Thủ Đức',
    courtName: 'Sân A1',
    sportType: 'BADMINTON',
    date: '2026-08-20',
    startMinute: 360,
    endMinute: 480,
    status: 'COMPLETED',
    amountPaid: 180000,
    totalPrice: 180000,
    paymentType: 'FULL',
    depositPercent: 30,
    hasReviewed: true,
    review: { rating: 5, comment: 'Sân rất thoáng mát, sàn BWF chuẩn thi đấu.' },
    createdAt: '2026-08-19T08:00:00.000Z',
  },
];

export async function handleMockRequest<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  await delay(MOCK_LATENCY_MS);

  // POST /ai/hold tái dùng nguyên transaction giữ chỗ của bookings (§3.12) —
  // mock cũng làm vậy: đổi đường dẫn rồi rơi xuống nhánh /bookings/holds.
  if (method === 'POST' && path.split('?')[0] === '/ai/hold') {
    path = '/bookings/holds';
    method = 'POST';
  }

  const route = method + ' ' + path;

  const payload = (typeof body === 'object' && body !== null ? body : {}) as Record<
    string,
    unknown
  >;

  const [rawPath0, rawQuery0 = ''] = path.split('?');
  const search0 = new URLSearchParams(rawQuery0);

  // ===================== BOOKING & PAYMENTS mock (t11) =====================
  // 1. GET /courts/:courtId/slots?from=YYYY-MM-DD&days=7
  // ===================== AI assistant mock (§3.12-13) ======================
  // Đếm lượt chat trong phiên để demo throttle 20/h; resetMockSession xoá.
  if (method === 'POST' && rawPath0 === '/ai/chat') {
    const text = requireString(payload, 'message').toLowerCase();
    MOCK_AI_CALLS += 1;
    if (MOCK_AI_CALLS > 20 || text.includes('rate-limit-me')) {
      throw new ApiError(
        429,
        'Bạn đã gửi quá nhiều tin nhắn. Thử lại sau ít phút.',
        'RATE_LIMITED',
      );
    }

    const sportHint = text.includes('pickle')
      ? 'PICKLEBALL'
      : text.includes('cầu lông') || text.includes('badminton')
        ? 'BADMINTON'
        : text.includes('tennis')
          ? 'TENNIS'
          : null;

    // Hỏi giờ của một sân đã tìm ở câu trước -> trả slot trống tối nay.
    const askSlots = /giờ|slot|trống/.test(text) && /(saigon|thủ đức|sân)/.test(text);
    if (askSlots) {
      return {
        intent: 'SEARCH_SLOTS',
        reply: 'Tối nay còn các khung giờ sau, chạm một khung để giữ chỗ nhé:',
        toolsUsed: ['searchVenues', 'checkSlots'],
        data: {
          slots: {
            courtId: 'c-1',
            courtName: 'Sân 1',
            date: today(),
            slotMinutes: 60,
            available: [
              { label: '18:00–19:00', startMinute: 1080, endMinute: 1140 },
              { label: '19:00–20:00', startMinute: 1140, endMinute: 1200 },
              { label: '20:00–21:00', startMinute: 1200, endMinute: 1260 },
            ],
          },
        },
      } as T;
    }

    // Tìm sân theo loại môn.
    if (sportHint !== null || /sân|tìm|đặt/.test(text)) {
      const venues = MOCK_VENUES.filter((venue) =>
        sportHint === null ? true : venue.courts.some((court) => court.sportType === sportHint),
      ).map((venue) => ({
        venueId: venue.id,
        name: venue.name,
        address: venue.address,
        image: venue.images[0],
        minPrice:
          venue.courts.length > 0
            ? Math.min(...venue.courts.map((court) => court.defaultPricePerSlot))
            : null,
        courts: venue.courts.map((court) => ({
          courtId: court.id,
          name: court.name,
          sportType: court.sportType as never,
          pricePerSlot: court.defaultPricePerSlot,
          slotMinutes: court.slotMinutes,
        })),
      }));
      return {
        intent: 'SEARCH_SLOTS',
        reply:
          venues.length > 0
            ? 'Mình tìm được ' + String(venues.length) + ' sân khớp, bạn xem nhé:'
            : 'Chưa có sân nào khớp yêu cầu của bạn.',
        toolsUsed: ['searchVenues'],
        data: { venues },
      } as T;
    }

    return {
      intent: 'FALLBACK',
      reply: 'Mình giúp tìm sân và xem giờ trống — bạn muốn chơi môn gì nhỉ?',
      toolsUsed: [],
      data: {},
    } as T;
  }

  // Gợi ý khung giờ AI-2: giờ vàng cố định, deterministic cho test.
  if (method === 'GET' && rawPath0 === '/ai/suggested-slots') {
    const date = search0.get('date') ?? today();
    return {
      courtId: search0.get('courtId') ?? '',
      date,
      suggestions: [
        {
          startMinute: 1080,
          label: '18:00',
          score: 0.9,
          reason: 'Giờ vàng — nhiều người thường chơi khung này.',
        },
        { startMinute: 1140, label: '19:00', score: 0.75, reason: 'Bạn hay chơi khung tối muộn.' },
        { startMinute: 1020, label: '17:00', score: 0.6, reason: 'Vừa sức sau giờ làm.' },
        { startMinute: 360, label: '06:00', score: 0.5, reason: 'Khung sáng sớm thoáng mát.' },
      ],
    } as T;
  }
  if (method === 'GET' && /^\/courts\/[^/]+\/slots/.test(rawPath0)) {
    const courtId = rawPath0.split('/')[2];
    const fromDate = search0.get('from') || new Date().toISOString().slice(0, 10);
    const [y, m, d] = fromDate.split('-').map(Number);
    const base = new Date(y, m - 1, d);

    // Tìm court và venue tương ứng
    let courtInfo = { slotMinutes: 60, defaultPricePerSlot: 120000 };
    for (const v of MOCK_VENUES) {
      const found = v.courts.find((c) => c.id === courtId);
      if (found) {
        courtInfo = found;
        break;
      }
    }

    const byDate = [];
    for (let i = 0; i < 7; i++) {
      const curr = new Date(base);
      curr.setDate(base.getDate() + i);
      const dateStr =
        curr.getFullYear() +
        '-' +
        String(curr.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(curr.getDate()).padStart(2, '0');

      const slots = [];
      for (
        let minute = 360;
        minute + courtInfo.slotMinutes <= 1380;
        minute += courtInfo.slotMinutes
      ) {
        // Giả lập trạng thái
        let state: 'AVAILABLE' | 'BOOKED' | 'HELD' | 'MAINTENANCE' | 'PAST' = 'AVAILABLE';
        if (i === 0 && minute === 1140) state = 'BOOKED'; // 19:00 ngày đầu — kịch bản chip bị lọc (t11)
        if (i === 1 && minute === 540) state = 'BOOKED';
        if (i === 2 && minute === 660) state = 'HELD';
        if (i === 4 && minute === 780) state = 'MAINTENANCE';

        // Hold đang hoạt động chặn slot tương ứng (t11: gợi ý phải đối chiếu)
        for (const holdEntry of MOCK_HOLDS.values()) {
          if (holdEntry.courtId !== courtId || holdEntry.date !== dateStr) continue;
          if (
            state === 'AVAILABLE' &&
            holdEntry.slots.some((holdSlot) => holdSlot.startMinute === minute)
          ) {
            state = 'HELD';
          }
        }

        slots.push({
          startMinute: minute,
          endMinute: minute + courtInfo.slotMinutes,
          state,
          price: courtInfo.defaultPricePerSlot,
        });
      }
      byDate.push({ date: dateStr, slots });
    }

    return { courtId, byDate } as T;
  }

  // 2. POST /bookings/holds
  if (method === 'POST' && (rawPath0 === '/bookings/holds' || rawPath0 === '/bookings/hold')) {
    const courtId = requireString(payload, 'courtId');
    const date = requireString(payload, 'date');
    const slots = (Array.isArray(payload.slots) ? payload.slots : []) as Array<{
      startMinute: number;
      endMinute: number;
    }>;

    let venueName = 'Sân thể thao';
    let courtName = 'Sân 1';
    let slotPrice = 120000;
    let depositPercent = 30;

    for (const v of MOCK_VENUES) {
      const found = v.courts.find((c) => c.id === courtId);
      if (found) {
        venueName = v.name;
        courtName = found.name;
        slotPrice = found.defaultPricePerSlot;
        depositPercent = v.depositPercent;
        break;
      }
    }

    const holdId = 'h-' + Date.now().toString(36);
    const subtotal = slots.length * slotPrice;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const holdObj: MockHoldStore = {
      id: holdId,
      courtId,
      courtName,
      venueName,
      date,
      slots,
      subtotal,
      depositPercent,
      expiresAt,
      // §3.11: chỉ nhận khi bật công khai và slotsNeeded hợp lệ 1..10.
      ...(payload.isPublicMatch === true
        ? (() => {
            const needed = Number(payload.slotsNeeded);
            const valid = Number.isInteger(needed) && needed >= 1 && needed <= 10;
            if (!valid) {
              throw new ApiError(
                400,
                'slotsNeeded (1..10) là bắt buộc khi bật ghép trận mở',
                'SLOTS_NEEDED_INVALID',
              );
            }
            return { isPublicMatch: true, slotsNeeded: needed };
          })()
        : {}),
    };
    MOCK_HOLDS.set(holdId, holdObj);

    // Contract thật trả holdId + khung giờ liền kề (bookings.service.createHold).
    const startMinute = slots.length > 0 ? Math.min(...slots.map((s) => s.startMinute)) : 0;
    const endMinute = slots.length > 0 ? Math.max(...slots.map((s) => s.endMinute)) : 0;
    return {
      holdId: holdObj.id,
      courtId,
      date,
      startMinute,
      endMinute,
      subtotal,
      depositPercent,
      expiresAt,
      ...(holdObj.isPublicMatch ? { isPublicMatch: true, slotsNeeded: holdObj.slotsNeeded } : {}),
    } as T;
  }

  // 3. GET /bookings/holds/:id
  if (method === 'GET' && rawPath0.startsWith('/bookings/holds/')) {
    const id = rawPath0.split('/')[3];
    const hold = MOCK_HOLDS.get(id);
    if (!hold) {
      // Fallback hold mẫu
      return {
        id,
        courtId: 'c-1',
        courtName: 'Sân 1',
        venueName: 'Sân Pickleball Saigon',
        date: '2026-08-28',
        slots: [{ startMinute: 1080, endMinute: 1200 }],
        subtotal: 240000,
        depositPercent: 30,
        expiresAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
      } as T;
    }
    return hold as T;
  }

  // 4. DELETE /bookings/holds/:id
  if (method === 'DELETE' && rawPath0.startsWith('/bookings/holds/')) {
    const id = rawPath0.split('/')[3];
    MOCK_HOLDS.delete(id);
    return { ok: true } as T;
  }

  // 5. POST /payments/checkout
  if (method === 'POST' && rawPath0 === '/payments/checkout') {
    const holdId = requireString(payload, 'holdId');
    const type = (payload.type as 'DEPOSIT' | 'FULL') || 'DEPOSIT';
    const hold = MOCK_HOLDS.get(holdId);

    const subtotal = hold?.subtotal ?? 240000;
    const depositPercent = hold?.depositPercent ?? 30;
    const amount = type === 'DEPOSIT' ? Math.round((subtotal * depositPercent) / 100) : subtotal;
    const txnRef = 'CH-' + Date.now().toString().slice(-8);

    // Tạo booking thành công trong mock
    const newBooking: MockCustomerBookingItem = {
      id: 'cb-' + Date.now().toString(36),
      code: txnRef,
      venueId: 'v-1',
      venueName: hold?.venueName ?? 'Sân Pickleball Saigon',
      courtName: hold?.courtName ?? 'Sân 1',
      sportType: 'PICKLEBALL',
      date: hold?.date ?? '2026-08-28',
      startMinute: hold?.slots[0]?.startMinute ?? 1080,
      endMinute: hold?.slots[hold?.slots.length - 1]?.endMinute ?? 1200,
      status: 'CONFIRMED',
      amountPaid: amount,
      totalPrice: subtotal,
      paymentType: type,
      depositPercent,
      createdAt: new Date().toISOString(),
    };
    MOCK_CUSTOMER_BOOKINGS.unshift(newBooking);

    return {
      txnRef,
      amount,
      type,
      mode: 'mock',
      paymentUrl: `/thanh-toan/ket-qua?status=SUCCESS&code=${txnRef}`,
      redirectUrl: `/thanh-toan/ket-qua?status=SUCCESS&code=${txnRef}`,
    } as T;
  }

  // 6. GET /bookings/me
  if (method === 'GET' && rawPath0 === '/bookings/me') {
    const filter = search0.get('filter') || 'upcoming';
    let filtered = [...MOCK_CUSTOMER_BOOKINGS];
    if (filter === 'upcoming') {
      filtered = filtered.filter((b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN');
    } else if (filter === 'history') {
      filtered = filtered.filter((b) => b.status === 'COMPLETED');
    } else if (filter === 'cancelled') {
      filtered = filtered.filter((b) => b.status === 'CANCELLED' || b.status === 'NO_SHOW');
    }
    return {
      items: filtered,
      total: filtered.length,
      page: 1,
      pages: 1,
    } as T;
  }

  // 7. GET /bookings/:id/refund-preview
  if (method === 'GET' && rawPath0.endsWith('/refund-preview')) {
    const id = rawPath0.split('/')[2];
    const b = MOCK_CUSTOMER_BOOKINGS.find((item) => item.id === id);
    const amountPaid = b?.amountPaid ?? 108000;
    return {
      refundPercent: 100,
      refundAmount: amountPaid,
      amountPaid,
      hoursUntilMatch: 48,
      policyDescription: 'Hủy trước giờ chơi >24h hoàn 100% số tiền đã cọc.',
    } as T;
  }

  // 8. POST /bookings/:id/review
  if (method === 'POST' && rawPath0.endsWith('/review')) {
    const id = rawPath0.split('/')[2];
    const b = MOCK_CUSTOMER_BOOKINGS.find((item) => item.id === id);
    if (b) {
      b.hasReviewed = true;
      b.review = {
        rating: typeof payload.rating === 'number' ? payload.rating : 5,
        comment: typeof payload.comment === 'string' ? payload.comment : '',
      };
    }
    return { ok: true } as T;
  }

  // ===================== OWNER / ADMIN mock (t10) =====================

  // GET /venues/mine — sân của owner đăng nhập (mọi trạng thái).
  if (method === 'GET' && rawPath0 === '/venues/mine') {
    const page = Math.max(1, Number(search0.get('page') ?? '1') || 1);
    const limit = Math.max(1, Number(search0.get('limit') ?? '20') || 20);
    const rows = MOCK_VENUES.filter((venue) => venue.ownerId === 'u-owner').map((venue) => ({
      ...toOwnerVenue(venue),
    }));
    return {
      items: rows.slice((page - 1) * limit, page * limit),
      total: rows.length,
      page,
      limit,
      pages: Math.max(1, Math.ceil(rows.length / limit)),
    } as T;
  }

  // CRUD venue của owner.
  if (method === 'POST' && rawPath0 === '/venues') {
    const now = Date.now();
    const created: MockVenue = {
      id: 'v-' + now.toString(36),
      status: 'PENDING',
      ownerId: 'u-owner',
      name: requireString(payload, 'name'),
      slug: requireString(payload, 'slug') || 'san-' + now.toString(36),
      address: requireString(payload, 'address'),
      lat: typeof payload.lat === 'number' ? payload.lat : 10.78,
      lng: typeof payload.lng === 'number' ? payload.lng : 106.7,
      images: Array.isArray(payload.images) ? (payload.images as string[]) : [],
      amenities: Array.isArray(payload.amenities) ? (payload.amenities as string[]) : [],
      depositPercent: typeof payload.depositPercent === 'number' ? payload.depositPercent : 30,
      openMinute: typeof payload.openMinute === 'number' ? payload.openMinute : 360,
      closeMinute: typeof payload.closeMinute === 'number' ? payload.closeMinute : 1380,
      courts: [],
      reviews: [],
    };
    MOCK_VENUES.unshift(created);
    return toOwnerVenue(created) as T;
  }
  if ((method === 'PUT' || method === 'DELETE') && rawPath0.startsWith('/venues/')) {
    const id = rawPath0.split('/')[2];
    const index = MOCK_VENUES.findIndex((venue) => venue.id === id);
    if (index === -1) throw new ApiError(404, 'Không tìm thấy sân', 'VENUE_NOT_FOUND');
    if (method === 'DELETE') {
      MOCK_VENUES.splice(index, 1);
      return { ok: true } as T;
    }
    Object.assign(MOCK_VENUES[index], payload);
    return toOwnerVenue(MOCK_VENUES[index]) as T;
  }

  // Sân con: GET/POST /venues/:venueId/courts + PUT/DELETE /courts/:id.
  if (method === 'GET' && /^\/venues\/[^/]+\/courts$/.test(rawPath0)) {
    const venueId = rawPath0.split('/')[2];
    const venue = MOCK_VENUES.find((item) => item.id === venueId || item.slug === venueId);
    if (venue === undefined) throw new ApiError(404, 'Không tìm thấy sân', 'VENUE_NOT_FOUND');
    return {
      items: venue.courts.map((court) => ({
        ...court,
        status: (court.status ?? 'ACTIVE') as 'ACTIVE' | 'MAINTENANCE',
        venueId,
      })),
    } as T;
  }
  if (method === 'POST' && /^\/venues\/[^/]+\/courts$/.test(rawPath0)) {
    const venueId = rawPath0.split('/')[2];
    const venue = MOCK_VENUES.find((item) => item.id === venueId);
    if (venue === undefined) throw new ApiError(404, 'Không tìm thấy sân', 'VENUE_NOT_FOUND');
    const court = {
      id: 'c-' + Date.now().toString(36),
      name: requireString(payload, 'name'),
      sportType: requireString(payload, 'sportType') || 'PICKLEBALL',
      slotMinutes: typeof payload.slotMinutes === 'number' ? payload.slotMinutes : 60,
      defaultPricePerSlot:
        typeof payload.defaultPricePerSlot === 'number' ? payload.defaultPricePerSlot : 100000,
      status: (typeof payload.status === 'string' ? payload.status : 'ACTIVE') as
        'ACTIVE' | 'MAINTENANCE',
    };
    venue.courts.push(court);
    return court as T;
  }
  if ((method === 'PUT' || method === 'DELETE') && /^\/courts\/[^/]+$/.test(rawPath0)) {
    const courtId = rawPath0.split('/')[2];
    for (const venue of MOCK_VENUES) {
      const index = venue.courts.findIndex((court) => court.id === courtId);
      if (index !== -1) {
        if (method === 'DELETE') {
          venue.courts.splice(index, 1);
          return { ok: true } as T;
        }
        venue.courts[index] = {
          ...venue.courts[index],
          ...payload,
        } as (typeof venue.courts)[number];
        return venue.courts[index] as T;
      }
    }
    throw new ApiError(404, 'Không tìm thấy sân con', 'COURT_NOT_FOUND');
  }

  // Bảng giá REPLACE-ALL theo court.
  if (rawPath0.startsWith('/courts/') && rawPath0.endsWith('/pricing-rules')) {
    const courtId = rawPath0.split('/')[2];
    if (method === 'GET') return { rules: MOCK_PRICING.get(courtId) ?? [] } as T;
    if (method === 'PUT' && Array.isArray(payload.rules)) {
      MOCK_PRICING.set(courtId, payload.rules as never);
      return { rules: payload.rules } as T;
    }
  }

  // Đơn hàng owner: lọc theo venueId/date/status.
  if (method === 'GET' && rawPath0 === '/owner/bookings') {
    let rows = mockOwnerBookings();
    const venueFilter = search0.get('venueId');
    const dateFilter = search0.get('date');
    const statusFilter = search0.get('status');
    if (venueFilter) rows = rows.filter((row) => row.venueId === venueFilter);
    if (dateFilter) rows = rows.filter((row) => row.date === dateFilter);
    if (statusFilter) rows = rows.filter((row) => row.status === statusFilter);
    return { items: rows, total: rows.length, page: 1, limit: 50, pages: 1 } as T;
  }
  // Thống kê owner (§3.10): venueId bắt buộc, days 1..90 (mặc định 30).
  if (method === 'GET' && rawPath0 === '/owner/analytics') {
    const venueId = search0.get('venueId') ?? '';
    const daysRaw = Number(search0.get('days') ?? '30');
    const days =
      Number.isFinite(daysRaw) && daysRaw >= 1 && daysRaw <= 90 ? Math.floor(daysRaw) : 30;
    if (venueId === '') {
      throw new ApiError(400, 'venueId là bắt buộc', 'VENUE_ID_REQUIRED');
    }
    const payload = buildMockAnalytics(venueId, days);
    if (payload === null) {
      throw new ApiError(404, 'Không tìm thấy sân', 'VENUE_NOT_FOUND');
    }
    return payload as T;
  }
  // Ghép trận mở (§3.11): danh sách public, lọc sportType/date, phân trang.
  if (method === 'GET' && rawPath0 === '/matches/open') {
    const sportType = search0.get('sportType');
    const date = search0.get('date');
    const page = Math.max(1, Number(search0.get('page') ?? '1') || 1);
    let rows = MOCK_OPEN_MATCHES.filter((m) => m.joinedCount < m.slotsNeeded);
    if (sportType) rows = rows.filter((m) => m.sportType === sportType);
    if (date) rows = rows.filter((m) => m.date === date);
    const limit = 12;
    const start = (page - 1) * limit;
    return {
      items: rows.slice(start, start + limit).map((m) => ({
        ...m,
        joinedCount: m.joinedCount + (MOCK_JOINED.has(m.bookingId) ? 1 : 0),
      })),
      total: rows.length,
      page,
      limit,
      pages: Math.max(1, Math.ceil(rows.length / limit)),
    } as T;
  }

  // Tham gia ghép trận: chặn trùng (409 ALREADY_JOINED) và đầy chỗ (409 MATCH_FULL).
  if (method === 'POST' && /^\/bookings\/[^/]+\/join$/.test(rawPath0)) {
    const bookingId = rawPath0.split('/')[2];
    const match = MOCK_OPEN_MATCHES.find((m) => m.bookingId === bookingId);
    if (match !== undefined) {
      if (MOCK_JOINED.has(bookingId)) {
        throw new ApiError(409, 'Bạn đã tham gia trận này rồi', 'ALREADY_JOINED');
      }
      if (match.joinedCount >= match.slotsNeeded) {
        throw new ApiError(409, 'Trận đã đủ người', 'MATCH_FULL');
      }
      MOCK_JOINED.add(bookingId);
      const joinedCount = match.joinedCount + 1;
      return {
        joinedCount,
        slotsNeeded: match.slotsNeeded,
        matchFull: joinedCount >= match.slotsNeeded,
      } as T;
    }
    throw new ApiError(404, 'Không tìm thấy đơn đặt', 'BOOKING_NOT_FOUND');
  }

  // Rời ghép trận.
  if (method === 'DELETE' && /^\/bookings\/[^/]+\/join$/.test(rawPath0)) {
    const bookingId = rawPath0.split('/')[2];
    const match = MOCK_OPEN_MATCHES.find((m) => m.bookingId === bookingId);
    if (!MOCK_JOINED.delete(bookingId)) {
      throw new ApiError(404, 'Bạn chưa tham gia trận này', 'NOT_JOINED');
    }
    const needed = match?.slotsNeeded ?? 0;
    // Rời ghép -> nếu đơn đang đầy sẽ tự mở lại chỗ trống (khớp service thật).
    void needed;
    return { left: true, bookingId, matchFull: false } as T;
  }

  // Danh sách người tham gia — demo trả tên mẫu cho các đơn mock.
  if (method === 'GET' && /^\/bookings\/[^/]+\/participants$/.test(rawPath0)) {
    const bookingId = rawPath0.split('/')[2];
    return {
      bookingId,
      slotsNeeded: 4,
      matchFull: false,
      joinedCount: 1,
      participants: [
        {
          userId: 'u-customer-01',
          fullName: 'Nguyễn Văn Bình',
          joinedAt: new Date().toISOString(),
        },
      ],
    } as T;
  }
  if (method === 'POST' && rawPath0 === '/bookings/check-in') {
    const code = requireString(payload, 'code').trim().toUpperCase();
    const row = mockOwnerBookings().find((item) => item.code.toUpperCase() === code);
    if (row === undefined || row.status !== 'CONFIRMED') {
      throw new ApiError(
        404,
        'Mã đơn không hợp lệ hoặc không ở trạng thái chờ check-in.',
        'INVALID_CHECKIN_CODE',
      );
    }
    row.status = 'CHECKED_IN';
    return row as T;
  }
  if (method === 'POST' && /^\/bookings\/[^/]+\/no-show$/.test(rawPath0)) {
    const id = rawPath0.split('/')[2];
    const row = mockOwnerBookings().find((item) => item.id === id);
    if (row === undefined) throw new ApiError(404, 'Không tìm thấy đơn', 'BOOKING_NOT_FOUND');
    row.status = 'NO_SHOW';
    return row as T;
  }
  if (method === 'DELETE' && /^\/bookings\/[^/]+$/.test(rawPath0)) {
    const id = rawPath0.split('/')[2];
    const row = mockOwnerBookings().find((item) => item.id === id);
    if (row === undefined) throw new ApiError(404, 'Không tìm thấy đơn', 'BOOKING_NOT_FOUND');
    row.status = 'CANCELLED';
    return { ok: true } as T;
  }

  // Admin: hàng chờ duyệt.
  if (method === 'GET' && rawPath0 === '/admin/venues') {
    const status = search0.get('status');
    const q = (search0.get('q') ?? '').trim().toLowerCase();
    let rows: AdminVenueRow[] = MOCK_VENUES.map((venue) => toAdminVenue(venue));
    if (status) rows = rows.filter((venue) => venue.status === status);
    if (q !== '') rows = rows.filter((venue) => venue.name.toLowerCase().includes(q));
    return { items: rows, total: rows.length } as T;
  }
  if (method === 'POST' && /^\/admin\/venues\/[^/]+\/(approve|reject)$/.test(rawPath0)) {
    const id = rawPath0.split('/')[3];
    const venue = MOCK_VENUES.find((item) => item.id === id);
    if (venue === undefined) throw new ApiError(404, 'Không tìm thấy sân', 'VENUE_NOT_FOUND');
    if (rawPath0.endsWith('/approve')) venue.status = 'APPROVED';
    else {
      venue.status = 'REJECTED';
      venue.rejectReason = requireString(payload, 'reason');
    }
    return toAdminVenue(venue) as T;
  }

  // GET /venues, /venues/:slugOrId và /venues/:slugOrId/reviews — mock public.
  if (
    method === 'GET' &&
    (path === '/venues' || path.startsWith('/venues?') || path.startsWith('/venues/'))
  ) {
    const [rawPath, rawQuery = ''] = path.split('?');
    const search = new URLSearchParams(rawQuery);
    if (rawPath === '/venues') {
      const q = (search.get('q') ?? '').trim().toLowerCase();
      const sportType = search.get('sportType');
      const district = search.get('district')?.trim().toLowerCase();
      const city = search.get('city')?.trim().toLowerCase();
      const userLatParam = search.get('userLat');
      const userLngParam = search.get('userLng');
      const radiusKmParam = search.get('radiusKm');
      const sortBy = search.get('sortBy') ?? search.get('sort');
      const userLat = userLatParam ? Number(userLatParam) : undefined;
      const userLng = userLngParam ? Number(userLngParam) : undefined;
      const radiusKm = radiusKmParam ? Number(radiusKmParam) : undefined;
      const page = Math.max(1, Number(search.get('page') ?? '1') || 1);
      const limit = Math.max(1, Number(search.get('limit') ?? '12') || 12);

      const hasUserGps =
        typeof userLat === 'number' &&
        !isNaN(userLat) &&
        typeof userLng === 'number' &&
        !isNaN(userLng);
      const hasRadius = typeof radiusKm === 'number' && !isNaN(radiusKm) && hasUserGps;

      // Public list: chỉ sân APPROVED. Mặc định chỉ công bố cụm sân Hà Nội;
      // truyền ?city= để xem thành phố khác (vd TP.HCM).
      let filtered = MOCK_VENUES.filter((venue) => {
        const matchStatus = venue.status === 'APPROVED';
        const matchQ =
          q === '' ||
          venue.name.toLowerCase().includes(q) ||
          venue.address.toLowerCase().includes(q) ||
          (venue.district !== undefined && venue.district.toLowerCase().includes(q));
        const matchDistrict =
          !district || (venue.district !== undefined && venue.district.toLowerCase() === district);
        const matchCityScope = city
          ? venue.city !== undefined && venue.city.toLowerCase() === city
          : venue.city === 'Hà Nội';
        const matchSport =
          sportType === null ||
          sportType === '' ||
          venue.courts.some((court) => court.sportType === sportType);
        return matchStatus && matchQ && matchDistrict && matchCityScope && matchSport;
      }).map((venue) => {
        let distanceKm: number | undefined = undefined;
        if (hasUserGps) {
          distanceKm = calculateHaversineDistanceKm(userLat!, userLng!, venue.lat, venue.lng);
        }
        return {
          ...venue,
          distanceKm,
        };
      });

      if (hasRadius) {
        filtered = filtered.filter(
          (venue) => venue.distanceKm !== undefined && venue.distanceKm <= radiusKm!,
        );
      }

      if (sortBy === 'distance' && hasUserGps) {
        filtered.sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999));
      } else if (sortBy === 'price_asc' || sortBy === 'price-asc') {
        const priceOf = (v: (typeof filtered)[0]) =>
          Math.min(...v.courts.map((c) => c.defaultPricePerSlot), Number.MAX_SAFE_INTEGER);
        filtered.sort((a, b) => priceOf(a) - priceOf(b));
      } else if (sortBy === 'price_desc' || sortBy === 'price-desc') {
        const priceOf = (v: (typeof filtered)[0]) =>
          Math.min(...v.courts.map((c) => c.defaultPricePerSlot), 0);
        filtered.sort((a, b) => priceOf(b) - priceOf(a));
      }

      const start = (page - 1) * limit;
      return {
        items: filtered.slice(start, start + limit),
        total: filtered.length,
        page,
        limit,
        pages: Math.max(1, Math.ceil(filtered.length / limit)),
      } as T;
    }
    const segments = rawPath.split('/').filter((segment) => segment !== '');
    // segments: ['venues', slugOrId, ('reviews')?]
    const slugOrId = segments[1];
    const venue = MOCK_VENUES.find((item) => item.slug === slugOrId || item.id === slugOrId);
    // Chi tiết public chỉ lộ sân APPROVED (ẩn PENDING/REJECTED như backend).
    if (venue === undefined || venue.status !== 'APPROVED') {
      throw new ApiError(404, 'Không tìm thấy sân', 'VENUE_NOT_FOUND');
    }
    if (segments[2] === 'reviews') {
      const pageNum = Math.max(1, Number(search.get('page') ?? '1') || 1);
      const size = Math.max(1, Number(search.get('size') ?? '5') || 5);
      const start = (pageNum - 1) * size;
      return {
        items: venue.reviews.slice(start, start + size),
        total: venue.reviews.length,
        page: pageNum,
        size,
        pages: Math.max(1, Math.ceil(venue.reviews.length / size)),
      } as T;
    }
    return venue as T;
  }

  switch (route) {
    case 'POST /auth/login': {
      const email = requireString(payload, 'email').trim().toLowerCase();
      const password = requireString(payload, 'password');
      const account = accounts.find((a) => a.email === email);
      if (!account || account.password !== password) {
        throw new ApiError(401, 'Email hoặc mật khẩu không đúng.', 'INVALID_CREDENTIALS');
      }
      sessionEmail = account.email;
      return { accessToken: makeAccessToken(account.email), user: toAuthUser(account) } as T;
    }

    case 'POST /auth/register': {
      const email = requireString(payload, 'email').trim().toLowerCase();
      const fullName = requireString(payload, 'fullName').trim();
      const password = requireString(payload, 'password');
      if (accounts.some((a) => a.email === email)) {
        throw new ApiError(409, 'Email này đã được sử dụng.', 'EMAIL_TAKEN');
      }
      const phone = requireString(payload, 'phone').trim();
      const account: MockAccount = {
        id: 'u-' + Date.now().toString(36),
        email,
        password,
        fullName,
        ...(phone !== '' ? { phone } : {}),
        role: UserRole.CUSTOMER,
      };
      accounts.push(account);
      return { accessToken: makeAccessToken(email), user: toAuthUser(account) } as T;
    }

    case 'POST /auth/forgot-password': {
      // Mock luôn trả thành công để không lộ email nào tồn tại (giống backend thật).
      // Khác backend: mock mode trả luôn devResetLink khi email tồn tại để demo
      // mở thẳng form đặt lại (P1-F2) thay vì đọc header X-Dev-Reset-Token.
      const email = requireString(payload, 'email').trim().toLowerCase();
      const account = accounts.find((a) => a.email === email);
      if (account !== undefined) {
        const token = 'reset-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        MOCK_RESET_TOKENS.set(token, email);
        return {
          message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.',
          devResetLink: '/dat-lai-mat-khau?token=' + token,
        } as T;
      }
      return {
        message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.',
      } as T;
    }

    case 'POST /auth/reset-password': {
      // 204 không body; token sai/hết hạn -> RESET_TOKEN_INVALID như backend.
      const token = requireString(payload, 'token');
      const newPassword = requireString(payload, 'newPassword');
      const email = MOCK_RESET_TOKENS.get(token);
      if (email === undefined || newPassword.length < 8) {
        throw new ApiError(
          400,
          'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
          'RESET_TOKEN_INVALID',
        );
      }
      const account = accounts.find((a) => a.email === email);
      if (account === undefined) {
        throw new ApiError(
          400,
          'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
          'RESET_TOKEN_INVALID',
        );
      }
      account.password = newPassword;
      MOCK_RESET_TOKENS.delete(token); // one-time như backend (RESET_TOKEN_STALE lần sau)
      sessionEmail = null; // thu hồi mọi phiên cũ
      return undefined as T;
    }

    case 'POST /auth/change-password': {
      // Bearer bắt buộc — mock nhận diện qua phiên đăng nhập hiện tại.
      if (sessionEmail === null) {
        throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.', 'SESSION_EXPIRED');
      }
      const account = accounts.find((a) => a.email === sessionEmail);
      if (account === undefined) {
        throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.', 'SESSION_EXPIRED');
      }
      const currentPassword = requireString(payload, 'currentPassword');
      const newPassword = requireString(payload, 'newPassword');
      if (account.password !== currentPassword) {
        throw new ApiError(400, 'Mật khẩu hiện tại không đúng', 'CURRENT_PASSWORD_WRONG');
      }
      if (newPassword.length < 8) {
        throw new ApiError(400, 'Mật khẩu tối thiểu 8 ký tự', 'VALIDATION_ERROR');
      }
      account.password = newPassword;
      sessionEmail = null; // backend thu hồi mọi phiên + xoá cookie refresh
      return undefined as T;
    }

    case 'PATCH /users/me': {
      if (sessionEmail === null) {
        throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.', 'SESSION_EXPIRED');
      }
      const account = accounts.find((a) => a.email === sessionEmail);
      if (account === undefined) {
        throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.', 'SESSION_EXPIRED');
      }
      if (typeof payload.fullName === 'string' && payload.fullName.trim() !== '') {
        account.fullName = payload.fullName.trim();
      }
      // phone/avatarUrl nhận null hoặc '' để xoá trắng (khớp UpdateProfileSchema).
      if (payload.phone === null || payload.phone === '') {
        delete account.phone;
      } else if (typeof payload.phone === 'string') {
        account.phone = payload.phone.trim();
      }
      if (payload.avatarUrl === null || payload.avatarUrl === '') {
        delete account.avatarUrl;
      } else if (typeof payload.avatarUrl === 'string') {
        account.avatarUrl = payload.avatarUrl.trim();
      }
      return { user: toAuthUser(account) } as T;
    }

    case 'POST /auth/refresh': {
      const current = sessionEmail ? accounts.find((a) => a.email === sessionEmail) : undefined;
      if (!current) {
        throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.', 'SESSION_EXPIRED');
      }
      return { accessToken: makeAccessToken(current.email), user: toAuthUser(current) } as T;
    }

    case 'POST /auth/logout': {
      sessionEmail = null;
      return { ok: true } as T;
    }

    default:
      throw new ApiError(404, 'Chưa có API mock cho ' + route + '.', 'MOCK_NOT_FOUND');
  }
}
