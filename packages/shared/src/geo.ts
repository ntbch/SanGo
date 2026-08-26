/**
 * Danh sách 12 quận nội thành Hà Nội (nguồn chân lý địa giới Hà Nội).
 */
export const HANOI_DISTRICTS = [
  'Ba Đình',
  'Cầu Giấy',
  'Đống Đa',
  'Hai Bà Trưng',
  'Hoàn Kiếm',
  'Thanh Xuân',
  'Tây Hồ',
  'Hoàng Mai',
  'Long Biên',
  'Hà Đông',
  'Nam Từ Liêm',
  'Bắc Từ Liêm',
] as const;

export type HanoiDistrict = (typeof HANOI_DISTRICTS)[number];

/**
 * Bảng ánh xạ alias / từ khóa nhận diện 12 quận (hỗ trợ NLU và tìm kiếm không dấu / viết tắt).
 */
export const HANOI_DISTRICT_ALIASES: Record<string, HanoiDistrict> = {
  // Ba Đình
  'ba dinh': 'Ba Đình',
  'ba đình': 'Ba Đình',
  'quan ba dinh': 'Ba Đình',
  'quận ba đình': 'Ba Đình',
  'q. ba dinh': 'Ba Đình',
  'q. ba đình': 'Ba Đình',
  'q ba dinh': 'Ba Đình',
  'q ba đình': 'Ba Đình',
  bd: 'Ba Đình',

  // Cầu Giấy
  'cau giay': 'Cầu Giấy',
  'cầu giấy': 'Cầu Giấy',
  'quan cau giay': 'Cầu Giấy',
  'quận cầu giấy': 'Cầu Giấy',
  'q. cau giay': 'Cầu Giấy',
  'q. cầu giấy': 'Cầu Giấy',
  'q cau giay': 'Cầu Giấy',
  'q cầu giấy': 'Cầu Giấy',
  cg: 'Cầu Giấy',

  // Đống Đa
  'dong da': 'Đống Đa',
  'đống đa': 'Đống Đa',
  'quan dong da': 'Đống Đa',
  'quận đống đa': 'Đống Đa',
  'q. dong da': 'Đống Đa',
  'q. đống đa': 'Đống Đa',
  'q dong da': 'Đống Đa',
  'q đống đa': 'Đống Đa',
  dd: 'Đống Đa',

  // Hai Bà Trưng
  'hai ba trung': 'Hai Bà Trưng',
  'hai bà trưng': 'Hai Bà Trưng',
  'quan hai ba trung': 'Hai Bà Trưng',
  'quận hai bà trưng': 'Hai Bà Trưng',
  'q. hai ba trung': 'Hai Bà Trưng',
  'q. hai bà trưng': 'Hai Bà Trưng',
  'q hai ba trung': 'Hai Bà Trưng',
  'q hai bà trưng': 'Hai Bà Trưng',
  hbt: 'Hai Bà Trưng',

  // Hoàn Kiếm
  'hoan kiem': 'Hoàn Kiếm',
  'hoàn kiếm': 'Hoàn Kiếm',
  'quan hoan kiem': 'Hoàn Kiếm',
  'quận hoàn kiếm': 'Hoàn Kiếm',
  'q. hoan kiem': 'Hoàn Kiếm',
  'q. hoàn kiếm': 'Hoàn Kiếm',
  'q hoan kiem': 'Hoàn Kiếm',
  'q hoàn kiếm': 'Hoàn Kiếm',
  'pho co': 'Hoàn Kiếm',
  'phố cổ': 'Hoàn Kiếm',
  'bo ho': 'Hoàn Kiếm',
  'bờ hồ': 'Hoàn Kiếm',
  hk: 'Hoàn Kiếm',

  // Thanh Xuân
  'thanh xuan': 'Thanh Xuân',
  'thanh xuân': 'Thanh Xuân',
  'quan thanh xuan': 'Thanh Xuân',
  'quận thanh xuân': 'Thanh Xuân',
  'q. thanh xuan': 'Thanh Xuân',
  'q. thanh xuân': 'Thanh Xuân',
  'q thanh xuan': 'Thanh Xuân',
  'q thanh xuân': 'Thanh Xuân',
  tx: 'Thanh Xuân',

  // Tây Hồ
  'tay ho': 'Tây Hồ',
  'tây hồ': 'Tây Hồ',
  'quan tay ho': 'Tây Hồ',
  'quận tây hồ': 'Tây Hồ',
  'q. tay ho': 'Tây Hồ',
  'q. tây hồ': 'Tây Hồ',
  'q tay ho': 'Tây Hồ',
  'q tây hồ': 'Tây Hồ',
  'ho tay': 'Tây Hồ',
  'hồ tây': 'Tây Hồ',
  'quang an': 'Tây Hồ',
  'quảng an': 'Tây Hồ',
  th: 'Tây Hồ',

  // Hoàng Mai
  'hoang mai': 'Hoàng Mai',
  'hoàng mai': 'Hoàng Mai',
  'quan hoang mai': 'Hoàng Mai',
  'quận hoàng mai': 'Hoàng Mai',
  'q. hoang mai': 'Hoàng Mai',
  'q. hoàng mai': 'Hoàng Mai',
  'q hoang mai': 'Hoàng Mai',
  'q hoàng mai': 'Hoàng Mai',
  hm: 'Hoàng Mai',

  // Long Biên
  'long bien': 'Long Biên',
  'long biên': 'Long Biên',
  'quan long bien': 'Long Biên',
  'quận long biên': 'Long Biên',
  'q. long bien': 'Long Biên',
  'q. long biên': 'Long Biên',
  'q long bien': 'Long Biên',
  'q long biên': 'Long Biên',
  lb: 'Long Biên',

  // Hà Đông
  'ha dong': 'Hà Đông',
  'hà đông': 'Hà Đông',
  'quan ha dong': 'Hà Đông',
  'quận hà đông': 'Hà Đông',
  'q. ha dong': 'Hà Đông',
  'q. hà đông': 'Hà Đông',
  'q ha dong': 'Hà Đông',
  'q hà đông': 'Hà Đông',
  hd: 'Hà Đông',

  // Nam Từ Liêm
  'nam tu liem': 'Nam Từ Liêm',
  'nam từ liêm': 'Nam Từ Liêm',
  'quan nam tu liem': 'Nam Từ Liêm',
  'quận nam từ liêm': 'Nam Từ Liêm',
  'q. nam tu liem': 'Nam Từ Liêm',
  'q. nam từ liêm': 'Nam Từ Liêm',
  'q nam tu liem': 'Nam Từ Liêm',
  'q nam từ liêm': 'Nam Từ Liêm',
  'my dinh': 'Nam Từ Liêm',
  'mỹ đình': 'Nam Từ Liêm',
  'me tri': 'Nam Từ Liêm',
  'mễ trì': 'Nam Từ Liêm',
  ntl: 'Nam Từ Liêm',

  // Bắc Từ Liêm
  'bac tu liem': 'Bắc Từ Liêm',
  'bắc từ liêm': 'Bắc Từ Liêm',
  'quan bac tu liem': 'Bắc Từ Liêm',
  'quận bắc từ liêm': 'Bắc Từ Liêm',
  'q. bac tu liem': 'Bắc Từ Liêm',
  'q. bắc từ liêm': 'Bắc Từ Liêm',
  'q bac tu liem': 'Bắc Từ Liêm',
  'q bắc từ liêm': 'Bắc Từ Liêm',
  'xuan dinh': 'Bắc Từ Liêm',
  'xuân đỉnh': 'Bắc Từ Liêm',
  'co nhue': 'Bắc Từ Liêm',
  'cổ nhuế': 'Bắc Từ Liêm',
  btl: 'Bắc Từ Liêm',
};

