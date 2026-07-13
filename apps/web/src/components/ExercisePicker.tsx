'use client';

import { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Search, Plus } from 'lucide-react';
import { useExercises, useCreateExercise, useMuscleGroups } from '@/hooks/useGym';
import { getMuscleGroupColor } from '@/lib/workout';

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exerciseId: string) => void;
  disabled?: boolean;
  excludeIds?: string[];
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

export function ExercisePicker({ open, onClose, onSelect, disabled, excludeIds }: ExercisePickerProps) {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrimaryMuscle, setNewPrimaryMuscle] = useState('');
  const [newCategory, setNewCategory] = useState<string>('other');

  const { data: exercises } = useExercises();
  const { data: muscleGroups } = useMuscleGroups();
  const createExercise = useCreateExercise();

  const filtered = useMemo(() => {
    if (!exercises) return [];
    const q = search.toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.primary_muscle.toLowerCase().includes(q) ||
        e.secondary_muscles.some((m) => m.toLowerCase().includes(q)),
    );
  }, [exercises, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const exercise of filtered) {
      const muscle = exercise.primary_muscle;
      if (!map.has(muscle)) map.set(muscle, []);
      map.get(muscle)!.push(exercise);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim() || !newPrimaryMuscle) return;
    const exercise = await createExercise.mutateAsync({
      name: newName.trim(),
      primary_muscle: newPrimaryMuscle,
      category: newCategory,
    });
    setNewName('');
    setNewPrimaryMuscle('');
    setNewCategory('other');
    setShowCreate(false);
    onSelect(exercise.id);
  }, [newName, newPrimaryMuscle, newCategory, createExercise, onSelect]);

  const muscleNames = useMemo(
    () => [...new Set((muscleGroups ?? []).map((m) => m.name))].sort(),
    [muscleGroups],
  );

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
            className="fixed inset-0 bg-black/60 z-[200]"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 left-0 right-0 z-[201] mx-auto max-w-lg"
          >
            <div className="bg-card rounded-t-2xl max-h-[85vh] flex flex-col">
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-surface-border" />
              </div>

              <div className="px-6 pb-4 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Add Exercise</h2>
                  <button onClick={onClose}>
                    <X size={20} className="text-text-secondary" />
                  </button>
                </div>

                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search exercises..."
                    className="w-full bg-elevated rounded-[10px] pl-9 pr-3 py-2.5 text-[15px] text-text-primary placeholder:text-text-secondary/50 outline-none border border-border focus:border-accent transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {showCreate ? (
                  <div className="space-y-4 py-2">
                    <div>
                      <label className="block text-xs font-medium text-muted uppercase tracking-[0.06em] mb-2">
                        Exercise Name
                      </label>
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Cable Crossover"
                        className="w-full bg-elevated rounded-[10px] px-3.5 py-3 text-[15px] text-text-primary placeholder:text-text-secondary/50 outline-none border border-border focus:border-accent transition-colors"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted uppercase tracking-[0.06em] mb-2">
                        Primary Muscle
                      </label>
                      <select
                        value={newPrimaryMuscle}
                        onChange={(e) => setNewPrimaryMuscle(e.target.value)}
                        className="w-full bg-elevated rounded-[10px] px-3.5 py-3 text-[15px] text-text-primary outline-none border border-border focus:border-accent transition-colors appearance-none"
                      >
                        <option value="">Select muscle...</option>
                        {muscleNames.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted uppercase tracking-[0.06em] mb-2">
                        Category
                      </label>
                      <div className="flex gap-2">
                        {(['compound', 'isolation', 'cardio', 'other'] as const).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setNewCategory(cat)}
                            className={`flex-1 py-2 rounded-[10px] text-xs font-medium capitalize transition-all ${
                              newCategory === cat
                                ? 'bg-accent text-white'
                                : 'bg-elevated text-text-secondary'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCreate(false)}
                        className="flex-1 py-3 rounded-[10px] bg-elevated text-text-secondary text-sm font-medium active:opacity-70 transition-opacity"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreate}
                        disabled={!newName.trim() || !newPrimaryMuscle}
                        className="flex-1 py-3 rounded-[10px] bg-accent text-white text-sm font-semibold active:opacity-70 transition-opacity disabled:opacity-50"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="w-full flex items-center gap-2 py-3 mb-2 text-[15px] text-accent font-medium active:opacity-50 transition-opacity"
                    >
                      <Plus size={18} />
                      Create Custom Exercise
                    </button>

                    {grouped.map(([muscle, items]) => (
                      <div key={muscle} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getMuscleGroupColor(muscle) }}
                          />
                          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                            {muscle}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {items.map((exercise) => {
                            const isExcluded = excludeIds?.includes(exercise.id) ?? false;
                            return (
                              <button
                                key={exercise.id}
                                onClick={() => onSelect(exercise.id)}
                                disabled={disabled || isExcluded}
                                className="w-full flex items-center justify-between py-2.5 px-3 rounded-[10px] active:bg-surface-elevated transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <span className="text-[15px] text-text-primary">{exercise.name}</span>
                                <div className="flex items-center gap-2">
                                  {isExcluded && (
                                    <span className="text-[10px] text-text-secondary">Added</span>
                                  )}
                                  {exercise.is_custom && (
                                    <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded-full font-medium">
                                      Custom
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {filtered.length === 0 && (
                      <p className="text-center text-[15px] text-text-secondary py-8">
                        No exercises found
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
