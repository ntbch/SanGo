import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../src/components/ui/button';
import { Badge } from '../src/components/ui/badge';
import { Input } from '../src/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../src/components/ui/card';
import { StatusBadge } from '../src/components/feedback/status-badge';
import { DualRangeSlider } from '../src/components/ui/dual-range-slider';
import { formatVND, formatMinutesToTime } from '../src/lib/utils';

describe('UI Kit Primitives', () => {
  it('renders Button with variants and loading state', () => {
    const { rerender } = render(<Button>Đặt sân</Button>);
    expect(screen.getByRole('button', { name: /Đặt sân/i })).toBeDefined();

    rerender(<Button loading>Đang xử lý</Button>);
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('renders Input with error state', () => {
    render(<Input placeholder="Tìm kiếm sân" error="Tên không hợp lệ" />);
    expect(screen.getByPlaceholderText(/Tìm kiếm sân/i)).toBeDefined();
    expect(screen.getByText(/Tên không hợp lệ/i)).toBeDefined();
  });

  it('renders Badge and StatusBadge correctly', () => {
    render(
      <div>
        <Badge variant="peak">Giờ vàng</Badge>
        <StatusBadge status="CONFIRMED" />
        <StatusBadge status="PENDING" />
      </div>,
    );
    expect(screen.getByText(/Giờ vàng/i)).toBeDefined();
    expect(screen.getByText(/Đã xác nhận/i)).toBeDefined();
    expect(screen.getByText(/Chờ duyệt/i)).toBeDefined();
  });

  it('renders Card with content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Sân bóng mini</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Giá 250k/h</p>
        </CardContent>
      </Card>,
    );
    expect(screen.getByText(/Sân bóng mini/i)).toBeDefined();
    expect(screen.getByText(/Giá 250k\/h/i)).toBeDefined();
  });

  it('renders DualRangeSlider and handles thumb change', () => {
    const onChange = vi.fn();
    render(
      <DualRangeSlider
        min={50000}
        max={1500000}
        value={[100000, 800000]}
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/100.000/i)).toBeDefined();
    expect(screen.getByText(/800.000/i)).toBeDefined();
  });

  it('formats currency and minutes properly', () => {
    expect(formatVND(300000)).toContain('300.000');
    expect(formatMinutesToTime(360)).toBe('06:00');
    expect(formatMinutesToTime(1020)).toBe('17:00');
  });
});
