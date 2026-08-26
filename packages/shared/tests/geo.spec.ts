import { describe, expect, it } from 'vitest';
import {
  buildGoogleMapsUrl,
  calculateHaversineDistanceKm,
  districtsOfCity,
  formatDistance,
  hasUsableCoords,
  HANOI_DISTRICT_ALIASES,
  HANOI_DISTRICTS,
  isSupportedCity,
  isValidDistrictForCity,
  SUPPORTED_CITIES,
} from '../src/geo';

describe('HANOI_DISTRICTS & HANOI_DISTRICT_ALIASES (shared)', () => {
  it('đủ 12 quận nội thành Hà Nội theo chuẩn', () => {
    expect(HANOI_DISTRICTS).toHaveLength(12);
    expect(HANOI_DISTRICTS).toContain('Ba Đình');
    expect(HANOI_DISTRICTS).toContain('Cầu Giấy');
    expect(HANOI_DISTRICTS).toContain('Đống Đa');
    expect(HANOI_DISTRICTS).toContain('Hai Bà Trưng');
    expect(HANOI_DISTRICTS).toContain('Hoàn Kiếm');
    expect(HANOI_DISTRICTS).toContain('Thanh Xuân');
    expect(HANOI_DISTRICTS).toContain('Tây Hồ');
    expect(HANOI_DISTRICTS).toContain('Hoàng Mai');
    expect(HANOI_DISTRICTS).toContain('Long Biên');
    expect(HANOI_DISTRICTS).toContain('Hà Đông');
    expect(HANOI_DISTRICTS).toContain('Nam Từ Liêm');
    expect(HANOI_DISTRICTS).toContain('Bắc Từ Liêm');
  });

  it('ánh xạ alias không dấu và viết tắt đúng quận', () => {
    expect(HANOI_DISTRICT_ALIASES['cau giay']).toBe('Cầu Giấy');
    expect(HANOI_DISTRICT_ALIASES['nam tu liem']).toBe('Nam Từ Liêm');
    expect(HANOI_DISTRICT_ALIASES['ntl']).toBe('Nam Từ Liêm');
    expect(HANOI_DISTRICT_ALIASES['bac tu liem']).toBe('Bắc Từ Liêm');
    expect(HANOI_DISTRICT_ALIASES['btl']).toBe('Bắc Từ Liêm');
    expect(HANOI_DISTRICT_ALIASES['hbt']).toBe('Hai Bà Trưng');
    expect(HANOI_DISTRICT_ALIASES['ha dong']).toBe('Hà Đông');
    expect(HANOI_DISTRICT_ALIASES['tay ho']).toBe('Tây Hồ');
    expect(HANOI_DISTRICT_ALIASES['hoan kiem']).toBe('Hoàn Kiếm');
  });
});

describe('calculateHaversineDistanceKm (shared)', () => {
  it('trả về 0 khi cùng tọa độ', () => {
    const d = calculateHaversineDistanceKm(21.0285, 105.8542, 21.0285, 105.8542);
    expect(d).toBe(0);
  });

  it('tính chính xác khoảng cách giữa Hoàn Kiếm và Cầu Giấy (~6.7 km)', () => {
    // Hoàn Kiếm (21.0285, 105.8542) <-> Cầu Giấy (21.0333, 105.7900)
    const d = calculateHaversineDistanceKm(21.0285, 105.8542, 21.0333, 105.79);
    expect(d).toBeGreaterThanOrEqual(6.0);
    expect(d).toBeLessThanOrEqual(7.0);
  });

  it('làm tròn 1 chữ số thập phân', () => {
    const d = calculateHaversineDistanceKm(21.0341, 105.82, 21.018, 105.828);
    const decimalParts = d.toString().split('.');
    if (decimalParts.length > 1) {
      expect(decimalParts[1].length).toBeLessThanOrEqual(1);
    }
  });
});

