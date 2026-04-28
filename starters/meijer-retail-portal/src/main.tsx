import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DxpProvider } from '@dxp/sdk-react';
import { ThemeProvider } from '@dxp/ui';
import { meijerTheme } from './config/theme';
import { App } from './App';
import './index.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DxpProvider config={{ bffUrl: '/api/v1' }}>
        <ThemeProvider theme={meijerTheme}>
          <App />
        </ThemeProvider>
      </DxpProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
