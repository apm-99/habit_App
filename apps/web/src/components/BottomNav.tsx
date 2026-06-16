'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, List, ChartNoAxesColumn, Settings } from 'lucide-react';

const tabs = [
  { href: '/', label: 'Today', Icon: CalendarCheck },
  { href: '/habits', label: 'Habits', Icon: List },
  { href: '/stats', label: 'Stats', Icon: ChartNoAxesColumn },
  { href: '/settings', label: 'Settings', Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 w-16 h-full"
              aria-label={label}
            >
              <Icon
                size={22}
                className={isActive ? 'text-accent' : 'text-text-secondary'}
              />
              <span
                className={`text-xs ${
                  isActive ? 'text-accent font-medium' : 'text-text-secondary'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
