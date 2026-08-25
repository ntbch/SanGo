/**
 * CourtHub — seed dữ liệu demo đẹp (đặc tả §9 & Master Data 12 Quận Hà Nội).
 *
 * Chạy: pnpm --filter @courthub/api db:seed
 * Dữ liệu: reset toàn bộ rồi tạo lại (deterministic cho demo/đồ án):
 *  - 24 venue APPROVED tại 12 quận nội thành Hà Nội + 1 venue TP.HCM
 *  - Phủ đủ 5 sportType: FOOTBALL5, FOOTBALL7, PICKLEBALL, BADMINTON, TENNIS
 *  - Pricing rules ngày thường / cuối tuần hợp lý
 *  - Booking mẫu đủ trạng thái + Payment + Review + BookingHold
 *  - 3 tài khoản demo (mật khẩu in rõ ở cuối log)
 */
import { PrismaClient, type SportType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Mật khẩu dùng chung của 3 tài khoản demo — in rõ khi seed theo yêu cầu. */
export const DEMO_PASSWORD = 'Courthub@2026';

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

async function main() {
  console.log('🧹 Dọn dữ liệu cũ...');
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.matchParticipant.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.bookingHold.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.court.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Tạo tài khoản demo...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  await prisma.user.create({
    data: {
      email: 'admin@courthub.vn',
      passwordHash,
      fullName: 'Nguyễn Quản Trị',
      phone: '0900000001',
      role: 'ADMIN',
    },
  });
  const owner = await prisma.user.create({
    data: {
      email: 'owner@courthub.vn',
      passwordHash,
      fullName: 'Trần Văn Chủ Sân',
      phone: '0900000002',
      role: 'OWNER',
    },
  });
  const customer = await prisma.user.create({
    data: {
      email: 'customer@courthub.vn',
      passwordHash,
      fullName: 'Lê Thị Khách Hàng',
      phone: '0900000003',
      role: 'CUSTOMER',
    },
  });

  console.log('🏟️  Tạo 24 cụm sân tại 12 quận Hà Nội + 1 cụm sân TP.HCM...');
  const venueSpecs: VenueSpec[] = [
    // --- 1. BA ĐÌNH ---
    {
      name: 'Sân Thể Thao Quần Ngựa',
      slug: 'san-the-thao-quan-ngua',
      city: 'Hà Nội',
      district: 'Ba Đình',
      address: '30 Văn Cao, Liễu Giai, Ba Đình, Hà Nội',
      lat: 21.0384,
      lng: 105.8152,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 30,
      amenities: ['Bãi đỗ xe', 'Phòng thay đồ', 'Căng tin', 'Wifi'],
      images: [
        'https://picsum.photos/seed/quan-ngua-1/800/500',
        'https://picsum.photos/seed/quan-ngua-2/800/500',
      ],
      courts: [
        {
          name: 'Sân Pickleball Quần Ngựa 1',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 130_000,
        },
        {
          name: 'Sân Cầu Lông Quần Ngựa',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 100_000,
        },
        {
          name: 'Sân Tennis Quần Ngựa',
          sportType: 'TENNIS',
          slotMinutes: 90,
          defaultPricePerSlot: 350_000,
        },
      ],
    },
    {
      name: 'Cụm Sân Bóng Đá Hoàng Hoa Thám',
      slug: 'cum-san-bong-da-hoang-hoa-tham',
      city: 'Hà Nội',
      district: 'Ba Đình',
      address: '250 Hoàng Hoa Thám, Thụy Khuê, Ba Đình, Hà Nội',
      lat: 21.0421,
      lng: 105.8236,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 30,
      amenities: ['Bãi xe máy', 'Đèn chiếu sáng ban đêm', 'Nước uống'],
      images: ['https://picsum.photos/seed/hoang-hoa-tham-1/800/500'],
      courts: [
        {
          name: 'Sân 5 Hoàng Hoa Thám A',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 450_000,
        },
        {
          name: 'Sân 7 Hoàng Hoa Thám B',
          sportType: 'FOOTBALL7',
          slotMinutes: 90,
          defaultPricePerSlot: 850_000,
        },
      ],
    },

    // --- 2. CẦU GIẤY ---
    {
      name: 'Tổ Hợp Thể Thao Cầu Giấy',
      slug: 'to-hop-the-thao-cau-giay',
      city: 'Hà Nội',
      district: 'Cầu Giấy',
      address: '35 Trần Quý Kiên, Dịch Vọng, Cầu Giấy, Hà Nội',
      lat: 21.0368,
      lng: 105.7925,
      openMinute: 360,
      closeMinute: 1410,
      depositPercent: 30,
      amenities: ['Bãi xe ô tô', 'Phòng tắm nóng lạnh', 'Cho thuê vợt', 'Wifi'],
      images: [
        'https://picsum.photos/seed/to-hop-cau-giay-1/800/500',
        'https://picsum.photos/seed/to-hop-cau-giay-2/800/500',
      ],
      courts: [
        {
          name: 'Sân Cầu Lông Số 1',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 90_000,
        },
        {
          name: 'Sân Cầu Lông Số 2',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 90_000,
        },
        {
          name: 'Sân Pickleball Cầu Giấy',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 130_000,
        },
        {
          name: 'Sân Tennis Cầu Giấy',
          sportType: 'TENNIS',
          slotMinutes: 90,
          defaultPricePerSlot: 320_000,
        },
      ],
    },
    {
      name: 'Sân Bóng Đá & Pickleball Trung Kính',
      slug: 'san-bong-da-pickleball-trung-kinh',
      city: 'Hà Nội',
      district: 'Cầu Giấy',
      address: '218 Trung Kính, Yên Hòa, Cầu Giấy, Hà Nội',
      lat: 21.0182,
      lng: 105.7938,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 30,
      amenities: ['Bãi đỗ xe', 'Căng tin', 'Tủ đồ'],
      images: ['https://picsum.photos/seed/trung-kinh-1/800/500'],
      courts: [
        {
          name: 'Sân Bóng Đá 5 Trung Kính',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 420_000,
        },
        {
          name: 'Sân Pickleball Trung Kính',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 120_000,
        },
      ],
    },

    // --- 3. ĐỐNG ĐA ---
    {
      name: 'Sân thể thao Ngọc Khánh',
      slug: 'san-the-thao-ngoc-khanh',
      city: 'Hà Nội',
      district: 'Đống Đa',
      address: 'Số 12 Nguyễn Chí Thanh, Láng Thượng, Đống Đa, Hà Nội',
      lat: 21.0283,
      lng: 105.8142,
      openMinute: 360,
      closeMinute: 1410,
      depositPercent: 30,
      amenities: ['Phòng thay đồ', 'Bãi xe miễn phí', 'Nước uống miễn phí', 'Wifi'],
      images: [
        'https://picsum.photos/seed/courthub-ngoc-khanh-1/800/500',
        'https://picsum.photos/seed/courthub-ngoc-khanh-2/800/500',
      ],
      courts: [
        {
          name: 'Sân bóng đá 5 người A',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 400_000,
        },
        {
          name: 'Sân bóng đá 5 người B',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 400_000,
        },
        {
          name: 'Sân Pickleball trong nhà',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 120_000,
        },
      ],
    },
    {
      name: 'Cụm Sân Thể Thao Hoàng Cầu',
      slug: 'cum-san-the-thao-hoang-cau',
      city: 'Hà Nội',
      district: 'Đống Đa',
      address: 'Số 1 Ngõ 69 Hoàng Cầu, Ô Chợ Dừa, Đống Đa, Hà Nội',
      lat: 21.0185,
      lng: 105.8234,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 30,
      amenities: ['Ven hồ thoáng mát', 'Bãi xe', 'Căng tin giải khát'],
      images: ['https://picsum.photos/seed/hoang-cau-1/800/500'],
      courts: [
        {
          name: 'Sân Cầu Lông Hoàng Cầu',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 95_000,
        },
        {
          name: 'Sân Tennis Hoàng Cầu',
          sportType: 'TENNIS',
          slotMinutes: 90,
          defaultPricePerSlot: 300_000,
        },
        {
          name: 'Sân Bóng Đá 5 Hoàng Cầu',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 400_000,
        },
      ],
    },

    // --- 4. HAI BÀ TRƯNG ---
    {
      name: 'Cụm Sân Thể Thao Bách Khoa',
      slug: 'cum-san-the-thao-bach-khoa',
      city: 'Hà Nội',
      district: 'Hai Bà Trưng',
      address: 'Số 1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội',
      lat: 21.0068,
      lng: 105.8452,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 30,
      amenities: ['Bãi đỗ xe lớn', 'Khán đài', 'Phòng thay đồ'],
      images: ['https://picsum.photos/seed/bach-khoa-1/800/500'],
      courts: [
        {
          name: 'Sân 5 Bách Khoa 1',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 400_000,
        },
        {
          name: 'Sân 7 Bách Khoa Pro',
          sportType: 'FOOTBALL7',
          slotMinutes: 90,
          defaultPricePerSlot: 800_000,
        },
        {
          name: 'Sân Cầu Lông Nhà Thi Đấu BK',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 85_000,
        },
      ],
    },
    {
      name: 'CLB Pickleball & Tennis Tuổi Trẻ',
      slug: 'clb-pickleball-tennis-tuoi-tre',
      city: 'Hà Nội',
      district: 'Hai Bà Trưng',
      address: 'Công viên Tuổi Trẻ, Võ Thị Sáu, Thanh Nhàn, Hai Bà Trưng, Hà Nội',
      lat: 21.0041,
      lng: 105.8562,
      openMinute: 360,
      closeMinute: 1350,
      depositPercent: 25,
      amenities: ['Không gian xanh', 'Bãi xe ô tô', 'Huấn luyện viên'],
      images: ['https://picsum.photos/seed/tuoi-tre-1/800/500'],
      courts: [
        {
          name: 'Sân Pickleball Tuổi Trẻ 1',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 110_000,
        },
        {
          name: 'Sân Pickleball Tuổi Trẻ 2',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 110_000,
        },
        {
          name: 'Sân Tennis Tuổi Trẻ',
          sportType: 'TENNIS',
          slotMinutes: 90,
          defaultPricePerSlot: 280_000,
        },
      ],
    },

    // --- 5. HOÀN KIẾM ---
    {
      name: 'Sân Thể Thao Phúc Tân',
      slug: 'san-the-thao-phuc-tan',
      city: 'Hà Nội',
      district: 'Hoàn Kiếm',
      address: 'Khu thể thao Phúc Tân, Phúc Tân, Hoàn Kiếm, Hà Nội',
      lat: 21.0315,
      lng: 105.8592,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 30,
      amenities: ['Bãi xe máy', 'Gần phố cổ', 'Nước uống'],
      images: ['https://picsum.photos/seed/phuc-tan-1/800/500'],
      courts: [
        {
          name: 'Sân Bóng Đá 5 Phúc Tân',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 420_000,
        },
        {
          name: 'Sân Cầu Lông Phúc Tân',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 95_000,
        },
      ],
    },
    {
      name: 'Trung Tâm Thể Thao Hàng Chiếu',
      slug: 'trung-tam-the-thao-hang-chieu',
      city: 'Hà Nội',
      district: 'Hoàn Kiếm',
      address: '42 Hàng Chiếu, Đồng Xuân, Hoàn Kiếm, Hà Nội',
      lat: 21.0378,
      lng: 105.8515,
      openMinute: 360,
      closeMinute: 1320,
      depositPercent: 30,
      amenities: ['Trung tâm phố cổ', 'Điều hòa', 'Tủ đồ an toàn'],
      images: ['https://picsum.photos/seed/hang-chieu-1/800/500'],
      courts: [
        {
          name: 'Sân Pickleball Phố Cổ',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 140_000,
        },
        {
          name: 'Sân Cầu Lông Hàng Chiếu',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 110_000,
        },
      ],
    },

    // --- 6. THANH XUÂN ---
    {
      name: 'Cụm Sân Không Quân Lê Trọng Tấn',
      slug: 'cum-san-khong-quan-le-trong-tan',
      city: 'Hà Nội',
      district: 'Thanh Xuân',
      address: '168 Lê Trọng Tấn, Khương Mai, Thanh Xuân, Hà Nội',
      lat: 20.9985,
      lng: 105.8285,
      openMinute: 360,
      closeMinute: 1410,
      depositPercent: 30,
      amenities: ['Bãi xe ô tô cực rộng', 'Căng tin', 'Hệ thống đèn tiêu chuẩn'],
      images: ['https://picsum.photos/seed/khong-quan-1/800/500'],
      courts: [
        {
          name: 'Sân Bóng Đá 5 Không Quân',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 420_000,
        },
        {
          name: 'Sân Bóng Đá 7 Không Quân',
          sportType: 'FOOTBALL7',
          slotMinutes: 90,
          defaultPricePerSlot: 850_000,
        },
        {
          name: 'Sân Tennis Phòng Không',
          sportType: 'TENNIS',
          slotMinutes: 90,
          defaultPricePerSlot: 300_000,
        },
      ],
    },
    {
      name: 'CLB Pickleball & Cầu Lông Thanh Xuân',
      slug: 'clb-pickleball-cau-long-thanh-xuan',
      city: 'Hà Nội',
      district: 'Thanh Xuân',
      address: '15 Khuất Duy Tiến, Nhân Chính, Thanh Xuân, Hà Nội',
      lat: 20.9952,
      lng: 105.8012,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 25,
      amenities: ['Mặt thảm chuẩn thi đấu', 'Phòng thay đồ', 'Wifi tốc độ cao'],
      images: ['https://picsum.photos/seed/thanh-xuan-1/800/500'],
      courts: [
        {
          name: 'Sân Pickleball Thanh Xuân A',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 120_000,
        },
        {
          name: 'Sân Pickleball Thanh Xuân B',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 120_000,
        },
        {
          name: 'Sân Cầu Lông Thanh Xuân 1',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 90_000,
        },
      ],
    },

    // --- 7. TÂY HỒ ---
    {
      name: 'D-Sports Quảng An',
      slug: 'd-sports-quang-an',
      city: 'Hà Nội',
      district: 'Tây Hồ',
      address: '50 Đặng Thai Mai, Quảng An, Tây Hồ, Hà Nội',
      lat: 21.0645,
      lng: 105.8282,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 30,
      amenities: ['View Hồ Tây', 'Cafe sang trọng', 'Phòng tắm nóng lạnh', 'Bãi xe ô tô'],
      images: ['https://picsum.photos/seed/quang-an-1/800/500'],
      courts: [
        {
          name: 'Sân Pickleball View Hồ',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 150_000,
        },
        {
          name: 'Sân Pickleball Pro Tây Hồ',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 150_000,
        },
        {
          name: 'Sân Tennis D-Sports',
          sportType: 'TENNIS',
          slotMinutes: 90,
          defaultPricePerSlot: 380_000,
        },
      ],
    },
    {
      name: 'Cụm Sân Thể Thao An Dương',
      slug: 'cum-san-the-thao-an-duong',
      city: 'Hà Nội',
      district: 'Tây Hồ',
      address: 'Ngõ 76 An Dương, Yên Phụ, Tây Hồ, Hà Nội',
      lat: 21.0512,
      lng: 105.8395,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 30,
      amenities: ['Bãi xe máy rộng', 'Đèn LED cao cấp', 'Nước ngọt'],
      images: ['https://picsum.photos/seed/an-duong-1/800/500'],
      courts: [
        {
          name: 'Sân 5 An Dương 1',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 400_000,
        },
        {
          name: 'Sân 7 An Dương',
          sportType: 'FOOTBALL7',
          slotMinutes: 90,
          defaultPricePerSlot: 800_000,
        },
        {
          name: 'Sân Cầu Lông An Dương',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 90_000,
        },
      ],
    },

    // --- 8. HOÀNG MAI ---
    {
      name: 'Trung tâm cầu lông & Pickleball Hoàng Mai',
      slug: 'cau-long-pickleball-hoang-mai',
      city: 'Hà Nội',
      district: 'Hoàng Mai',
      address: 'KĐT Linh Đàm, Hoàng Liệt, Hoàng Mai, Hà Nội',
      lat: 20.9845,
      lng: 105.8541,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 25,
      amenities: ['Phòng thay đồ', 'Bãi xe có mái che', 'Thuê vợt/cầu'],
      images: [
        'https://picsum.photos/seed/courthub-hoang-mai-1/800/500',
        'https://picsum.photos/seed/courthub-hoang-mai-2/800/500',
      ],
      courts: [
        {
          name: 'Sân cầu lông 1',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 90_000,
        },
        {
          name: 'Sân cầu lông 2',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 90_000,
        },
        {
          name: 'Sân bóng đá 7 người',
          sportType: 'FOOTBALL7',
          slotMinutes: 90,
          defaultPricePerSlot: 800_000,
        },
        {
          name: 'Sân Pickleball ngoài trời',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 100_000,
          status: 'MAINTENANCE',
        },
      ],
    },
    {
      name: 'Sân Bóng Đá Định Công',
      slug: 'san-bong-da-dinh-cong',
      city: 'Hà Nội',
      district: 'Hoàng Mai',
      address: 'Định Công Thượng, Định Công, Hoàng Mai, Hà Nội',
      lat: 20.9852,
      lng: 105.8341,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 30,
      amenities: ['Bãi xe máy & ô tô', 'Khán đài mini', 'Căng tin'],
      images: ['https://picsum.photos/seed/dinh-cong-1/800/500'],
      courts: [
        {
          name: 'Sân 5 Định Công A',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 380_000,
        },
        {
          name: 'Sân 7 Định Công B',
          sportType: 'FOOTBALL7',
          slotMinutes: 90,
          defaultPricePerSlot: 750_000,
        },
      ],
    },

    // --- 9. LONG BIÊN ---
    {
      name: 'Cụm Sân Thể Thao Bồ Đề',
      slug: 'cum-san-the-thao-bo-de',
      city: 'Hà Nội',
      district: 'Long Biên',
      address: 'Phố Hồng Tiến, Bồ Đề, Long Biên, Hà Nội',
      lat: 21.0385,
      lng: 105.8752,
      openMinute: 360,
      closeMinute: 1410,
      depositPercent: 30,
      amenities: ['Bãi xe ô tô', 'Sân cỏ nhân tạo mới', 'Hệ thống đèn LED', 'Wifi'],
      images: ['https://picsum.photos/seed/bo-de-1/800/500'],
      courts: [
        {
          name: 'Sân Bóng Đá 5 Bồ Đề',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 400_000,
        },
        {
          name: 'Sân Pickleball Bồ Đề',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 110_000,
        },
        {
          name: 'Sân Tennis Bồ Đề',
          sportType: 'TENNIS',
          slotMinutes: 90,
          defaultPricePerSlot: 290_000,
        },
      ],
    },
    {
      name: 'Trung Tâm Pickleball & Cầu Lông Việt Hưng',
      slug: 'trung-tam-pickleball-cau-long-viet-hung',
      city: 'Hà Nội',
      district: 'Long Biên',
      address: 'KĐT Việt Hưng, Giang Biên, Long Biên, Hà Nội',
      lat: 21.0615,
      lng: 105.9085,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 25,
      amenities: ['Nhà thi đấu có máy lạnh', 'Phòng tắm sạch', 'Cho thuê dụng cụ'],
      images: ['https://picsum.photos/seed/viet-hung-1/800/500'],
      courts: [
        {
          name: 'Sân Pickleball Việt Hưng 1',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 120_000,
        },
        {
          name: 'Sân Pickleball Việt Hưng 2',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 120_000,
        },
        {
          name: 'Sân Cầu Lông Việt Hưng',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 85_000,
        },
      ],
    },

    // --- 10. HÀ ĐÔNG ---
    {
      name: 'Cụm Sân Thể Thao Văn Quán',
      slug: 'cum-san-the-thao-van-quan',
      city: 'Hà Nội',
      district: 'Hà Đông',
      address: 'KĐT Văn Quán, Văn Quán, Hà Đông, Hà Nội',
      lat: 20.9785,
      lng: 105.7892,
      openMinute: 360,
      closeMinute: 1410,
      depositPercent: 30,
      amenities: ['Ven hồ Văn Quán', 'Bãi xe ô tô', 'Căng tin đồ uống', 'Tủ đồ'],
      images: ['https://picsum.photos/seed/van-quan-1/800/500'],
      courts: [
        {
          name: 'Sân Bóng Đá 5 Văn Quán',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 380_000,
        },
        {
          name: 'Sân Pickleball Văn Quán',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 110_000,
        },
        {
          name: 'Sân Cầu Lông Văn Quán',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 80_000,
        },
      ],
    },
    {
      name: 'Sân Tennis & Pickleball Dương Nội',
      slug: 'san-tennis-pickleball-duong-noi',
      city: 'Hà Nội',
      district: 'Hà Đông',
      address: 'KĐT Dương Nội, Dương Nội, Hà Đông, Hà Nội',
      lat: 20.9652,
      lng: 105.7525,
      openMinute: 360,
      closeMinute: 1350,
      depositPercent: 30,
      amenities: ['Bãi đỗ xe', 'Hệ thống đèn LED', 'Nước uống'],
      images: ['https://picsum.photos/seed/duong-noi-1/800/500'],
      courts: [
        {
          name: 'Sân Tennis Dương Nội 1',
          sportType: 'TENNIS',
          slotMinutes: 90,
          defaultPricePerSlot: 270_000,
        },
        {
          name: 'Sân Pickleball Dương Nội',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 100_000,
        },
      ],
    },

    // --- 11. NAM TỪ LIÊM ---
    {
      name: 'Cụm Sân Tân Mỹ - Mỹ Đình',
      slug: 'cum-san-tan-my-my-dinh',
      city: 'Hà Nội',
      district: 'Nam Từ Liêm',
      address: 'Đường Tân Mỹ, Mỹ Đình 1, Nam Từ Liêm, Hà Nội',
      lat: 21.0252,
      lng: 105.7685,
      openMinute: 360,
      closeMinute: 1410,
      depositPercent: 30,
      amenities: ['Gần SVĐ Quốc Gia', 'Bãi xe cực lớn', 'Cỏ nhân tạo đạt chuẩn', 'Wifi'],
      images: ['https://picsum.photos/seed/tan-my-1/800/500'],
      courts: [
        {
          name: 'Sân Bóng Đá 5 Tân Mỹ 1',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 400_000,
        },
        {
          name: 'Sân Bóng Đá 7 Tân Mỹ Pro',
          sportType: 'FOOTBALL7',
          slotMinutes: 90,
          defaultPricePerSlot: 850_000,
        },
        {
          name: 'Sân Pickleball Mỹ Đình',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 120_000,
        },
      ],
    },
    {
      name: 'Sân Bóng Đá & Cầu Lông Mễ Trì',
      slug: 'san-bong-da-cau-long-me-tri',
      city: 'Hà Nội',
      district: 'Nam Từ Liêm',
      address: 'Đường Mễ Trì Hạ, Mễ Trì, Nam Từ Liêm, Hà Nội',
      lat: 21.0112,
      lng: 105.7815,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 25,
      amenities: ['Bãi đỗ xe máy & ô tô', 'Phòng thay đồ', 'Căng tin'],
      images: ['https://picsum.photos/seed/me-tri-1/800/500'],
      courts: [
        {
          name: 'Sân Bóng Đá 5 Mễ Trì',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 400_000,
        },
        {
          name: 'Sân Cầu Lông Mễ Trì',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 85_000,
        },
      ],
    },

    // --- 12. BẮC TỪ LIÊM ---
    {
      name: 'Cụm Sân Thể Thao Cổ Nhuế',
      slug: 'cum-san-the-thao-co-nhue',
      city: 'Hà Nội',
      district: 'Bắc Từ Liêm',
      address: 'Đường Cổ Nhuế, Cổ Nhuế 2, Bắc Từ Liêm, Hà Nội',
      lat: 21.0685,
      lng: 105.7725,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 30,
      amenities: ['Bãi đỗ xe', 'Hệ thống đèn LED', 'Nước uống'],
      images: ['https://picsum.photos/seed/co-nhue-1/800/500'],
      courts: [
        {
          name: 'Sân Bóng Đá 5 Cổ Nhuế',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 380_000,
        },
        {
          name: 'Sân Bóng Đá 7 Cổ Nhuế',
          sportType: 'FOOTBALL7',
          slotMinutes: 90,
          defaultPricePerSlot: 750_000,
        },
        {
          name: 'Sân Cầu Lông Cổ Nhuế',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 80_000,
        },
      ],
    },
    {
      name: 'CLB Pickleball & Tennis Xuân Đỉnh',
      slug: 'clb-pickleball-tennis-xuan-dinh',
      city: 'Hà Nội',
      district: 'Bắc Từ Liêm',
      address: 'Đường Xuân Đỉnh, Xuân Đỉnh, Bắc Từ Liêm, Hà Nội',
      lat: 21.0745,
      lng: 105.7885,
      openMinute: 360,
      closeMinute: 1380,
      depositPercent: 30,
      amenities: ['Khuôn viên rộng', 'Bãi xe ô tô', 'HLV chuyên nghiệp', 'Phòng tắm nóng lạnh'],
      images: ['https://picsum.photos/seed/xuan-dinh-1/800/500'],
      courts: [
        {
          name: 'Sân Pickleball Xuân Đỉnh 1',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 120_000,
        },
        {
          name: 'Sân Pickleball Xuân Đỉnh 2',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 120_000,
        },
        {
          name: 'Sân Tennis Xuân Đỉnh',
          sportType: 'TENNIS',
          slotMinutes: 90,
          defaultPricePerSlot: 300_000,
        },
      ],
    },

    // --- TP. HỒ CHÍ MINH ---
    {
      name: 'Tổng hợp thể thao Phú Thọ',
      slug: 'tong-hop-the-thao-phu-tho',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 11',
      address: '221 Lý Thường Kiệt, Quận 11, TP. Hồ Chí Minh',
      lat: 10.7626,
      lng: 106.673,
      openMinute: 330,
      closeMinute: 1320,
      depositPercent: 30,
      amenities: ['Phòng thay đồ', 'Bãi xe giữ xe', 'Ghim bóng miễn phí'],
      images: [
        'https://picsum.photos/seed/courthub-phu-tho-1/800/500',
        'https://picsum.photos/seed/courthub-phu-tho-2/800/500',
      ],
      courts: [
        {
          name: 'Sân Tennis số 1',
          sportType: 'TENNIS',
          slotMinutes: 90,
          defaultPricePerSlot: 300_000,
        },
        {
          name: 'Sân Tennis số 2',
          sportType: 'TENNIS',
          slotMinutes: 90,
          defaultPricePerSlot: 300_000,
        },
        {
          name: 'Sân bóng đá 5 người',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 350_000,
        },
      ],
    },
  ];

  const createdCourts: { id: string; spec: CourtSpec }[] = [];
  for (const spec of venueSpecs) {
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

  console.log('📅 Tạo booking mẫu đủ trạng thái + payment/review...');
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

  console.log('🔒 Tạo 1 BookingHold đang hoạt động (demo slot state HOLD)...');
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

  console.log('\n============================================================');
  console.log('✨ SEED DỮ LIỆU THÀNH CÔNG!');
  console.log('============================================================');
  console.log('3 tài khoản demo sẵn sàng đăng nhập (mật khẩu chung):');
  console.log(`  Mật khẩu: ${DEMO_PASSWORD}`);
  console.log('  1. ADMIN:    admin@courthub.vn');
  console.log('  2. OWNER:    owner@courthub.vn');
  console.log('  3. CUSTOMER: customer@courthub.vn');
  console.log('------------------------------------------------------------');
  console.log(
    `Tổng cộng: ${venueSpecs.length} venue (${venueSpecs.length - 1} Hà Nội phủ 12 quận, 1 TP.HCM), ${createdCourts.length} court.`,
  );
  console.log('============================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