/**
 * Tính cự ly địa lý (đường chim bay) giữa 2 tọa độ theo công thức Haversine.
 * Kết quả làm tròn 1 chữ số thập phân (đơn vị km).
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const aRaw =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const a = Math.min(1, Math.max(0, aRaw));
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Kiểm tra cặp tọa độ có dùng được cho bản đồ/chỉ đường không.
 * Coi 0/0 hoặc NaN/undefined là "thiếu dữ liệu" (EC-06 trong BRD GEO).
 */
export function hasUsableCoords(lat?: number, lng?: number): boolean {
  return (
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    lat !== 0 &&
    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    lng !== 0
  );
}

/**
 * Tạo URL mở Google Maps chỉ đường tới sân.
 * - Có tọa độ hợp lệ -> Directions URL chuẩn (AC-04.2).
 * - Thiếu/tọa độ 0 (EC-06) -> fallback tìm kiếm theo địa chỉ chuỗi;
 *   không có địa chỉ thì tìm kiếm mặc định tại Hà Nội.
 */
export function buildGoogleMapsUrl(lat?: number, lng?: number, address?: string): string {
  if (!hasUsableCoords(lat, lng)) {
    const query =
      address !== undefined && address.trim() !== '' ? address.trim() : 'Hà Nội, Việt Nam';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

/**
 * Định dạng khoảng cách hiển thị trên badge (AC-03.3):
 * < 1 km -> mét ('650 m'); >= 1 km -> 1 chữ số thập phân ('2.4 km').
 * Trả về null khi không có khoảng cách hợp lệ để UI ẩn badge.
 */
export function formatDistance(km: number | null | undefined): string | null {
  if (typeof km !== 'number' || !Number.isFinite(km) || km < 0) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/* ------------------------------------------------------------------ */
/* Master data Thành phố → Quận/Huyện                                  */
/* Phạm vi khớp dữ liệu seed SanGo (AloBo, chỉ HN + TP.HCM).         */
/* ------------------------------------------------------------------ */

/** Quận/huyện TP. Hồ Chí Minh xuất hiện trong dữ liệu SanGo. */
export const HO_CHI_MINH_DISTRICTS = [
  'Quận 1',
  'Quận 2',
  'Quận 3',
  'Quận 4',
  'Quận 7',
  'Quận 9',
  'Quận 10',
  'Quận 12',
  'Thủ Đức',
  'Bình Thạnh',
  'Bình Tân',
  'Bình Chánh',
  'Gò Vấp',
  'Phú Nhuận',
  'Tân Bình',
  'Tân Phú',
  'Hóc Môn',
  'Nhà Bè',
] as const;

export type HoChiMinhDistrict = (typeof HO_CHI_MINH_DISTRICTS)[number];

/** Thành phố SanGo đang hỗ trợ — thứ tự này cũng là thứ tự hiển thị trên UI. */
export const SUPPORTED_CITIES = ['Hà Nội', 'TP. Hồ Chí Minh'] as const;
export type SupportedCity = (typeof SUPPORTED_CITIES)[number];

/**
 * Quận/huyện canonical theo thành phố.
 * Hà Nội = 12 quận nội thành (HANOI_DISTRICTS) + huyện Thanh Trì.
 */
export const CITY_DISTRICTS: Record<SupportedCity, readonly string[]> = {
  'Hà Nội': [...HANOI_DISTRICTS, 'Thanh Trì'],
  'TP. Hồ Chí Minh': HO_CHI_MINH_DISTRICTS,
};

/** Chuỗi city có phải thành phố được hỗ trợ không (so khớp bỏ qua hoa/thường). */
export function isSupportedCity(city?: string | null): boolean {
  if (!city) return false;
  const normalized = city.trim().toLowerCase();
  return SUPPORTED_CITIES.some((supported) => supported.toLowerCase() === normalized);
}

/** Quận/huyện canonical của một thành phố; thành phố lạ trả về mảng rỗng. */
export function districtsOfCity(city: string): readonly string[] {
  const match = SUPPORTED_CITIES.find(
    (supported) => supported.toLowerCase() === city.trim().toLowerCase(),
  );
  return match ? CITY_DISTRICTS[match] : [];
}

/** Quận/huyện có thuộc thành phố đã chọn không (không phân biệt hoa/thường). */
export function isValidDistrictForCity(city: string, district: string): boolean {
  return districtsOfCity(city).some(
    (canonical) => canonical.toLowerCase() === district.trim().toLowerCase(),
  );
}
