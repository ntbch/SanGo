import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../src/lib/api-client';
import { useAuthStore } from '../src/lib/auth-store';
import { useNotificationsStore, type NotificationListResponse } from '../src/features/notifications/store/notifications-store';
import { UserRole } from '../src/lib/constants';

const realtime = vi.hoisted(() => ({
  sockets: [] as Array<{
    auth: (cb: (payload: { token: string }) => void) => void;
    handlers: Record<string, () => void>;
    connected: boolean;
    connect: () => void;
    disconnect: () => void;
    removeAllListeners: () => void;
    on: (event: string, handler: () => void) => void;
  }>,
}));

vi.mock('socket.io-client', () => ({
  io: vi.fn((_url, options) => {
    const connection = {
      auth: options.auth,
      handlers: {} as Record<string, () => void>,
      connected: false,
      connect: vi.fn(() => { connection.connected = true; }),
      disconnect: vi.fn(() => { connection.connected = false; }),
      removeAllListeners: vi.fn(() => { connection.handlers = {}; }),
      on: vi.fn((event: string, handler: () => void) => { connection.handlers[event] = handler; }),
    };
    realtime.sockets.push(connection);
    return connection;
  }),
}));
vi.mock('../src/lib/api-client', () => ({ apiClient: vi.fn() }));

const request = vi.mocked(apiClient);
const notification = (id: string, readAt: string | null = null) => ({
  id, type: 'REMINDER', title: `Notification ${id}`, body: id, link: null,
  readAt, createdAt: '2026-09-01T00:00:00Z',
});
const inbox = (ids: string[], page = 1, total = ids.length, unreadCount = total) => ({
  items: ids.map((id) => notification(id)), page, pageSize: 10, total, unreadCount,
});
const login = (id: string, token = `${id}-token`) => useAuthStore.setState({
  user: { id, email: `${id}@example.invalid`, fullName: id, role: UserRole.CUSTOMER },
  accessToken: token, status: 'authenticated',
});

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, status: 'unauthenticated' });
  useNotificationsStore.getState().setSession(null);
  request.mockReset();
  realtime.sockets.length = 0;
});

describe('notification session isolation and reconciliation', () => {
  it('discards an old session response even after logging back into the same account', async () => {
    // ES2022 target lacks Promise.withResolvers.
    let finishOld!: (value: NotificationListResponse) => void;
    const old = new Promise<NotificationListResponse>((resolve) => { finishOld = resolve; });
    request.mockReturnValueOnce(old).mockResolvedValueOnce(inbox(['current']));
    login('a');
    useAuthStore.setState({ user: null, accessToken: null, status: 'unauthenticated' });
    expect(useNotificationsStore.getState().notifications).toEqual([]);
    login('a');
    await vi.waitFor(() => expect(useNotificationsStore.getState().loaded).toBe(true));
    finishOld(inbox(['private-old']));
    await old;
    expect(useNotificationsStore.getState().notifications.map((n) => n.id)).toEqual(['current']);
  });

  it('hydrates on login, reconciles reconnect and uses refreshed handshake token', async () => {
    request.mockResolvedValueOnce(inbox(['offline'])).mockResolvedValueOnce(inbox(['reconnected']));
    login('a');
    await vi.waitFor(() => expect(useNotificationsStore.getState().notifications[0]?.id).toBe('offline'));
    const staleConnection = realtime.sockets[0];
    const staleEvent = staleConnection.handlers['notification:new'];
    useAuthStore.setState({ accessToken: 'fresh-token' });
    const currentConnection = realtime.sockets[1];
    const handshake = vi.fn();
    currentConnection.auth(handshake);
    expect(handshake).toHaveBeenCalledWith({ token: 'fresh-token' });
    staleEvent();
    expect(request).toHaveBeenCalledTimes(1);
    currentConnection.handlers.connect();
    await vi.waitFor(() => expect(useNotificationsStore.getState().notifications[0]?.id).toBe('reconnected'));
    expect(staleConnection.connected).toBe(false);
  });

  it('keeps unread total from the entire inbox and loads older pages', async () => {
    const first = inbox(Array.from({ length: 10 }, (_, i) => `n${i}`), 1, 11, 1);
    first.items = first.items.map((n) => ({ ...n, readAt: '2026-09-01T00:00:00Z' }));
    request.mockResolvedValueOnce(first).mockResolvedValueOnce(inbox(['older'], 2, 11, 1));
    login('a');
    await vi.waitFor(() => expect(useNotificationsStore.getState().loaded).toBe(true));
    expect(useNotificationsStore.getState().unreadCount()).toBe(1);
    await useNotificationsStore.getState().fetchNotifications(true);
    expect(useNotificationsStore.getState().notifications.map((n) => n.id)).toContain('older');
    expect(useNotificationsStore.getState().page).toBe(2);
  });

  it('preserves the inbox on delete failure and removes it only after persisted deletion', async () => {
    request.mockResolvedValueOnce(inbox(['keep']));
    login('a');
    await vi.waitFor(() => expect(useNotificationsStore.getState().loaded).toBe(true));
    request.mockRejectedValueOnce(new Error('Offline'));
    await useNotificationsStore.getState().deleteNotification('keep');
    expect(useNotificationsStore.getState().notifications[0]?.id).toBe('keep');
    expect(useNotificationsStore.getState().error).not.toBeNull();
    request.mockResolvedValueOnce({ deleted: 1 }).mockResolvedValueOnce(inbox([]));
    await useNotificationsStore.getState().deleteNotification('keep');
    expect(useNotificationsStore.getState().notifications).toEqual([]);
    expect(useNotificationsStore.getState().unreadCount()).toBe(0);
  });
});
