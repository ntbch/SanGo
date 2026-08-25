/** Test trang danh sách sân chạy ở chế độ mock (kèm case biên EC-01..06 của BRD GEO). */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement } from 'react';
import { useLocation } from 'react-router-dom';

import { resetMockSession } from '../../../lib/api/mock-server';
import { renderApp } from '../../../test/test-utils';
import { VenuesPage } from './venues-page';

vi.stubEnv('VITE_USE_MOCK', 'true');

function stubGeolocation(behavior: { success?: { lat: number; lng: number }; errorCode?: number }) {
  const mockGeolocation = {
    getCurrentPosition: vi.fn().mockImplementation((success, error) => {
      if (behavior.success !== undefined) {
        success({ coords: { latitude: behavior.success.lat, longitude: behavior.success.lng } });
      } else {
        error({ code: behavior.errorCode ?? 1, message: 'mocked geolocation error' });
      }
    }),
  };
  vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeolocation });
  return mockGeolocation;
}

/** Đọc querystring hiện tại của MemoryRouter để kiểm tra đồng bộ URL 2 chiều. */
function RouteProbe(): ReactElement {
  const { search } = useLocation();
  return <div data-testid="route-search">{search}</div>;
}

describe('VenuesPage (mock data)', () => {
  beforeEach(() => {
    resetMockSession();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('hiển thị danh sách sân Hà Nội APPROVED và tách sân TP.HCM/chưa duyệt khỏi public', async () => {
    renderApp({ route: '/venues' });
    await waitFor(() => {
      expect(screen.getByText('Sân Thể Thao Quần Ngựa')).toBeTruthy();
      // MẠNH-fix: 3 sân TP.HCM (Saigon/Thủ Đức/Bình Thạnh) không còn trong list public Hà Nội.
      expect(screen.queryByText('Sân Pickleball Saigon')).toBeNull();
      expect(screen.queryByText('Cụm Cầu lông Thủ Đức')).toBeNull();
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
      expect(screen.getByText('Sân Thể Thao Quần Ngựa')).toBeTruthy();
    });
  });

  it('header đếm theo data.total thay vì số item trang hiện tại', async () => {
    renderApp({ route: '/venues?limit=12' });
    const heading = await screen.findByText(/Kết quả \(\d+ sân\)/);
    const total = Number(heading.textContent?.match(/\((\d+) sân\)/)?.[1] ?? '0');
    expect(total).toBeGreaterThan(0);
  });

  it('URL ?district= đồng bộ 2 chiều: vào trang theo URL và đổi quận cập nhật URL', async () => {
    renderApp({
      route: `/venues?district=${encodeURIComponent('Cầu Giấy')}`,
      ui: (
        <>
          <VenuesPage />
          <RouteProbe />
        </>
      ),
    });
    // URL -> state: select phản ánh đúng quận từ querystring, kết quả lọc theo Cầu Giấy.
    const select = (await screen.findByLabelText('Chọn quận huyện')) as HTMLSelectElement;
    expect(select.value).toBe('Cầu Giấy');
    await waitFor(() => {
      expect(screen.getByText('Sân Bóng Đá & Pickleball Trung Kính')).toBeTruthy();
      expect(screen.queryByText('Sân Thể Thao Quần Ngựa')).toBeNull();
    });

    // State -> URL: đổi quận qua sidebar, querystring cập nhật theo
    // (URLSearchParams mã hoá khoảng trắng dạng '+').
    fireEvent.change(select, { target: { value: 'Nam Từ Liêm' } });
    await waitFor(() => {
      const search = screen.getByTestId('route-search').textContent ?? '';
      const districtInUrl = new URLSearchParams(
        search.startsWith('?') ? search.slice(1) : search,
      ).get('district');
      expect(districtInUrl).toBe('Nam Từ Liêm');
    });
  });

  it('chip loại sân lọc kết quả', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/venues' });
    await screen.findByText('Sân Thể Thao Quần Ngựa');
    await user.click(screen.getByRole('button', { name: 'Tennis' }));
    await waitFor(() => {
      expect(screen.queryByText('Cụm Sân Bóng Đá Hoàng Hoa Thám')).toBeNull();
    });
    expect(screen.getByText('Sân Thể Thao Quần Ngựa')).toBeTruthy();
  });

  it('lọc theo quận/huyện từ dropdown sidebar hiển thị đúng sân thuộc quận đó (ví dụ Nam Từ Liêm)', async () => {
    renderApp({ route: '/venues' });
    const select = (await screen.findByLabelText('Chọn quận huyện')) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'Nam Từ Liêm' } });

    await waitFor(() => {
      expect(screen.getByText('Cụm Sân Tân Mỹ - Mỹ Đình')).toBeTruthy();
      expect(screen.getByText('Sân Bóng Đá & Cầu Lông Mễ Trì')).toBeTruthy();
      expect(screen.queryByText('Sân Thể Thao Quần Ngựa')).toBeNull();
    });
  });

  it('bấm nút "📍 Gần tôi" lấy toạ độ GPS, hiển thị khoảng cách và dải bán kính', async () => {
    stubGeolocation({ success: { lat: 21.0362, lng: 105.7906 } }); // Cầu Giấy
    const user = userEvent.setup();
    renderApp({ route: '/venues' });

    const gpsBtn = await screen.findByRole('button', { name: /định vị gần tôi/i });
    expect(gpsBtn.hasAttribute('disabled')).toBe(false);
    await user.click(gpsBtn);

    await waitFor(() => {
      expect(screen.getByText(/Bán kính gần bạn/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: '3 km' })).toBeTruthy();
      expect(screen.getAllByText(/📍 Cách bạn/).length).toBeGreaterThan(0);
    });
  });

  it('chip bán kính lọc kết quả theo khoảng cách (3 km loại sân > 3 km)', async () => {
    stubGeolocation({ success: { lat: 21.0362, lng: 105.7906 } }); // Cầu Giấy
    const user = userEvent.setup();
    renderApp({ route: '/venues' });
    await user.click(await screen.findByRole('button', { name: /định vị gần tôi/i }));
    await screen.findAllByText(/📍 Cách bạn/);

    await user.click(screen.getByRole('button', { name: '3 km' }));
    await waitFor(() => {
      // Hoàng Hoa Thám cách Cầu Giấy ~3.5 km -> bị loại khỏi bán kính 3 km.
      expect(screen.queryByText('Cụm Sân Bóng Đá Hoàng Hoa Thám')).toBeNull();
      // Quần Ngựa ~2.6 km -> vẫn hiển thị.
      expect(screen.getByText('Sân Thể Thao Quần Ngựa')).toBeTruthy();
    });
    // a11y: chip đang chọn có aria-pressed.
    expect(screen.getByRole('button', { name: '3 km' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('Tắt định vị xoá dải bán kính và trả sort về mặc định', async () => {
    stubGeolocation({ success: { lat: 21.0362, lng: 105.7906 } });
    const user = userEvent.setup();
    renderApp({ route: '/venues' });
    await user.click(await screen.findByRole('button', { name: /định vị gần tôi/i }));
    await screen.findByText(/Bán kính gần bạn/i);

    await user.click(screen.getByRole('button', { name: /tắt định vị/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Bán kính gần bạn/i)).toBeNull();
      const sortSelect = screen.getByLabelText('Sắp xếp danh sách') as HTMLSelectElement;
      expect(sortSelect.value).toBe('newest');
    });
  });

  it('EC-02: khoá nút GPS kèm tooltip khi trình duyệt không hỗ trợ định vị', async () => {
    renderApp({ route: '/venues' });
    const gpsBtn = await screen.findByRole('button', { name: /định vị gần tôi/i });
    expect(gpsBtn.hasAttribute('disabled')).toBe(true);
    expect(gpsBtn.getAttribute('title')).toMatch(/không hỗ trợ định vị/i);
  });

  it('EC-01: thông báo thân thiện khi người dùng từ chối quyền vị trí', async () => {
    stubGeolocation({ errorCode: 1 });
    const user = userEvent.setup();
    renderApp({ route: '/venues' });
    await user.click(await screen.findByRole('button', { name: /định vị gần tôi/i }));
    await waitFor(() => {
      expect(screen.getByText('Từ chối quyền vị trí')).toBeTruthy();
    });
  });

  it('EC-03: GPS timeout hiển thị thông báo lỗi định vị', async () => {
    stubGeolocation({ errorCode: 3 });
    const user = userEvent.setup();
    renderApp({ route: '/venues' });
    await user.click(await screen.findByRole('button', { name: /định vị gần tôi/i }));
    await waitFor(() => {
      expect(screen.getByText('Lỗi định vị')).toBeTruthy();
    });
  });

  it('EC-04: người dùng > 50 km khỏi Hà Nội thấy thông điệp khoảng cách riêng', async () => {
    stubGeolocation({ success: { lat: 20.9101, lng: 106.8395 } }); // Hạ Long
    const user = userEvent.setup();
    renderApp({ route: '/venues' });
    await user.click(await screen.findByRole('button', { name: /định vị gần tôi/i }));
    await waitFor(() => {
      expect(screen.getByText(/Bạn đang ở cách Hà Nội ~\d+(\.\d+)? km/)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Xem tất cả sân Hà Nội' })).toBeTruthy();
    });
  });

  it('EC-05: ngoài bán kính hiện empty state + nút mở rộng ẩn khi đã 20 km', async () => {
    stubGeolocation({ success: { lat: 21.06, lng: 105.5 } }); // Sơn Tây ~36 km
    const user = userEvent.setup();
    renderApp({ route: '/venues' });
    await user.click(await screen.findByRole('button', { name: /định vị gần tôi/i }));
    await waitFor(() => {
      expect(
        screen.getByText('Không tìm thấy cụm sân nào trong bán kính 5 km quanh bạn'),
      ).toBeTruthy();
      expect(screen.getByRole('button', { name: /Mở rộng bán kính lên 10 km/i })).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: '20 km' }));
    await waitFor(() => {
      expect(
        screen.getByText('Không tìm thấy cụm sân nào trong bán kính 20 km quanh bạn'),
      ).toBeTruthy();
      expect(screen.queryByRole('button', { name: /Mở rộng bán kính/i })).toBeNull();
      expect(screen.getByRole('button', { name: 'Xem tất cả sân Hà Nội' })).toBeTruthy();
    });
  });

  it('sort distance khi chưa bật GPS hiển thị hint thay vì im lặng', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/venues' });
    await screen.findByText('Sân Thể Thao Quần Ngựa');
    await user.selectOptions(screen.getByLabelText('Sắp xếp danh sách'), 'distance');
    expect(screen.getByText(/chưa bật định vị/i)).toBeTruthy();
  });

  it('mỗi card sân có nút Chỉ đường trỏ đúng URL Google Maps', async () => {
    renderApp({ route: '/venues' });
    await waitFor(() => {
      const dirLinks = screen.getAllByRole('link', { name: /chỉ đường đến/i });
      expect(dirLinks.length).toBeGreaterThan(0);
      const firstHref = dirLinks[0].getAttribute('href');
      expect(firstHref).toContain('https://www.google.com/maps/dir/?api=1&destination=');
      expect(firstHref).toContain('&travelmode=driving');
      expect(dirLinks[0].getAttribute('target')).toBe('_blank');
      expect(dirLinks[0].getAttribute('rel')).toBe('noopener noreferrer');
    });
  });
});
