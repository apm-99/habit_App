'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, isAnonymous, userEmail, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        const result = await signUp(email, password);
        if (result.session) {
          setSuccess('Account created! You are now signed in with your email.');
          setTimeout(() => router.push('/'), 1500);
        } else {
          setSuccess('Account created! Check your email for a confirmation link to complete sign-up.');
        }
      } else {
        await signIn(email, password);
        setSuccess('Signed in successfully.');
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [mode, email, password, signIn, signUp, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!isAnonymous) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6">
        <h1 className="text-[22px] font-[500] text-text-primary mb-2">Signed In</h1>
        <p className="text-[15px] text-text-secondary mb-6">{userEmail}</p>
        <Link
          href="/"
          className="text-[15px] text-accent font-[500] active:opacity-50 transition-opacity"
        >
          Back to app
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 pt-14 pb-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-[15px] text-accent font-[500] active:opacity-50 transition-opacity mb-8"
      >
        <ArrowLeft size={18} />
        Back
      </Link>

      <h1 className="text-[28px] font-[500] tracking-[-0.02em] text-text-primary mb-1">
        {mode === 'signin' ? 'Sign In' : 'Create Account'}
      </h1>
      <p className="text-[15px] text-text-secondary mb-8">
        {mode === 'signin'
          ? 'Sign in to sync your habits across devices.'
          : 'Create an account to sync your habits across devices.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="text-[13px] font-[500] text-text-secondary block mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full h-[44px] rounded-[10px] bg-card border border-border px-3.5 text-[15px] text-text-primary placeholder:text-[#666668] outline-none focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-[13px] font-[500] text-text-secondary block mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full h-[44px] rounded-[10px] bg-card border border-border px-3.5 text-[15px] text-text-primary placeholder:text-[#666668] outline-none focus:border-accent transition-colors"
          />
        </div>

        {error && (
          <p className="text-[13px] text-red-500 bg-red-500/10 rounded-[8px] px-3 py-2">{error}</p>
        )}

        {success && (
          <p className="text-[13px] text-green-500 bg-green-500/10 rounded-[8px] px-3 py-2">{success}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-[44px] rounded-[10px] bg-accent text-white text-[15px] font-[500] active:opacity-70 transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <p className="text-[13px] text-text-secondary text-center mt-6">
        {mode === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
              className="text-accent font-[500] bg-none border-none p-0 cursor-pointer"
            >
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
              className="text-accent font-[500] bg-none border-none p-0 cursor-pointer"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
