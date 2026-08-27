import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';

const STORAGE_KEY = 'sango-theme';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {
    throw new Error('setTheme phải gọi bên trong <ThemeProvider>');
  },
});

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme !== 'system') return theme;
  return systemPrefersDark() ? 'dark' : 'light';
}

function applyToDocument(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

/** Quản lý giao diện sáng/tối/theo hệ thống; lưu lựa chọn vào localStorage. */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = STORAGE_KEY,
}: ThemeProviderProps): ReactNode {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    const stored = window.localStorage.getItem(storageKey);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : defaultTheme;
  });

  const resolvedTheme = resolveTheme(theme);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    applyToDocument(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    // Luôn resolve theo lựa chọn hiện tại (không ghi đè khi user chọn tường minh).
    const onChange = (): void => applyToDocument(resolveTheme(themeRef.current));
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (next: Theme) => {
        try {
          window.localStorage.setItem(storageKey, next);
        } catch {
          // localStorage có thể bị chặn (private mode) — vẫn đổi theme trong phiên.
        }
        setThemeState(next);
      },
    }),
    [resolvedTheme, storageKey, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Hook truy cập theme hiện tại — quy ước shadcn/ui đặt kèm provider. */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
