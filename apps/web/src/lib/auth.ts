import { supabase } from './supabase';

export async function ensureAnonymousSession() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;

  return data.session;
}

export async function signUp(email: string, password: string) {
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  const oldUserId = currentSession?.user?.id;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Sign-up failed');

  if (oldUserId && oldUserId !== data.user.id) {
    try {
      await supabase.rpc('migrate_user_data', {
        old_user_id: oldUserId,
        new_user_id: data.user.id,
      });
    } catch (e) {
      console.error('Failed to migrate anonymous data:', e);
    }
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSessionEmail(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.email ?? null;
}
