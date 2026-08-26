import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserRole } from '@sango/shared';

import { resetMockSession } from '../../../../src/lib/api/mock-server';
import { useAuthStore } from '../../../../src/lib/auth/auth-store';
import { renderApp } from '../../../test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('AiChatWidget (§3.12)', () => {
  beforeEach(() => {
    resetMockSession();
    useAuthStore.getState().clearSession();
  });

  it('mở panel với lời chào và quick-reply chips', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/matches' });
    await user.click(screen.getByTestId('ai-chat-toggle'));
    expect(await screen.findByTestId('ai-chat-panel')).toBeTruthy();
    expect(screen.getByText(/Chào bạn!/)).toBeTruthy();
    expect(screen.getByText('Tìm sân pickleball ở Gò Vấp')).toBeTruthy();
  });

  it('tìm sân -> badge tool searchVenues + card venue thật từ DB mock', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/matches' });
    await user.click(screen.getByTestId('ai-chat-toggle'));
    await screen.findByText(/Chào bạn!/);

    await user.type(screen.getByTestId('ai-chat-input'), 'Tìm sân pickleball{enter}');
    expect(
      await screen.findByText('[tool: searchVenues]', undefined, { timeout: 3000 }),
    ).toBeTruthy();
    expect(await screen.findByText('Sân Pickleball Saigon')).toBeTruthy();
  });

  it('vượt hạn mức 429 -> bubble thân thiện, hội thoại không vỡ', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/matches' });
    await user.click(screen.getByTestId('ai-chat-toggle'));
    await screen.findByText(/Chào bạn!/);

    await user.type(screen.getByTestId('ai-chat-input'), 'rate-limit-me{enter}');
    expect(
      await screen.findByText(
        'Bạn đã gửi nhiều tin quá, mình nghỉ chút nhé, thử lại sau.',
        undefined,
        { timeout: 3000 },
      ),
    ).toBeTruthy();
    // Input vẫn dùng được để thử lại
    expect(screen.getByTestId('ai-chat-input')).toBeTruthy();
  });

  it('khách bấm chip giờ -> gợi ý đăng nhập thay vì giữ chỗ', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/matches' });
    await user.click(screen.getByTestId('ai-chat-toggle'));
    await screen.findByText(/Chào bạn!/);

    await user.type(screen.getByTestId('ai-chat-input'), 'Sân Saigon còn giờ nào tối nay{enter}');
    const chip = await screen.findByText('18:00–19:00');
    await user.click(chip);
    expect(await screen.findByText('Bạn cần đăng nhập để giữ chỗ nhé.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeTruthy();
  });

  it('đã đăng nhập: chip giờ tạo hold và chuyển trang thanh toán', async () => {
    useAuthStore.getState().setSession(
      {
        id: 'u-cust',
        email: 'cust@sango.vn',
        role: UserRole.CUSTOMER,
        fullName: 'Khách Hàng',
      },
      'tok',
    );
    const user = userEvent.setup();
    renderApp({ route: '/matches' });
    await user.click(screen.getByTestId('ai-chat-toggle'));
    await screen.findByText(/Chào bạn!/);

    await user.type(screen.getByTestId('ai-chat-input'), 'Sân Saigon còn giờ nào tối nay{enter}');
    const chip = await screen.findByText('18:00–19:00');
    await user.click(chip);

    const checkoutBtn = await screen.findByTestId('continue-checkout', undefined, {
      timeout: 3000,
    });
    expect(screen.getByText('Đã giữ chỗ 10 phút!')).toBeTruthy();
    await user.click(checkoutBtn);
    // Đã rời chat sang luồng checkout chuẩn — trang checkout tải được hold vừa tạo
    expect(
      await screen.findByText('Thanh toán toàn bộ (100%)', undefined, { timeout: 3000 }),
    ).toBeTruthy();
  });
});
