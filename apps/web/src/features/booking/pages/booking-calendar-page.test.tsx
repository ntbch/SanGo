import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserRole } from '@courthub/shared';
import { handleMockRequest, resetMockSession } from '../../../lib/api/mock-server';
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

  it('dải gợi ý khung giờ AI hiển thị và chọn được slot trống', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/venues/san-pickleball-saigon/book' });
    const chips = await screen.findAllByTestId('ai-suggestion-chip');
    expect(chips.length).toBeGreaterThan(0);

    // Chip '18:00' luôn trống trong mock -> bấm là chọn slot tương ứng
    await user.click(chips[0]);
    await waitFor(() => {
      expect(screen.getByText(/Đã chọn 1 slot/)).toBeTruthy();
    });
  });
  it('G2-FIX: loại chip mà slot không còn AVAILABLE (19:00 bị BOOKED)', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/venues/san-pickleball-saigon/book' });

    // Mock: 4 gợi ý nhưng 19:00 ngày đầu tuần đã BOOKED -> còn đúng 3 chip
    const chipLabels = (await screen.findAllByTestId('ai-suggestion-chip')).map(
      (chip) => chip.textContent,
    );
    expect(chipLabels).toEqual(['18:00', '17:00', '06:00']);

    // Chip hợp lệ đầu tiên vẫn chọn được slot tương ứng
    const chips = await screen.findAllByTestId('ai-suggestion-chip');
    await user.click(chips[0]);
    await waitFor(() => {
      expect(screen.getByText(/Đã chọn 1 slot/)).toBeTruthy();
    });
  });

  it('G2-FIX: ẩn cả dải khi chỉ còn <=1 chip khả dụng', async () => {
    const today = new Date().toISOString().slice(0, 10);
    // Giữ trước 17:00–20:00 cho sân đang xem -> chỉ còn gợi ý 06:00 là trống
    await handleMockRequest('/bookings/holds', 'POST', {
      courtId: 'c-1',
      date: today,
      slots: [
        { startMinute: 1020, endMinute: 1080 },
        { startMinute: 1080, endMinute: 1140 },
        { startMinute: 1140, endMinute: 1200 },
      ],
    });

    renderApp({ route: '/venues/san-pickleball-saigon/book' });
    await waitFor(() => {
      expect(screen.getAllByText('Trống').length).toBeGreaterThan(0);
    });
    // Đợi nốt query suggestions kịp resolve (mock latency) rồi mới khẳng định vắng
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(screen.queryByText('💡 Gợi ý cho bạn')).toBeNull();
    expect(screen.queryByTestId('ai-suggestion-chip')).toBeNull();
  });

  it('S2-F1: chọn tư cách đội khi giữ chỗ và checkout hiển thị lại tên đội', async () => {
    // Đăng nhập đội trưởng của Dragon Pickleball Club để danh sách đội không rỗng
    useAuthStore.getState().setSession(
      {
        id: 'u-customer-01',
        email: 'customer@courthub.vn',
        role: UserRole.CUSTOMER,
        fullName: 'Nguyễn Văn Bình',
      },
      'tok',
    );
    const user = userEvent.setup();
    await loginAndSelectFirstSlot(user);

    const teamSelect = screen.getByTestId('team-as-select') as HTMLSelectElement;
    await user.selectOptions(teamSelect, 'team-01');

    await user.click(screen.getByRole('button', { name: /Giữ chỗ & Thanh toán/ }));
    await waitFor(() => {
      expect(screen.getByText(/Đặt dưới tư cách:/)).toBeTruthy();
      expect(screen.getAllByText(/Dragon Pickleball Club/).length).toBeGreaterThan(0);
    });
  });
});
