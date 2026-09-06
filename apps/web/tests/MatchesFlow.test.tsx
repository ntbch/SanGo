import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MatchesPage, MatchDetailPage } from '../src/features/matches/pages';
import { MatchCard } from '../src/features/matches/components/match-card';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';
import * as matchesApi from '../src/features/matches/api/matches-api';

const mockMatch = {
  id: 'match-1',
  title: 'Kèo giao lưu sân 5 cuối tuần',
  sportType: 'FOOTBALL5',
  skillLevel: 'Giao lưu nhẹ',
  date: '2026-09-10',
  startTime: '20:00',
  endTime: '21:30',
  venueName: 'Cụm Sân Thể Thao Ngọc Khánh',
  venueAddress: 'Cầu Giấy, Hà Nội',
  city: 'Hà Nội',
  totalSlots: 10,
  filledSlots: 6,
  costPerPerson: 50000,
  description: 'Cần thêm người chơi sân 5, giao lưu vui vẻ.',
  requiresApproval: true,
  hostUser: { id: 'host-1', fullName: 'Nguyễn Văn Nam', avatarUrl: null },
  participants: [
    {
      id: 'part-1',
      matchId: 'match-1',
      userId: 'u-2',
      status: 'APPROVED' as const,
      preferredPosition: null,
      note: null,
      joinedAt: new Date().toISOString(),
      user: { id: 'u-2', fullName: 'Trần Đức Người Chơi', avatarUrl: null },
    },
  ],
  comments: [
    {
      id: 'c-1',
      matchId: 'match-1',
      userId: 'u-2',
      content: 'Mình đi đủ người, hẹn gặp cuối tuần.',
      createdAt: new Date().toISOString(),
      user: { id: 'u-2', fullName: 'Trần Đức Người Chơi', avatarUrl: null },
    },
  ],
};

vi.mock('../src/features/matches/api/matches-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/features/matches/api/matches-api')>();
  return {
    ...actual,
    listOpenMatchesApi: vi.fn(),
    getMatchDetailApi: vi.fn(),
    listJoinRequestsApi: vi.fn(),
    listMatchCommentsApi: vi.fn(),
  };
});

