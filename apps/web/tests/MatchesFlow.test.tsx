import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MatchesPage, MatchDetailPage } from '../src/features/matches/pages';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';

vi.mock('../src/features/matches/api/matches-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/features/matches/api/matches-api')>();
  const mockMatch = {
    id: 'match-1',
    title: 'Kèo giao lưu sân 5 cuối tuần',
    sportType: 'FOOTBALL5',
    skillLevel: 'Giao lưu nhẹ',
    date: new Date().toISOString().slice(0, 10),
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
  return {
    ...actual,
    getMatchDetailApi: vi.fn().mockResolvedValue(mockMatch),
    listJoinRequestsApi: vi.fn().mockResolvedValue(mockMatch.participants),
    listMatchCommentsApi: vi.fn().mockResolvedValue(mockMatch.comments),
  };
});

describe('Matches Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
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
  });

  it('renders MatchesPage with filter bar and match listings', async () => {
    render(
      <MemoryRouter initialEntries={['/matches']}>
        <Routes>
          <Route path="/matches" element={<MatchesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Tìm Kèo Giao Hữu & Tuyển Slot Lẻ/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Tất Cả Môn/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Pickleball/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Cầu Lông/i })).toBeDefined();
  });

  it('renders MatchDetailPage with line-up and join request form', async () => {
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

    expect(screen.getByRole('heading', { name: /Đội Hình Đã Tham Gia/i })).toBeDefined();
    expect(screen.getByRole('heading', { name: /Đăng Ký Tham Gia Kèo/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Gửi Yêu Cầu Xin Slot/i })).toBeDefined();
    expect(screen.getByRole('heading', { name: /Giao Lưu & Trao Đổi Trước Trận/i })).toBeDefined();
  });
});
