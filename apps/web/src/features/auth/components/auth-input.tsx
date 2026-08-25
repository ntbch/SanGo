import type { ComponentProps, ReactElement } from 'react';

import { Input } from '../../../components/ui/input';

/**
 * Input auth chuẩn A5: cao h-12, icon lucide bên trái (pl-10), focus viền primary.
 * Là con TRỰC TIẾP của <FormControl> (Radix Slot) và truyền toàn bộ props
 * (id, aria-*) xuống <Input> để label vẫn gắn đúng ô nhập.
 */
export function AuthInput({
  icon,
  className,
  ...props
}: { icon: ReactElement } & ComponentProps<typeof Input>): ReactElement {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <Input
        className={`h-12 rounded-lg border-input bg-background pl-10 focus-visible:border-primary ${className ?? ''}`}
        {...props}
      />
    </div>
  );
}
