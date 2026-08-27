import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';

describe('Search Flow from Home to Venues', () => {
  it('submits search from home hero and navigates to venues without crash', async () => {
    render(<App />);

    const searchButton = screen.getByRole('button', { name: /Tìm kiếm sân ngay/i });
    expect(searchButton).toBeDefined();

    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText(/Bộ Lọc Nâng Cao/i)).toBeDefined();
    });
  });
});
