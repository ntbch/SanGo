import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MatchesPage, MatchDetailPage } from '../src/features/matches/pages';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';
import { apiClient } from '../src/lib/api-client';

vi.mock('../src/lib/api-client', () => ({ apiClient: vi.fn() }));

const host = { id: 'host-1', fullName: 'Nguyễn Văn Nam', avatarUrl: null };
const venue = { name: 'Sân Ngọc Khánh', address: '12 Cầu Giấy', city: 'Hà Nội', district: 'Cầu Giấy' };
const match = {
  bookingId: 'match-1', date: '2026-09-20', startMinute: 0, endMinute: 90,
  slotsNeeded: 1, joinedCount: 0, costPerPerson: 50000, matchLevel: 'FRIENDLY',
  requiresApproval: true, host,
  court: { name: 'Sân 5', sportType: 'FOOTBALL5', venue },
  participants: [],
};
const request = {
  id: 'request-1', bookingId: 'match-1', userId: 'player-2', status: 'PENDING',
  position: 'Hậu vệ', message: 'Mình đến sớm', createdAt: '2026-09-19T10:00:00.000Z',
  user: { id: 'player-2', fullName: 'Trần Đức', avatarUrl: null },
};

function renderPage(path = '/matches/match-1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/matches/:id" element={<MatchDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function login(id: string) {
  useAuthStore.setState({
    user: { id, email: 'player@sango.vn', fullName: 'Người chơi', role: UserRole.CUSTOMER },
    accessToken: 'test-token', status: 'authenticated',
  });
}

