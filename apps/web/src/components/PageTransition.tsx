'use client';

import { useRef, useCallback, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useIsPresent } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
}

const routeDepth = (path: string): number => {
  const segments = path.split('/').filter(Boolean);
  return segments.length;
};

const areEqualDepth = (a: string, b: string) => routeDepth(a) === routeDepth(b);

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  const getDirection = useCallback(() => {
    const prev = prevPath.current;
    const curr = pathname;
    prevPath.current = curr;

    if (prev === curr) return 0;
    if (!areEqualDepth(prev, curr)) {
      return routeDepth(curr) > routeDepth(prev) ? 1 : -1;
    }
    return 0;
  }, [pathname]);

  const direction = getDirection();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: direction * 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -10 }}
        transition={{
          duration: 0.2,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="min-h-0 flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function PageFade({ children }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={usePathname()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        className="min-h-0 flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
