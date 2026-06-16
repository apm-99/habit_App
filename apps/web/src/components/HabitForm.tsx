'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { CreateHabitSchema } from '@repo/db';
import type { CreateHabitInput, Habit } from '@repo/db';
import { getCategoryColor } from '@/hooks/useHabits';

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHabitInput) => void;
  initial?: Habit;
}

const categories = [
  { label: 'Health', value: 'health' },
  { label: 'Fitness', value: 'fitness' },
  { label: 'Learning', value: 'learning' },
  { label: 'Mindfulness', value: 'mindfulness' },
  { label: 'Work', value: 'work' },
  { label: 'Social', value: 'social' },
  { label: 'Finance', value: 'finance' },
  { label: 'Other', value: 'other' },
];

const frequencies = [
  { label: 'Daily', value: 'daily' as const },
  { label: 'Weekly', value: 'weekly' as const },
  { label: 'Custom', value: 'custom_days' as const },
];

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HabitForm({ open, onClose, onSubmit, initial }: HabitFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'health');
  const [frequencyType, setFrequencyType] = useState(initial?.frequency_type ?? 'daily');
  const [targetCount, setTargetCount] = useState(initial?.target_count ?? 1);
  const [customDays, setCustomDays] = useState<number[]>(initial?.custom_days ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
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
    onSubmit(result.data);
    setSubmitting(false);
    onClose();
  };

  const toggleDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card rounded-t-2xl p-6 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">
            {initial ? 'Edit Habit' : 'New Habit'}
          </h2>
          <button onClick={onClose}>
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors({}); }}
              placeholder="e.g. Morning run"
              className="w-full bg-elevated rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Description <span className="text-text-secondary/50">(optional)</span>
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="w-full bg-elevated rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === cat.value
                      ? 'text-white'
                      : 'bg-elevated text-text-secondary'
                  }`}
                  style={category === cat.value ? { backgroundColor: getCategoryColor(cat.value) } : undefined}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Frequency</label>
            <div className="flex gap-2">
              {frequencies.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFrequencyType(f.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    frequencyType === f.value
                      ? 'bg-accent text-white'
                      : 'bg-elevated text-text-secondary'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {frequencyType === 'weekly' && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
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
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {frequencyType === 'custom_days' && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Select days
              </label>
              <div className="flex gap-2">
                {dayLabels.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`w-9 h-9 rounded-full text-xs font-medium transition-all ${
                      customDays.includes(i)
                        ? 'bg-accent text-white'
                        : 'bg-elevated text-text-secondary'
                    }`}
                  >
                    {label[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-accent text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? 'Saving...' : initial ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </div>
    </div>
  );
}
