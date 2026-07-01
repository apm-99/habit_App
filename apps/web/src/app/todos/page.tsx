'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import { TodoCard } from '@/components/TodoCard';
import { TodoForm } from '@/components/TodoForm';
import { UndoToast } from '@/components/UndoToast';
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useCleanupOldTodos,
} from '@/hooks/useTodos';
import { Plus, ChevronDown, CheckCircle2, ListTodo, Sunrise, Sunset } from 'lucide-react';
import { format, addDays } from 'date-fns';
import type { CreateTodoInput, Todo } from '@repo/db';

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center pt-16 pb-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-card border border-surface-border flex items-center justify-center">
        <ListTodo size={28} className="text-accent" />
      </div>
      <h2 className="text-[22px] font-[400] tracking-[-0.01em] text-text-primary">
        No tasks for today
      </h2>
      <p className="text-[15px] text-text-secondary mt-2.5 max-w-[280px] mx-auto leading-relaxed">
        Add your first task above to get started.
      </p>
      <button
        onClick={onAdd}
        className="mt-4 border border-text-secondary/50 rounded-[20px] px-6 py-2.5 text-[15px] text-text-primary active:opacity-50 transition-opacity"
      >
        Add Task
      </button>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  label,
  count,
  collapsed,
  onToggle,
  iconColor,
}: {
  icon: typeof Sunrise;
  label: string;
  count: number;
  collapsed?: boolean;
  onToggle?: () => void;
  iconColor?: string;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={!onToggle}
      className={`flex items-center gap-2 mb-2 ${onToggle ? 'active:opacity-60 transition-opacity' : ''}`}
    >
      <Icon size={16} style={{ color: iconColor ?? '#9A9AA2' }} />
      <span className="text-[13px] font-[500] text-text-secondary uppercase tracking-[0.06em]">
        {label}
      </span>
      {count > 0 && (
        <span className="text-[11px] text-muted font-medium bg-surface-card rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
          {count}
        </span>
      )}
      {onToggle && (
        <motion.div
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-auto"
        >
          <ChevronDown size={14} className="text-tertiary" />
        </motion.div>
      )}
    </button>
  );
}

