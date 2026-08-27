import { forwardRef, type ComponentProps, type ReactElement } from 'react';

import { Input } from '../../../components/ui/input';

export interface AuthInputProps extends ComponentProps<typeof Input> {
  icon: ReactElement;
}

/**
 * Input auth chuẩn A5: cao h-12, icon lucide bên trái (pl-10), focus viền primary.
 * Là con TRỰC TIẾP của <FormControl> (Radix Slot) và truyền toàn bộ props
 * (id, aria-*, ref) xuống <Input> để label và validation vẫn gắn đúng ô nhập.
 */
export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { icon, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <Input
        ref={ref}
        className={`h-12 rounded-lg border-input bg-background pl-10 focus-visible:border-primary ${className ?? ''}`}
        {...props}
      />
    </div>
  );
});
