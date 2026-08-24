import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserRole } from '@courthub/shared';
import { resetMockSession } from '../../../lib/api/mock-server';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

async function loginAndSelectFirstSlot(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  renderApp({ route: '/venues/san-pickleball-saigon/book' });
  await waitFor(() => {
    expect(screen.getByText('Chọn giờ đặt sân')).toBeTruthy();
  });
  const availableSlots = await screen.findAllByText('Trống');
  await user.click(availableSlots[0]);
  await waitFor(() => {
    expect(screen.getByText(/Đã chọn 1 slot/)).toBeTruthy();
  });
}

describe('BookingCalendarPage', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession(
      {
        id: 'u-cust',
        email: 'cust@courthub.vn',
        role: UserRole.CUSTOMER,
        fullName: 'Khách Hàng',
      },
      'tok',
    );
    resetMockSession();
  });

  it('render lịch tuần, danh sách sân con và thông tin giờ mở cửa', async () => {
    renderApp({ route: '/venues/san-pickleball-saigon/book' });
    await waitFor(() => {
      expect(screen.getByText('Chọn giờ đặt sân')).toBeTruthy();
      expect(screen.getByText(/Sân 1/)).toBeTruthy();
      expect(screen.getByText(/06:00 – 23:00/)).toBeTruthy();
    });
  });

  it('cho phép chọn slot trống và hiển thị thanh tính tiền', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/venues/san-pickleball-saigon/book' });
    await waitFor(() => {
      expect(screen.getByText('Chọn giờ đặt sân')).toBeTruthy();
    });

    const availableSlots = await screen.findAllByText('Trống');
    expect(availableSlots.length).toBeGreaterThan(0);

    await user.click(availableSlots[0]);
    await waitFor(() => {
      expect(screen.getByText(/Đã chọn 1 slot/)).toBeTruthy();
      expect(screen.getByText(/Giữ chỗ & Thanh toán/)).toBeTruthy();
    });
  });
  it('toggle checkbox ghép trận và reset khi đổi sân con', async () => {
    const user = userEvent.setup();
    await loginAndSelectFirstSlot(user);
    const checkbox = screen.getByTestId('open-match-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    await user.click(checkbox);
    expect((screen.getByTestId('open-match-checkbox') as HTMLInputElement).checked).toBe(true);
    const select = screen.getByTestId('slots-needed-select') as HTMLSelectElement;
    expect(select.value).toBe('4'); // mặc định 4 người

    // Đổi sân con -> xoá chọn slot nên khu ghép trận biến mất (state đã reset)
    await user.click(screen.getByRole('button', { name: /Sân 2/ }));
    await waitFor(() => {
      expect(screen.queryByTestId('open-match-checkbox')).toBeNull();
    });
    // Chọn lại slot trên sân mới: checkbox xuất hiện lại ở trạng thái OFF
    const slotsAfterSwitch = await screen.findAllByText('Trống');
    await user.click(slotsAfterSwitch[0]);
    const freshCheckbox = (await screen.findByTestId('open-match-checkbox')) as HTMLInputElement;
    expect(freshCheckbox.checked).toBe(false);
  });
});
