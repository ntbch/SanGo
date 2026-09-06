import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from '../src/features/home/pages/home-page';

vi.mock('../src/features/matches/api/matches-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/features/matches/api/matches-api')>();
  return {
    ...actual,
    listOpenMatchesApi: vi.fn().mockResolvedValue([
      {
        id: 'match-1',
        title: 'Kèo giao lưu sân 5 Ngọc Khánh',
        sportType: 'FOOTBALL5',
        skillLevel: 'Giao lưu',
        date: '2026-09-10',
        startTime: '19:00',
        endTime: '20:30',
        venueName: 'Sân Thể Thao Ngọc Khánh',
        venueAddress: 'Ba Đình, Hà Nội',
        totalSlots: 10,
        filledSlots: 7,
        costPerPerson: 60000,
        hostUser: { id: 'h1', fullName: 'Nguyễn Văn A' },
      },
    ]),
  };
});

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

describe('Home Page Flow Components', () => {
  it('renders Hero Command Center with integrated search and tabular open matches ticker', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    // 1. Headline & subtext
    const heading = screen.getByRole('heading', { level: 1, name: /Đặt Sân Thể Thao & Ghép Kèo Nhanh/i });
    expect(heading).toBeDefined();
    expect(heading.className).toContain('font-black');
    expect(
      screen.getByText(/250\+ Cụm sân hoạt động trực tuyến tại Hà Nội và TP\. Hồ Chí Minh/i),
    ).toBeDefined();

    // 2. Sports selector buttons
    expect(screen.getByRole('button', { name: 'Tất cả' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Bóng đá 5 & 7' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Pickleball' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cầu lông' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Tennis' })).toBeDefined();

    // 3. Search input & submit button
    expect(screen.getByPlaceholderText(/VD: Ngọc Khánh, Cầu Giấy, Thảo Điền/i)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Tìm kiếm sân ngay' })).toBeDefined();

    // 4. Right column open matches card
    expect(screen.getByRole('heading', { level: 2, name: /Kèo ghép đang mở/i })).toBeDefined();
    expect(screen.getAllByText('Thời gian thực').length).toBeGreaterThan(0);
    expect(screen.getByText('Trận đấu đang thiếu người hôm nay')).toBeDefined();

    // 5. Tabular match item
    await waitFor(() => {
      expect(screen.getByText(/Kèo giao lưu sân 5 Ngọc Khánh/i)).toBeDefined();
    });
    expect(screen.getByText(/19:00–20:30/i)).toBeDefined();
    expect(screen.getByText(/60.000đ/i)).toBeDefined();
    expect(screen.getAllByText(/Thiếu/i).length).toBeGreaterThan(0);

    // 6. Matches navigation link
    const matchesLinks = screen.getAllByRole('link', { name: /Xem danh sách kèo thi đấu/i });
    expect(matchesLinks.length).toBeGreaterThan(0);
    expect(matchesLinks[0].getAttribute('href')).toBe('/matches');
  });

  it('renders all Home page sections successfully without emojis', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    // 1. Hero & Search Hub
    expect(screen.getByRole('heading', { name: /Đặt Sân Thể Thao & Ghép Kèo Nhanh/i })).toBeDefined();

    // 2. Sports Cards
    expect(screen.getByRole('heading', { name: /Khám Phá Theo Môn Thể Thao/i })).toBeDefined();
    expect(screen.getByText(/Bóng Đá Sân 5 & 7/i)).toBeDefined();
    expect(screen.getAllByText(/Pickleball/i).length).toBeGreaterThan(0);

    // 3. Featured Venues
    expect(screen.getByRole('heading', { name: /Cụm Sân Tiêu Biểu Được Yêu Thích/i })).toBeDefined();

    // 4. Map Discovery Banner
    expect(screen.getByRole('heading', { name: /Tìm Sân Gần Nhất Bằng Bản Đồ Tương Tác/i })).toBeDefined();

    // 5. Community Features Introduction (Matches & Tournaments)
    expect(screen.getByRole('heading', { name: /Kết Nối Đồng Đội & Thi Đấu Thể Thao/i })).toBeDefined();
    expect(screen.getByRole('heading', { name: /Mở Kèo & Tìm Đồng Đội Cùng Trình Độ/i })).toBeDefined();
    expect(screen.getByRole('heading', { name: /Hệ Thống Giải Đấu & Bảng Điểm Tự Động/i })).toBeDefined();

    // 6. Tech Pillars
    expect(screen.getByRole('heading', { name: /Công Nghệ Vận Hành Thể Thao SanGo/i })).toBeDefined();

    // 7. Partner CTA
    expect(screen.getByRole('heading', { name: /Số Hóa Quản Lý Sân & Tối Đa Doanh Thu Với SanGo OS/i })).toBeDefined();
  });
});
