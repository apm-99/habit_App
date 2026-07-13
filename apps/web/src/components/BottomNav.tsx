'use client';

import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, ListTodo, Dumbbell, BarChart3, Settings } from 'lucide-react';

const tabs = [
  { href: '/', label: 'Today', Icon: CalendarCheck },
  { href: '/todos', label: 'Todos', Icon: ListTodo },
  { href: '/gym', label: 'Gym', Icon: Dumbbell },
  { href: '/stats', label: 'Stats', Icon: BarChart3 },
  { href: '/settings', label: 'Settings', Icon: Settings },
] as const;

export const BottomNav = memo(function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const prefetched = useRef(new Set<string>());

  const handleNav = useCallback(
    (href: string) => {
      if (pathname === href) return;

      if (!prefetched.current.has(href)) {
        prefetched.current.add(href);
        router.prefetch(href);
      }

      router.push(href);
    },
    [pathname, router],
  );

  return (
    <nav className="shrink-0 z-50 ios-blur border-t border-surface-border safe-bottom">
      <div className="flex justify-around items-center h-[50px] max-w-lg mx-auto">
        {tabs.map(({ href, label, Icon }) => {
          const isActive =
            href === '/' ? pathname === href : pathname.startsWith(href);
          return (
            <button
              key={href}
              onClick={() => handleNav(href)}
              className="relative flex flex-col items-center justify-center gap-0.5 w-14 h-full active:opacity-60 transition-opacity"
              aria-label={label}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-accent/8 rounded-xl"
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.5}
                className={`relative z-10 transition-colors duration-150 ${
                  isActive ? 'text-accent' : 'text-muted'
                }`}
              />
              <span
                className={`relative z-10 text-[10px] transition-colors duration-150 ${
                  isActive ? 'text-accent font-semibold' : 'text-muted'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});
