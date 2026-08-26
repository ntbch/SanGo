/**
 * SanGo — seed dữ liệu demo đẹp (đặc tả §9 & Master Data 12 Quận Hà Nội).
 *
 * Chạy: pnpm --filter @sango/api db:seed
 * Dữ liệu: reset toàn bộ rồi tạo lại (deterministic cho demo/đồ án):
 *  - Venue APPROVED từ dữ liệu AloBo, CHỈ giữ Hà Nội + TP.HCM
 *    (lọc bỏ venue ngoài 2 thành phố và venue bị gán nhầm city ở tỉnh khác)
 *  - Phủ đủ 5 sportType: FOOTBALL5, FOOTBALL7, PICKLEBALL, BADMINTON, TENNIS
 *  - Pricing rules ngày thường / cuối tuần hợp lý
 *  - Booking mẫu đủ trạng thái + Payment + Review + BookingHold
 *  - DEMO BUỔI 1: ví 500k cho 2 khách, voucher GIAM20-* đủ 7 thứ,
 *    3 đơn CONFIRMED đã trả cùng 1 ngày tới (demo hủy hàng loạt N2),
 *    thông báo WALLET chưa đọc sẵn cho chuông thông báo.
 *  - 4 tài khoản demo (mật khẩu in rõ ở cuối log)
 *  - SPRINT 3 (F7/F2): giải 'SanGo Open 2026' 8 đội bracket sẵn round 1,
 *    booking lịch sử đa dạng cho ranking; chạy với cờ '--reset' để chỉ reset phần giải đấu
 */
import { PrismaClient, type SportType } from '@prisma/client';
import { isValidDistrictForCity } from '@sango/shared';
import bcrypt from 'bcryptjs';
import aloboVenues from './data/alobo_venues.json';

const prisma = new PrismaClient();

/** Mật khẩu dùng chung của 3 tài khoản demo — in rõ khi seed theo yêu cầu. */
export const DEMO_PASSWORD = 'Sango@2026';

