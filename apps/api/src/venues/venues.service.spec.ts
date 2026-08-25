import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VenuesService } from './venues.service';
import { PrismaService } from '../prisma/prisma.service';
import { SportType } from '@courthub/shared';

describe('VenuesService (Unit Tests)', () => {
  let service: VenuesService;
  let prisma: {
    venue: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    court: {
      count: jest.Mock;
    };
    review: {
      aggregate: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  const mockVenues = [
    {
      id: 'venue-1',
      name: 'Sân Cầu Giấy Pickleball',
      slug: 'san-cau-giay-pickleball',
      address: '1 Dịch Vọng Hậu, Cầu Giấy',
      city: 'Hà Nội',
      district: 'Cầu Giấy',
      lat: 21.0313,
      lng: 105.7835,
      images: [],
      amenities: ['Wifi', 'Parking'],
      depositPercent: 30,
      openMinute: 360,
      closeMinute: 1320,
      courts: [
        {
          id: 'c1',
          name: 'Sân 1',
          sportType: SportType.PICKLEBALL,
          slotMinutes: 60,
          defaultPricePerSlot: 150000,
        },
        {
          id: 'c2',
          name: 'Sân 2',
          sportType: SportType.PICKLEBALL,
          slotMinutes: 60,
          defaultPricePerSlot: 200000,
        },
      ],
    },
    {
      id: 'venue-2',
      name: 'Sân Hoàn Kiếm Tennis',
      slug: 'san-hoan-kiem-tennis',
      address: '1 Tràng Tiền, Hoàn Kiếm',
      city: 'Hà Nội',
      district: 'Hoàn Kiếm',
      lat: 21.0245,
      lng: 105.8576,
      images: [],
      amenities: ['Shower'],
      depositPercent: 50,
      openMinute: 360,
      closeMinute: 1320,
      courts: [
        {
          id: 'c3',
          name: 'Sân VIP',
          sportType: SportType.TENNIS,
          slotMinutes: 60,
          defaultPricePerSlot: 300000,
        },
      ],
    },
    {
      id: 'venue-3',
      name: 'Sân Hà Đông Football',
      slug: 'san-ha-dong-football',
      address: '10 Quang Trung, Hà Đông',
      city: 'Hà Nội',
      district: 'Hà Đông',
      lat: 20.9723,
      lng: 105.7765,
      images: [],
      amenities: ['Canteen'],
      depositPercent: 30,
      openMinute: 360,
      closeMinute: 1320,
      courts: [
        {
          id: 'c4',
          name: 'Sân F7',
          sportType: SportType.FOOTBALL7,
          slotMinutes: 90,
          defaultPricePerSlot: 100000,
        },
      ],
    },
  ];

  beforeEach(async () => {
    prisma = {
      venue: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      court: {
        count: jest.fn(),
      },
      review: {
        aggregate: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [VenuesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<VenuesService>(VenuesService);
  });

  describe('listPublic / findAll', () => {
    it('trả về danh sách sân cơ bản với phân trang', async () => {
      prisma.venue.findMany.mockResolvedValue(mockVenues);

      const result = await service.listPublic({ page: 1, limit: 10 });

      expect(result.items.length).toBe(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.pages).toBe(1);
      expect(result.items[0].city).toBe('Hà Nội');
      expect(result.items[0].district).toBe('Cầu Giấy');
      expect(result.items[0].distanceKm).toBeNull();
    });

    it('áp dụng bộ lọc city và district vào Prisma where query', async () => {
      prisma.venue.findMany.mockResolvedValue([mockVenues[0]]);

      const result = await service.listPublic({
        city: 'Hà Nội',
        district: 'Cầu Giấy',
        page: 1,
        limit: 12,
      });

      expect(prisma.venue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'APPROVED',
            city: { equals: 'Hà Nội', mode: 'insensitive' },
            district: { equals: 'Cầu Giấy', mode: 'insensitive' },
          }),
        }),
      );
      expect(result.items.length).toBe(1);
      expect(result.items[0].district).toBe('Cầu Giấy');
    });

    it('tính khoảng cách distanceKm khi có userLat và userLng', async () => {
      // Người dùng ở Cầu Giấy (21.0313, 105.7835)
      prisma.venue.findMany.mockResolvedValue(mockVenues);

      const result = await service.listPublic({
        userLat: 21.0313,
        userLng: 105.7835,
        page: 1,
        limit: 10,
      });

      expect(result.items.length).toBe(3);
      // Sân 1 cùng tọa độ -> distanceKm = 0
      const venue1 = result.items.find((i) => i.id === 'venue-1');
      expect(venue1?.distanceKm).toBe(0);

      // Sân 2 ở Hoàn Kiếm -> ~7.7 km
      const venue2 = result.items.find((i) => i.id === 'venue-2');
      expect(venue2?.distanceKm).toBeGreaterThan(5);
    });

    it('lọc sân theo bán kính radiusKm', async () => {
      // Người dùng ở Cầu Giấy (21.0313, 105.7835), lọc trong 5km
      prisma.venue.findMany.mockResolvedValue(mockVenues);

      const result = await service.listPublic({
        userLat: 21.0313,
        userLng: 105.7835,
        radiusKm: 5,
        page: 1,
        limit: 10,
      });

      // Chỉ sân 1 trong bán kính 5km
      expect(result.items.length).toBe(1);
      expect(result.items[0].id).toBe('venue-1');
      expect(result.total).toBe(1);
    });

    it('sắp xếp theo khoảng cách sortBy=distance', async () => {
      // Người dùng ở gần Hoàn Kiếm (21.0240, 105.8570)
      prisma.venue.findMany.mockResolvedValue(mockVenues);

      const result = await service.listPublic({
        userLat: 21.024,
        userLng: 105.857,
        sortBy: 'distance',
        page: 1,
        limit: 10,
      });

      expect(result.items[0].id).toBe('venue-2'); // Hoàn Kiếm gần nhất
    });

    it('sắp xếp theo giá tăng dần sortBy=price_asc', async () => {
      prisma.venue.findMany.mockResolvedValue(mockVenues);

      const result = await service.listPublic({
        sortBy: 'price_asc',
        page: 1,
        limit: 10,
      });

      expect(result.items[0].id).toBe('venue-3'); // 100k
      expect(result.items[1].id).toBe('venue-1'); // 150k
      expect(result.items[2].id).toBe('venue-2'); // 300k
    });

    it('sắp xếp theo giá giảm dần sortBy=price_desc', async () => {
      prisma.venue.findMany.mockResolvedValue(mockVenues);

      const result = await service.listPublic({
        sortBy: 'price_desc',
        page: 1,
        limit: 10,
      });

      expect(result.items[0].id).toBe('venue-2'); // min 300k
      expect(result.items[1].id).toBe('venue-1'); // min 150k
      expect(result.items[2].id).toBe('venue-3'); // min 100k
    });

    it('phân trang chính xác khi dữ liệu nhiều trang', async () => {
      prisma.venue.findMany.mockResolvedValue(mockVenues);

      const result = await service.listPublic({ page: 2, limit: 2 });

      expect(result.total).toBe(3);
      expect(result.pages).toBe(2);
      expect(result.items.length).toBe(1);
      expect(result.items[0].id).toBe('venue-3');
    });
  });

  describe('getPublicByIdOrSlug', () => {
    it('trả về chi tiết sân kèm city và district', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenues[0]);

      const result = await service.getPublicByIdOrSlug('san-cau-giay-pickleball');

      expect(result.id).toBe('venue-1');
      expect(result.city).toBe('Hà Nội');
      expect(result.district).toBe('Cầu Giấy');
    });

    it('ném NotFoundException khi không tìm thấy sân hoặc chưa APPROVED', async () => {
      prisma.venue.findFirst.mockResolvedValue(null);

      await expect(service.getPublicByIdOrSlug('unknown-slug')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('tạo venue mới với status PENDING, city và district', async () => {
      prisma.venue.findUnique.mockResolvedValue(null);
      prisma.venue.create.mockResolvedValue({
        id: 'new-v',
        name: 'Sân Mới',
        slug: 'san-moi',
        city: 'Hà Nội',
        district: 'Ba Đình',
        status: 'PENDING',
      });

      const user = { id: 'owner-1' };
      const dto = {
        name: 'Sân Mới',
        address: '123 Kim Mã, Ba Đình',
        city: 'Hà Nội',
        district: 'Ba Đình',
        lat: 21.032,
        lng: 105.821,
        openMinute: 360,
        closeMinute: 1320,
      };

      const result = await service.create(user, dto);

      expect(prisma.venue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ownerId: 'owner-1',
          slug: 'san-moi',
          status: 'PENDING',
          city: 'Hà Nội',
          district: 'Ba Đình',
        }),
      });
      expect(result.status).toBe('PENDING');
    });
  });
});
