import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';

describe('Navigation to Venues and Map', () => {
  it('navigates to /venues when clicking Tìm sân link without error', async () => {
    render(<App />);

    const searchLinks = screen.getAllByRole('link', { name: /Tìm sân/i });
    expect(searchLinks.length).toBeGreaterThan(0);

    // Click on the first link
    fireEvent.click(searchLinks[0]);

    await waitFor(() => {
      // The venues page should render sidebar and top sort bar
      expect(screen.getByText(/Bộ Lọc Nâng Cao/i)).toBeDefined();
    }, { timeout: 10000 });
  });
});
