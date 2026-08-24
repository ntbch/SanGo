import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { resetMockSession } from '../../../lib/api/mock-server';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('MatchesPage (ghép trận mở)', () => {
  beforeEach(() => {
    resetMockSession();
  });

  it('render danh sách trận mở với số người tham gia định dạng X/Y', async () => {
    renderApp({ route: '/matches' });
    expect(await screen.findByText('Ghép trận mở')).toBeTruthy();
    expect(await screen.findByText('Sân Pickleball Saigon · Sân 1')).toBeTruthy();
    const counts = screen.getAllByTestId('joined-count');
    expect(counts.some((el) => el.textContent === '2/4 người')).toBe(true);
  });

  it('filter theo loại sân chỉ còn card khớp', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/matches' });
    await screen.findByText('Sân Pickleball Saigon · Sân 1');
    await user.selectOptions(screen.getByLabelText('Loại sân'), 'BADMINTON');
    await waitFor(() => {
      expect(screen.queryByText('Sân Pickleball Saigon · Sân 1')).toBeNull();
    });
    expect(
      await screen.findByText('Cụm Cầu lông Thủ Đức · Sân A1', undefined, { timeout: 3000 }),
    ).toBeTruthy();
  });
});
