/** Tiện ích render chung cho unit test: router + query client + theme. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { AppRoutes } from '../routes/router';
import { ThemeProvider } from '../components/theme/theme-provider';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

interface RenderAppOptions {
  route?: string;
  ui?: ReactNode;
}

export function renderApp(options: RenderAppOptions = {}): RenderResult {
  const { route = '/', ui } = options;
  const content: ReactNode = ui ?? <AppRoutes />;

  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <ThemeProvider defaultTheme="light">
        <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}