describe('Matches Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'u-1',
        email: 'player1@sango.vn',
        fullName: 'Trần Đức Người Chơi',
        role: UserRole.CUSTOMER,
      },
      accessToken: 'test-token',
      status: 'authenticated',
    });

    vi.mocked(matchesApi.listOpenMatchesApi).mockResolvedValue([mockMatch]);
    vi.mocked(matchesApi.getMatchDetailApi).mockResolvedValue(mockMatch);
    vi.mocked(matchesApi.listJoinRequestsApi).mockResolvedValue(mockMatch.participants);
    vi.mocked(matchesApi.listMatchCommentsApi).mockResolvedValue(mockMatch.comments);
  });

  describe('MatchCard - Horizontal Fixture Row', () => {
    it('renders horizontal fixture row card with tabular schedule, cost, and slots', () => {
      const { container } = render(
        <MemoryRouter>
          <MatchCard match={mockMatch} />
        </MemoryRouter>,
      );

      expect(screen.getByTestId('fixture-date-column')).toBeDefined();
      expect(screen.getByTestId('fixture-main')).toBeDefined();

      // Horizontal row card class
      const card = screen.getByTestId('match-card-match-1');
      expect(card.className).toContain('sm:flex-row');
      expect(card.className).toContain('rounded-2xl');
      expect(card.className).toContain('border-border');

      // Tabular schedule time
      const timeElement = screen.getByText('20:00 - 21:30');
      expect(timeElement.className).toContain('font-mono-num');
      expect(timeElement.className).toContain('font-black');

      // Remaining slot badge
      expect(screen.getByText('Còn 4 slot')).toBeDefined();
      expect(screen.getByText('(6/10)')).toBeDefined();

      // Cost per person with mono font
      const costElement = screen.getByText(/50.000/);
      expect(costElement.className).toContain('font-mono-num');
      expect(costElement.className).toContain('font-extrabold');
      expect(costElement.className).toContain('text-primary');

      // CTA button with active scale and link
      const ctaLink = screen.getByRole('link', { name: /Chi tiết/i });
      expect(ctaLink.getAttribute('href')).toBe('/matches/match-1');
      expect(ctaLink.className).toContain('active:scale-[0.98]');

      // Cliche-free: 0 hover:opacity, 0 animate-pulse
      expect(container.querySelector('.animate-pulse')).toBeNull();
      expect(container.innerHTML).not.toContain('hover:opacity');
    });

    it('renders full status badge when all slots are filled', () => {
      const fullMatch = { ...mockMatch, filledSlots: 10 };
      render(
        <MemoryRouter>
          <MatchCard match={fullMatch} />
        </MemoryRouter>,
      );

      expect(screen.getByText('Đã đủ')).toBeDefined();
    });
  });

  describe('MatchesPage', () => {
    it('renders MatchesPage with filter bar and match listings in vertical stack', async () => {
      render(
        <MemoryRouter initialEntries={['/matches']}>
          <Routes>
            <Route path="/matches" element={<MatchesPage />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: /Tìm Kèo Giao Hữu & Tuyển Slot Lẻ/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Tất Cả Môn/i })).toBeDefined();

      await waitFor(() => {
        const list = screen.getByTestId('matches-list');
        expect(list.className).toContain('flex flex-col gap-3');
      });

      expect(screen.getByText('Kèo giao lưu sân 5 cuối tuần')).toBeDefined();
    });

    it('renders calm skeleton during loading without animate-pulse', async () => {
      // Return pending promise to inspect loading state
      vi.mocked(matchesApi.listOpenMatchesApi).mockReturnValue(new Promise(() => {}));

      const { container } = render(
        <MemoryRouter initialEntries={['/matches']}>
          <Routes>
            <Route path="/matches" element={<MatchesPage />} />
          </Routes>
        </MemoryRouter>,
      );

      const skeletonContainer = screen.getByTestId('matches-skeleton-list');
      expect(skeletonContainer).toBeDefined();
      expect(skeletonContainer.className).toContain('flex flex-col gap-3');

      // Cliche-free check: 0 animate-pulse
      expect(container.querySelector('.animate-pulse')).toBeNull();
    });

    it('renders EmptyState formula when no matches match query', async () => {
      vi.mocked(matchesApi.listOpenMatchesApi).mockResolvedValue([]);

      render(
        <MemoryRouter initialEntries={['/matches']}>
          <Routes>
            <Route path="/matches" element={<MatchesPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Không tìm thấy kèo thi đấu phù hợp')).toBeDefined();
      });
      expect(screen.getByRole('button', { name: /Đặt lại bộ lọc/i })).toBeDefined();
    });
  });

  describe('MatchDetailPage - 60/40 Command Center', () => {
    it('renders 60/40 asymmetric command center layout', async () => {
      render(
        <MemoryRouter initialEntries={['/matches/match-1']}>
          <Routes>
            <Route path="/matches/:id" element={<MatchDetailPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Ghi Chú & Thể Thức Thi Đấu/i })).toBeDefined();
      });

      // 60/40 Split Columns
      const leftCol = screen.getByTestId('match-main-column');
      expect(leftCol.className).toContain('lg:col-span-7');

      const rightCol = screen.getByTestId('match-action-sidebar');
      expect(rightCol.className).toContain('lg:col-span-5');
      expect(rightCol.className).toContain('sticky');

      // Left column content
      expect(screen.getByRole('heading', { name: /Thông Số & Quy Định Kèo/i })).toBeDefined();
      expect(screen.getByRole('heading', { name: /Đội Hình Đã Tham Gia/i })).toBeDefined();
      expect(screen.getByRole('heading', { name: /Giao Lưu & Trao Đổi Trước Trận/i })).toBeDefined();

      // Right column Action Card specs
      expect(within(rightCol).getByText('Chi phí mỗi người')).toBeDefined();
      const feeElement = within(rightCol).getByText(/50.000/);
      expect(feeElement.className).toContain('font-mono-num');
      expect(feeElement.className).toContain('font-black');
      expect(feeElement.className).toContain('text-2xl');
      expect(feeElement.className).toContain('text-primary');

      // Join request form
      expect(screen.getByRole('heading', { name: /Đăng Ký Tham Gia Kèo/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Gửi Yêu Cầu Xin Slot/i })).toBeDefined();
    });

    it('renders calm loading state without animate-pulse', () => {
      vi.mocked(matchesApi.getMatchDetailApi).mockReturnValue(new Promise(() => {}));

      const { container } = render(
        <MemoryRouter initialEntries={['/matches/match-1']}>
          <Routes>
            <Route path="/matches/:id" element={<MatchDetailPage />} />
          </Routes>
        </MemoryRouter>,
      );

      // Cliche-free: 0 animate-pulse on loading
      expect(container.querySelector('.animate-pulse')).toBeNull();
    });
  });
});
