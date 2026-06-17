'use client';

import { useAuthError, useAuthRetry } from '@/hooks/useAuth';

export function AuthErrorBanner() {
  const error = useAuthError();
  const retry = useAuthRetry();

  if (!error) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-destructive/90 backdrop-blur-sm px-4 py-3 safe-top">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <p className="text-xs text-white font-medium">{error}</p>
        <button
          onClick={retry}
          className="text-xs text-white font-semibold underline ml-4 shrink-0"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
