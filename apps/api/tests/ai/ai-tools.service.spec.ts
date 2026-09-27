import { NotFoundException } from '@nestjs/common';
import { AiToolsService } from '../../src/ai/ai-tools.service';
import type { PrismaService } from '../../src/prisma/prisma.service';
import type { BookingsService } from '../../src/bookings/bookings.service';
import type { SlotsService } from '../../src/bookings/slots.service';

jest.mock('../../src/prisma/prisma.service', () => ({ PrismaService: class {} }));

const COURT_ID = '11111111-1111-4111-8111-111111111111';

function makeTools(overrides: { prisma?: object; slots?: object; bookings?: object }) {
  const prisma = {
    venue: { findMany: jest.fn() },
    court: { findUnique: jest.fn() },
    booking: { findMany: jest.fn().mockResolvedValue([]) },
    ...overrides.prisma,
  };
  const slots = { week: jest.fn().mockResolvedValue({
    slotMinutes: 60,
    byDate: [{ slots: [360, 480, 1020, 1080, 1140].map((startMinute) => ({
      startMinute, endMinute: startMinute + 60, state: 'AVAILABLE',
    })) }],
  }) };
  const bookingsSvc = { createHold: jest.fn() };
  Object.assign(slots, overrides.slots ?? {});
  Object.assign(bookingsSvc, overrides.bookings ?? {});
  return {
    tools: new AiToolsService(
      prisma as unknown as PrismaService,
      slots as unknown as SlotsService,
      bookingsSvc as unknown as BookingsService,
    ),
    prisma,
    slots,
    bookingsSvc,
  };
}