export default function TodosPage() {
  const [mounted, setMounted] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>(undefined);
  const [deletedTodo, setDeletedTodo] = useState<Todo | undefined>(undefined);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const cleanupRanRef = useRef(false);
  const quickAddRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: todos, isLoading } = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const { deleteTodo, undoDelete } = useDeleteTodo();
  const cleanupOldTodos = useCleanupOldTodos();

  useEffect(() => {
    if (mounted && todos && todos.length > 0 && !cleanupRanRef.current) {
      cleanupRanRef.current = true;
      cleanupOldTodos.mutate();
    }
  }, [mounted, todos, cleanupOldTodos]);

  const { todayStr, tomorrowStr } = useMemo(() => ({
    todayStr: format(new Date(), 'yyyy-MM-dd'),
    tomorrowStr: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
  }), []);

  const { todayTodos, tomorrowTodos, laterTodos, completedTodos } = useMemo(() => {
    if (!todos) return { todayTodos: [], tomorrowTodos: [], laterTodos: [], completedTodos: [] };

    const today: Todo[] = [];
    const tomorrow: Todo[] = [];
    const later: Todo[] = [];
    const completed: Todo[] = [];

    for (const todo of todos) {
      if (todo.completed) {
        completed.push(todo);
      } else if (todo.due_date === todayStr) {
        today.push(todo);
      } else if (todo.due_date === tomorrowStr) {
        tomorrow.push(todo);
      } else {
        later.push(todo);
      }
    }

    return { todayTodos: today, tomorrowTodos: tomorrow, laterTodos: later, completedTodos: completed };
  }, [todos, todayStr, tomorrowStr]);

  const hasAnyTodos = useMemo(() => {
    if (!todos) return false;
    return todos.length > 0;
  }, [todos]);

  const handleQuickAdd = useCallback(async () => {
    const trimmed = quickAddValue.trim();
    if (!trimmed) return;

    await createTodo.mutateAsync({ title: trimmed });
    setQuickAddValue('');
    setTimeout(() => quickAddRef.current?.focus(), 50);
  }, [quickAddValue, createTodo]);

  const handleFormSubmit = useCallback(async (input: CreateTodoInput) => {
    if (editingTodo) {
      await updateTodo.mutateAsync({ id: editingTodo.id, ...input });
    } else {
      await createTodo.mutateAsync(input);
    }
    setShowForm(false);
    setEditingTodo(undefined);
  }, [editingTodo, createTodo, updateTodo]);

  const handleToggleComplete = useCallback(
    (todo: Todo) => {
      updateTodo.mutate({ id: todo.id, completed: !todo.completed });
    },
    [updateTodo],
  );

  const handleEdit = useCallback((todo: Todo) => {
    setEditingTodo(todo);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    (todo: Todo) => {
      setDeletedTodo(todo);
      deleteTodo(todo);
    },
    [deleteTodo],
  );

  const handleUndoDelete = useCallback(() => {
    if (deletedTodo) {
      undoDelete(deletedTodo);
      setDeletedTodo(undefined);
    }
  }, [deletedTodo, undoDelete]);

  return (
    <AppShell>
      <div className="px-5 pt-14 pb-24">
        <div className="flex items-center justify-between mb-0.5">
          <h1 className="text-[36px] font-[500] tracking-[-0.02em] text-text-primary leading-tight">
            Todos
          </h1>
        </div>
        {mounted && (
          <p className="text-[15px] text-text-secondary mb-4">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        )}

        <div className="relative mb-6">
          <input
            ref={quickAddRef}
            value={quickAddValue}
            onChange={(e) => setQuickAddValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleQuickAdd();
              }
            }}
            placeholder="Quick add a task..."
            className="w-full bg-surface-card rounded-[10px] px-4 py-3 text-[15px] text-text-primary placeholder:text-text-secondary/50 outline-none border border-surface-border focus:border-accent transition-colors"
          />
          {quickAddValue.trim() && (
            <button
              onClick={handleQuickAdd}
              disabled={createTodo.isPending}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-[28px] h-[28px] rounded-full bg-accent flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <Plus size={14} className="text-white" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[52px] rounded-2xl bg-surface-card animate-pulse" />
            ))}
          </div>
        ) : !hasAnyTodos ? (
          <EmptyState onAdd={() => setShowForm(true)} />
        ) : (
          <div className="space-y-6">
            {todayTodos.length > 0 && (
              <div>
                <SectionHeader
                  icon={Sunrise}
                  label="Today"
                  count={todayTodos.length}
                  iconColor="#FF6B4A"
                />
                <div className="space-y-2">
                  {todayTodos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <TodoCard
                        todo={todo}
                        onToggle={() => handleToggleComplete(todo)}
                        onClick={() => handleEdit(todo)}
                        onDelete={() => handleDelete(todo)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {tomorrowTodos.length > 0 && (
              <div>
                <SectionHeader
                  icon={Sunset}
                  label="Tomorrow"
                  count={tomorrowTodos.length}
                  iconColor="#FF9F0A"
                />
                <div className="space-y-2">
                  {tomorrowTodos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <TodoCard
                        todo={todo}
                        onToggle={() => handleToggleComplete(todo)}
                        onClick={() => handleEdit(todo)}
                        onDelete={() => handleDelete(todo)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {laterTodos.length > 0 && (
              <div>
                <SectionHeader
                  icon={Sunset}
                  label="Later"
                  count={laterTodos.length}
                  iconColor="#BF5AF2"
                />
                <div className="space-y-2">
                  {laterTodos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <TodoCard
                        todo={todo}
                        onToggle={() => handleToggleComplete(todo)}
                        onClick={() => handleEdit(todo)}
                        onDelete={() => handleDelete(todo)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {completedTodos.length > 0 && (
              <div>
                <SectionHeader
                  icon={CheckCircle2}
                  label="Completed"
                  count={completedTodos.length}
                  collapsed={completedCollapsed}
                  onToggle={() => setCompletedCollapsed(!completedCollapsed)}
                  iconColor="#3DD68C"
                />
                <AnimatePresence>
                  {!completedCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2">
                        {completedTodos.map((todo) => (
                          <motion.div
                            key={todo.id}
                            layout
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                          >
                            <TodoCard
                              todo={todo}
                              onToggle={() => handleToggleComplete(todo)}
                              onClick={() => handleEdit(todo)}
                              onDelete={() => handleDelete(todo)}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      <TodoForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTodo(undefined);
        }}
        onSubmit={handleFormSubmit}
        initial={editingTodo}
        saving={createTodo.isPending || updateTodo.isPending}
        error={
          createTodo.error
            ? (createTodo.error as Error).message
            : updateTodo.error
              ? (updateTodo.error as Error).message
              : null
        }
      />

      {deletedTodo && (
        <UndoToast
          message={`"${deletedTodo.title}" deleted`}
          onUndo={handleUndoDelete}
          onDismiss={() => setDeletedTodo(undefined)}
        />
      )}
    </AppShell>
  );
}
