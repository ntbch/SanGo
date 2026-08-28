import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as bookingApi from '../src/features/booking/api/booking-api';
import { PaymentResultPage } from '../src/features/booking/pages/payment-result-page';
import { PaymentPendingPage } from '../src/features/booking/pages/payment-pending-page';

const activeHoldPayload = {
  holdId: '3a5fa37e-9f2e-4d90-b17a-8f0c9c9f2e72',
  courtId: 'a4cf4190-a8f1-4d4b-8094-2b7f2fed3020',
  date: '2026-08-29',
  startMinute: 1080,
  endMinute: 1140,
  subtotal: 300000,
  expiresAt: '2026-08-28T06:10:00.000Z',
  depositPercent: 30,
};

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

describe('booking recovery and payment outcome', () => {
  it('normalizes the create-hold response so checkout receives a usable id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => activeHoldPayload,
      }),
    );

    const hold = await bookingApi.createBookingHoldApi({
      courtId: activeHoldPayload.courtId,
      date: activeHoldPayload.date,
      slots: [activeHoldPayload.startMinute],
    });

    expect(hold.id).toBe(activeHoldPayload.holdId);
  });

  it('loads the server-owned active hold so a user can resume it after leaving checkout', async () => {
    const getActiveBookingHoldApi = (
      bookingApi as typeof bookingApi & { getActiveBookingHoldApi?: () => Promise<unknown> }
    ).getActiveBookingHoldApi;

    expect(getActiveBookingHoldApi).toBeTypeOf('function');
    if (!getActiveBookingHoldApi) return;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ...activeHoldPayload, id: activeHoldPayload.holdId }),
      }),
    );

    await expect(getActiveBookingHoldApi()).resolves.toMatchObject({ id: activeHoldPayload.holdId });
  });

  it('shows a failure outcome when the payment callback reports FAIL', () => {
    window.history.replaceState({}, '', '/thanh-toan/ket-qua?status=FAIL');

    render(
      <BrowserRouter>
        <PaymentResultPage />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Thanh Toán Không Thành Công/i)).toBeDefined();
    expect(screen.queryByText(/Thanh Toán Đặt Sân Thành Công/i)).toBeNull();
  });

  it('keeps a mock checkout pending behind a QR code until the user confirms it', () => {
    window.history.replaceState(
      {},
      '',
      '/checkout/payment?txnRef=hold-123.DEPOSIT.demo&amount=90000&mode=mock',
    );

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <BrowserRouter>
          <PaymentPendingPage />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Quét mã QR để thanh toán/i)).toBeDefined();
    expect(screen.getByRole('img', { name: /Mã QR thanh toán/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Tôi đã quét mã/i })).toBeDefined();
    expect(screen.queryByText(/Thanh Toán Đặt Sân Thành Công/i)).toBeNull();
  });

  it('confirms a mock payment only through the explicit confirmation endpoint', async () => {
    const confirmMockPaymentApi = (
      bookingApi as typeof bookingApi & {
        confirmMockPaymentApi?: (txnRef: string, amount: number) => Promise<unknown>;
      }
    ).confirmMockPaymentApi;

    expect(confirmMockPaymentApi).toBeTypeOf('function');
    if (!confirmMockPaymentApi) return;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(confirmMockPaymentApi('hold-123.DEPOSIT.demo', 90000)).resolves.toMatchObject({
      success: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/payments/mock/confirm'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
