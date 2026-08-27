export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}

export enum SportType {
  FOOTBALL5 = 'FOOTBALL5',
  FOOTBALL7 = 'FOOTBALL7',
  PICKLEBALL = 'PICKLEBALL',
  BADMINTON = 'BADMINTON',
  TENNIS = 'TENNIS',
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export const SPORT_LABELS: Record<SportType, string> = {
  [SportType.FOOTBALL5]: 'Bóng đá 5 người',
  [SportType.FOOTBALL7]: 'Bóng đá 7 người',
  [SportType.PICKLEBALL]: 'Pickleball',
  [SportType.BADMINTON]: 'Cầu lông',
  [SportType.TENNIS]: 'Tennis',
};

export const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh'] as const;

export const DISTRICTS_BY_CITY: Record<(typeof CITIES)[number], string[]> = {
  'Hà Nội': [
    'Ba Đình',
    'Hoàn Kiếm',
    'Cầu Giấy',
    'Đống Đa',
    'Hai Bà Trưng',
    'Thanh Xuân',
    'Tây Hồ',
    'Nam Từ Liêm',
    'Bắc Từ Liêm',
    'Hà Đông',
    'Hoàng Mai',
    'Long Biên',
  ],
  'TP. Hồ Chí Minh': [
    'Quận 1',
    'Quận 3',
    'Quận 4',
    'Quận 5',
    'Quận 7',
    'Quận 10',
    'Bình Thạnh',
    'Phú Nhuận',
    'Tân Bình',
    'Gò Vấp',
    'TP. Thủ Đức',
  ],
};
