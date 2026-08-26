/**
 * API giả lập trong bộ nhớ — dùng khi chưa có backend thật (VITE_USE_MOCK=true).
 * Mô phỏng đúng hợp đồng REST của module auth (đặc tả §3.1) và shape lỗi
 * thống nhất { statusCode, message, code } để UI chạy đứng yên không lỗi.
 */
import { calculateHaversineDistanceKm, NotificationType, UserRole } from '@courthub/shared';

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
  // Hộp thư thông báo dựng lại từ seed — badge/mark-read cách ly giữa test (P2-F1).
  MOCK_NOTIFICATIONS = seedNotifications();
  // Ví mock dựng lại từ seed — số dư/ledger cách ly giữa các test (F6).
  MOCK_WALLET_BALANCES.clear();
  MOCK_WALLET_LEDGER.length = 0;
  // Voucher dựng lại từ seed — danh sách/quota cách ly giữa các test (F3).
  resetMockVouchers();
  // Teams dựng lại từ seed — thành viên/quỹ cách ly giữa các test (F1).
  resetMockTeams();
  // Dịch vụ đi kèm dựng lại từ seed — menu/addon cách ly giữa các test (F4).
  resetMockVenueServices();
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

/* ------------------------------------------------------------------ */
/* Thông báo in-app (P2-F1): hộp thư theo user, mới nhất trước.        */
/* ------------------------------------------------------------------ */

interface MockNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

/**
 * Dữ liệu mẫu đa loại cho demo chuông thông báo — gắn theo tài khoản mock
 * (customer/owner/admin đều có hộp thư riêng). createdAt tính lùi từ "bây giờ"
 * để badge + thời gian tương đối luôn sống động khi demo.
 */
function seedNotifications(): MockNotification[] {
  const minutesAgo = (m: number): string => new Date(Date.now() - m * 60_000).toISOString();
  return [
    {
      id: 'n-cus-01',
      userId: 'u-customer-01',
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Đặt sân thành công',
      body: 'Đơn CH-2026 của bạn tại Sân Pickleball Saigon đã được xác nhận.',
      link: '/dashboard/my-bookings',
      readAt: null,
      createdAt: minutesAgo(3),
    },
    {
      id: 'n-cus-02',
      userId: 'u-customer-01',
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Thanh toán thành công',
      body: 'Bạn đã thanh toán 36.000₫ cho đơn giữ chỗ tại Sân Pickleball Saigon.',
      link: '/dashboard/my-bookings',
      readAt: null,
      createdAt: minutesAgo(65),
    },
    {
      id: 'n-cus-03',
      userId: 'u-customer-01',
      type: NotificationType.REMINDER,
      title: 'Nhắc lịch: trận đấu sau 2 giờ',
      body: 'Bạn có trận đấu lúc 18:00 hôm nay tại Cụm Cầu lông Thủ Đức — đừng quên!',
      link: '/dashboard/my-bookings',
      readAt: null,
      createdAt: minutesAgo(60 * 5),
    },
    {
      id: 'n-cus-04',
      userId: 'u-customer-01',
      type: NotificationType.MATCH_JOINED,
      title: 'Có người tham gia trận ghép',
      body: 'Minh T. vừa tham gia đơn ghép của bạn — còn trống 2 slot.',
      link: '/dashboard/my-bookings',
      readAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
      createdAt: minutesAgo(60 * 26),
    },
    {
      id: 'n-cus-05',
      userId: 'u-customer-01',
      type: NotificationType.BOOKING_CANCELLED,
      title: 'Đơn đặt đã bị huỷ',
      body: 'Đơn CH-2025 tại Tennis Bình Thạnh đã được huỷ, tiền cọc sẽ hoàn trong 3-5 ngày.',
      link: '/dashboard/my-bookings',
      readAt: new Date(Date.now() - 50 * 3600_000).toISOString(),
      createdAt: minutesAgo(60 * 50),
    },
    {
      id: 'n-own-01',
      userId: 'u-owner-01',
      type: NotificationType.NEW_BOOKING_OWNER,
      title: 'Có đơn đặt mới',
      body: 'Sân A1 (Cụm Cầu lông Thủ Đức) vừa có đơn mới từ Hoàng N.',
      link: '/dashboard/bookings',
      readAt: null,
      createdAt: minutesAgo(12),
    },
    {
      id: 'n-own-02',
      userId: 'u-owner-01',
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Khách đã thanh toán cọc',
      body: 'Đơn CH-2024 — khách đã chuyển cọc 30% qua VNPAY.',
      link: '/dashboard/bookings',
      readAt: null,
      createdAt: minutesAgo(95),
    },
    {
      id: 'n-adm-01',
      userId: 'u-admin-01',
      type: NotificationType.NEW_BOOKING_OWNER,
      title: 'Sân mới chờ duyệt',
      body: 'Cụm sân "Tennis Bình Thạnh" đang chờ quản trị duyệt.',
      link: '/dashboard/admin',
      readAt: null,
      createdAt: minutesAgo(30),
    },
  ];
}

/** Hộp thư mock theo phiên — resetMockSession() dựng lại để cách ly giữa test. */
let MOCK_NOTIFICATIONS: MockNotification[] = seedNotifications();

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
  /** F3 voucher: snapshot giảm giá (null/undefined = chưa áp). */
  discountAmount?: number | null;
  finalAmount?: number | null;
  /** S2-F1: hold tạo tư cách đội. */
  teamId?: string | null;
}

