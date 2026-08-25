import { RuleBasedNluProvider, resolveRelativeDate } from './rule-based-nlu.provider';

describe('RuleBasedNluProvider (AI-1 & GEO-4)', () => {
  const nlu = new RuleBasedNluProvider();
  const now = new Date('2026-08-25T10:00:00.000Z'); // Thứ 3

  it('nhận diện loại sân: sân 7 -> FOOTBALL7, bóng đá thường -> FOOTBALL5', async () => {
    const seven = await nlu.parse('cho mình sân bóng đá sân 7 gần nhà');
    expect(seven.entities.sportType).toBe('FOOTBALL7');
    const five = await nlu.parse('tìm bóng đá khu cầu giấy');
    expect(five.entities.sportType).toBe('FOOTBALL5');
  });

  it('nhận diện pickleball / cầu lông / tennis', async () => {
    expect((await nlu.parse('sân pickleball ở gò vấp tối nay')).entities.sportType).toBe(
      'PICKLEBALL',
    );
    expect((await nlu.parse('cầu lông ngày mai nhé')).entities.sportType).toBe('BADMINTON');
    expect((await nlu.parse('tennis quan 7')).entities.sportType).toBe('TENNIS');
  });

  it('resolve ngày tương đối: hôm nay / mai / mốt', () => {
    expect(resolveRelativeDate('hôm nay còn sân không', now)).toBe('2026-08-25');
    expect(resolveRelativeDate('cho xin lịch ngày mai', now)).toBe('2026-08-26');
    expect(resolveRelativeDate('mốt đi chơi', now)).toBe('2026-08-27');
    expect(resolveRelativeDate('không nhắc ngày', now)).toBeUndefined();
  });

  it('nhận diện khu vực phổ biến HN/HCM', async () => {
    const hcm = await nlu.parse('cho mình sân pickleball gần Gò Vấp tối nay');
    expect(hcm.entities.location).toBe('gò vấp');
    const hn = await nlu.parse('sân tennis quận cầu giấy');
    expect(hn.entities.location).toBe('cầu giấy');
  });

  it('GEO-4: nhận diện đầy đủ 12 quận nội thành Hà Nội (có dấu & không dấu)', async () => {
    // 1. Ba Đình
    expect((await nlu.parse('tìm sân ở ba đình')).entities.location).toBe('ba đình');
    expect((await nlu.parse('đặt sân bóng ba dinh ngày mai')).entities.location).toBe('ba đình');

    // 2. Cầu Giấy
    expect((await nlu.parse('sân pickleball cau giay')).entities.location).toBe('cầu giấy');

    // 3. Đống Đa
    expect((await nlu.parse('sân bóng đống đa tối nay')).entities.location).toBe('đống đa');
    expect((await nlu.parse('san tennis dong da')).entities.location).toBe('đống đa');

    // 4. Hai Bà Trưng
    expect((await nlu.parse('sân cầu lông ở hai bà trưng')).entities.location).toBe('hai bà trưng');
    expect((await nlu.parse('sân pickleball hbt')).entities.location).toBe('hai bà trưng');

    // 5. Hoàn Kiếm
    expect((await nlu.parse('tìm sân bóng hoàn kiếm')).entities.location).toBe('hoàn kiếm');
    expect((await nlu.parse('quan hoan kiem con san khong')).entities.location).toBe('hoàn kiếm');

    // 6. Thanh Xuân
    expect((await nlu.parse('sân bóng thanh xuân')).entities.location).toBe('thanh xuân');
    expect((await nlu.parse('san thanh xuan')).entities.location).toBe('thanh xuân');

    // 7. Tây Hồ
    expect((await nlu.parse('sân tennis tây hồ')).entities.location).toBe('tây hồ');
    expect((await nlu.parse('san tay ho toi nay')).entities.location).toBe('tây hồ');

    // 8. Hoàng Mai
    expect((await nlu.parse('cho mình sân cầu lông ở hoàng mai')).entities.location).toBe('hoàng mai');
    expect((await nlu.parse('san pickleball hoang mai')).entities.location).toBe('hoàng mai');

    // 9. Long Biên
    expect((await nlu.parse('tìm sân ở long biên')).entities.location).toBe('long biên');
    expect((await nlu.parse('san long bien')).entities.location).toBe('long biên');

    // 10. Hà Đông
    expect((await nlu.parse('sân bóng hà đông tối nay')).entities.location).toBe('hà đông');
    expect((await nlu.parse('san ha dong mai')).entities.location).toBe('hà đông');

    // 11. Nam Từ Liêm
    expect((await nlu.parse('tìm sân pickleball ở nam từ liêm')).entities.location).toBe('nam từ liêm');
    expect((await nlu.parse('san bong nam tu liem')).entities.location).toBe('nam từ liêm');
    expect((await nlu.parse('san pickleball ntl')).entities.location).toBe('nam từ liêm');

    // 12. Bắc Từ Liêm
    expect((await nlu.parse('sân tennis bắc từ liêm')).entities.location).toBe('bắc từ liêm');
    expect((await nlu.parse('san bac tu liem')).entities.location).toBe('bắc từ liêm');
    expect((await nlu.parse('san bong btl')).entities.location).toBe('bắc từ liêm');
  });

  it('phân loại intent: hỏi lịch -> SEARCH_SLOTS, muốn giữ -> HOLD_REQUEST, chào -> FALLBACK', async () => {
    expect((await nlu.parse('sân Saigon còn giờ nào?')).intent).toBe('SEARCH_SLOTS');
    expect((await nlu.parse('giữ giúp mình chỗ 18h mai')).intent).toBe('HOLD_REQUEST');
    expect((await nlu.parse('hello bạn ơi')).intent).toBe('FALLBACK');
  });

  it('trích venueHint từ "sân X còn giờ nào"', async () => {
    const parsed = await nlu.parse('sân Saigon còn giờ nào?');
    expect(parsed.entities.query?.toLowerCase()).toContain('saigon');
  });

  it('QA t8: dateHint theo múi giờ VN — 20:00 UTC ngày 24/8 (= 03:00 ICT 25/8) là "hôm nay" = 2026-08-25', async () => {
    expect((await nlu.parse('cho mình sân cầu long hôm nay')).entities.dateHint).toBe('2026-08-25');
    expect((await nlu.parse('dat san 5 mai')).entities.dateHint).toBe('2026-08-26');
  });
});
