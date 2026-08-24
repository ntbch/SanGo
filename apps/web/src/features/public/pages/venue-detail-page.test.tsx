/** Test trang chi tiết sân ở chế độ mock. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { resetMockSession } from '../../../lib/api/mock-server';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('VenueDetailPage (mock data)', () => {
  beforeEach(() => {
    resetMockSession();
    vi.clearAllMocks();
  });

  it('render gallery, giờ mở cửa, sân con và giá', async () => {
    renderApp({ route: '/venues/san-pickleball-saigon' });
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Sân Pickleball Saigon' })).toBeTruthy();
      expect(screen.getByText(/Mở cửa 06:00 – 23:00/)).toBeTruthy();
      expect(screen.getByText('Sân 3')).toBeTruthy();
      expect(screen.getAllByText(/400.000₫\/slot/).length).toBeGreaterThan(0);
      expect(screen.getByText('Đặt cọc 30% · Huỷ trước 24h hoàn 100%')).toBeTruthy();
    });
  });

  it('hiển thị tiện ích và đánh giá mẫu', async () => {
    renderApp({ route: '/venues/san-pickleball-saigon' });
    await waitFor(() => {
      expect(screen.getByText('Ánh sáng')).toBeTruthy();
      expect(screen.getByText('Minh T.')).toBeTruthy();
      expect(screen.getByText(/Sân mới, bóng đẹp/)).toBeTruthy();
    });
  });

  it('404 hiển thị thông báo và nút về danh sách', async () => {
    renderApp({ route: '/venues/khong-co-san' });
    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy cụm sân này.')).toBeTruthy();
    });
  });
});
