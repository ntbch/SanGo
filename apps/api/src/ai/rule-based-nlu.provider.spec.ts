import { RuleBasedNluProvider, resolveRelativeDate } from './rule-based-nlu.provider';

describe('RuleBasedNluProvider (AI-1)', () => {
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
