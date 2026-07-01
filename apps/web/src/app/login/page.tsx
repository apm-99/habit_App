'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid email or password')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (lower.includes('user not found')) {
    return 'No account found with this email.';
  }
  if (lower.includes('email already registered') || lower.includes('already been registered')) {
    return 'An account with this email already exists.';
  }
  if (lower.includes('password should be at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (lower.includes('unable to validate email address')) {
    return 'Please enter a valid email address.';
  }
  if (lower.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Connection error. Check your internet and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, isAnonymous, userEmail, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => {
      const next = !prev;
      requestAnimationFrame(() => {
        const input = passwordRef.current;
        if (input) {
          const len = input.value.length;
          input.setSelectionRange(len, len);
          input.focus();
        }
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        const result = await signUp(email, password);
        if (result.session) {
          setSuccess('Account created! Signing you in...');
          setTimeout(() => router.push('/'), 1200);
        } else {
          setSuccess('Account created! Check your email for a confirmation link.');
        }
      } else {
        await signIn(email, password);
        setSuccess('Signed in!');
        setTimeout(() => router.push('/'), 800);
      }
    } catch (err) {
      setError(friendlyError((err as Error).message));
    } finally {
      setSubmitting(false);
    }
  }, [mode, email, password, signIn, signUp, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 size={24} className="text-accent animate-spin" />
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
        className="inline-flex items-center gap-1.5 text-[15px] text-accent font-[500] active:opacity-50 transition-opacity mb-8"
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
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={submitting}
            className="w-full h-[44px] rounded-[10px] bg-card border border-border px-3.5 text-[15px] text-text-primary placeholder:text-muted outline-none focus:border-accent transition-colors disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-[13px] font-[500] text-text-secondary block mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              ref={passwordRef}
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              disabled={submitting}
              className="w-full h-[44px] rounded-[10px] bg-card border border-border px-3.5 pr-11 text-[15px] text-text-primary placeholder:text-muted outline-none focus:border-accent transition-colors disabled:opacity-50"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              tabIndex={-1}
              className="absolute right-0 top-0 h-[44px] w-[44px] flex items-center justify-center text-text-secondary active:opacity-50 transition-opacity"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {showPassword ? (
                  <motion.div
                    key="off"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <EyeOff size={18} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="on"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Eye size={18} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-[13px] text-destructive bg-destructive/10 rounded-[10px] px-3.5 py-2.5 flex items-start gap-2">
                <span className="shrink-0 mt-px">!</span>
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-[13px] text-success bg-success/10 rounded-[10px] px-3.5 py-2.5">
                {success}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={submitting || !email.trim() || password.length < 6}
          className="w-full h-[44px] rounded-[10px] bg-accent text-white text-[15px] font-[500] active:opacity-70 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
            </>
          ) : (
            mode === 'signin' ? 'Sign In' : 'Create Account'
          )}
        </button>
      </form>

      <p className="text-[13px] text-text-secondary text-center mt-6">
        {mode === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
              className="text-accent font-[500] bg-none border-none p-0 cursor-pointer active:opacity-50 transition-opacity"
            >
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
              className="text-accent font-[500] bg-none border-none p-0 cursor-pointer active:opacity-50 transition-opacity"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