const MOCK_HOLDS = new Map<string, MockHoldStore>();

/* ===================== TEAMS mock (F1) ===================== */

interface MockTeam {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  sportType: string;
  captainId: string;
  createdAt: string;
}

interface MockTeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'CAPTAIN' | 'MEMBER';
  status: 'ACTIVE' | 'PENDING';
  joinedAt: string;
}

interface MockExpenseShare {
  id: string;
  teamId: string;
  bookingId: string | null;
  payerId: string;
  debtorId: string;
  amount: number;
  note: string | null;
  status: 'UNPAID' | 'PAID';
  createdAt: string;
}

const MOCK_TEAMS: MockTeam[] = [
  {
    id: 'team-01',
    name: 'Dragon Pickleball Club',
    logoUrl: null,
    description: 'Nhóm chơi pickleball tối thứ 3 - thứ 5 tại Quần Ngựa.',
    sportType: 'PICKLEBALL',
    captainId: 'u-customer-01',
    createdAt: '2026-08-15T02:00:00.000Z',
  },
];

let MOCK_TEAM_MEMBERS: MockTeamMember[] = [
  {
    id: 'tm-01',
    teamId: 'team-01',
    userId: 'u-customer-01',
    role: 'CAPTAIN',
    status: 'ACTIVE',
    joinedAt: '2026-08-15T02:00:00.000Z',
  },
  {
    id: 'tm-02',
    teamId: 'team-01',
    userId: 'u-owner-01',
    role: 'MEMBER',
    status: 'ACTIVE',
    joinedAt: '2026-08-16T02:00:00.000Z',
  },
  {
    id: 'tm-03',
    teamId: 'team-01',
    userId: 'u-admin-01',
    role: 'MEMBER',
    status: 'ACTIVE',
    joinedAt: '2026-08-17T02:00:00.000Z',
  },
];

let MOCK_EXPENSES: MockExpenseShare[] = [
  {
    id: 'es-01',
    teamId: 'team-01',
    bookingId: null,
    payerId: 'u-customer-01',
    debtorId: 'u-owner-01',
    amount: 80000,
    note: 'Tiền nước trận cuối tuần',
    status: 'UNPAID',
    createdAt: '2026-08-22T02:00:00.000Z',
  },
  {
    id: 'es-02',
    teamId: 'team-01',
    bookingId: null,
    payerId: 'u-customer-01',
    debtorId: 'u-admin-01',
    amount: 120000,
    note: 'Thuê sân chia đều',
    status: 'PAID',
    createdAt: '2026-08-20T02:00:00.000Z',
  },
];

function resetMockTeams(): void {
  MOCK_TEAM_MEMBERS = MOCK_TEAM_MEMBERS.filter((m) => ['tm-01', 'tm-02', 'tm-03'].includes(m.id));
  MOCK_EXPENSES = MOCK_EXPENSES.filter((e) => ['es-01', 'es-02'].includes(e.id));
}

/* ===================== WALLET mock (F6) =====================
   Contract backend wallets.controller:
   POST /wallet/topup -> {txnRef, amount, mode:'mock', paymentUrl}
   GET /wallet/me -> {balance, page, pageSize, total, items[]}.
   Mock ghi thẳng ledger + cập nhật số dư ngay lúc topup (callback luôn SUCCESS). */

interface MockLedgerEntry {
  id: string;
  userId: string;
  direction: 'CREDIT' | 'DEBIT';
  type: 'TOPUP' | 'PAYMENT' | 'REFUND' | 'CASHBACK';
  amount: number;
  refType: string;
  refId: string;
  balanceAfter: number;
  createdAt: string;
}

/** Số dư theo userId — vai trò "wallet_balances" phía backend. */
const MOCK_WALLET_BALANCES = new Map<string, number>();
/** Ledger append-only giả lập — truy vấn luôn sort mới nhất trước. */
const MOCK_WALLET_LEDGER: MockLedgerEntry[] = [];

/** Seed demo: user có sẵn một lần nạp 300.000₫ để trang Ví không trống trơn. */
function mockWalletSeed(userId: string): void {
  if (MOCK_WALLET_BALANCES.has(userId)) return;
  MOCK_WALLET_BALANCES.set(userId, 300000);
  MOCK_WALLET_LEDGER.push({
    id: 'wl-seed-' + userId,
    userId,
    direction: 'CREDIT',
    type: 'TOPUP',
    amount: 300000,
    refType: 'TOPUP',
    refId: 'seed-topup-' + userId,
    balanceAfter: 300000,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  });
}

/** Áp một biến động vào ví mock (CREDIT cộng / DEBIT trừ) rồi ghi ledger. */
function mockWalletApply(
  userId: string,
  direction: MockLedgerEntry['direction'],
  type: MockLedgerEntry['type'],
  amount: number,
  refType: string,
  refId: string,
): void {
  const current = MOCK_WALLET_BALANCES.get(userId) ?? 0;
  const balanceAfter = direction === 'CREDIT' ? current + amount : current - amount;
  MOCK_WALLET_BALANCES.set(userId, balanceAfter);
  MOCK_WALLET_LEDGER.push({
    id: 'wl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    userId,
    direction,
    type,
    amount,
    refType,
    refId,
    balanceAfter,
    createdAt: new Date().toISOString(),
  });
}

