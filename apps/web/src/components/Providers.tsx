'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthErrorBanner } from '@/components/AuthErrorBanner';
import { OfflineBanner } from '@/components/OfflineBanner';
import type { Persister } from '@tanstack/react-query-persist-client';

function createPersister(): Persister {
  if (typeof window === 'undefined') {
    return createSyncStoragePersister({
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
      key: 'HABIT_APP_QUERY_CACHE',
      throttleTime: 1000,
    });
  }
  return createSyncStoragePersister({
    storage: window.localStorage,
    key: 'HABIT_APP_QUERY_CACHE',
    throttleTime: 1000,
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 60 * 24,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const [persister] = useState(createPersister);

  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24 * 7,
        }}
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AuthErrorBanner />
            <OfflineBanner />
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}
