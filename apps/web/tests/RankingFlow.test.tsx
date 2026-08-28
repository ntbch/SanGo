import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RankingPage } from '../src/features/ranking/pages';

describe('Ranking Flow Integration', () => {
  it('renders RankingPage with Podium and switches between Clubs and Athletes', async () => {
    render(
      <MemoryRouter initialEntries={['/ranking']}>
        <Routes>
          <Route path="/ranking" element={<RankingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Bảng Xếp Hạng Thể Thao SanGo/i })).toBeDefined();

    // Sport pills
    expect(screen.getByRole('button', { name: /Tất Cả Môn/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Bóng Đá/i })).toBeDefined();

    // Check Club ranking tab
    await waitFor(() => {
      expect(screen.getAllByText(/SanGo Warriors FC/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByRole('heading', { name: /Bảng Tổng Sắp Câu Lạc Bộ/i })).toBeDefined();

    // Switch to Athletes ranking tab
    const athletesTabBtn = screen.getByRole('button', { name: /Bảng Vàng Vận Động Viên/i });
    expect(athletesTabBtn).toBeDefined();
    fireEvent.click(athletesTabBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Bảng Vàng Vận Động Viên Phong Trào/i })).toBeDefined();
    });
    expect(screen.getAllByText(/Trần Đức Người Chơi/i).length).toBeGreaterThan(0);

    // Filter by Pickleball where there is 1 athlete
    const pickleballBtn = screen.getByRole('button', { name: /Pickleball/i });
    fireEvent.click(pickleballBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Ngô Thuỳ Linh/i).length).toBeGreaterThan(0);
    });

    // When 1 person in the list, their rank badge must be 1, not 3
    const rankBadges = screen.getAllByText('1');
    expect(rankBadges.length).toBeGreaterThanOrEqual(1);
  });
});

