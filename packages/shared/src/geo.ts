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
 * Tạo URL mở Google Maps chỉ đường trực tiếp tới tọa độ sân.
 */
export function buildGoogleMapsUrl(lat: number, lng: number, _address?: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}
