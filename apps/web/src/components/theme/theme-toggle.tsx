import { Moon, Sun } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '../ui/button';
import { useTheme } from './theme-provider';

/** Nút bật/tắt giao diện sáng ↔ tối (mặc định ban đầu: theo hệ thống). */
export function ThemeToggle(): ReactElement {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Chuyển giao diện sáng/tối"
      title="Chuyển giao diện sáng/tối"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {resolvedTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
}
