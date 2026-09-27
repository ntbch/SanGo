import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AiChatWidget } from '../src/components/ai/ai-chat-widget';
import { useAuthStore } from '../src/lib/auth-store';

const response = {
  intent: 'HOLD_REQUEST',
  reply: 'Chọn giờ bên dưới.',
  toolsUsed: ['getSuggestedSlots'],
  data: {
    courtId: 'court-1', dateHint: '2026-09-20',
    suggestions: [{ startMinute: 1080, label: '18:00–19:00', score: 5, reason: 'Giờ vàng' }],
  },
};

function openChat() {
  render(<MemoryRouter><Routes>
    <Route path="/" element={<AiChatWidget />} />
    <Route path="/checkout/hold/:holdId" element={<p>Trang thanh toán giữ chỗ</p>} />
  </Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /Mở Trợ Lý AI Đặt Sân/i }));
  fireEvent.change(screen.getByPlaceholderText(/Hỏi AI tìm sân/), { target: { value: 'Giữ sân tối mai' } });
  fireEvent.submit(screen.getByPlaceholderText(/Hỏi AI tìm sân/).closest('form')!);
}

describe('AI structured booking flow', () => {
  // setState của zustand thông báo cho subscriber đang render (kể cả AuthModal
  // luôn được mount) -> phải bọc act để không phát warning và không rò render.
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = () => {};
    act(() => { useAuthStore.setState({ user: null, accessToken: null }); });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    act(() => { useAuthStore.setState({ user: null, accessToken: null }); });
  });

  it('requires guest login without creating a hold automatically', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    openChat();
    fireEvent.click(await screen.findByRole('button', { name: /Giữ chỗ 18:00/ }));
    expect(await screen.findByText('Đăng nhập để giữ chỗ')).toBeDefined();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/ai/hold'))).toBe(false);
  });

  it('creates the explicitly selected slot and opens checkout only after a real hold succeeds', async () => {
    act(() => { useAuthStore.setState({ user: { id: 'customer-1', role: 'CUSTOMER' } as never }); });
    const fetchMock = vi.fn().mockImplementation(async (url: string, options: RequestInit) => {
      if (String(url).endsWith('/ai/chat')) return new Response(JSON.stringify(response));
      if (String(url).endsWith('/ai/hold')) {
        expect(JSON.parse(options.body as string)).toEqual({ courtId: 'court-1', date: '2026-09-20', slots: [1080] });
        return new Response(JSON.stringify({ id: 'hold-1' }), { status: 201 });
      }
      throw new Error('Unexpected request');
    });
    vi.stubGlobal('fetch', fetchMock);
    openChat();
    const slot = await screen.findByRole('button', { name: /Giữ chỗ 18:00/ });
    fireEvent.click(slot);
    expect(await screen.findByText('Trang thanh toán giữ chỗ')).toBeDefined();
    // Phải khẳng định SỐ request hold sau khi bấm, không phải "chưa có trước khi bấm"
    // (cách cũ luôn đúng kể cả khi code hoàn toàn không gọi /ai/hold).
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/ai/hold'))).toHaveLength(1);
  });

  it('shows quota failure and lets the user retry instead of fabricating venue availability', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Too Many Requests' }), { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(response))));
    openChat();
    expect((await screen.findByRole('alert')).textContent).toMatch(/giới hạn/i);
    expect(screen.queryByText(/Sân Ngọc Khánh/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('button', { name: /Giữ chỗ 18:00/ })).toBeDefined();
  });

  it('keeps a rejected hold on the chat surface with its error, not checkout', async () => {
    act(() => { useAuthStore.setState({ user: { id: 'customer-1', role: 'CUSTOMER' } as never }); });
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(response)))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Khung giờ vừa được giữ' }), { status: 409 })));
    openChat();
    fireEvent.click(await screen.findByRole('button', { name: /Giữ chỗ 18:00/ }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Khung giờ vừa được giữ'));
    expect(screen.queryByText('Trang thanh toán giữ chỗ')).toBeNull();
  });

  it('surfaces a hold failure even when the session is cleared mid-flight', async () => {
    // apiClient xoá session ĐỒNG BỘ trước khi ném 401, nên guard "user còn đúng không"
    // trong catch sẽ nuốt mất lỗi: trước fix này người dùng thấy spinner tắt
    // mà không có gì cả, dù hold server-side có thể đã tạo và khoá slot.
    act(() => { useAuthStore.setState({ user: { id: 'customer-1', role: 'CUSTOMER' } as never }); });
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
      if (String(url).endsWith('/ai/chat')) return new Response(JSON.stringify(response));
      if (String(url).endsWith('/ai/hold')) {
        act(() => { useAuthStore.setState({ user: null, accessToken: null }); });
        return new Response(JSON.stringify({ message: 'Phiên đăng nhập đã hết hạn' }), { status: 401 });
      }
      throw new Error('Unexpected request');
    }));
    openChat();
    fireEvent.click(await screen.findByRole('button', { name: /Giữ chỗ 18:00/ }));
    // 401 -> mở lại modal đăng nhập, KHÔNG im lặng báo thành công.
    expect(await screen.findByText('Đăng nhập để giữ chỗ')).toBeDefined();
    expect(screen.queryByText('Trang thanh toán giữ chỗ')).toBeNull();
  });

  it('displays a full long reply while sending bounded history without repeating the current user turn', async () => {
    const longReply = 'a'.repeat(9000);
    const requests: Array<{ message: string; history: Array<{ role: string; content: string }> }> = [];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, options: RequestInit) => {
      requests.push(JSON.parse(options.body as string));
      return new Response(JSON.stringify({ ...response, reply: requests.length === 1 ? longReply : 'Đã nhận', data: {} }));
    }));
    openChat();
    expect(await screen.findByText(longReply)).toBeDefined();
    fireEvent.change(screen.getByPlaceholderText(/Hỏi AI tìm sân/), { target: { value: 'Câu tiếp theo' } });
    fireEvent.submit(screen.getByPlaceholderText(/Hỏi AI tìm sân/).closest('form')!);
    expect(await screen.findByText('Đã nhận')).toBeDefined();
    expect(requests[1].history.find((item) => item.content.startsWith('aaa'))?.content).toHaveLength(8000);
    expect(requests[1].history.some((item) => item.content === 'Câu tiếp theo')).toBe(false);
  });
});
