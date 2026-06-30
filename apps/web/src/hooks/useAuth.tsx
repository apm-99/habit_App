'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
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
  signUp: (email: string, password: string) => Promise<{ user: import('@supabase/supabase-js').User | null; session: import('@supabase/supabase-js').Session | null }>;
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
  signUp: async () => ({ user: null, session: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

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
        retryCountRef.current = 0;
      })
      .catch((err) => {
        const message = (err as Error).message || 'Authentication failed';
        console.error('Auth init failed:', err);
        setError(message);
        setLoading(false);
        if (retryCountRef.current < RETRY_DELAYS.length) {
          const delay = RETRY_DELAYS[retryCountRef.current];
          retryCountRef.current += 1;
          timerRef.current = setTimeout(init, delay);
        }
      });
  }, [updateSession]);

  useEffect(() => {
    init();
    return () => clearTimeout(timerRef.current);
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
    const result = await authSignUp(email, password);
    if (result.session) updateSession(result.session);
    return result;
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
