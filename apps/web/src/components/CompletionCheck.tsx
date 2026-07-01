'use client';

import { motion } from 'framer-motion';

interface CompletionCheckProps {
  done: boolean | undefined;
  onToggle: () => void;
}

export function CompletionCheck({ done, onToggle }: CompletionCheckProps) {
  return (
    <motion.button
      className="h-[26px] w-[26px] flex items-center justify-center shrink-0"
      onClick={onToggle}
      whileTap={{ scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]">
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          fill="transparent"
          strokeWidth="1.5"
          animate={{
            fill: done ? 'var(--accent-primary)' : 'transparent',
            stroke: done ? 'var(--accent-primary)' : '#48484A',
          }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.path
          d="M7.5 12.5l3 3 6.5-6.5"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: done ? 1 : 0,
            opacity: done ? 1 : 0,
          }}
          transition={{
            pathLength: { duration: 0.3, delay: done ? 0.1 : 0, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: 0.1, delay: done ? 0.1 : 0 },
          }}
        />
      </svg>
    </motion.button>
  );
}
