import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';

describe('App Root Integration', () => {
  it('renders application with router and home hero', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Đặt Sân Thể Thao & Ghép Kèo Nhanh/i })).toBeDefined();
    expect(screen.getByText(/250\+ Cụm sân hoạt động trực tuyến/i)).toBeDefined();
  });
});
