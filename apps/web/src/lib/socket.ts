import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from './auth-store';

/** WS gợi ý refetch; REST là nguồn sự thật. */
export const REALTIME_EVENTS = {
  NOTIFICATION_NEW: 'notification:new',
  WALLET_UPDATED: 'wallet:updated',
} as const;

export const REALTIME_PATH = '/api/socket.io';

let socket: Socket | null = null;
let authBound = false;
let reconcileInbox: (() => void) | undefined;

function resolveSocketUrl(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
  if (/^https?:\/\//i.test(raw)) return new URL(raw).origin;
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }
  return 'http://localhost:4000';
}

export function getRealtimeSocket(): Socket | null {
  return socket;
}

/** Mỗi handshake dùng accessToken hiện tại, kể cả sau REST refresh. */
export function connectRealtime(): Socket {
  if (socket) {
    if (!socket.connected) socket.connect();
    return socket;
  }
  const connection = io(resolveSocketUrl(), {
    path: REALTIME_PATH,
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken ?? '' }),
    autoConnect: false,
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15000,
    withCredentials: true,
  });
  socket = connection;
  connection.on('connect', () => {
    if (socket === connection) reconcileInbox?.();
  });
  connection.on(REALTIME_EVENTS.NOTIFICATION_NEW, () => {
    if (socket === connection) reconcileInbox?.();
  });
  connection.on(REALTIME_EVENTS.WALLET_UPDATED, () => {
    if (socket === connection) window.dispatchEvent(new CustomEvent('sango:wallet:updated'));
  });
  connection.connect();
  return connection;
}

export function disconnectRealtime(): void {
  const previous = socket;
  socket = null;
  previous?.removeAllListeners();
  previous?.disconnect();
}

/** Reset đồng bộ trước khi nối phiên mới; không giữ inbox của tài khoản cũ. */
export function bindRealtimeToAuth(callbacks: {
  onSessionChange: (userId: string | null) => void;
  onReconnect: () => void;
}): void {
  if (authBound || typeof window === 'undefined') return;
  authBound = true;
  reconcileInbox = callbacks.onReconnect;
  let lastUserId: string | null | undefined;
  let lastToken: string | null = null;

  const sync = () => {
    const state = useAuthStore.getState();
    const userId = state.status === 'authenticated' && state.accessToken ? state.user?.id ?? null : null;
    const token = userId ? state.accessToken : null;
    if (userId === lastUserId && token === lastToken) return;
    disconnectRealtime();
    const changedUser = userId !== lastUserId;
    lastUserId = userId;
    lastToken = token;
    if (changedUser) callbacks.onSessionChange(userId);
    if (token) connectRealtime();
  };
  useAuthStore.subscribe(sync);
  sync();
}
