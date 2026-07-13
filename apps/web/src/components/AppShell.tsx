'use client';

import { type ReactNode, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { BottomNav } from './BottomNav';

const NO_NAV_ROUTES = ['/login'];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = NO_NAV_ROUTES.includes(pathname);

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <main className="flex-1 overflow-y-auto overscroll-none" id="app-scroll-container">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.12,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </motion.div>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
