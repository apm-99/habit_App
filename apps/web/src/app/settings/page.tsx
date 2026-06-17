'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { Moon, Sun, Info } from 'lucide-react';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);

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

  return (
    <AppShell>
      <div className="px-6 pt-12 pb-24">
        <h1 className="text-[28px] font-bold text-text-primary tracking-tight">Settings</h1>
        <p className="text-sm text-text-secondary mt-0.5 mb-6">App preferences</p>

        <div className="rounded-xl bg-[#1C1C1E] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-[26px] h-[26px] rounded-full bg-[#007AFF]/20 flex items-center justify-center">
                {darkMode ? <Moon size={14} className="text-[#007AFF]" /> : <Sun size={14} className="text-[#007AFF]" />}
              </div>
              <span className="text-[15px] text-text-primary font-medium">Dark Mode</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-[48px] h-[28px] rounded-full transition-colors ${darkMode ? 'bg-[#34C759]' : 'bg-[#3A3A3C]'}`}
            >
              <div
                className={`absolute top-[2px] w-[24px] h-[24px] rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
              />
            </button>
          </div>
          <div className="h-[1px] bg-[#2C2C2E] ml-[54px]" />
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-[26px] h-[26px] rounded-full bg-[#8E8E93]/20 flex items-center justify-center">
              <Info size={14} className="text-[#8E8E93]" />
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
