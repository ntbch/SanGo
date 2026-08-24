/** Test trang danh sách sân chạy ở chế độ mock. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { resetMockSession } from '../../../lib/api/mock-server';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('VenuesPage (mock data)', () => {
  beforeEach(() => {
    resetMockSession();
    vi.clearAllMocks();
  });

  it('hiển thị danh sách sân từ API mock', async () => {
    renderApp({ route: '/venues' });
    await waitFor(() => {
      expect(screen.getByText('Sân Pickleball Saigon')).toBeTruthy();
      expect(screen.getByText('Cụm Cầu lông Thủ Đức')).toBeTruthy();
    });
  });

  it('lọc theo từ khoá và rơi vào empty state khi không khớp', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/venues' });
    const input = await screen.findByLabelText('Từ khoá tìm kiếm');
    await user.type(input, 'khong-ton-tai-xyz');
    await user.click(screen.getByRole('button', { name: /tìm sân/i }));
    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy sân phù hợp')).toBeTruthy();
    });
    await user.click(screen.getByRole('button', { name: 'Xoá bộ lọc' }));
    await waitFor(() => {
      expect(screen.getByText('Sân Pickleball Saigon')).toBeTruthy();
    });
  });

  it('chip loại sân lọc kết quả', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/venues' });
    await screen.findByText('Tennis Bình Thạnh');
    await user.click(screen.getByRole('button', { name: 'Tennis' }));
    await waitFor(() => {
      expect(screen.queryByText('Cụm Cầu lông Thủ Đức')).toBeNull();
    });
    expect(screen.getByText('Tennis Bình Thạnh')).toBeTruthy();
  });
});
