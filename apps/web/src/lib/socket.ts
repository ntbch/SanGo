import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from './auth-store';
import type { RealtimeBeNotification } from '../features/notifications/store/notifications-store';

/** Event BE realtime gateway phát — WS chỉ gợi ý refetch, REST vẫn là nguồn sự thật. */
export const REALTIME_EVENTS = {
  NOTIFICATION_NEW: 'notification:new',
  WALLET_UPDATED: 'wallet:updated',
} as const;

/** Path server-side (REALTIME_PATH của api realtime gateway) — dưới tiền tố /api. */
export const REALTIME_PATH = '/api/socket.io';

let socket: Socket | null = null;
let authBound = false;

function resolveSocketUrl(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
  // VITE_API_URL tuyệt đối (vd http://localhost:4000/api/v1) -> WS thẳng origin API.
  if (/^https?:\/\//i.test(raw)) return new URL(raw).origin;
  // Relative (mặc định /api/v1) -> cùng origin, đi qua Vite proxy/nginx như REST.
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }
  return 'http://localhost:4000';
}

export function getRealtimeSocket(): Socket | null {
  return socket;
}

/** Kết nối realtime (auth JWT lúc handshake; tự reconnect; token mới nhất mỗi lần reconnect). */
export function connectRealtime(): Socket {
  if (socket) return socket;
  socket = io(resolveSocketUrl(), {
    path: REALTIME_PATH,
    // auth là function: mỗi lần (re)connect lấy token HIỆN TẠI — access token 15 phút
    // hết hạn vẫn reconnect được sau khi apiClient refresh.
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken ?? '' }),
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15000,
    withCredentials: true,
  });

  socket.on(REALTIME_EVENTS.NOTIFICATION_NEW, (payload: RealtimeBeNotification) => {
    void onNotificationNew(payload);
  });
  socket.on(REALTIME_EVENTS.WALLET_UPDATED, () => {
    // Gợi ý refetch số dư ví: wallet feature nghe event window này (giữ phạm vi file Phase 4).
    window.dispatchEvent(new CustomEvent('sango:wallet:updated'));
  });
  return socket;
}

export function disconnectRealtime(): void {
  socket?.disconnect();
  socket = null;
}

async function onNotificationNew(payload: RealtimeBeNotification): Promise<void> {
  try {
    // import động để tránh cycle nạp module socket <-> notifications-store.
    const { useNotificationsStore } = await import(
      '../features/notifications/store/notifications-store'
    );
    useNotificationsStore.getState().handleRealtimeNotification(payload);
  } catch (e) {
    console.warn('[realtime] Xử lý notification:new thất bại (bỏ qua)', e);
  }
}

/**
 * Nối vòng đời socket với auth state — gọi đúng MỘT LẦN khi notifications-store nạp
 * (navbar luôn mount NotificationDropdown nên store thuộc bundle khởi động app).
 * authenticated -> connect; unauthenticated (logout/hết phiên) -> disconnect.
 */
export function bindRealtimeToAuth(): void {
  if (authBound || typeof window === 'undefined') return;
  authBound = true;
  let lastToken: string | null = useAuthStore.getState().accessToken ?? null;
  if (lastToken) connectRealtime();
  useAuthStore.subscribe((state) => {
    const token = state.accessToken ?? null;
    if (token === lastToken) return;
    lastToken = token;
    if (token) connectRealtime();
    else disconnectRealtime();
  });
}
