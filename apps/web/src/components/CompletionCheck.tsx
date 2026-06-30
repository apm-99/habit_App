'use client';

import { motion } from 'framer-motion';

interface CompletionCheckProps {
  done: boolean | undefined;
  onToggle: () => void;
}

export function CompletionCheck({ done, onToggle }: CompletionCheckProps) {
  return (
    <motion.button
      className="h-11 w-11 flex items-center justify-center active:scale-95 transition-transform shrink-0"
      onClick={onToggle}
      whileTap={{ scale: 0.9 }}
    >
      <motion.svg viewBox="0 0 24 24" className="h-6 w-6">
        <motion.circle
          cx="12" cy="12" r="10"
          fill={done ? '#FF6B4A' : 'transparent'}
          stroke={done ? '#FF6B4A' : '#5C5C63'}
          strokeWidth="1.5"
          animate={{
            fill: done ? '#FF6B4A' : 'transparent',
            stroke: done ? '#FF6B4A' : '#5C5C63',
          }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        />
        <motion.path
          d="M7 12l3 3 7-7"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: done ? 1 : 0 }}
          transition={{ duration: 0.15, delay: done ? 0.08 : 0 }}
        />
      </motion.svg>
    </motion.button>
  );
}
