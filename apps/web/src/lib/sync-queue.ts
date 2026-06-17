const STORAGE_KEY = 'habit-pending-mutations';

interface PendingMutation {
  id: string;
  name: string;
  args: unknown;
  timestamp: string;
}

function getQueue(): PendingMutation[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: PendingMutation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    console.error('Failed to save sync queue');
  }
}

export function enqueue(name: string, args: unknown): void {
  const queue = getQueue();
  queue.push({
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    name,
    args,
    timestamp: new Date().toISOString(),
  });
  saveQueue(queue);
}

export function dequeue(id: string): void {
  const queue = getQueue();
  const filtered = queue.filter((m) => m.id !== id);
  saveQueue(filtered);
}

export function clearQueue(): void {
  saveQueue([]);
}

export function getPendingCount(): number {
  return getQueue().length;
}

export function processQueue(handlers: Record<string, (args: unknown) => Promise<void>>): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return Promise.resolve();

  return queue.reduce((promise, mutation) => {
    return promise.then(async () => {
      const handler = handlers[mutation.name];
      if (!handler) {
        console.warn(`No handler for mutation: ${mutation.name}`);
        dequeue(mutation.id);
        return;
      }
      try {
        await handler(mutation.args);
        dequeue(mutation.id);
      } catch (error) {
        console.error(`Failed to replay mutation ${mutation.name}:`, error);
      }
    });
  }, Promise.resolve());
}
