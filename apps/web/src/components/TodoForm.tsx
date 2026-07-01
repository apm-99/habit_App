'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Flag } from 'lucide-react';
import { CreateTodoSchema } from '@repo/db';
import type { CreateTodoInput, Todo } from '@repo/db';
import { format } from 'date-fns';

interface TodoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTodoInput) => Promise<void>;
  initial?: Todo;
  error?: string | null;
  saving?: boolean;
}

const CATEGORIES = [
  { label: 'Health', value: 'health', color: '#FF5C5C' },
  { label: 'Fitness', value: 'fitness', color: '#FF9F0A' },
  { label: 'Learning', value: 'learning', color: '#FFD60A' },
  { label: 'Mindfulness', value: 'mindfulness', color: '#3DD68C' },
  { label: 'Work', value: 'work', color: '#FF6482' },
  { label: 'Social', value: 'social', color: '#AF52DE' },
  { label: 'Finance', value: 'finance', color: '#BF5AF2' },
  { label: 'Other', value: 'other', color: '#8E8E93' },
];

const PRIORITIES = [
  { label: 'None', value: 0, color: '#5C5C63' },
  { label: 'Low', value: 1, color: '#FFD60A' },
  { label: 'Medium', value: 2, color: '#FF9F0A' },
  { label: 'High', value: 3, color: '#FF5C5C' },
];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const sheetVariants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { type: 'spring' as const, damping: 30, stiffness: 300, duration: 0.32 },
  },
  exit: {
    y: '100%',
    transition: { type: 'spring' as const, damping: 30, stiffness: 300, duration: 0.25 },
  },
};

export function TodoForm({ open, onClose, onSubmit, initial, error: submitError, saving }: TodoFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [dueDate, setDueDate] = useState(initial?.due_date ?? null);
  const [priority, setPriority] = useState(initial?.priority ?? 0);
  const [category, setCategory] = useState(initial?.category ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(!!initial?.notes || !!initial?.category || (initial?.priority ?? 0) > 0);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? '');
      setNotes(initial?.notes ?? '');
      setDueDate(initial?.due_date ?? null);
      setPriority(initial?.priority ?? 0);
      setCategory(initial?.category ?? '');
      setErrors({});
      setShowDetails(!!initial?.notes || !!initial?.category || (initial?.priority ?? 0) > 0);
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    const input = {
      title,
      notes,
      due_date: dueDate,
      priority,
      category,
    };

    const result = CreateTodoSchema.safeParse(input);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      await onSubmit(result.data);
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = saving || submitting;

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={!isBusy ? onClose : undefined}
          />
          <motion.div
            key="sheet"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 left-0 right-0 z-[101] mx-auto max-w-lg"
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 && !isBusy) {
                  onClose();
                }
              }}
              className="bg-card rounded-t-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-surface-border" />
              </div>

              <div className="px-6 pb-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {initial ? 'Edit Todo' : 'New Todo'}
                  </h2>
                  <button onClick={!isBusy ? onClose : undefined} disabled={isBusy}>
                    <X size={20} className="text-text-secondary" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <input
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setErrors({});
                      }}
                      placeholder="What needs to be done?"
                      className="w-full bg-transparent rounded-[10px] px-3.5 py-3 text-[17px] text-text-primary placeholder:text-text-secondary/50 outline-none border border-border focus:border-accent transition-colors"
                      autoFocus
                      disabled={isBusy}
                    />
                    {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted uppercase tracking-[0.06em] mb-2">
                      Due Date
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDueDate(null)}
                        className={`flex-1 py-2 rounded-[10px] text-xs font-medium transition-all ${
                          dueDate === null ? 'bg-accent text-white' : 'bg-elevated text-text-secondary'
                        }`}
                        disabled={isBusy}
                      >
                        No Date
                      </button>
                      <button
                        onClick={() => setDueDate(today)}
                        className={`flex-1 py-2 rounded-[10px] text-xs font-medium transition-all ${
                          dueDate === today ? 'bg-accent text-white' : 'bg-elevated text-text-secondary'
                        }`}
                        disabled={isBusy}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setDueDate(tomorrow)}
                        className={`flex-1 py-2 rounded-[10px] text-xs font-medium transition-all ${
                          dueDate === tomorrow ? 'bg-accent text-white' : 'bg-elevated text-text-secondary'
                        }`}
                        disabled={isBusy}
                      >
                        Tomorrow
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-2 text-[13px] text-text-secondary font-medium active:opacity-60 transition-opacity"
                  >
                    <span className={`transition-transform duration-200 ${showDetails ? 'rotate-90' : ''}`}>
                      ›
                    </span>
                    {showDetails ? 'Hide Details' : 'Add Details'}
                  </button>

                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5 overflow-hidden"
                    >
                      <div>
                        <label className="block text-xs font-medium text-muted uppercase tracking-[0.06em] mb-2">
                          Notes
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add details..."
                          rows={3}
                          className="w-full bg-transparent rounded-[10px] px-3.5 py-3 text-[15px] text-text-primary placeholder:text-text-secondary/50 outline-none border border-border focus:border-accent transition-colors resize-none"
                          disabled={isBusy}
                        />
                        {errors.notes && <p className="text-xs text-destructive mt-1">{errors.notes}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted uppercase tracking-[0.06em] mb-2">
                          Priority
                        </label>
                        <div className="flex gap-2">
                          {PRIORITIES.map((p) => (
                            <button
                              key={p.value}
                              onClick={() => setPriority(p.value as 0 | 1 | 2 | 3)}
                              className={`flex-1 py-2 rounded-[10px] text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                                priority === p.value ? 'bg-accent text-white' : 'bg-elevated text-text-secondary'
                              }`}
                              disabled={isBusy}
                            >
                              <Flag size={12} style={{ color: priority === p.value ? 'white' : p.color }} />
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted uppercase tracking-[0.06em] mb-2">
                          Category
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {CATEGORIES.map((c) => (
                            <button
                              key={c.value}
                              onClick={() => setCategory(category === c.value ? '' : c.value)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                category === c.value
                                  ? 'border-text-primary bg-white/5 text-text-primary'
                                  : 'border-border bg-transparent text-text-secondary'
                              }`}
                              disabled={isBusy}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {submitError && <p className="text-xs text-destructive text-center">{submitError}</p>}

                  <button
                    onClick={handleSubmit}
                    disabled={isBusy}
                    className="w-full py-3 rounded-[10px] bg-accent text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isBusy ? 'Saving...' : initial ? 'Save Changes' : 'Add Todo'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
