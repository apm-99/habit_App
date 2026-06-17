'use client';

import { useState } from 'react';
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

const COLORS = ['#FF453A', '#FF9F0A', '#FFD60A', '#30D158', '#64D2FF', '#0A84FF', '#BF5AF2', '#FF375F', '#8E8E93'];

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
  work: '#64D2FF',
  social: '#0A84FF',
  finance: '#BF5AF2',
  other: '#8E8E93',
};

function emojiToCategory(emoji: string): string {
  const entry = Object.entries(CATEGORY_EMOJI_MAP).find(([, e]) => e === emoji);
  return entry?.[0] || 'other';
}

function colorToCategory(color: string): string {
  const entry = Object.entries(CATEGORY_COLOR_MAP).find(([, c]) => c === color);
  return entry?.[0] || 'other';
}

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

  if (!open) return null;

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
      // error is displayed via submitError prop
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={!saving && !submitting ? onClose : undefined} />
      <div className="relative w-full max-w-lg bg-card rounded-t-[14px] p-6" style={{ animation: 'slideUp 0.33s cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">
            {initial ? 'Edit Habit' : 'New Habit'}
          </h2>
          <button onClick={!saving && !submitting ? onClose : undefined} disabled={saving || submitting}>
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
              disabled={saving || submitting}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

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
                  disabled={saving || submitting}
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
                  disabled={saving || submitting}
                />
              ))}
            </div>
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
                  disabled={saving || submitting}
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
                    disabled={saving || submitting}
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
                    disabled={saving || submitting}
                  >
                    {label[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {submitError && (
            <p className="text-xs text-destructive text-center">{submitError}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || saving}
            className="w-full py-3 rounded-[10px] bg-accent text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {submitting || saving ? 'Saving...' : initial ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </div>
    </div>
  );
}
