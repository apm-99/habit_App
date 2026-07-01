'use client';

import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center pt-20 pb-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-card border border-surface-border flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-[22px] font-[400] tracking-[-0.01em] text-text-primary">
        {title}
      </h2>
      <p className="text-[15px] text-text-secondary mt-2.5 max-w-[280px] mx-auto leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 border border-text-secondary/30 rounded-[20px] px-6 py-2.5 text-[15px] text-text-primary active:opacity-50 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
