import { CreateVenueWithLocationSchema, UpdateVenueSchema } from '../../src/venues/dto/venue.dto';

const base = {
  name: 'Sân test',
  address: '123 Đường ABC',
  lat: 21.03,
  lng: 105.85,
  openMinute: 360,
  closeMinute: 1320,
};

describe('Cascade TP → Quận ở tầng DTO', () => {
  it('create: district sai thành phố -> DISTRICT_NOT_IN_CITY', () => {
    const r = CreateVenueWithLocationSchema.safeParse({
      ...base,
      city: 'Hà Nội',
      district: 'Quận 7',
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toContain('DISTRICT_NOT_IN_CITY');
  });

  it('create: thiếu city nhưng gửi district của TP.HCM -> suy ra Hà Nội và từ chối', () => {
    const r = CreateVenueWithLocationSchema.safeParse({ ...base, district: 'Quận 7' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path[0]).toBe('district');
  });

  it('create: thiếu city, district thuộc Hà Nội -> pass', () => {
    const r = CreateVenueWithLocationSchema.safeParse({ ...base, district: 'Cầu Giấy' });
    expect(r.success).toBe(true);
  });

  it('create: city không hỗ trợ (Đà Nẵng) -> CITY_NOT_SUPPORTED', () => {
    const r = CreateVenueWithLocationSchema.safeParse({
      ...base,
      city: 'Đà Nẵng',
      district: 'Hải Châu',
    });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.issues.some((i) => i.message.startsWith('CITY_NOT_SUPPORTED'))).toBe(true);
  });

  it('update một phần: chỉ district hợp lệ với city ngầm -> không lỗi ở tầng DTO', () => {
    // Trạng thái sau merge được kiểm ở VenuesService.update (cần biết bản ghi hiện tại)
    const r = UpdateVenueSchema.safeParse({ district: 'Long Biên' });
    expect(r.success).toBe(true);
  });

  it('update: city lạ -> CITY_NOT_SUPPORTED', () => {
    const r = UpdateVenueSchema.safeParse({ city: 'Hải Phòng' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path[0]).toBe('city');
  });
});