/* ===================== VOUCHER mock (F3) =====================
   Contract backend: /owner/vouchers (OWNER CRUD) và /holds/:id/voucher (áp mã).
   Mock bỏ kiểm cửa sổ giờ/ngày — chỉ minh hoạ luồng giá snapshot cho UI/demo. */

interface MockVoucher {
  id: string;
  code: string;
  percentOff: number;
  dayOfWeek: number;
  validFromMinute: number;
  validToMinute: number;
  usageLimit: number;
  perUserLimit: number;
  expiresAt: string | null;
  active: boolean;
  ownerId: string;
  createdAt: string;
  _count: { redemptions: number };
}

/** Seed demo: hai mã đang chạy để trang quản lý không trống trơn. */
let MOCK_VOUCHERS: MockVoucher[] = [
  {
    id: 'vc-1',
    code: 'MUA50',
    percentOff: 50,
    dayOfWeek: 3,
    validFromMinute: 840,
    validToMinute: 1080,
    usageLimit: 100,
    perUserLimit: 1,
    expiresAt: null,
    active: true,
    ownerId: 'u-owner-01',
    createdAt: '2026-08-20T02:00:00.000Z',
    _count: { redemptions: 3 },
  },
  {
    id: 'vc-2',
    code: 'SALE10',
    percentOff: 10,
    dayOfWeek: 5,
    validFromMinute: 600,
    validToMinute: 1440,
    usageLimit: 200,
    perUserLimit: 2,
    expiresAt: '2026-12-31T00:00:00.000Z',
    active: true,
    ownerId: 'u-owner-01',
    createdAt: '2026-08-22T02:00:00.000Z',
    _count: { redemptions: 12 },
  },
];

function resetMockVouchers(): void {
  MOCK_VOUCHERS = MOCK_VOUCHERS.filter((v) => v.id === 'vc-1' || v.id === 'vc-2');
  for (const v of MOCK_VOUCHERS) v._count = { redemptions: v.id === 'vc-1' ? 3 : 12 };
}

/* ===================== VENUE SERVICE mock (F4) =====================
   Contract backend: /owner/venues/:venueId/services (OWNER CRUD),
   /venues/:venueId/services (menu public), /bookings/:id/addons (+/checkout).
   Mock không phân quyền owner — mọi session OWNER coi như chủ sân demo. */

interface MockVenueService {
  id: string;
  venueId: string;
  name: string;
  price: number;
  type: 'BEVERAGE' | 'EQUIPMENT' | 'OTHER';
  isAvailable: boolean;
}

/** Seed demo: nước uống + đồ thuê cho hai cụm sân, có một món đang tắt bán. */
let MOCK_VENUE_SERVICES: MockVenueService[] = [
  {
    id: 'svc-1',
    venueId: 'v-1',
    name: 'Nước suối 500ml',
    price: 10000,
    type: 'BEVERAGE',
    isAvailable: true,
  },
  {
    id: 'svc-2',
    venueId: 'v-1',
    name: 'Thuê vợt Pickleball',
    price: 50000,
    type: 'EQUIPMENT',
    isAvailable: true,
  },
  {
    id: 'svc-3',
    venueId: 'v-1',
    name: 'Nước tăng lực',
    price: 20000,
    type: 'BEVERAGE',
    isAvailable: false,
  },
  {
    id: 'svc-4',
    venueId: 'v-2',
    name: 'Quả cầu lông (hộp)',
    price: 25000,
    type: 'EQUIPMENT',
    isAvailable: true,
  },
  {
    id: 'svc-5',
    venueId: 'v-2',
    name: 'Thuê giày cầu lông',
    price: 30000,
    type: 'EQUIPMENT',
    isAvailable: true,
  },
];

const SEED_SERVICE_IDS = ['svc-1', 'svc-2', 'svc-3', 'svc-4', 'svc-5'];

/** Dịch vụ đã gọi trong từng đơn — dùng tính tổng chưa trả của booking (F4). */
const MOCK_BOOKING_ADDONS: Array<{
  bookingId: string;
  serviceId: string;
  quantity: number;
  unitPrice: number;
  paid: boolean;
}> = [];

