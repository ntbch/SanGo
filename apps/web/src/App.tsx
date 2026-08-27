import React from 'react';
import { AppProviders } from './app/providers';
import { AppRoutes } from './app/routes';

export function App(): React.ReactElement {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