describe('AiToolsService (tool-call DB thật)', () => {
  it('searchVenues: chỉ APPROVED, take 6, tính minPrice từ courts', async () => {
    const { tools, prisma } = makeTools({});
    prisma.venue.findMany.mockResolvedValue([
      {
        id: 'v1',
        name: 'Sân PB Saigon',
        address: 'Gò Vấp',
        images: ['a.png'],
        courts: [
          {
            courtId: 'c1',
            name: 'S1',
            sportType: 'PICKLEBALL',
            defaultPricePerSlot: 120_000,
            slotMinutes: 60,
          },
          {
            courtId: 'c2',
            name: 'S2',
            sportType: 'PICKLEBALL',
            defaultPricePerSlot: 90_000,
            slotMinutes: 60,
          },
        ],
      },
    ]);

    const cards = await tools.searchVenues({ sportType: 'PICKLEBALL', location: 'gò vấp' });

    // where phải chặn venue chưa APPROVED + lọc courts theo sportType
    const arg = prisma.venue.findMany.mock.calls[0][0];
    expect(arg.where.status).toBe('APPROVED');
    expect(arg.where.courts.some.sportType).toBe('PICKLEBALL');
    expect(arg.take).toBe(6);
    expect(cards[0].minPrice).toBe(90_000);
    expect(cards[0].image).toBe('a.png');
  });

  it('checkSlots: gọi SlotsService.week(courtId, date, 1) và trả chip HH:mm chỉ slot AVAILABLE', async () => {
    const { tools, slots } = makeTools({});
    slots.week.mockResolvedValue({
      courtId: COURT_ID,
      courtStatus: 'ACTIVE',
      slotMinutes: 90,
      from: '2026-08-25',
      days: 1,
      byDate: [
        {
          date: '2026-08-25',
          slots: [
            { startMinute: 1020, endMinute: 1110, state: 'AVAILABLE' },
            { startMinute: 1110, endMinute: 1200, state: 'BOOKED' },
            { startMinute: 1200, endMinute: 1290, state: 'AVAILABLE' },
          ],
        },
      ],
    });
    prismaCourtName(tools);

    const res = await tools.checkSlots(COURT_ID, '2026-08-25');

    expect(slots.week).toHaveBeenCalledWith(COURT_ID, '2026-08-25', 1);
    expect(res.available).toEqual([
      { label: '17:00–18:30', startMinute: 1020, endMinute: 1110 },
      { label: '20:00–21:30', startMinute: 1200, endMinute: 1290 },
    ]);
  });

  it('createHold: ủy thẳng nguyên vẹn sang BookingsService.createHold (không tự viết query)', async () => {
    const dto = { courtId: COURT_ID, date: '2026-08-25', slots: [1080] };
    const holdResult = { holdId: 'h1', subtotal: 100_000 };
    const { tools, bookingsSvc } = makeTools({
      bookings: { createHold: jest.fn().mockResolvedValue(holdResult) },
    });

    const res = await tools.createHold({ id: 'u1' }, dto);

    expect(bookingsSvc.createHold).toHaveBeenCalledWith({ id: 'u1' }, dto);
    expect(res).toBe(holdResult);
  });

  it('getSuggestedSlots cold-start: ưu tiên giờ vàng 17–19h, top 4 có reason', async () => {
    const { tools, prisma } = makeTools({});
    prisma.court.findUnique.mockResolvedValue({
      id: COURT_ID,
      slotMinutes: 60,
      venue: { openMinute: 360, closeMinute: 1320 },
    });

    const res = await tools.getSuggestedSlots(COURT_ID); // không userId -> cold-start

    expect(res.suggestions).toHaveLength(4);
    for (const s of res.suggestions) {
      // Giờ vàng = khung 17–20h và 6–7h
      expect([6, 17, 18, 19]).toContain(Math.floor(s.startMinute / 60));
      expect(s.reason).toBe('Giờ vàng nhiều người chọn');
      expect(s.score).toBe(5);
    }
  });

  it('getSuggestedSlots có lịch sử: boost giờ từng chơi lên trước giờ vàng', async () => {
    const { tools, prisma, slots } = makeTools({});
    prisma.court.findUnique.mockResolvedValue({
      id: COURT_ID,
      slotMinutes: 60,
      venue: { openMinute: 360, closeMinute: 1320 },
    });
    // User hay chơi 8h sáng (startMinute 480) — 2 trong 10 trận gần nhất.
    prisma.booking.findMany.mockResolvedValue([
      { startMinute: 480 },
      { startMinute: 480 },
      { startMinute: 1020 },
    ]);

    const res = await tools.getSuggestedSlots(COURT_ID, { userId: 'u1', date: '2026-08-26' });

    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId: 'u1', status: 'COMPLETED' },
        take: 10,
      }),
    );
    // Nếu code truyền vnToday() hoặc opts.date cũ vào week() thì mọi chip và mọi
    // nút "Giữ chỗ" sẽ thuộc sai ngày mà các test này vẫn xanh — phải chốt tham số.
    expect(slots.week).toHaveBeenCalledWith(COURT_ID, '2026-08-26', 1);
    expect(res.date).toBe('2026-08-26');
    expect(res.suggestions[0]).toMatchObject({ startMinute: 480, score: 20 });
    expect(res.suggestions[0].reason).toContain('Bạn thường chơi khung này');
    // Giờ vàng vẫn xuất hiện phía sau
    const golden = res.suggestions.filter((s) =>
      [17, 18, 19].includes(Math.floor(s.startMinute / 60)),
    );
    expect(golden.length).toBeGreaterThanOrEqual(1);
  });

  it('suggestions exclude unavailable slots and keep the real non-hourly slot grid', async () => {
    const { tools, prisma, slots } = makeTools({});
    prisma.court.findUnique.mockResolvedValue({ id: COURT_ID, slotMinutes: 90 });
    slots.week.mockResolvedValue({ byDate: [{ slots: [
      { startMinute: 1020, endMinute: 1110, state: 'BOOKED' },
      { startMinute: 1110, endMinute: 1200, state: 'AVAILABLE' },
      { startMinute: 1200, endMinute: 1290, state: 'HELD' },
    ] }] });
    const result = await tools.getSuggestedSlots(COURT_ID, { date: '2026-09-20' });
    expect(slots.week).toHaveBeenCalledWith(COURT_ID, '2026-09-20', 1);
    expect(result.suggestions.map(({ startMinute, label }) => ({ startMinute, label }))).toEqual([
      { startMinute: 1110, label: '18:30–20:00' },
    ]);
  });

  it('getSuggestedSlots: court không tồn tại -> 404 COURT_NOT_FOUND', async () => {
    const { tools, prisma } = makeTools({});
    prisma.court.findUnique.mockResolvedValue(null);
    await expect(tools.getSuggestedSlots(COURT_ID)).rejects.toThrow(NotFoundException);
  });
});

/** checkSlots tra thêm tên sân qua prisma.court.findUnique — mock trả tên mặc định. */
function prismaCourtName(tools: AiToolsService): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyTools = tools as any;
  anyTools.prisma.court.findUnique = jest.fn().mockResolvedValue({ name: 'Sân 5 IT' });
}
