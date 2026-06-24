'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ensureAnonymousSession, signIn as authSignIn, signUp as authSignUp, signOut as authSignOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const RETRY_DELAYS = [1000, 2000, 4000, 8000];

interface AuthContextValue {
  userId: string | null;
  userEmail: string | null;
  isAnonymous: boolean;
  loading: boolean;
  error: string | null;
  retry: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  userId: null,
  userEmail: null,
  isAnonymous: true,
  loading: true,
  error: null,
  retry: () => {},
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const updateSession = useCallback((session: import('@supabase/supabase-js').Session | null) => {
    if (session) {
      setUserId(session.user.id);
      setUserEmail(session.user.email ?? null);
    } else {
      setUserId(null);
      setUserEmail(null);
    }
  }, []);

  const init = useCallback(() => {
    setLoading(true);
    setError(null);
    ensureAnonymousSession()
      .then((session) => {
        if (session) {
          updateSession(session);
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
  }, [retryCount, updateSession]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateSession(session);
    });
    return () => subscription.unsubscribe();
  }, [updateSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { session } = await authSignIn(email, password);
    if (session) updateSession(session);
  }, [updateSession]);

  const signUp = useCallback(async (email: string, password: string) => {
    await authSignUp(email, password);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) updateSession(session);
  }, [updateSession]);

  const signOut = useCallback(async () => {
    await authSignOut();
    await ensureAnonymousSession().then((session) => {
      if (session) updateSession(session);
    });
  }, [updateSession]);

  const isAnonymous = !userEmail;

  return (
    <AuthContext.Provider value={{ userId, userEmail, isAnonymous, loading, error, retry: init, signIn, signUp, signOut }}>
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

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
