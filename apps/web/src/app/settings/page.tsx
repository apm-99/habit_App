'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { Moon, Sun, Info, LogIn, LogOut, Mail } from 'lucide-react';

export default function SettingsPage() {
  const { userEmail, isAnonymous, signOut, loading: authLoading } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('habit-dark-mode');
    if (stored !== null) {
      setDarkMode(stored === 'true');
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('habit-dark-mode', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <AppShell>
      <div className="px-5 pt-14 pb-24">
        <h1 className="text-[36px] font-[500] tracking-[-0.02em] text-text-primary leading-tight">Settings</h1>
        <p className="text-[15px] text-text-secondary mt-0.5 mb-6">App preferences</p>

        <div className="rounded-xl bg-surface-card overflow-hidden">
          {authLoading ? (
            <div className="px-4 py-3.5">
              <div className="h-4 w-20 rounded bg-surface-elevated animate-pulse" />
            </div>
          ) : isAnonymous ? (
            <Link
              href="/login"
              className="flex items-center gap-3 px-4 py-3.5 active:opacity-50 transition-opacity"
            >
              <div className="w-[26px] h-[26px] rounded-full bg-accent/15 flex items-center justify-center">
                <LogIn size={14} className="text-accent" />
              </div>
              <span className="text-[15px] text-text-primary font-medium">Sign In to Sync</span>
            </Link>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-[26px] h-[26px] rounded-full bg-success/15 flex items-center justify-center">
                  <Mail size={14} className="text-success" />
                </div>
                <div>
                  <p className="text-[15px] text-text-primary font-medium">Account</p>
                  <p className="text-[12px] text-text-secondary">{userEmail}</p>
                </div>
              </div>
              <div className="h-px bg-surface-border ml-[54px]" />
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-3 px-4 py-3.5 w-full active:opacity-50 transition-opacity disabled:opacity-50"
              >
                <div className="w-[26px] h-[26px] rounded-full bg-destructive/15 flex items-center justify-center">
                  <LogOut size={14} className="text-destructive" />
                </div>
                <span className="text-[15px] text-destructive font-medium">
                  {signingOut ? 'Signing out...' : 'Sign Out'}
                </span>
              </button>
            </>
          )}
        </div>

        <div className="rounded-xl bg-surface-card overflow-hidden mt-4">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-[26px] h-[26px] rounded-full bg-accent/15 flex items-center justify-center">
                {darkMode ? <Moon size={14} className="text-accent" /> : <Sun size={14} className="text-accent" />}
              </div>
              <span className="text-[15px] text-text-primary font-medium">Dark Mode</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-[48px] h-[28px] rounded-full transition-colors ${darkMode ? 'bg-success' : 'bg-surface-elevated'}`}
            >
              <div
                className={`absolute top-[2px] w-[24px] h-[24px] rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
              />
            </button>
          </div>
          <div className="h-px bg-surface-border ml-[54px]" />
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-[26px] h-[26px] rounded-full bg-muted/15 flex items-center justify-center">
              <Info size={14} className="text-muted" />
            </div>
            <div>
              <p className="text-[15px] text-text-primary font-medium">habit app</p>
              <p className="text-[12px] text-text-secondary">Version 1.0 · Built with Next.js + Supabase</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
