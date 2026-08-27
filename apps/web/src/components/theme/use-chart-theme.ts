import { useTheme } from './theme-provider';

export interface ChartThemeColors {
  isDark: boolean;
  revenue: string;
  revenueBackground: string;
  bookings: string;
  bookingsBackground: string;
  text: string;
  mutedText: string;
  grid: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
}

/**
 * Hook cung cấp bảng màu cho Chart.js tương thích hoàn hảo Light/Dark mode
 * theo chuẩn Athletic Synergy design tokens.
 */
export function useChartTheme(): ChartThemeColors {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return {
    isDark,
    revenue: isDark ? '#2ecc71' : '#006d37',
    revenueBackground: isDark ? 'rgba(46, 204, 113, 0.85)' : 'rgba(0, 109, 55, 0.85)',
    bookings: isDark ? '#f59e0b' : '#d97706',
    bookingsBackground: isDark ? '#f59e0b' : '#d97706',
    text: isDark ? '#ecf1ed' : '#191c1e',
    mutedText: isDark ? '#93a39a' : '#5c6470',
    grid: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
    tooltipBg: isDark ? '#151b17' : '#ffffff',
    tooltipBorder: isDark ? '#26302a' : '#dde5df',
    tooltipText: isDark ? '#ecf1ed' : '#191c1e',
  };
}
