import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from '../src/features/home/pages/home-page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Home Page Flow Components', () => {
  it('renders all Home page sections successfully without emojis', () => {
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
