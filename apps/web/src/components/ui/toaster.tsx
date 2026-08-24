import type { ReactElement } from 'react';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
import { useToast } from './use-toast';

/** Gắn một lần duy nhất ở gốc app để mọi nơi gọi toast() đều hiển thị được. */
export function Toaster(): ReactElement {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map((t) => {
        return (
          <Toast key={t.id} variant={t.variant} open={t.open} onOpenChange={t.onOpenChange}>
            <div className="grid gap-1">
              {t.title ? <ToastTitle>{t.title}</ToastTitle> : null}
              {t.description ? <ToastDescription>{t.description}</ToastDescription> : null}
            </div>
            {t.action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