/** Ngày hôm nay theo giờ Việt Nam (UTC+7), dạng YYYY-MM-DD. */
function vnToday(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Cộng/trừ n ngày trên chuỗi YYYY-MM-DD. */
function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Chuỗi ngày -> Date UTC-midnight để lưu cột DATE (xem schema.prisma). */
function toDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function formatCodeDate(isoDate: string): string {
  return isoDate.replaceAll('-', '');
}

/** Làm tròn giá về bội số 1000 VND cho đẹp. */
function roundPrice(vnd: number): number {
  return Math.round(vnd / 1000) * 1000;
}

interface CourtSpec {
  name: string;
  sportType: SportType;
  slotMinutes: 60 | 90;
  defaultPricePerSlot: number;
  status?: 'ACTIVE' | 'MAINTENANCE';
}

interface VenueSpec {
  name: string;
  slug: string;
  address: string;
  city: string;
  district: string;
  lat: number;
  lng: number;
  openMinute: number;
  closeMinute: number;
  depositPercent: number;
  amenities: string[];
  images: string[];
  courts: CourtSpec[];
}

/** Xoá dữ liệu giải đấu theo thứ tự FK-an-toàn (match -> team -> tournament). */
async function clearTournaments(): Promise<void> {
  await prisma.tournamentMatch.deleteMany();
  await prisma.tournamentTeam.deleteMany();
  await prisma.tournament.deleteMany();
}

/** Lấy hoặc tạo user CUSTOMER theo email (dùng cho captain bổ sung của S3). */
async function ensureCustomer(email: string, fullName: string, phone: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  return prisma.user.create({ data: { email, passwordHash, fullName, phone, role: 'CUSTOMER' } });
}

/** Lấy hoặc tạo đội mẫu theo tên, gắn captain + member CAPTAIN tương ứng. */
async function ensureTeam(name: string, sportType: SportType, captainId: string) {
  const existing = await prisma.team.findFirst({ where: { name } });
  if (existing) return existing;
  const team = await prisma.team.create({
    data: { name, sportType, description: 'Đội mẫu Sprint 3 cho giải đấu demo.', captainId },
  });
  await prisma.teamMember.create({
    data: { teamId: team.id, userId: captainId, role: 'CAPTAIN', status: 'ACTIVE' },
  });
  return team;
}

/**
 * SPRINT 3 (F7): giải 'SanGo Open 2026' — 8 đội FOOTBALL5, bracket single-elimination
 * đã start đủ round 1 (4 trận QF READY cặp chuẩn [1v8,4v5,2v7,3v6], SF/chung kết PENDING)
 * để FE nhập điểm trực tiếp lúc bảo vệ. Chạy độc lập với phần seed còn lại.
 */
async function seedSprint3Tournament(): Promise<void> {
  const host = await prisma.user.findUnique({ where: { email: 'owner@sango.vn' } });
  if (!host) {
    throw new Error('Chưa có owner@sango.vn — hãy chạy seed đầy đủ trước khi reset giải đấu.');
  }
  const customer = await prisma.user.findUnique({ where: { email: 'customer@sango.vn' } });
  const customer2 = await prisma.user.findUnique({ where: { email: 'customer2@sango.vn' } });
  if (!customer || !customer2) {
    throw new Error('Thiếu tài khoản demo customer/customer2 — hãy chạy seed đầy đủ trước.');
  }

  console.log('S3: tạo 6 captain bổ sung cho giải đấu (captain3..captain8)...');
  const extraDefs: Array<[string, string, string]> = [
    ['captain3@sango.vn', 'Vũ Đình Cầu', '0900000013'],
    ['captain4@sango.vn', 'Bùi Minh Bóng', '0900000014'],
    ['captain5@sango.vn', 'Đỗ Thanh Long', '0900000015'],
    ['captain6@sango.vn', 'Hoàng Văn Nhất', '0900000016'],
    ['captain7@sango.vn', 'Ngô Khánh Linh', '0900000017'],
    ['captain8@sango.vn', 'Dương Tuấn Kiệt', '0900000018'],
  ];
  const extras = [];
  for (const [email, fullName, phone] of extraDefs) {
    extras.push(await ensureCustomer(email, fullName, phone));
  }

  console.log('S3 F7: dựng giải SanGo Open 2026 (8 đội single-elimination)...');
  await clearTournaments();

  const teamDefs: Array<{ name: string; captainId: string }> = [
    { name: 'FC SanGo', captainId: customer.id },
    { name: 'Hà Nội Rangers', captainId: customer2.id },
    { name: 'FC Tây Hồ', captainId: extras[0].id },
    { name: 'Golden Star FC', captainId: extras[1].id },
    { name: 'Long Biên United', captainId: extras[2].id },
    { name: 'Than Xuân FC', captainId: extras[3].id },
    { name: 'Shark Football', captainId: extras[4].id },
    { name: 'Cầu Giấy Young Boys', captainId: extras[5].id },
  ];
  const teams = [];
  for (let i = 0; i < teamDefs.length; i++) {
    teams.push(await ensureTeam(teamDefs[i].name, 'FOOTBALL5', teamDefs[i].captainId));
  }

  const tour = await prisma.tournament.create({
    data: {
      name: 'SanGo Open 2026',
      description: 'Giải bóng đá 5 người khai mạc hệ thống — 8 đội đấu loại trực tiếp.',
      sportType: 'FOOTBALL5',
      maxTeams: 8,
      status: 'ONGOING',
      createdBy: host.id,
    },
  });

  // Đăng ký đúng thứ tự seed: joinedAt cách nhau để seed 1..8 deterministic.
  const baseTime = Date.now();
  for (let i = 0; i < teams.length; i++) {
    await prisma.tournamentTeam.create({
      data: {
        tournamentId: tour.id,
        teamId: teams[i].id,
        seed: i + 1, // thứ tự đăng ký = hạt giống (1 = top seed)
        joinedAt: new Date(baseTime - (8 - i) * 60_000),
      },
    });
  }

  // Sinh bracket y hệt logic service: 7 trận, nextMatchId nối cây, QF cặp chuẩn.
  const slots = 8;
  const totalRounds = 3;
  const matches = new Map<string, string>();
  for (let round = 1; round <= totalRounds; round++) {
    const countInRound = slots / 2 ** round;
    for (let position = 1; position <= countInRound; position++) {
      const m = await prisma.tournamentMatch.create({
        data: { tournamentId: tour.id, round, position },
      });
      matches.set(round + '-' + position, m.id);
    }
  }
  for (const [key, id] of matches) {
    const [r, p] = key.split('-').map(Number);
    if (r < totalRounds) {
      await prisma.tournamentMatch.update({
        where: { id },
        data: { nextMatchId: matches.get(r + 1 + '-' + Math.ceil(p / 2))! },
      });
    }
  }

  const slotOrder = [1, 8, 4, 5, 2, 7, 3, 6]; // seed chuẩn: mạnh cách nhau
  for (let pos = 1; pos <= slots / 2; pos++) {
    const homeSeed = slotOrder[(pos - 1) * 2];
    const awaySeed = slotOrder[(pos - 1) * 2 + 1];
    await prisma.tournamentMatch.update({
      where: { id: matches.get('1-' + pos)! },
      data: {
        homeTeamId: teams[homeSeed - 1].id,
        awayTeamId: teams[awaySeed - 1].id,
        status: 'READY',
      },
    });
  }

  console.log(
    '   -> 7 trận đã sinh: 4 QF READY ([1v8][4v5][2v7][3v6]) chờ nhập điểm, SF/Final PENDING.',
  );
}

/**
 * SPRINT 3 (F2): booking lịch sử đa dạng để ranking compute-on-read có số liệu đẹp:
 * đúng giờ nhiều (customer), trung tính (customer2), no-show nặng (captain4/5), hủy sát giờ.
 * KHÔNG tạo payment/ledger — chỉ dữ liệu trạng thái phục vụ tính điểm.
 */
async function seedRankingHistory(
  courts: Array<{ id: string }>,
  users: Array<{ id: string }>,
): Promise<void> {
  console.log('S3 F2: tạo booking lịch sử đa dạng cho ranking...');
  type Outcome = 'ONTIME' | 'NOSHOW' | 'LATE_CANCEL';
  interface HistSpec {
    userIdx: number;
    courtIdx: number;
    daysAgo: number;
    startMinute: number;
    endMinute: number;
    subtotal: number;
    outcome: Outcome;
  }
  const specs: HistSpec[] = [
    // customer: đúng giờ 5 lần cao điểm -> điểm uy tín cao nhất bảng
    {
      userIdx: 0,
      courtIdx: 0,
      daysAgo: 21,
      startMinute: 1080,
      endMinute: 1140,
      subtotal: 450_000,
      outcome: 'ONTIME',
    },
    {
      userIdx: 0,
      courtIdx: 0,
      daysAgo: 18,
      startMinute: 1020,
      endMinute: 1080,
      subtotal: 450_000,
      outcome: 'ONTIME',
    },
    {
      userIdx: 0,
      courtIdx: 1,
      daysAgo: 14,
      startMinute: 960,
      endMinute: 1020,
      subtotal: 100_000,
      outcome: 'ONTIME',
    },
    {
      userIdx: 0,
      courtIdx: 0,
      daysAgo: 9,
      startMinute: 1140,
      endMinute: 1200,
      subtotal: 450_000,
      outcome: 'ONTIME',
    },
    {
      userIdx: 0,
      courtIdx: 1,
      daysAgo: 4,
      startMinute: 900,
      endMinute: 960,
      subtotal: 100_000,
      outcome: 'ONTIME',
    },
    // customer2: khá — 2 đúng giờ, 1 quên đá (no-show), 1 hủy sát giờ
    {
      userIdx: 1,
      courtIdx: 1,
      daysAgo: 20,
      startMinute: 840,
      endMinute: 900,
      subtotal: 100_000,
      outcome: 'ONTIME',
    },
    {
      userIdx: 1,
      courtIdx: 2,
      daysAgo: 15,
      startMinute: 810,
      endMinute: 900,
      subtotal: 350_000,
      outcome: 'ONTIME',
    },
    {
      userIdx: 1,
      courtIdx: 0,
      daysAgo: 10,
      startMinute: 1080,
      endMinute: 1140,
      subtotal: 450_000,
      outcome: 'NOSHOW',
    },
    {
      userIdx: 1,
      courtIdx: 1,
      daysAgo: 5,
      startMinute: 780,
      endMinute: 840,
      subtotal: 100_000,
      outcome: 'LATE_CANCEL',
    },
    // captain3: ổn định; captain4: quen quên; captain5: chuyên hủy sát giờ
    {
      userIdx: 2,
      courtIdx: 0,
      daysAgo: 16,
      startMinute: 960,
      endMinute: 1020,
      subtotal: 450_000,
      outcome: 'ONTIME',
    },
    {
      userIdx: 2,
      courtIdx: 0,
      daysAgo: 7,
      startMinute: 1020,
      endMinute: 1080,
      subtotal: 450_000,
      outcome: 'ONTIME',
    },
    {
      userIdx: 3,
      courtIdx: 1,
      daysAgo: 17,
      startMinute: 720,
      endMinute: 780,
      subtotal: 100_000,
      outcome: 'NOSHOW',
    },
    {
      userIdx: 3,
      courtIdx: 0,
      daysAgo: 6,
      startMinute: 900,
      endMinute: 960,
      subtotal: 450_000,
      outcome: 'NOSHOW',
    },
    {
      userIdx: 4,
      courtIdx: 2,
      daysAgo: 12,
      startMinute: 780,
      endMinute: 870,
      subtotal: 350_000,
      outcome: 'LATE_CANCEL',
    },
    {
      userIdx: 4,
      courtIdx: 1,
      daysAgo: 3,
      startMinute: 840,
      endMinute: 900,
      subtotal: 100_000,
      outcome: 'LATE_CANCEL',
    },
  ];

  let seq = 1;
  for (const spec of specs) {
    const isoDate = addDays(vnToday(), -spec.daysAgo);
    const startAt = toDate(isoDate).getTime() + spec.startMinute * 60_000;
    const data: Parameters<typeof prisma.booking.create>[0]['data'] = {
      code: 'BK-HIST-' + String(seq).padStart(3, '0'),
      customerId: users[spec.userIdx].id,
      courtId: courts[spec.courtIdx].id,
      date: toDate(isoDate),
      startMinute: spec.startMinute,
      endMinute: spec.endMinute,
      subtotal: spec.subtotal,
      depositAmount: roundPrice((spec.subtotal * 30) / 100),
    };
    if (spec.outcome === 'LATE_CANCEL') {
      data.status = 'CANCELLED';
      data.cancelledAt = new Date(startAt - 6 * 60 * 60_000); // hủy cách kickoff 6 tiếng (<12h)
      data.cancelReason = 'Đổi lịch gấp, mong sân thông cảm!';
    } else {
      data.status = 'COMPLETED';
      if (spec.outcome === 'ONTIME') {
        data.checkedInAt = new Date(startAt - 10 * 60_000); // check-in sớm 10 phút
      } // NOSHOW: COMPLETED mà không có checkedInAt
    }
    await prisma.booking.create({ data });
    seq++;
  }
  console.log(
    '   -> ' + specs.length + ' booking lịch sử (đúng giờ/no-show/hủy sát giờ) cho leaderboard.',
  );
}
async function main() {
  // --reset: chỉ dọn + seed lại PHẦN GIẢI ĐẤU, giữ nguyên venue/booking/ví/đội hiện có.
  if (process.argv.includes('--reset')) {
    console.log('--reset: dọn bảng tournament* (FK-an-toàn) rồi seed lại giải demo S3...');
    await clearTournaments();
    await seedSprint3Tournament();
    return;
  }

  console.log('Dọn dữ liệu cũ...');
  // Thứ tự FK-an-toàn: con trước cha; bảng F6/F3/F8/S2/S3 xoá trước users.
  await clearTournaments(); // giải đấu xoá trước teams (FK championTeamId)
  await prisma.expenseShare.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.venueService.deleteMany(); // S2-F4: RESTRICT tới venues -> phải xoá trước
  await prisma.team.deleteMany();
  await prisma.bookingAddOn.deleteMany();
  await prisma.voucherRedemption.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.walletLedger.deleteMany();
  await prisma.walletTopup.deleteMany();
  await prisma.walletBalance.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.matchParticipant.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.bookingHold.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.court.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.bookingCodeSeq.deleteMany(); // reset bộ đếm mã đơn -> demo luôn CH-...-0001
  await prisma.user.deleteMany();

  console.log('Tạo tài khoản demo...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  await prisma.user.create({
    data: {
      email: 'admin@sango.vn',
      passwordHash,
      fullName: 'Nguyễn Quản Trị',
      phone: '0900000001',
      role: 'ADMIN',
    },
  });
  const owner = await prisma.user.create({
    data: {
      email: 'owner@sango.vn',
      passwordHash,
      fullName: 'Trần Văn Chủ Sân',
      phone: '0900000002',
      role: 'OWNER',
    },
  });
  const customer = await prisma.user.create({
    data: {
      email: 'customer@sango.vn',
      passwordHash,
      fullName: 'Lê Thị Khách Hàng',
      phone: '0900000003',
      role: 'CUSTOMER',
    },
  });
  // Khách thứ 2 phục vụ demo N2 (hủy hàng loạt -> hoàn ví + thông báo TỪNG khách)
  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@sango.vn',
      passwordHash,
      fullName: 'Phạm Văn Khách Hai',
      phone: '0900000004',
      role: 'CUSTOMER',
    },
  });

  // Giới hạn phạm vi: chỉ Hà Nội & TP.HCM. Lọc kép vì một số bản ghi bị gán
  // nhầm city="TP. Hồ Chí Minh" trong khi địa chỉ thật ở Bình Dương / Bà Rịa-Vũng Tàu.
  const ALLOWED_CITIES = new Set(['Hà Nội', 'TP. Hồ Chí Minh']);
  const OUTSIDE_ADDRESS_PATTERN =
    /(bình dương|dĩ an|thuận an|thủ dầu một|tân uyên|bà rịa|vũng tàu|biên hòa)/i;
  const aloboAll = aloboVenues as unknown as VenueSpec[];
  const isAllowed = (v: VenueSpec): boolean =>
    ALLOWED_CITIES.has(v.city.trim()) &&
    !OUTSIDE_ADDRESS_PATTERN.test(`${v.name} ${v.district} ${v.address}`);
  const excludedCount = aloboAll.filter((v) => !isAllowed(v)).length;
  const venueSpecs: VenueSpec[] = aloboAll.filter(isAllowed);
  // Lưới an toàn cuối: mọi spec sắp insert phải canonical (city + district thuộc city).
  // Pattern OUTSIDE_ADDRESS_PATTERN có test cả name — chấp nhận trade-off false-positive
  // hiếm gặp để chặn venue gán nhầm city mà district/address lại "sạch" (case VSP Vũng Tàu).
  for (const v of venueSpecs) {
    if (!isValidDistrictForCity(v.city.trim(), v.district)) {
      console.warn(
        `[seed] Bỏ qua venue lệch chuẩn địa giới: "${v.name}" (${v.city}/${v.district})`,
      );
    }
  }
  const insertableSpecs = venueSpecs.filter((v) =>
    isValidDistrictForCity(v.city.trim(), v.district),
  );
  console.log(
    `Tạo ${insertableSpecs.length} cụm sân thể thao từ AloBo (chỉ Hà Nội & TP.HCM, đã loại ${excludedCount} venue ngoài phạm vi)...`,
  );

  const createdCourts: { id: string; spec: CourtSpec }[] = [];
  for (const spec of insertableSpecs) {
    const venue = await prisma.venue.create({
      data: {
        ownerId: owner.id,
        name: spec.name,
        slug: spec.slug,
        address: spec.address,
        city: spec.city,
        district: spec.district,
        lat: spec.lat,
        lng: spec.lng,
        openMinute: spec.openMinute,
        closeMinute: spec.closeMinute,
        images: spec.images,
        amenities: spec.amenities,
        depositPercent: spec.depositPercent,
        status: 'APPROVED',
      },
    });

    for (const courtSpec of spec.courts) {
      const court = await prisma.court.create({
        data: {
          venueId: venue.id,
          name: courtSpec.name,
          sportType: courtSpec.sportType,
          slotMinutes: courtSpec.slotMinutes,
          defaultPricePerSlot: courtSpec.defaultPricePerSlot,
          status: courtSpec.status ?? 'ACTIVE',
        },
      });
      createdCourts.push({ id: court.id, spec: courtSpec });

      // Bảng giá ghi đè: tối ưu giá khung cao điểm + cuối tuần (đặc tả §3.3).
      const base = courtSpec.defaultPricePerSlot;
      const rules = [
        // Ngày thường tối 17:00–22:00 đắt hơn 30%
        {
          dayType: 'WEEKDAY' as const,
          startMinute: 1020,
          endMinute: 1320,
          pricePerSlot: roundPrice(base * 1.3),
        },
        // Cuối tuần ban ngày +15%
        {
          dayType: 'WEEKEND' as const,
          startMinute: 330,
          endMinute: 1020,
          pricePerSlot: roundPrice(base * 1.15),
        },
        // Cuối tuần tối +40%
        {
          dayType: 'WEEKEND' as const,
          startMinute: 1020,
          endMinute: 1320,
          pricePerSlot: roundPrice(base * 1.4),
        },
      ];
      for (const rule of rules) {
        await prisma.pricingRule.create({ data: { courtId: court.id, ...rule } });
      }
    }
  }

  // Tìm court cho demo bookings
  const football5A =
    createdCourts.find((c) => c.spec.sportType === 'FOOTBALL5') ?? createdCourts[0];
  const badminton1 =
    createdCourts.find((c) => c.spec.sportType === 'BADMINTON') ?? createdCourts[1];
  const tennis1 = createdCourts.find((c) => c.spec.sportType === 'TENNIS') ?? createdCourts[2];
  const pickleballIndoor =
    createdCourts.find((c) => c.spec.sportType === 'PICKLEBALL') ?? createdCourts[3];

  console.log('Tạo booking mẫu đủ trạng thái + payment/review...');
  const today = vnToday();
  const depositOf = (subtotal: number, percent: number) => roundPrice((subtotal * percent) / 100);

  interface BookingSeed {
    court: { id: string };
    dateOffset: number;
    startMinute: number;
    endMinute: number;
    subtotal: number;
    depositPercent: number;
    status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    method?: 'VNPAY' | 'MOCK';
    refund?: number;
    publicMatch?: { slotsNeeded: number; matchFull: boolean };
    review?: { rating: number; comment: string };
  }

  // Mỗi đơn một ngày khác nhau -> NNNN trong mã đơn luôn là 0001, dễ đọc.
  const bookingSeeds: BookingSeed[] = [
    {
      // Sắp tới: đã xác nhận chờ chơi, ghép trận mở còn 2 chỗ
      court: football5A,
      dateOffset: 2,
      startMinute: 1080, // 18:00
      endMinute: 1200, // 20:00
      subtotal: 800_000,
      depositPercent: 30,
      status: 'CONFIRMED',
      method: 'VNPAY',
      publicMatch: { slotsNeeded: 4, matchFull: false },
    },
    {
      // Hôm nay: khách đã check-in
      court: badminton1,
      dateOffset: 0,
      startMinute: 420, // 07:00
      endMinute: 480, // 08:00
      subtotal: 180_000,
      depositPercent: 25,
      status: 'CHECKED_IN',
      method: 'MOCK',
    },
    {
      // 3 ngày trước: hoàn thành + đánh giá 5 sao
      court: tennis1,
      dateOffset: -3,
      startMinute: 360, // 06:00
      endMinute: 450, // 07:30
      subtotal: 600_000,
      depositPercent: 30,
      status: 'COMPLETED',
      method: 'VNPAY',
      review: { rating: 5, comment: 'Sân đẹp, mặt sân mới, nhân viên thân thiện. Sẽ đặt lại!' },
    },
    {
      // 1 ngày trước: đã hủy + hoàn tiền 50%
      court: pickleballIndoor,
      dateOffset: -1,
      startMinute: 960, // 16:00
      endMinute: 1020, // 17:00
      subtotal: 120_000,
      depositPercent: 30,
      status: 'CANCELLED',
      method: 'VNPAY',
      refund: 18_000, // 50% của 36.000 cọc
    },
    {
      // 5 ngày trước: khách không đến
      court: football5A,
      dateOffset: -5,
      startMinute: 1200, // 20:00
      endMinute: 1260, // 21:00
      subtotal: 400_000,
      depositPercent: 30,
      status: 'NO_SHOW',
      method: 'MOCK',
    },
  ];

  for (const b of bookingSeeds) {
    const playDate = addDays(today, b.dateOffset);
    const depositAmount = depositOf(b.subtotal, b.depositPercent);
    const code = `BK-${formatCodeDate(playDate)}-0001`;

    const booking = await prisma.booking.create({
      data: {
        code,
        customerId: customer.id,
        courtId: b.court.id,
        date: toDate(playDate),
        startMinute: b.startMinute,
        endMinute: b.endMinute,
        subtotal: b.subtotal,
        depositAmount,
        status: b.status,
        cancelReason: b.status === 'CANCELLED' ? 'Bận đột xuất, xin hủy' : null,
      },
    });

    if (b.method) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          type: 'DEPOSIT',
          method: b.method,
          amount: depositAmount,
          txnRef: `demo-tx-${booking.id.slice(0, 8)}`,
          status: 'PAID',
          paidAt: new Date(),
        },
      });
      if (b.refund) {
        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            type: 'REFUND',
            method: b.method,
            amount: b.refund,
            txnRef: `demo-rf-${booking.id.slice(0, 8)}`,
            status: 'REFUNDED',
            paidAt: new Date(),
          },
        });
      }
    }

    if (b.review) {
      const courtRow = await prisma.court.findUnique({
        where: { id: b.court.id },
        select: { venueId: true },
      });
      if (courtRow) {
        await prisma.review.create({
          data: {
            bookingId: booking.id,
            customerId: customer.id,
            venueId: courtRow.venueId,
            rating: b.review.rating,
            comment: b.review.comment,
          },
        });
      }
    }

    if (b.publicMatch) {
      await prisma.matchParticipant.create({
        data: {
          bookingId: booking.id,
          userId: customer.id,
        },
      });
    }
  }

  console.log('Tạo 1 BookingHold đang hoạt động (demo slot state HOLD)...');
  const tomorrow = addDays(today, 1);
  await prisma.bookingHold.create({
    data: {
      courtId: football5A.id,
      date: toDate(tomorrow),
      startMinute: 1140, // 19:00
      endMinute: 1200, // 20:00
      subtotal: 400_000,
      userId: customer.id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // còn 10 phút
      status: 'ACTIVE',
    },
  });

  // ================================================================
  // DEMO BUỔI BẢO VỆ 1 (roadmap v5): nạp ví -> áp mã -> trả tiền ->
  // owner hủy cả ngày mưa -> tiền về ví + chuông thông báo từng khách.
  // ================================================================

  console.log('F6: Nạp sẵn ví 500.000đ cho 2 khách (ledger + balance đồng bộ)...');
  const seedWallet = async (userId: string) => {
    const amount = 500_000;
    const txnRef = `demo-topup-${userId.slice(0, 8)}.TOPUP.seed`;
    await prisma.walletTopup.create({
      data: {
        userId,
        amount,
        method: 'MOCK',
        txnRef,
        status: 'PAID',
        paidAt: new Date(),
      },
    });
    await prisma.walletLedger.create({
      data: {
        userId,
        direction: 'CREDIT',
        type: 'TOPUP',
        amount,
        refType: 'TOPUP',
        refId: txnRef, // UNIQUE(refType, refId, type): idempotency như callback thật
        balanceAfter: amount,
      },
    });
    await prisma.walletBalance.create({ data: { userId, balance: amount } });
  };
  await seedWallet(customer.id);
  await seedWallet(customer2.id);

  console.log('F3: Tạo voucher giảm 20% phủ đủ 7 thứ trong tuần (owner sở hữu)...');
  // Mỗi thứ một mã — presenter đặt sân ngày nào cũng có mã hợp lệ để áp ngay.
  const weekdayCodes = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']; // index = getUTCDay()
  for (let dow = 0; dow < 7; dow++) {
    await prisma.voucher.create({
      data: {
        code: `GIAM20-${weekdayCodes[dow]}`,
        percentOff: 20,
        dayOfWeek: dow,
        validFromMinute: 360, // 06:00
        validToMinute: 1320, // 22:00
        usageLimit: 50,
        perUserLimit: 1,
        ownerId: owner.id,
      },
    });
  }

  console.log('N2: 3 đơn CONFIRMED đã trả trên cùng 1 ngày tới (cụm sân của owner)...');
  // Owner sẽ hủy hàng loạt đúng ngày này -> hoàn 100% tiền ĐÃ TRẢ vào ví từng khách.
  const rainyDate = addDays(today, 3);
  interface RainyBookingSeed {
    court: { id: string };
    customerId: string;
    startMinute: number;
    endMinute: number;
    subtotal: number;
    depositPercent: number;
  }
  const rainyBookings: RainyBookingSeed[] = [
    {
      court: football5A,
      customerId: customer.id,
      startMinute: 1080,
      endMinute: 1140,
      subtotal: 450_000,
      depositPercent: 30,
    },
    {
      court: badminton1,
      customerId: customer2.id,
      startMinute: 600,
      endMinute: 660,
      subtotal: 100_000,
      depositPercent: 30,
    },
    {
      court: tennis1,
      customerId: customer2.id,
      startMinute: 810,
      endMinute: 900,
      subtotal: 350_000,
      depositPercent: 25,
    },
  ];
  let rainySeq = 1;
  for (const rb of rainyBookings) {
    const depositAmount = depositOf(rb.subtotal, rb.depositPercent);
    const booking = await prisma.booking.create({
      data: {
        code: `BK-${formatCodeDate(rainyDate)}-000${rainySeq}`,
        customerId: rb.customerId,
        courtId: rb.court.id,
        date: toDate(rainyDate),
        startMinute: rb.startMinute,
        endMinute: rb.endMinute,
        subtotal: rb.subtotal,
        depositAmount,
        status: 'CONFIRMED',
      },
    });
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        type: 'DEPOSIT',
        method: 'MOCK',
        amount: depositAmount,
        txnRef: `demo-rainy-${booking.id.slice(0, 8)}`,
        status: 'PAID',
        paidAt: new Date(),
      },
    });
    rainySeq++;
  }

  // Ranking cần cả captain3..5 -> đảm bảo tồn tại trước khi dựng lịch sử đấu.
  const rankUsers = [
    customer,
    customer2,
    await ensureCustomer('captain3@sango.vn', 'Vũ Đình Cầu', '0900000013'),
    await ensureCustomer('captain4@sango.vn', 'Bùi Minh Bóng', '0900000014'),
    await ensureCustomer('captain5@sango.vn', 'Đỗ Thanh Long', '0900000015'),
  ];
  await seedRankingHistory([football5A, badminton1, tennis1], rankUsers);

  console.log('F8: 2 thông báo WALLET chưa đọc để chuông thông báo có badge sẵn...');
  for (const c of [customer, customer2]) {
    await prisma.notification.create({
      data: {
        userId: c.id,
        type: 'WALLET',
        title: 'Nạp ví thành công',
        body: 'Ví của bạn vừa được cộng 500.000đ (nạp qua cổng giả lập).',
        link: '/wallet',
      },
    });
  }

  // ================================================================
  // DEMO BUỔI BẢO VỆ 2 (Sprint 2): đội nhóm -> đặt sân tư cách đội ->
  // chia tiền ExpenseShare (track-only) + catalog dịch vụ đi kèm.
  // ================================================================

  console.log('F1: Tạo 2 đội thể thao kèm thành viên...');
  const fcSanGo = await prisma.team.create({
    data: {
      name: 'FC SanGo',
      sportType: 'FOOTBALL5',
      description: 'Đội bóng đá 5 người của hệ thống SanGo — sẵn sàng cho mọi trận cầu.',
      captainId: customer.id,
    },
  });
  await prisma.teamMember.create({
    data: { teamId: fcSanGo.id, userId: customer.id, role: 'CAPTAIN', status: 'ACTIVE' },
  });
  await prisma.teamMember.create({
    data: { teamId: fcSanGo.id, userId: customer2.id, role: 'MEMBER', status: 'ACTIVE' },
  });

  const pbSaigon = await prisma.team.create({
    data: {
      name: 'Pickleball Saigon Club',
      sportType: 'PICKLEBALL',
      description: 'Câu lạc bộ Pickleball sôi động nhất Sài Gòn.',
      captainId: customer2.id,
    },
  });
  await prisma.teamMember.create({
    data: { teamId: pbSaigon.id, userId: customer2.id, role: 'CAPTAIN', status: 'ACTIVE' },
  });
  await prisma.teamMember.create({
    data: { teamId: pbSaigon.id, userId: customer.id, role: 'MEMBER', status: 'ACTIVE' },
  });

  console.log('F1: Đặt sân tư cách FC SanGo + khoản chia tiền ExpenseShare...');
  // Đội FC SanGo đặt sân ngày mưa (đơn thứ 4) — captain trả trước, member bị ghi nợ 1/2.
  const teamBookingDeposit = depositOf(450_000, 30);
  const teamBooking = await prisma.booking.create({
    data: {
      code: `BK-${formatCodeDate(rainyDate)}-000${rainySeq}`,
      customerId: customer.id,
      courtId: football5A.id,
      date: toDate(rainyDate),
      startMinute: 1140, // 19:00
      endMinute: 1200, // 20:00
      subtotal: 450_000,
      depositAmount: teamBookingDeposit,
      status: 'CONFIRMED',
      teamId: fcSanGo.id,
    },
  });
  await prisma.payment.create({
    data: {
      bookingId: teamBooking.id,
      type: 'DEPOSIT',
      method: 'MOCK',
      amount: teamBookingDeposit,
      txnRef: `demo-team-${teamBooking.id.slice(0, 8)}`,
      status: 'PAID',
      paidAt: new Date(),
    },
  });
  rainySeq++;

  // Chia đều tiền cọc cho thành viên còn lại (track-only qua ExpenseShare)
  const shareAmount = Math.floor(teamBookingDeposit / 2);
  await prisma.expenseShare.create({
    data: {
      teamId: fcSanGo.id,
      bookingId: teamBooking.id,
      payerId: customer.id,
      debtorId: customer2.id,
      amount: shareAmount,
      note: `Chia tiền cọc sân ${rainyDate} 19:00-20:00 (1/2 cho mỗi thành viên)`,
      status: 'UNPAID',
    },
  });

  console.log('F4: Tạo menu dịch vụ đi kèm cho các cụm sân của owner...');
  const venueOfCourt = async (court: { id: string }): Promise<string> => {
    const row = await prisma.court.findUnique({
      where: { id: court.id },
      select: { venueId: true },
    });
    return row?.venueId ?? '';
  };
  const fbVenueId = await venueOfCourt(football5A);
  const bdVenueId = await venueOfCourt(badminton1);
  const svcSpecs: Array<{
    venueId: string;
    name: string;
    price: number;
    type: 'BEVERAGE' | 'EQUIPMENT' | 'OTHER';
  }> = [
    { venueId: fbVenueId, name: 'Nước suối Aquafina 500ml', price: 10_000, type: 'BEVERAGE' },
    { venueId: fbVenueId, name: 'Nước tăng lực Redbull 250ml', price: 20_000, type: 'BEVERAGE' },
    { venueId: bdVenueId, name: 'Thuê bóng chuyền (trận)', price: 30_000, type: 'EQUIPMENT' },
    { venueId: bdVenueId, name: 'Thuê giày cầu lông', price: 50_000, type: 'EQUIPMENT' },
  ];
  let svcCount = 0;
  for (const spec of svcSpecs) {
    if (!spec.venueId) continue;
    await prisma.venueService.create({
      data: {
        venueId: spec.venueId,
        name: spec.name,
        price: spec.price,
        type: spec.type,
        isAvailable: true,
      },
    });
    svcCount++;
  }

  await seedSprint3Tournament();

  console.log('\n============================================================');
  console.log('SEED DỮ LIỆU THÀNH CÔNG!');
  console.log('============================================================');
  console.log('4 tài khoản demo sẵn sàng đăng nhập (mật khẩu chung):');
  console.log(`  Mật khẩu: ${DEMO_PASSWORD}`);
  console.log('  1. ADMIN:    admin@sango.vn');
  console.log('  2. OWNER:    owner@sango.vn   (sở hữu mọi venue + voucher GIAM20-*)');
  console.log('  3. CUSTOMER: customer@sango.vn (ví 500k, đơn ngày mưa)');
  console.log('  4. CUSTOMER: customer2@sango.vn (ví 500k, đơn ngày mưa)');
  console.log('------------------------------------------------------------');
  console.log('Voucher F3: GIAM20-CN..GIAM20-T7 (giảm 20%, theo thứ, 06:00-22:00)');
  console.log(
    `Ngày mưa N2: ${rainyBookings.length + 1} đơn CONFIRMED đã trả chờ hủy hàng loạt (${rainyDate})`,
  );
  console.log('Ví F6: customer & customer2 mỗi ví 500.000đ');
  console.log('F1 Teams: FC SanGo (captain customer) + Pickleball Saigon Club (captain customer2)');
  console.log('F7 Tournaments: SanGo Open 2026 — bracket 8 đội, round 1 sẵn sàng nhập điểm');
  console.log('F2 Ranking: booking lịch sử đa dạng (đúng giờ/no-show/hủy sát giờ) cho leaderboard');
  console.log('Captain thêm S3: captain3..captain8@sango.vn (cùng mật khẩu demo)');
  console.log(
    `ExpenseShare: 1 khoản ${Math.floor(depositOf(450_000, 30) / 2).toLocaleString('vi-VN')}đ UNPAID từ booking đội FC SanGo`,
  );
  console.log(`F4 Services: ${svcCount} dịch vụ menu (Aquafina/Redbull/bóng chuyền/giày cầu lông)`);
  console.log('------------------------------------------------------------');
  const hnCount = venueSpecs.filter((v) => v.city.trim() === 'Hà Nội').length;
  console.log(
    `Tổng cộng: ${venueSpecs.length} venue (${hnCount} Hà Nội, ${venueSpecs.length - hnCount} TP.HCM), ${createdCourts.length} court.`,
  );
  console.log('============================================================\n');
}

main()
  .catch((e) => {
    console.error('Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