function resetMockVenueServices(): void {
  MOCK_VENUE_SERVICES = MOCK_VENUE_SERVICES.filter((s) => SEED_SERVICE_IDS.includes(s.id));
  MOCK_BOOKING_ADDONS.length = 0;
}

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
  /** S2-F1: đơn đặt tư cách đội (lịch sử đặt sân của đội). */
  teamId?: string | null;
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
    // S2-F1: đơn này đặt tư cách Dragon Pickleball Club (demo lịch sử đội).
    teamId: 'team-01',
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
      // S2-F1: giữ lựa chọn đội để hiển thị lại ở checkout.
      teamId: typeof payload.teamId === 'string' && payload.teamId ? payload.teamId : null,
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
        discountAmount: null,
        finalAmount: null,
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

  /* ===================== NOTIFICATIONS mock (P2-F1) =====================
     Contract backend t1: GET /notifications (page, pageSize 10, unreadCount),
     POST /notifications/:id/read (idempotent, 404 nếu không thuộc sở hữu),
     POST /notifications/read-all -> { updated }. */

  // GET /notifications?page= — hộp thư của user đăng nhập, mới nhất trước.
  // Nhất quán các mock khác: không có phiên thì rơi về tài khoản demo đầu tiên.
  if (method === 'GET' && rawPath0 === '/notifications') {
    const account =
      sessionEmail === null
        ? accounts[0]
        : (accounts.find((a) => a.email === sessionEmail) ?? accounts[0]);
    const page = Math.max(1, Number(search0.get('page') ?? '1') || 1);
    const mine = MOCK_NOTIFICATIONS.filter((n) => n.userId === account.id).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const pageSize = 10; // NOTIFICATIONS_PAGE_SIZE của backend
    const start = (page - 1) * pageSize;
    return {
      items: mine.slice(start, start + pageSize),
      page,
      pageSize,
      total: mine.length,
      unreadCount: mine.filter((n) => n.readAt === null).length,
    } as T;
  }

  // POST /notifications/read-all — khai báo TRƯỚC ':id/read' để không bị nuốt.
  if (method === 'POST' && rawPath0 === '/notifications/read-all') {
    const account =
      sessionEmail === null
        ? accounts[0]
        : (accounts.find((a) => a.email === sessionEmail) ?? accounts[0]);
    let updated = 0;
    const now = new Date().toISOString();
    for (const n of MOCK_NOTIFICATIONS) {
      if (n.userId === account.id && n.readAt === null) {
        n.readAt = now;
        updated += 1;
      }
    }
    return { updated } as T;
  }

  // POST /notifications/:id/read — idempotent; 404 nếu không thuộc sở hữu.
  if (method === 'POST' && /^\/notifications\/[^/]+\/read$/.test(rawPath0)) {
    const account =
      sessionEmail === null
        ? accounts[0]
        : (accounts.find((a) => a.email === sessionEmail) ?? accounts[0]);
    const id = rawPath0.split('/')[2];
    const row = MOCK_NOTIFICATIONS.find((n) => n.id === id && n.userId === account.id);
    if (row === undefined) {
      throw new ApiError(404, 'Không tìm thấy thông báo', 'NOTIFICATION_NOT_FOUND');
    }
    if (row.readAt === null) row.readAt = new Date().toISOString();
    return { ...row } as T;
  }

  /* ===================== TEAMS mock (F1) ===================== */

  const mockUserSummary = (userId: string) => {
    const acc = accounts.find((a) => a.id === userId);
    return {
      id: userId,
      fullName: acc?.fullName ?? 'Thành viên',
      avatarUrl: null,
      email: acc?.email ?? null,
      phone: null,
    };
  };

  // GET /teams/my-teams
  if (method === 'GET' && rawPath0 === '/teams/my-teams') {
    const account =
      sessionEmail === null
        ? accounts[0]
        : (accounts.find((a) => a.email === sessionEmail) ?? accounts[0]);
    const memberships = MOCK_TEAM_MEMBERS.filter((m) => m.userId === account.id);
    const result = memberships.map((m) => {
      const team = MOCK_TEAMS.find((t) => t.id === m.teamId)!;
      return {
        membershipId: m.id,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
        team: {
          ...team,
          captain: mockUserSummary(team.captainId),
          memberCount: MOCK_TEAM_MEMBERS.filter(
            (x) => x.teamId === team.id && x.status === 'ACTIVE',
          ).length,
        },
      };
    });
    return result as unknown as T;
  }

  // POST /teams — tạo đội mới
  if (method === 'POST' && rawPath0 === '/teams') {
    const account =
      sessionEmail === null
        ? accounts[0]
        : (accounts.find((a) => a.email === sessionEmail) ?? accounts[0]);
    const name = requireString(payload, 'name');
    const newTeam: MockTeam = {
      id: 'team-' + Date.now().toString(36),
      name,
      logoUrl:
        typeof payload.logoUrl === 'string' && payload.logoUrl !== '' ? payload.logoUrl : null,
      description:
        typeof payload.description === 'string' && payload.description !== ''
          ? payload.description
          : null,
      sportType: typeof payload.sportType === 'string' ? payload.sportType : 'PICKLEBALL',
      captainId: account.id,
      createdAt: new Date().toISOString(),
    };
    MOCK_TEAMS.push(newTeam);
    MOCK_TEAM_MEMBERS.push({
      id: 'tm-' + Date.now().toString(36),
      teamId: newTeam.id,
      userId: account.id,
      role: 'CAPTAIN',
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
    });
    return { ...newTeam, members: [], captain: mockUserSummary(account.id) } as T;
  }

  // GET /teams/:id
  if (method === 'GET' && /^\/teams\/[^/]+$/.test(rawPath0)) {
    const id = rawPath0.split('/')[2];
    const team = MOCK_TEAMS.find((t) => t.id === id);
    if (team === undefined) {
      throw new ApiError(404, 'Không tìm thấy đội thể thao', 'TEAM_NOT_FOUND');
    }
    const members = MOCK_TEAM_MEMBERS.filter((m) => m.teamId === id);
    return {
      ...team,
      captain: mockUserSummary(team.captainId),
      members: members.map((m) => ({
        ...m,
        user: mockUserSummary(m.userId),
      })),
    } as T;
  }

  // DELETE /teams/:id/members/:userId
  if (method === 'DELETE' && /^\/teams\/[^/]+\/members\/[^/]+$/.test(rawPath0)) {
    const parts = rawPath0.split('/');
    MOCK_TEAM_MEMBERS = MOCK_TEAM_MEMBERS.filter(
      (m) => !(m.teamId === parts[2] && m.userId === parts[4]),
    );
    return { success: true, message: 'Đã xoá thành viên khỏi đội' } as T;
  }

  // GET /teams/:id/expenses
  if (method === 'GET' && /^\/teams\/[^/]+\/expenses$/.test(rawPath0)) {
    const teamId = rawPath0.split('/')[2];
    const shares = MOCK_EXPENSES.filter((e) => e.teamId === teamId);
    const withUsers = shares.map((s) => ({
      ...s,
      payer: mockUserSummary(s.payerId),
      debtor: mockUserSummary(s.debtorId),
    }));
    const totalUnpaid = withUsers
      .filter((s) => s.status === 'UNPAID')
      .reduce((sum, s) => sum + s.amount, 0);
    return {
      totalUnpaid,
      myOwed: Math.round(totalUnpaid / 2),
      myReceivable: totalUnpaid - Math.round(totalUnpaid / 2),
      shares: withUsers,
    } as T;
  }

  // PATCH /teams/:id/expenses/:shareId/status
  if (method === 'PATCH' && /^\/teams\/[^/]+\/expenses\/[^/]+\/status$/.test(rawPath0)) {
    const shareId = rawPath0.split('/')[4];
    const share = MOCK_EXPENSES.find((s) => s.id === shareId);
    if (share === undefined)
      throw new ApiError(404, 'Không tìm thấy khoản chia tiền', 'EXPENSE_NOT_FOUND');
    share.status = payload.status === 'PAID' ? 'PAID' : 'UNPAID';
    return { ...share } as T;
  }

  /* ===================== VOUCHER mock (F3) ===================== */

  // GET /owner/vouchers — danh sách mã của owner (demo: một owner duy nhất).
  if (method === 'GET' && rawPath0 === '/owner/vouchers') {
    return [...MOCK_VOUCHERS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ) as T;
  }

  // POST /owner/vouchers — tạo mã mới.
  if (method === 'POST' && rawPath0 === '/owner/vouchers') {
    const code = requireString(payload, 'code');
    if (!/^[A-Za-z0-9_-]{3,40}$/.test(code)) {
      throw new ApiError(400, 'Mã chỉ gồm chữ/số/gạch và dài 3–40 ký tự.', 'VOUCHER_BAD_CODE');
    }
    const owner = accounts.find((a) => a.role === UserRole.OWNER) ?? accounts[0];
    const voucher: MockVoucher = {
      id: 'vc-' + Date.now().toString(36),
      code,
      percentOff: Number(payload.percentOff) || 10,
      dayOfWeek: Number(payload.dayOfWeek ?? 3),
      validFromMinute: Number(payload.validFromMinute ?? 840),
      validToMinute: Number(payload.validToMinute ?? 1080),
      usageLimit: Number(payload.usageLimit ?? 100),
      perUserLimit: Number(payload.perUserLimit ?? 1),
      expiresAt: typeof payload.expiresAt === 'string' ? payload.expiresAt : null,
      active: true,
      ownerId: owner.id,
      createdAt: new Date().toISOString(),
      _count: { redemptions: 0 },
    };
    MOCK_VOUCHERS.push(voucher);
    return { id: voucher.id, code: voucher.code } as T;
  }

  // PATCH /owner/vouchers/:id — cập nhật một phần (active, limit, cửa sổ...).
  if (method === 'PATCH' && /^\/owner\/vouchers\/[^/]+$/.test(rawPath0)) {
    const id = rawPath0.split('/')[3];
    const voucher = MOCK_VOUCHERS.find((v) => v.id === id);
    if (voucher === undefined) {
      throw new ApiError(404, 'Không tìm thấy voucher', 'VOUCHER_NOT_FOUND');
    }
    for (const key of [
      'percentOff',
      'dayOfWeek',
      'validFromMinute',
      'validToMinute',
      'usageLimit',
      'perUserLimit',
    ] as const) {
      if (payload[key] !== undefined) voucher[key] = Number(payload[key]);
    }
    if (payload.expiresAt !== undefined) voucher.expiresAt = payload.expiresAt as string | null;
    if (payload.active !== undefined) voucher.active = Boolean(payload.active);
    return { ok: true } as T;
  }

  // DELETE /owner/vouchers/:id
  if (method === 'DELETE' && /^\/owner\/vouchers\/[^/]+$/.test(rawPath0)) {
    const id = rawPath0.split('/')[3];
    MOCK_VOUCHERS = MOCK_VOUCHERS.filter((v) => v.id !== id);
    return { ok: true } as T;
  }

  // POST /holds/:id/voucher — áp mã vào hold, snapshot giá NGAY LÚC ÁP MÃ.
  if (method === 'POST' && /^\/holds\/[^/]+\/voucher$/.test(rawPath0)) {
    const holdId = rawPath0.split('/')[3];
    const code = requireString(payload, 'code');
    let hold = MOCK_HOLDS.get(holdId);
    if (hold === undefined) {
      // Materialise hold demo (khớp fallback GET) để giá snapshot persist qua refetch.
      hold = {
        id: holdId,
        courtId: 'c-1',
        courtName: 'Sân 1',
        venueName: 'Sân Pickleball Saigon',
        date: '2026-08-28',
        slots: [{ startMinute: 1080, endMinute: 1200 }],
        subtotal: 240000,
        depositPercent: 30,
        expiresAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
        discountAmount: null,
        finalAmount: null,
      };
      MOCK_HOLDS.set(holdId, hold);
    }
    if (hold.discountAmount !== null && hold.discountAmount !== undefined) {
      throw new ApiError(409, 'Hold này đã áp voucher rồi', 'VOUCHER_ALREADY_APPLIED');
    }
    const voucher = MOCK_VOUCHERS.find(
      (v) =>
        v.code === code &&
        v.active &&
        (v.expiresAt === null || new Date(v.expiresAt).getTime() > Date.now()),
    );
    if (voucher === undefined) {
      // Nhất quán BE: không phân biệt mã lạ với mã hết hạn/bị tắt để không dò mã.
      throw new ApiError(404, 'Mã không khả dụng', 'VOUCHER_NOT_FOUND');
    }
    const discountAmount = Math.min(
      Math.round((hold.subtotal * voucher.percentOff) / 100),
      hold.subtotal,
    );
    const finalAmount = hold.subtotal - discountAmount;
    hold.discountAmount = discountAmount;
    hold.finalAmount = finalAmount;
    voucher._count.redemptions += 1;
    return {
      holdId: hold.id,
      code: voucher.code,
      percentOff: voucher.percentOff,
      subtotal: hold.subtotal,
      discountAmount,
      finalAmount,
    } as T;
  }

  /* ===================== VENUE SERVICE mock (F4) ===================== */

  // GET/POST /owner/venues/:venueId/services — menu của owner (kể cả món đã tắt).
  if (
    (method === 'GET' || method === 'POST') &&
    /^\/owner\/venues\/[^/]+\/services$/.test(rawPath0)
  ) {
    const venueId = rawPath0.split('/')[3];
    if (!MOCK_VENUES.some((v) => v.id === venueId)) {
      throw new ApiError(404, 'Không tìm thấy cụm sân', 'VENUE_NOT_FOUND');
    }
    if (method === 'GET') {
      return MOCK_VENUE_SERVICES.filter((s) => s.venueId === venueId) as T;
    }
    const name = requireString(payload, 'name');
    const price = Number(payload.price);
    if (!Number.isInteger(price) || price < 1000 || price > 10_000_000) {
      throw new ApiError(
        400,
        'Giá dịch vụ phải nguyên trong khoảng 1.000đ–10.000.000đ',
        'SERVICE_BAD_PRICE',
      );
    }
    const created: MockVenueService = {
      id: 'svc-' + Date.now().toString(36),
      venueId,
      name,
      price,
      type: (payload.type as MockVenueService['type']) ?? 'OTHER',
      isAvailable: payload.isAvailable === undefined ? true : Boolean(payload.isAvailable),
    };
    MOCK_VENUE_SERVICES.push(created);
    return created as T;
  }

  // PATCH/DELETE /owner/venues/:venueId/services/:id — cập nhật hoặc xoá-tắt.
  if (
    (method === 'PATCH' || method === 'DELETE') &&
    /^\/owner\/venues\/[^/]+\/services\/[^/]+$/.test(rawPath0)
  ) {
    const parts = rawPath0.split('/');
    const service = MOCK_VENUE_SERVICES.find((s) => s.id === parts[5] && s.venueId === parts[3]);
    if (service === undefined) {
      throw new ApiError(404, 'Không tìm thấy dịch vụ', 'SERVICE_NOT_FOUND');
    }
    if (method === 'PATCH') {
      if (payload.name !== undefined) service.name = requireString(payload, 'name');
      if (payload.price !== undefined) service.price = Number(payload.price);
      if (payload.type !== undefined) service.type = payload.type as MockVenueService['type'];
      if (payload.isAvailable !== undefined) service.isAvailable = Boolean(payload.isAvailable);
      return service as T;
    }
    // Demo không có lịch sử addon gắn với món seed -> xoá thẳng, khớp nhánh deleted.
    MOCK_VENUE_SERVICES = MOCK_VENUE_SERVICES.filter((s) => s.id !== service.id);
    return { id: service.id, deleted: true, disabled: false } as T;
  }

  // GET /venues/:venueId/services — menu đang mở bán cho khách (trước handler public chung).
  if (method === 'GET' && /^\/venues\/[^/]+\/services$/.test(rawPath0)) {
    const venueId = rawPath0.split('/')[2];
    return MOCK_VENUE_SERVICES.filter((s) => s.venueId === venueId && s.isAvailable) as T;
  }

  // GET/POST /bookings/:id/addons và POST .../checkout — gọi thêm dịch vụ trong đơn.
  if (/^\/bookings\/[^/]+\/addons$/.test(rawPath0) && (method === 'GET' || method === 'POST')) {
    const bookingId = rawPath0.split('/')[2];
    const booking = MOCK_CUSTOMER_BOOKINGS.find((b) => b.id === bookingId);
    if (booking === undefined) {
      throw new ApiError(404, 'Không tìm thấy đơn đặt sân', 'BOOKING_NOT_FOUND');
    }
    if (method === 'POST') {
      if (booking.status !== 'CONFIRMED' && booking.status !== 'CHECKED_IN') {
        throw new ApiError(
          409,
          'Chỉ có thể thêm dịch vụ cho đơn đã xác nhận',
          'BOOKING_NOT_CONFIRMED',
        );
      }
      const items = Array.isArray(payload.items) ? payload.items : [];
      for (const item of items) {
        const service = MOCK_VENUE_SERVICES.find((s) => s.id === item.serviceId);
        if (service === undefined || service.venueId !== booking.venueId || !service.isAvailable) {
          throw new ApiError(400, 'Dịch vụ không khả dụng', 'SERVICE_UNAVAILABLE');
        }
        const existing = MOCK_BOOKING_ADDONS.find(
          (a) => a.bookingId === bookingId && a.serviceId === service.id,
        );
        if (existing === undefined) {
          MOCK_BOOKING_ADDONS.push({
            bookingId,
            serviceId: service.id,
            quantity: Number(item.quantity) || 1,
            unitPrice: service.price,
            paid: false,
          });
        } else {
          existing.quantity += Number(item.quantity) || 1;
          existing.unitPrice = service.price;
        }
      }
    }
    const rows = MOCK_BOOKING_ADDONS.filter((a) => a.bookingId === bookingId);
    const totalCost = rows.reduce((sum, a) => sum + a.quantity * a.unitPrice, 0);
    const paidAmount = rows
      .filter((a) => a.paid)
      .reduce((sum, a) => sum + a.quantity * a.unitPrice, 0);
    return {
      bookingId,
      items: rows.map((a) => ({
        id: bookingId + ':' + a.serviceId,
        bookingId,
        serviceId: a.serviceId,
        quantity: a.quantity,
        unitPrice: a.unitPrice,
        service: MOCK_VENUE_SERVICES.find((s) => s.id === a.serviceId),
      })),
      totalCost,
      paidAmount,
      unpaidAmount: Math.max(0, totalCost - paidAmount),
    } as T;
  }

  // POST /bookings/:id/addons/checkout — mock gateway: đánh dấu đã trả rồi trả URL kết quả.
  if (method === 'POST' && /^\/bookings\/[^/]+\/addons\/checkout$/.test(rawPath0)) {
    const bookingId = rawPath0.split('/')[2];
    const rows = MOCK_BOOKING_ADDONS.filter((a) => a.bookingId === bookingId);
    const unpaidAmount = rows
      .filter((a) => !a.paid)
      .reduce((sum, a) => sum + a.quantity * a.unitPrice, 0);
    if (unpaidAmount <= 0) {
      throw new ApiError(409, 'Tất cả dịch vụ đi kèm đã được thanh toán', 'NO_UNPAID_ADDONS');
    }
    for (const row of rows) row.paid = true;
    return {
      txnRef: bookingId + '.ADD_ON.mock',
      amount: unpaidAmount,
      type: 'ADD_ON',
      mode: 'mock',
      paymentUrl: '/thanh-toan/ket-qua?status=SUCCESS&type=ADD_ON&amount=' + unpaidAmount,
    } as T;
  }

  /* ===================== REPUTATION mock (S3-F2) ===================== */

  // Bảng điểm tĩnh demo — sort-on-read theo score giảm dần.
  const MOCK_LEADERBOARD: Array<{
    userId: string;
    fullName: string;
    avatarUrl: string | null;
    score: number;
    breakdown: { onTimeCheckIns: number; lateCancels: number; noShows: number };
  }> = [
    {
      userId: 'u-customer-02',
      fullName: 'Lê Thị Mai',
      avatarUrl: null,
      score: 92,
      breakdown: { onTimeCheckIns: 14, lateCancels: 0, noShows: 0 },
    },
    {
      userId: 'u-customer-01',
      fullName: 'Nguyễn Văn Bình',
      avatarUrl: null,
      score: 85,
      breakdown: { onTimeCheckIns: 11, lateCancels: 1, noShows: 0 },
    },
    {
      userId: 'u-runner-01',
      fullName: 'Phạm Minh Quân',
      avatarUrl: null,
      score: 78,
      breakdown: { onTimeCheckIns: 9, lateCancels: 1, noShows: 1 },
    },
    {
      userId: 'u-owner-01',
      fullName: 'Trần Thị Cẩm Lan',
      avatarUrl: null,
      score: 74,
      breakdown: { onTimeCheckIns: 8, lateCancels: 2, noShows: 0 },
    },
    {
      userId: 'u-admin-01',
      fullName: 'Phạm Quốc Dũng',
      avatarUrl: null,
      score: 66,
      breakdown: { onTimeCheckIns: 7, lateCancels: 2, noShows: 1 },
    },
  ];

  /** Hai badge đầu tiên của F2 — khớp computeBadges phía BE. */
  function mockReputationBadges(onTimeCheckIns: number, totalBookings: number) {
    return [
      {
        code: 'ON_TIME_10',
        name: 'Đúng giờ 10 lần',
        unlocked: onTimeCheckIns >= 10,
        current: Math.min(onTimeCheckIns, 10),
        target: 10,
      },
      {
        code: 'BOOKING_10',
        name: '10 lần đặt sân',
        unlocked: totalBookings >= 10,
        current: Math.min(totalBookings, 10),
        target: 10,
      },
    ];
  }

  // GET /reputation/me — điểm + badge của user đăng nhập (mặc định tài khoản đầu).
  if (method === 'GET' && rawPath0 === '/reputation/me') {
    const account =
      sessionEmail === null
        ? accounts[0]
        : (accounts.find((a) => a.email === sessionEmail) ?? accounts[0]);
    const row = MOCK_LEADERBOARD.find((r) => r.userId === account.id);
    const breakdown = row?.breakdown ?? { onTimeCheckIns: 0, lateCancels: 0, noShows: 0 };
    return {
      score: row?.score ?? 80, // chưa có dữ liệu -> trung tính
      breakdown,
      badges: mockReputationBadges(
        breakdown.onTimeCheckIns,
        breakdown.onTimeCheckIns + breakdown.lateCancels,
      ),
    } as T;
  }

  // GET /reputation/leaderboard?limit=N — sort score desc, đánh dấu dòng của tôi.
  if (method === 'GET' && rawPath0 === '/reputation/leaderboard') {
    const limit = Math.max(1, Number(search0.get('limit') ?? '20') || 20);
    const account =
      sessionEmail === null
        ? accounts[0]
        : (accounts.find((a) => a.email === sessionEmail) ?? accounts[0]);
    const items = [...MOCK_LEADERBOARD]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((row) => ({ ...row, isMe: row.userId === account.id }));
    return { items } as unknown as T;
  }

  /* ===================== WALLET mock (F6) ===================== */

  // GET /wallet/me — số dư + lịch sử phân trang của user đăng nhập.
  // Nhất quán /bookings/me: mock không có phiên thì rơi về tài khoản demo đầu.
  if (method === 'GET' && rawPath0 === '/wallet/me') {
    const account =
      sessionEmail === null
        ? accounts[0]
        : (accounts.find((a) => a.email === sessionEmail) ?? accounts[0]);
    mockWalletSeed(account.id);
    const page = Math.max(1, Number(search0.get('page') ?? '1') || 1);
    const pageSize = Math.min(50, Math.max(1, Number(search0.get('pageSize') ?? '10') || 10));
    const mine = MOCK_WALLET_LEDGER.filter((e) => e.userId === account.id).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return {
      balance: MOCK_WALLET_BALANCES.get(account.id) ?? 0,
      page,
      pageSize,
      total: mine.length,
      items: mine.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize),
    } as T;
  }

  // POST /wallet/topup — mock ghi ngay ledger; paymentUrl là path trong-app
  // như payments mock để window.location điều hướng nội bộ không rời SPA.
  if (method === 'POST' && rawPath0 === '/wallet/topup') {
    const account =
      sessionEmail === null
        ? accounts[0]
        : (accounts.find((a) => a.email === sessionEmail) ?? accounts[0]);
    const amount = Number(payload.amount);
    if (!Number.isInteger(amount) || amount < 10000 || amount > 50000000) {
      throw new ApiError(
        400,
        'Số tiền nạp không hợp lệ (10.000₫ – 50.000.000₫).',
        'WALLET_BAD_AMOUNT',
      );
    }
    mockWalletSeed(account.id);
    const txnRef = 'TOPUP-' + Date.now().toString(36);
    mockWalletApply(account.id, 'CREDIT', 'TOPUP', amount, 'TOPUP', txnRef);
    return {
      txnRef,
      amount,
      mode: 'mock',
      paymentUrl: '/vi/wallet?status=SUCCESS&txnRef=' + encodeURIComponent(txnRef),
    } as T;
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

    // F5 Map nâng cao: GET /venues/map?bbox=minLat,minLng,maxLat,maxLng
    if (rawPath === '/venues/map') {
      const bboxStr = search.get('bbox') ?? '';
      const sportType = search.get('sportType');
      const q = (search.get('q') ?? '').trim().toLowerCase();
      const limit = Math.max(1, Math.min(100, Number(search.get('limit') ?? '50') || 50));

      const [minLat, minLng, maxLat, maxLng] = bboxStr.split(',').map(Number);
      const hasValidBbox =
        !isNaN(minLat) &&
        !isNaN(minLng) &&
        !isNaN(maxLat) &&
        !isNaN(maxLng) &&
        minLat <= maxLat &&
        minLng <= maxLng;

      const filtered = MOCK_VENUES.filter((venue) => {
        const matchStatus = venue.status === 'APPROVED';
        const matchBbox =
          hasValidBbox &&
          venue.lat >= minLat &&
          venue.lat <= maxLat &&
          venue.lng >= minLng &&
          venue.lng <= maxLng;
        const matchQ =
          q === '' ||
          venue.name.toLowerCase().includes(q) ||
          venue.address.toLowerCase().includes(q);
        const matchSport =
          !sportType ||
          venue.courts.some((c) => c.sportType === sportType && c.status !== 'MAINTENANCE');
        return matchStatus && matchBbox && matchQ && matchSport;
      }).slice(0, limit);

      const items = filtered.map((v) => {
        const activeCourts = v.courts.filter(
          (c) => c.status !== 'MAINTENANCE' && (!sportType || c.sportType === sportType),
        );
        const prices = activeCourts.map((c) => c.defaultPricePerSlot);
        const priceFrom = prices.length > 0 ? Math.min(...prices) : null;
        const priceTo = prices.length > 0 ? Math.max(...prices) : null;
        const availableSports = Array.from(new Set(v.courts.map((c) => c.sportType)));

        return {
          id: v.id,
          name: v.name,
          slug: v.slug,
          address: v.address,
          city: v.city,
          district: v.district,
          lat: v.lat,
          lng: v.lng,
          images: v.images,
          amenities: v.amenities,
          depositPercent: v.depositPercent,
          openMinute: v.openMinute,
          closeMinute: v.closeMinute,
          totalCourts: v.courts.length,
          priceFrom,
          priceTo,
          availableSports,
          courts: v.courts,
        };
      });

      return {
        items,
        total: items.length,
        bounds: { minLat, minLng, maxLat, maxLng },
      } as T;
    }

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
        const token =
          'reset-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
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
