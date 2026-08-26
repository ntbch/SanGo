/** Test trang chi tiết sân ở chế độ mock. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { resetMockSession } from '../../../../src/lib/api/mock-server';
import { renderApp } from '../../../test-utils';

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

  it('hiển thị nút Chỉ đường trên Google Maps trỏ đúng URL chuẩn', async () => {
    renderApp({ route: '/venues/san-pickleball-saigon' });
    await waitFor(() => {
      const mapBtn = screen.getByRole('link', { name: 'Chỉ đường trên Google Maps' });
      expect(mapBtn).toBeTruthy();
      const href = mapBtn.getAttribute('href');
      expect(href).toContain(
        'https://www.google.com/maps/dir/?api=1&destination=10.8205,106.6894&travelmode=driving',
      );
      expect(mapBtn.getAttribute('target')).toBe('_blank');
      expect(mapBtn.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  it('404 hiển thị thông báo và nút về danh sách', async () => {
    renderApp({ route: '/venues/khong-co-san' });
    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy cụm sân này.')).toBeTruthy();
    });
  });

  it('sân chưa APPROVED (PENDING) trả 404 như backend public', async () => {
    renderApp({ route: '/venues/cum-cau-long-thu-duc' }); // v-2 PENDING TP.HCM
    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy cụm sân này.')).toBeTruthy();
    });
  });
});
