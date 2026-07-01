'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function UndoToast({ message, onUndo, onDismiss, duration = 5000 }: UndoToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const handleUndo = () => {
    setVisible(false);
    onUndo();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-lg"
        >
          <div className="bg-surface-card border border-surface-border rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg">
            <span className="text-sm text-text-primary">{message}</span>
            <button
              onClick={handleUndo}
              className="text-sm font-semibold text-accent active:opacity-60 transition-opacity ml-3"
            >
              Undo
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