describe('buildGoogleMapsUrl (shared)', () => {
  it('tạo URL Google Maps chỉ đường chuẩn xác với mode driving', () => {
    const url = buildGoogleMapsUrl(21.0285, 105.8542);
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=21.0285,105.8542&travelmode=driving',
    );
  });

  it('EC-06: tọa độ thiếu/0 -> fallback tìm kiếm theo địa chỉ chuỗi', () => {
    const byAddress = buildGoogleMapsUrl(0, 0, '12 Nguyễn Văn Bảo, Gò Vấp, TP.HCM');
    expect(byAddress).toBe(
      'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent('12 Nguyễn Văn Bảo, Gò Vấp, TP.HCM'),
    );
    const undefinedCoords = buildGoogleMapsUrl(undefined, undefined, '30 Văn Cao, Hà Nội');
    expect(undefinedCoords).toContain('https://www.google.com/maps/search/?api=1&query=');
  });

  it('EC-06: không có cả tọa độ lẫn địa chỉ -> tìm kiếm mặc định Hà Nội', () => {
    const url = buildGoogleMapsUrl();
    expect(url).toBe(
      'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Hà Nội, Việt Nam'),
    );
  });
});

describe('hasUsableCoords (shared)', () => {
  it('chấp nhận tọa độ hợp lệ, từ chối 0 / NaN / undefined', () => {
    expect(hasUsableCoords(21.03, 105.81)).toBe(true);
    expect(hasUsableCoords(0, 105.81)).toBe(false);
    expect(hasUsableCoords(21.03, 0)).toBe(false);
    expect(hasUsableCoords(NaN, 105.81)).toBe(false);
    expect(hasUsableCoords(undefined, 105.81)).toBe(false);
  });
});

describe('formatDistance (shared)', () => {
  it('< 1 km hiển thị mét làm tròn', () => {
    expect(formatDistance(0.65)).toBe('650 m');
    expect(formatDistance(0.08)).toBe('80 m');
  });

  it('>= 1 km hiển thị 1 chữ số thập phân (AC-03.3)', () => {
    expect(formatDistance(2.44)).toBe('2.4 km');
    expect(formatDistance(12)).toBe('12.0 km');
    expect(formatDistance(0)).toBe('0 m');
  });

  it('khoảng cách không hợp lệ -> null để UI ẩn badge', () => {
    expect(formatDistance(undefined)).toBeNull();
    expect(formatDistance(null)).toBeNull();
    expect(formatDistance(NaN)).toBeNull();
    expect(formatDistance(-1)).toBeNull();
  });
});

describe('Thành phố → Quận/Huyện master data (shared)', () => {
  it('đúng 2 thành phố được hỗ trợ', () => {
    expect(SUPPORTED_CITIES).toEqual(['Hà Nội', 'TP. Hồ Chí Minh']);
    expect(isSupportedCity('hà nội')).toBe(true);
    expect(isSupportedCity('TP. Hồ Chí Minh')).toBe(true);
    expect(isSupportedCity('Đà Nẵng')).toBe(false);
    expect(isSupportedCity(undefined)).toBe(false);
  });

  it('districtsOfCity trả danh sách canonical theo thành phố', () => {
    // HN = 12 quận nội thành + Thanh Trì
    expect(districtsOfCity('Hà Nội')).toHaveLength(13);
    expect(districtsOfCity('Hà Nội')).toContain('Thanh Trì');
    // TP.HCM có cả quận lẫn huyện ngoại thành xuất hiện trong dữ liệu seed
    const hcm = districtsOfCity('TP. Hồ Chí Minh');
    expect(hcm).toContain('Quận 1');
    expect(hcm).toContain('Thủ Đức');
    expect(hcm).toContain('Nhà Bè');
    expect(hcm).not.toContain('Dĩ An');
    // Thành phố lạ -> rỗng
    expect(districtsOfCity('Hải Phòng')).toEqual([]);
  });

  it('isValidDistrictForCity so khớp không phân biệt hoa/thường và chéo thành phố', () => {
    expect(isValidDistrictForCity('Hà Nội', 'Cầu Giấy')).toBe(true);
    expect(isValidDistrictForCity('Hà Nội', 'cầu giấy')).toBe(true);
    expect(isValidDistrictForCity('TP. Hồ Chí Minh', 'Quận 7')).toBe(true);
    // Quận của TP.HCM không hợp lệ khi chọn Hà Nội và ngược lại
    expect(isValidDistrictForCity('Hà Nội', 'Quận 7')).toBe(false);
    expect(isValidDistrictForCity('TP. Hồ Chí Minh', 'Cầu Giấy')).toBe(false);
  });
});
