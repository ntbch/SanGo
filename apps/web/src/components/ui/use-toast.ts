/** Bộ điều phối toast toàn cục (chuẩn shadcn/ui) — dùng được cả ngoài React. */
import { useEffect, useState, type ReactNode } from 'react';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 1000000;

export type ToasterToast = {
  id: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'destructive';
  open?: boolean;
  onOpenChange?: ((open: boolean) => void) | undefined;
};

let count = 0;

function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | { type: 'ADD_TOAST'; toast: ToasterToast }
  | { type: 'UPDATE_TOAST'; toast: Partial<ToasterToast> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: ToasterToast['id'] }
  | { type: 'REMOVE_TOAST'; toastId?: ToasterToast['id'] };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function addToRemoveQueue(toastId: string): void {
  if (toastTimeouts.has(toastId)) return;

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: 'REMOVE_TOAST', toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TOAST':
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case 'DISMISS_TOAST': {
      const toastId = action.toastId;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((item) => addToRemoveQueue(item.id));
      }

      return {
        ...state,
        toasts: state.toasts.map((item) =>
          item.id === toastId || toastId === undefined ? { ...item, open: false } : item,
        ),
      };
    }

    case 'REMOVE_TOAST':
      if (action.toastId === undefined) return { ...state, toasts: [] };
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) };
  }
}

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action): void {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

export type ToastOptions = Omit<ToasterToast, 'id'>;

export interface ToastHandle {
  id: string;
  dismiss: () => void;
  update: (options: ToastOptions) => void;
}

export function toast(options: ToastOptions): ToastHandle {
  const id = genId();

  const update = (opts: ToastOptions): void =>
    dispatch({ type: 'UPDATE_TOAST', toast: { ...opts, id } });
  const dismiss = (): void => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...options,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
    },
  });

  return { id, dismiss, update };
}

export function dismissToast(toastId?: string): void {
  dispatch({ type: 'DISMISS_TOAST', toastId });
}

export function useToast(): State & { toast: typeof toast; dismiss: typeof dismissToast } {
  const [state, setState] = useState<State>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, [state]);

  return { ...state, toast, dismiss: dismissToast };
}
