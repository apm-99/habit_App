'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ensureAnonymousSession } from '@/lib/auth';

const RETRY_DELAYS = [1000, 2000, 4000, 8000];

interface AuthContextValue {
  userId: string | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  userId: null,
  loading: true,
  error: null,
  retry: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const init = useCallback(() => {
    setLoading(true);
    setError(null);
    ensureAnonymousSession()
      .then((session) => {
        if (session) {
          setUserId(session.user.id);
        }
        setLoading(false);
        setRetryCount(0);
      })
      .catch((err) => {
        const message = (err as Error).message || 'Authentication failed';
        console.error('Auth init failed:', err);
        setError(message);
        setLoading(false);
        if (retryCount < RETRY_DELAYS.length) {
          const delay = RETRY_DELAYS[retryCount];
          setRetryCount((c) => c + 1);
          setTimeout(init, delay);
        }
      });
  }, [retryCount]);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <AuthContext.Provider value={{ userId, loading, error, retry: init }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUserId(): string | null {
  const { userId, loading } = useContext(AuthContext);
  if (loading) return null;
  return userId;
}

export function useAuthError(): string | null {
  return useContext(AuthContext).error;
}

export function useAuthRetry(): () => void {
  return useContext(AuthContext).retry;
}