/** Promise treo để kiểm soát thứ tự trả lời của từng lần gọi apiClient. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => { resolve = res; });
  return { promise, resolve };
}

function openMatchItem(bookingId: string) {
  return { ...match, bookingId, court: undefined, courtName: 'Sân 5', sportType: 'FOOTBALL5', venue };
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  useAuthStore.setState({ user: null, accessToken: null, status: 'unauthenticated' });
  vi.mocked(apiClient).mockImplementation(async (path) => {
    if (path.startsWith('/matches/open')) return { items: [{ ...match, court: undefined, courtName: 'Sân 5', sportType: 'FOOTBALL5', venue }] };
    if (path === '/matches/match-1') return match;
    if (path === '/matches/match-1/comments') return [];
    if (path === '/matches/match-1/requests') return [request];
    throw new Error(`Unexpected request ${path}`);
  });
});

describe('Matches API-to-screen contract', () => {
  it('loads public detail for a guest without requesting host-only data', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: /Kèo Sân 5/ })).toBeDefined();
    expect(screen.getByText('Còn 1 slot')).toBeDefined();
    expect(screen.getAllByText(/00:00 - 01:30/)).toHaveLength(2);
    expect(screen.getByText('Kèo cần chủ kèo duyệt thành viên')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Tham gia ngay' })).toBeNull();
    expect(apiClient).not.toHaveBeenCalledWith('/matches/match-1/requests');
  });

  it('renders public participant names and positions from the detail response', async () => {
    vi.mocked(apiClient).mockImplementation(async (path) => path === '/matches/match-1'
      ? { ...match, slotsNeeded: 2, joinedCount: 1, participants: [{
          id: 'player-2', fullName: 'Trần Đức', avatarUrl: null,
          preferredPositions: ['Hậu vệ'], joinedAt: '2026-09-19T10:00:00.000Z',
        }] } : []);
    renderPage();
    expect(await screen.findByText('Trần Đức')).toBeDefined();
    expect(screen.getByText('Vị trí: Hậu vệ')).toBeDefined();
  });

  it('does not request host data for an authenticated non-host', async () => {
    login('player-1');
    renderPage();
    await screen.findByRole('heading', { name: /Kèo Sân 5/ });
    expect(apiClient).not.toHaveBeenCalledWith('/matches/match-1/requests');
    expect(screen.queryByRole('heading', { name: /Yêu Cầu Chờ Duyệt/ })).toBeNull();
  });

  it('maps the host and request fields, and clears host controls on logout', async () => {
    login(host.id);
    renderPage();
    expect(await screen.findByRole('heading', { name: /Yêu Cầu Chờ Duyệt \(1\)/ })).toBeDefined();
    expect(screen.getByText('Vị trí: Hậu vệ')).toBeDefined();
    expect(screen.getByText(/Mình đến sớm/)).toBeDefined();
    expect(screen.queryByRole('button', { name: /Gửi Yêu Cầu Xin Slot/ })).toBeNull();
    act(() => useAuthStore.setState({ user: null, accessToken: null, status: 'unauthenticated' }));
    expect(screen.queryByRole('heading', { name: /Yêu Cầu Chờ Duyệt/ })).toBeNull();
  });

  it('keeps public detail usable when host requests or comments fail', async () => {
    login(host.id);
    vi.mocked(apiClient).mockImplementation(async (path) => {
      if (path === '/matches/match-1') return match;
      throw new Error('Unavailable');
    });
    renderPage();
    expect(await screen.findByText('Không thể tải yêu cầu tham gia.')).toBeDefined();
    expect(await screen.findByText('Không thể tải bình luận.')).toBeDefined();
    expect(screen.getByRole('heading', { name: /Kèo Sân 5/ })).toBeDefined();
    expect(screen.queryByText('Không có yêu cầu chờ duyệt nào.')).toBeNull();
  });

  it('replaces a failed detail load with a retryable error, not an endless skeleton', async () => {
    vi.mocked(apiClient).mockRejectedValueOnce(new Error('Unavailable'));
    renderPage();
    await screen.findByText('Không thể mở kèo ghép trận');
    expect(screen.queryByLabelText('Đang tải thông tin kèo')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('heading', { name: /Kèo Sân 5/ })).toBeDefined();
  });

  it('sends the football group and preserves list venue, capacity and approval', async () => {
    renderPage('/matches');
    expect(await screen.findByText('Sân Ngọc Khánh')).toBeDefined();
    expect(screen.getByText('Còn 1 slot')).toBeDefined();
    expect(screen.getByText('(0/1)')).toBeDefined();
    expect(screen.getByText('Cần duyệt')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Bóng Đá/i }));
    await waitFor(() => expect(apiClient).toHaveBeenCalledWith('/matches/open?sportGroup=FOOTBALL'));
  });

  it('reports list failures separately from an empty search', async () => {
    vi.mocked(apiClient).mockRejectedValue(new Error('Unavailable'));
    renderPage('/matches');
    expect(await screen.findByText('Không thể tải danh sách kèo')).toBeDefined();
    expect(screen.queryByText('Không tìm thấy kèo thi đấu phù hợp')).toBeNull();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeDefined();
  });

  it('sends join position and message using server DTO names', async () => {
    login('player-1');
    renderPage();
    await screen.findByRole('button', { name: /Gửi Yêu Cầu Xin Slot/ });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Hậu vệ' } });
    fireEvent.change(screen.getByPlaceholderText(/Mình đá chân trái/), { target: { value: 'Mình đến sớm' } });
    fireEvent.click(screen.getByRole('button', { name: /Gửi Yêu Cầu Xin Slot/ }));
    await waitFor(() => expect(apiClient).toHaveBeenCalledWith('/matches/match-1/requests', {
      method: 'POST', body: JSON.stringify({ position: 'Hậu vệ', message: 'Mình đến sớm' }),
    }));
  });

  it('keeps capacity fixed at full and disables direct joining', async () => {
    vi.mocked(apiClient).mockImplementation(async (path) => path === '/matches/match-1'
      ? { ...match, slotsNeeded: 2, joinedCount: 2, requiresApproval: false } : []);
    renderPage();
    const buttons = await screen.findAllByRole('button', { name: 'Kèo đã kín slot' });
    // findAllByRole chỉ bảo đảm có >=1 phần tử: cả 2 nút (tham gia trực tiếp + khung gửi
    // yêu cầu) phải cùng chuyển sang nhãn kín slot, không được mất 1 nút trong im lặng.
    expect(buttons).toHaveLength(2);
    expect(buttons.every((button) => button.hasAttribute('disabled'))).toBe(true);
    expect(screen.getByText('2/2 (100%)')).toBeDefined();
  });

  it('renders the empty state with a working reset action when the list returns no items', async () => {
    vi.mocked(apiClient).mockImplementation(async (path) =>
      path.startsWith('/matches/open') ? { items: [] } : []);
    renderPage('/matches');
    expect(await screen.findByRole('heading', { name: 'Không tìm thấy kèo thi đấu phù hợp' })).toBeDefined();
    expect(screen.queryByTestId('matches-skeleton-list')).toBeNull();
    expect(screen.queryByTestId('matches-list')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Bóng Đá/i }));
    await waitFor(() => expect(apiClient).toHaveBeenCalledWith('/matches/open?sportGroup=FOOTBALL'));
    const callsBeforeReset = vi.mocked(apiClient).mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại bộ lọc' }));
    await waitFor(() => expect(vi.mocked(apiClient).mock.calls.length).toBeGreaterThan(callsBeforeReset));
    expect(apiClient).toHaveBeenLastCalledWith('/matches/open');
  });

  it('shows the calm skeleton list until the request settles, then swaps in the cards', async () => {
    const pending = deferred<unknown>();
    vi.mocked(apiClient).mockImplementation(async (path) =>
      path.startsWith('/matches/open') ? pending.promise : []);
    renderPage('/matches');
    const skeleton = screen.getByTestId('matches-skeleton-list');
    expect(skeleton.getAttribute('aria-busy')).toBe('true');
    expect(skeleton.getAttribute('aria-label')).toBe('Đang tải danh sách kèo');
    expect(screen.queryByTestId('matches-list')).toBeNull();
    expect(screen.queryByText('Không tìm thấy kèo thi đấu phù hợp')).toBeNull();

    await act(async () => { pending.resolve({ items: [openMatchItem('match-1')] }); });
    expect(await screen.findByTestId('match-card-match-1')).toBeDefined();
    expect(screen.queryByTestId('matches-skeleton-list')).toBeNull();
  });

  it('keeps the newest filter response when the stale one resolves last', async () => {
    const allSports = deferred<unknown>();
    const football = deferred<unknown>();
    vi.mocked(apiClient).mockImplementation(async (path) => {
      if (path === '/matches/open') return allSports.promise;
      if (path === '/matches/open?sportGroup=FOOTBALL') return football.promise;
      throw new Error(`Unexpected request ${path}`);
    });

    renderPage('/matches');
    expect(screen.getByTestId('matches-skeleton-list')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Bóng Đá/i }));
    await waitFor(() => expect(apiClient).toHaveBeenCalledWith('/matches/open?sportGroup=FOOTBALL'));

    await act(async () => { football.resolve({ items: [openMatchItem('match-football')] }); });
    expect(await screen.findByTestId('match-card-match-football')).toBeDefined();

    // Request cũ ("tất cả môn") tới sau: guard version phải chặn, không được ghi đè danh sách mới.
    await act(async () => { allSports.resolve({ items: [openMatchItem('match-all-sports')] }); });
    expect(screen.getByTestId('match-card-match-football')).toBeDefined();
    expect(screen.queryByTestId('match-card-match-all-sports')).toBeNull();
  });

  it('drops an in-flight list response that resolves after unmount', async () => {
    const pending = deferred<unknown>();
    vi.mocked(apiClient).mockImplementation(async (path) =>
      path.startsWith('/matches/open') ? pending.promise : []);

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // React 18 im lặng khi setState sau unmount nên bọc setter để thấy state nào thực sự được áp dụng.
    const applied: unknown[] = [];
    const realUseState = React.useState;
    const useStateSpy = vi.spyOn(React, 'useState').mockImplementation(((initial: unknown) => {
      const [state, setState] = realUseState(initial);
      return [state, (value: unknown) => { applied.push(value); return setState(value); }];
    }) as unknown as typeof React.useState);

    try {
      const { unmount } = renderPage('/matches');
      expect(screen.getByTestId('matches-skeleton-list')).toBeDefined();
      expect(applied.length).toBeGreaterThan(0);

      unmount();
      applied.length = 0;
      consoleError.mockClear();
      consoleWarn.mockClear();

      await act(async () => { pending.resolve({ items: [openMatchItem('match-1')] }); });

      expect(applied).toHaveLength(0);
      expect(consoleError).not.toHaveBeenCalled();
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(screen.queryByTestId('match-card-match-1')).toBeNull();
    } finally {
      useStateSpy.mockRestore();
      consoleError.mockRestore();
      consoleWarn.mockRestore();
    }
  });

  it('renders the full badge and the fee/venue on a full card in the list', async () => {
    vi.mocked(apiClient).mockImplementation(async (path) => path.startsWith('/matches/open')
      ? { items: [{ ...match, slotsNeeded: 3, joinedCount: 3, costPerPerson: 120000, court: undefined, courtName: 'Sân 7', sportType: 'FOOTBALL7', venue }] }
      : []);
    renderPage('/matches');
    const card = await screen.findByTestId('match-card-match-1');
    expect(within(card).getByText('Đã đủ')).toBeDefined();
    expect(within(card).queryByText(/Còn \d+ slot/)).toBeNull();
    expect(within(card).getByText('(3/3)')).toBeDefined();
    expect(within(card).getByText(/120\.000/)).toBeDefined();
    expect(within(card).getByText('Sân Ngọc Khánh')).toBeDefined();
  });

  it('renders venue, skill level label and per-person cost in the command center', async () => {
    renderPage();
    const main = await screen.findByTestId('match-main-column');
    const sidebar = screen.getByTestId('match-action-sidebar');
    expect(within(main).getByText('Sân Ngọc Khánh')).toBeDefined();
    expect(within(main).getByText('12 Cầu Giấy')).toBeDefined();
    expect(within(main).getByText('Trình độ: Giao lưu')).toBeDefined();
    expect(within(sidebar).getByText(/^Chi phí mỗi người$/)).toBeDefined();
    expect(within(sidebar).getByText(/50\.000\s*₫/)).toBeDefined();
  });
});
