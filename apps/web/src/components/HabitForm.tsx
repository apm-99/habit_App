'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { CreateHabitSchema } from '@repo/db';
import type { CreateHabitInput, Habit } from '@repo/db';

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHabitInput) => Promise<void>;
  initial?: Habit;
  error?: string | null;
  saving?: boolean;
}

const EMOJIS = ['\u{1F3C3}', '\u{1F4A7}', '\u{1F4D6}', '\u{1F9D8}', '\u{270D}\u{FE0F}', '\u{1F343}', '\u{1F4AA}', '\u{1F9E0}', '\u{1F3B5}', '\u2615', '\u{1F957}', '\u{1F6CF}\u{FE0F}', '\u{1F4DD}', '\u{1F3A8}', '\u{1F331}', '\u{1F3CB}\u{FE0F}'];

const COLORS = ['#FF453A', '#FF9F0A', '#FFD60A', '#30D158', '#FF6482', '#AF52DE', '#BF5AF2', '#FF375F', '#8E8E93'];

const frequencies = [
  { label: 'Daily', value: 'daily' as const },
  { label: 'Weekly', value: 'weekly' as const },
  { label: 'Custom', value: 'custom_days' as const },
];

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  health: '\u{2764}\u{FE0F}',
  fitness: '\u{1F3C3}',
  learning: '\u{1F4D6}',
  mindfulness: '\u{1F9D8}',
  work: '\u{1F4BB}',
  social: '\u{1F91D}',
  finance: '\u{1F4B0}',
  other: '\u{1F4CB}',
};

const CATEGORY_COLOR_MAP: Record<string, string> = {
  health: '#FF453A',
  fitness: '#FF9F0A',
  learning: '#FFD60A',
  mindfulness: '#30D158',
  work: '#FF6482',
  social: '#AF52DE',
  finance: '#BF5AF2',
  other: '#8E8E93',
};

function emojiToCategory(emoji: string): string {
  const entry = Object.entries(CATEGORY_EMOJI_MAP).find(([, e]) => e === emoji);
  return entry?.[0] || 'other';
}

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

export function HabitForm({ open, onClose, onSubmit, initial, error: submitError, saving }: HabitFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [selectedEmoji, setSelectedEmoji] = useState<string>(initial?.category ? CATEGORY_EMOJI_MAP[initial.category] || EMOJIS[0] : EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState<string>(initial?.category ? CATEGORY_COLOR_MAP[initial.category] || COLORS[0] : COLORS[0]);
  const [frequencyType, setFrequencyType] = useState(initial?.frequency_type ?? 'daily');
  const [targetCount, setTargetCount] = useState(initial?.target_count ?? 1);
  const [customDays, setCustomDays] = useState<number[]>(initial?.custom_days ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showCustomize, setShowCustomize] = useState(!!initial);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setDescription(initial?.description ?? '');
      setSelectedEmoji(initial?.category ? CATEGORY_EMOJI_MAP[initial.category] || EMOJIS[0] : EMOJIS[0]);
      setSelectedColor(initial?.category ? CATEGORY_COLOR_MAP[initial.category] || COLORS[0] : COLORS[0]);
      setFrequencyType(initial?.frequency_type ?? 'daily');
      setTargetCount(initial?.target_count ?? 1);
      setCustomDays(initial?.custom_days ?? []);
      setErrors({});
      setShowCustomize(!!initial);
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    const category = emojiToCategory(selectedEmoji);
    const input = {
      name,
      description,
      category,
      frequency_type: frequencyType,
      target_count: frequencyType === 'custom_days' ? customDays.length : targetCount,
      custom_days: frequencyType === 'custom_days' ? customDays : [],
    };

    const result = CreateHabitSchema.safeParse(input);
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
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  const isBusy = saving || submitting;

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
                    {initial ? 'Edit Habit' : 'New Habit'}
                  </h2>
                  <button onClick={!isBusy ? onClose : undefined} disabled={isBusy}>
                    <X size={20} className="text-text-secondary" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-muted uppercase tracking-[0.06em] mb-2">Name</label>
                    <input
                      value={name}
                      onChange={(e) => { setName(e.target.value); setErrors({}); }}
                      placeholder="e.g. Morning run"
                      className="w-full bg-transparent rounded-[10px] px-3.5 py-3 text-[17px] text-text-primary placeholder:text-text-secondary/50 outline-none border border-border focus:border-accent transition-colors"
                      autoFocus
                      disabled={isBusy}
                    />
                    {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted uppercase tracking-[0.06em] mb-2">Frequency</label>
                    <div className="flex gap-2">
                      {frequencies.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => setFrequencyType(f.value)}
                          className={`flex-1 py-2 rounded-[10px] text-xs font-medium transition-all ${
                            frequencyType === f.value
                              ? 'bg-accent text-white'
                              : 'bg-elevated text-text-secondary'
                          }`}
                          disabled={isBusy}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {frequencyType === 'weekly' && (
                    <div>
                      <label className="block text-xs font-medium text-muted uppercase tracking-[0.06em] mb-1.5">
                        Times per week
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                          <button
                            key={n}
                            onClick={() => setTargetCount(n)}
                            className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                              targetCount === n
                                ? 'bg-accent text-white'
                                : 'bg-elevated text-text-secondary'
                            }`}
                            disabled={isBusy}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {frequencyType === 'custom_days' && (
                    <div>
                      <label className="block text-xs font-medium text-muted uppercase tracking-[0.06em] mb-1.5">
                        Select days
                      </label>
                      <div className="flex gap-2">
                        {dayLabels.map((label, i) => (
                          <button
                            key={i}
                            onClick={() => toggleDay(i)}
                            className={`w-10 h-10 rounded-full text-xs font-medium transition-all ${
                              customDays.includes(i)
                                ? 'bg-white/10 text-text-primary border border-text-primary'
                                : 'bg-transparent text-text-secondary border border-border'
                            }`}
                            disabled={isBusy}
                          >
                            {label[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setShowCustomize(!showCustomize)}
                    className="flex items-center gap-2 text-[13px] text-text-secondary font-medium active:opacity-60 transition-opacity"
                  >
                    <span className={`transition-transform duration-200 ${showCustomize ? 'rotate-90' : ''}`}>›</span>
                    Customize
                  </button>

                  {showCustomize && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5 overflow-hidden"
                    >
                      <div>
                        <label className="block text-xs font-medium text-muted uppercase tracking-[0.06em] mb-2">Icon</label>
                        <div className="flex gap-2 flex-wrap">
                          {EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => setSelectedEmoji(emoji)}
                              className={`w-[44px] h-[44px] rounded-[10px] text-[22px] flex items-center justify-center transition-all ${
                                selectedEmoji === emoji
                                  ? 'border border-text-primary bg-white/5'
                                  : 'border border-border bg-transparent'
                              }`}
                              disabled={isBusy}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted uppercase tracking-[0.06em] mb-2">Color</label>
                        <div className="flex gap-2.5 flex-wrap">
                          {COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={`w-[36px] h-[36px] rounded-full transition-all ${
                                selectedColor === color ? 'scale-110 border-2 border-text-primary' : 'border-2 border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                              disabled={isBusy}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {submitError && (
                    <p className="text-xs text-destructive text-center">{submitError}</p>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={isBusy}
                    className="w-full py-3 rounded-[10px] bg-accent text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isBusy ? 'Saving...' : initial ? 'Save Changes' : 'Create Habit'}
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
