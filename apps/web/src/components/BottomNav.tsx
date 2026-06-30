'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, BarChart3, Settings } from 'lucide-react';

const tabs = [
  { href: '/', label: 'Today', Icon: CalendarCheck },
  { href: '/stats', label: 'Statistics', Icon: BarChart3 },
  { href: '/settings', label: 'Settings', Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 ios-blur border-t border-[#38383A]/50 safe-bottom">
      <div className="flex justify-around items-center h-[50px] max-w-lg mx-auto">
        {tabs.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-full"
              aria-label={label}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
                className={isActive ? 'text-accent' : 'text-[#8E8E93]'}
              />
              <span
                className={`text-[10px] ${
                   isActive ? 'text-accent font-semibold' : 'text-[#8E8E93]'
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
