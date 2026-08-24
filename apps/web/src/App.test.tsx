import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App placeholder', () => {
  it('hiển thị tiêu đề CourtHub', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('CourtHub');
  });

  it('liệt kê đủ 5 loại sân từ @courthub/shared', () => {
    render(<App />);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });
});
