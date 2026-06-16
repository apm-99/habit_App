# Technical Specification Document

## 1. Proposed Architecture

### High-Level Architecture (MVP)

```
┌─────────────────────────────────────────────────────────┐
│                    Monorepo (Turborepo)                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  apps/web                                          │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Next.js 14 (App Router)                     │  │  │
│  │  │  TypeScript                                   │  │  │
│  │  │  Tailwind CSS + shadcn/ui                     │  │  │
│  │  │  TanStack Query (persisted to IndexedDB)      │  │  │
│  │  │  Serwist (service worker)                     │  │  │
│  │  │  @use-gesture/react (swipe)                    │  │  │
│  │  │  Sentry (error tracking)                      │  │  │
│  │  │  Supabase JS Client (direct from browser)     │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  packages/db                                       │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Shared TypeScript types                      │  │  │
│  │  │  Supabase client config                       │  │  │
│  │  │  Common utility functions                     │  │  │
│  │  │  Zod validation schemas                       │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  apps/api (V3+)                                    │  │
│  │  (planned: FastAPI + Python)                       │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │                        │
         │ Supabase JS Client     │ TanStack Query persist
         ▼                        ▼
┌───────────────────┐    ┌───────────────────┐
│   Supabase        │    │   Browser         │
│   PostgreSQL      │◄──►│   IndexedDB       │
│   (Cloud)         │    │   (TanStack Cache)│
│                   │    │                   │
│   - habits table  │    │   - habits        │
│   - completions   │    │   - completions   │
│   - RLS policies  │    │   - query cache   │
└───────────────────┘    └───────────────────┘
         ▲
         │
         │ PostgreSQL protocol (local Docker)
         ▼
┌───────────────────┐
│   Supabase Local  │
│   (Docker Dev)    │
└───────────────────┘
```

### Architecture Principles

| Principle | Application |
|---|---|
| **Offline-first** | All reads served from local cache. Writes go local first, then sync to remote. |
| **Supabase as backing store** | Direct browser-to-Supabase via JS client. No custom API server for MVP. |
| **Read from cache, write through** | TanStack Query serves cached data; mutations write to Supabase and update cache. |
| **Schema-ready for multi-user** | `user_id` column present from day 1; RLS policies scoped to `auth.uid()`. |
| **Static-first, dynamic second** | Next.js static generation where possible; dynamic routes for habit-specific pages. |

## 2. Technology Stack

### Frontend (apps/web)

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14.2+ (App Router) | React framework, routing, SSR/SSG |
| TypeScript | 5.4+ | Type safety |
| Tailwind CSS | 3.4+ | Utility-first styling |
| shadcn/ui | latest | Primitive UI components |
| TanStack Query | 5.x | Server state management, caching, persistence |
| TanStack Query Persist Client | 5.x | IndexedDB persistence for offline |
| @use-gesture/react | 10.x | Swipe and tap gesture recognition |
| Serwist | latest | PWA service worker management |
| @sentry/nextjs | 8.x | Error tracking |
| Supabase JS Client | 2.x | Database access |
| Lucide React | latest | Icon set |
| Zod | 3.x | Schema validation |
| date-fns | 3.x | Date manipulation |
| recharts | 2.x | Trend line charts (V2) |

### Shared (packages/db)

| Technology | Purpose |
|---|---|
| TypeScript | Shared types |
| Zod | Validation schemas shared between client and DB |
| Supabase JS Client config | Centralized client setup |

### Database

| Technology | Version | Purpose |
|---|---|---|
| Supabase PostgreSQL | 15.x | Primary data store |
| Supabase Local CLI | latest | Local development via Docker |

### Developer Tools

| Tool | Purpose |
|---|---|
| Turborepo | Monorepo orchestration |
| pnpm | Package manager (workspaces) |
| Vitest | Unit/integration testing |
| Testing Library | React component tests |
| MSW (v2) | API mocking for tests |
| ESLint | Code linting |
| Prettier | Code formatting |
| Supabase CLI | Schema migrations, local dev |
| Sentry CLI | Source map upload |

## 3. Backend Architecture

### MVP: No Custom Backend

For the single-user MVP, **there is no backend server**. The architecture is:

```
Browser ──Supabase JS Client──► Supabase PostgreSQL
   │
   ├── Read: Direct SELECT queries (via TanStack Query)
   ├── Write: Direct INSERT/UPDATE/DELETE mutations
   └── Auth: Anonymous Auth (Supabase GoTrue)
```

**Why this works:**
- Supabase JS client connects directly from the browser to the database
- Row-Level Security (RLS) policies control access scoped to `auth.uid()`
- No CORS, no API gateway, no server-side logic needed
- TanStack Query handles caching, deduplication, and background refetching

### V3+: FastAPI Backend (Planned)

```
Browser ──HTTPS──► FastAPI ──AsyncPG──► Supabase PostgreSQL
                     │
                     ├── Authentication middleware
                     ├── Rate limiting
                     ├── Sync conflict resolution
                     └── WebSocket for real-time sync
```

## 4. Frontend Architecture

### Route Design (Next.js App Router)

```
app/
├── layout.tsx              ← Root layout (providers, theme, service worker)
├── page.tsx                ← Today page (default route "/")
├── habits/
│   ├── page.tsx            ← Habits list page
│   └── [id]/
│       └── page.tsx        ← Individual habit detail (future)
├── stats/
│   └── page.tsx            ← Statistics dashboard
├── settings/
│   └── page.tsx            ← Settings page
├── error.tsx               ← Global error boundary
├── loading.tsx             ← Global loading skeleton
└── global-error.tsx        ← Fatal error boundary
```

### Component Tree

```
<Providers>                    (layout.tsx)
├── <QueryClientProvider>      TanStack Query
│   └── <PersistQueryClient>  IndexedDB persistence
├── <ThemeProvider>            Dark mode theming
├── <SentryProvider>           Error tracking
└── <SerwistProvider>          Service worker registration

<AppShell>                     (shared layout)
├── <OfflineBanner>           Conditional: "You're offline"
├── {children}                 Page content
└── <BottomNav>               Tab bar (Today, Habits, Stats, Settings)

<TodayPage>
├── <DateHeader>
└── <HabitList>
    └── <HabitCard>[]
        ├── <CategoryDot>
        ├── <HabitName>
        ├── <ScheduleBadge>
        ├── <StreakBadge>
        └── <CompleteButton>
            └── @use-gesture swipe handler

<HabitsPage>
├── <PageHeader> + AddButton
├── <CategoryFilter>
└── <HabitList>
    └── <HabitCard>[] (with edit/archive actions)
        └── <HabitFormSheet> (bottom sheet for create/edit)

<StatsPage>
├── <SummaryCards>
├── <MonthlyCalendar>
└── <YearlyHeatmap>

<SettingsPage>
├── <ThemeToggle>
└── <AboutSection>
```

### Data Layer Architecture

```
TanStack Query
│
├── QueryClient (global)
│   └── persistQueryClient({ persister: createSyncStoragePersister(...) })
│       → IndexedDB via @tanstack/query-persist-client/storage
│       → obfuscated before writing to IndexedDB
│
├── Queries (reads)
│   ├── useHabits()
│   │   → queryKey: ['habits']
│   │   → queryFn: supabase.from('habits').select('*').eq('archived', false)
│   │
│   ├── useHabit(id)
│   │   → queryKey: ['habits', id]
│   │
│   ├── useCompletions(dateRange)
│   │   → queryKey: ['completions', { start, end }]
│   │   → queryFn: supabase.from('habit_completions').select('*')
│   │       .gte('completed_at', start).lte('completed_at', end)
│   │
│   └── useCompletionsForHabit(habitId, dateRange)
│
├── Mutations (writes)
│   ├── useCreateHabit()
│   ├── useUpdateHabit()
│   ├── useDeleteHabit()
│   ├── useArchiveHabit()
│   └── useToggleCompletion()
│       → Checks if completion exists for today
│       → If exists: DELETE (undo)
│       → If not: INSERT
│       → optimistic: toggle cache immediately
│
└── Subscriptions (real-time, future V3)
    └── supabase.channel('completions').on('postgres_changes', ...)
```

### Offline Sync Architecture

```
User completes habit (offline)
        │
        ▼
TanStack Query mutation
        │
        ├── onMutate: Optimistic update to cache + IndexedDB persist
        │
        ├── mutationFn: supabase.from('habit_completions').insert(...)
        │   └── FAILS (offline) → error caught
        │
        ├── onError: Queue mutation to pending writes list
        │   └── Store in IndexedDB: { key, mutationFn, variables, timestamp }
        │
        └── online event fires
                │
                ▼
        Replay queue (FIFO order)
                │
                ├── Execute each queued mutation
                ├── Last-write-wins: if server has newer timestamp, skip
                └── on success: remove from queue + invalidate queries
```

## 5. Database Design

### Tables

```sql
CREATE TABLE habits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT '',
  frequency_type  TEXT NOT NULL DEFAULT 'daily'
                    CHECK (frequency_type IN ('daily', 'weekly', 'custom_days')),
  target_count    INT NOT NULL DEFAULT 1 CHECK (target_count >= 1 AND target_count <= 7),
  custom_days     INT[] NOT NULL DEFAULT '{}',
  reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_time   TIME DEFAULT NULL,
  archived        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id         UUID NOT NULL DEFAULT auth.uid()
);

CREATE TABLE habit_completions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id      UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id       UUID NOT NULL DEFAULT auth.uid()
);

CREATE UNIQUE INDEX idx_one_completion_per_day
  ON habit_completions (habit_id, (completed_at::date));

CREATE INDEX idx_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_completions_date ON habit_completions(completed_at);
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_completions_user_id ON habit_completions(user_id);
CREATE INDEX idx_habits_archived ON habits(archived) WHERE archived = FALSE;
CREATE INDEX idx_habits_category ON habits(category);
```

### RLS Policies

```sql
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON habits
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON habits
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own completions" ON habit_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own completions" ON habit_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions" ON habit_completions
  FOR DELETE USING (auth.uid() = user_id);
```

### Auto-set user_id on insert

```sql
CREATE OR REPLACE FUNCTION set_habit_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_habits_user_id_on_insert
  BEFORE INSERT ON habits
  FOR EACH ROW EXECUTE FUNCTION set_habit_user_id();

CREATE OR REPLACE FUNCTION set_completion_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_completions_user_id_on_insert
  BEFORE INSERT ON habit_completions
  FOR EACH ROW EXECUTE FUNCTION set_completion_user_id();
```

## 6. API Design

### No REST API (MVP)

All data operations use the **Supabase JS Client API** directly from the browser.

### Query Patterns

```typescript
// Read Habits
supabase.from('habits').select('*').eq('archived', false).order('created_at')

// Read Completions for Date Range
supabase.from('habit_completions').select('*')
  .gte('completed_at', startOfDay)
  .lte('completed_at', endOfDay)

// Create Habit
supabase.from('habits').insert({ name, description, category, frequency_type, ... })

// Toggle Completion
const existing = await supabase.from('habit_completions').select('id')
  .eq('habit_id', habitId)
  .eq('completed_at::date', today)
if (existing) {
  await supabase.from('habit_completions').delete().eq('id', existing.id)
} else {
  await supabase.from('habit_completions').insert({ habit_id: habitId })
}
```

## 7. Deployment Strategy

### Infrastructure (MVP)

| Component | Provider | Plan | Cost |
|---|---|---|---|
| Frontend | Vercel | Hobby (Free) | $0 |
| Database | Supabase | Free | $0 |
| Error Tracking | Sentry | Free (300/hr) | $0 |
| Source Control | GitHub | Free | $0 |

### Deployment Pipeline

```
Git push to main branch
        │
        ▼
Vercel detects push (GitHub integration)
        │
        ├── Build: next build (Turborepo)
        ├── Lint: next lint
        ├── Test: vitest run
        ├── Upload source maps to Sentry
        └── Deploy to Vercel (if build + tests pass)
                │
                ▼
        Production: habit-app.vercel.app
```

### vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build --filter=web",
  "installCommand": "pnpm install",
  "regions": ["iad1"]
}
```

### Environment Variables

| Variable | Source | Used In |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings | Runtime |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings | Runtime |
| `SENTRY_DSN` | Sentry project settings | Runtime |
| `SENTRY_AUTH_TOKEN` | Sentry CI | Build |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry project settings | Runtime |

### Local Development

```
1. Install: pnpm install
2. Start Supabase local: supabase start
3. Apply migrations: supabase db push
4. Start dev server: pnpm dev
5. Results:
   - Web: http://localhost:3000
   - Supabase Studio: http://localhost:54323
   - Supabase DB: postgresql://postgres:postgres@localhost:54322/postgres
```

## 8. Monitoring Strategy

### MVP Monitoring

| Category | Tool | What We Monitor |
|---|---|---|
| Error tracking | Sentry | Unhandled exceptions, API failures, render errors |
| Performance | Lighthouse CI | Core Web Vitals, PWA score |
| Uptime | Vercel status page | Deployment and hosting availability |

### Sentry Configuration

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.5,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
});
```

## 9. Logging Strategy

### Console-based Logging

```typescript
// lib/logger.ts
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel: LogLevel =
  process.env.NODE_ENV === 'production' ? 'error' : 'debug';

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  switch (level) {
    case 'error':
      console.error(JSON.stringify(entry));
      Sentry.captureMessage(message, { level: 'error', extra: context });
      break;
    case 'warn':
      console.warn(JSON.stringify(entry));
      break;
    case 'info':
      console.info(JSON.stringify(entry));
      break;
    case 'debug':
      console.debug(JSON.stringify(entry));
      break;
  }
}
```

### What to Log

| Event | Level | Context |
|---|---|---|
| Habit created | info | habit_id, name |
| Completion toggled | debug | habit_id, date, action |
| Offline/Online detected | info | — |
| Sync replay started/completed | info | pending_mutation_count |
| Sync conflict resolved | warn | habit_id |
| Supabase query error | error | query details, error code |

## 10. Testing Strategy

### Test Pyramid

```
        /\
       /  \       E2E (P2, future)
      /    \
     /──────\     Integration (P1)
    /        \
   /──────────\  Unit (P0 - MVP focus)
  /            \
 /──────────────\
```

### MVP: Unit Tests (Vitest)

**Location:** `apps/web/src/**/*.test.ts` (co-located with source)

| Category | What to Test | Priority |
|---|---|---|
| Frequency scheduling | isScheduledToday, weekly calculation, custom days | P0 |
| Streak calculation | Current streak, longest streak, streak break, partial week | P0 |
| Completion rate | Rate = completed / scheduled, edge cases (0/0) | P0 |
| Date utilities | UTC-to-local, day boundaries, week/month ranges | P0 |
| Validation | Zod schemas, empty name, invalid frequency | P0 |
| Sync queue | Enqueue, replay FIFO, deduplication, LWW | P0 |
| TanStack hooks | Toggle completion, create habit — optimistic updates | P1 |

### Test Runner Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/', 'src/hooks/', 'src/schemas/'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 85,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

## 11. CI/CD Strategy

### CI Pipeline (GitHub Actions)

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2 with: { version: latest }
      - uses: actions/setup-node@v4 with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck --filter=web
      - run: pnpm lint --filter=web
      - run: pnpm test --filter=web env: { CI: true }
      - run: pnpm build --filter=web
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ vars.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ vars.SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_SENTRY_DSN: ${{ vars.SENTRY_DSN }}
```

### Branch Strategy

| Branch | Purpose | CI | Deploy |
|---|---|---|---|
| `main` | Production-ready | Full pipeline | Auto-deploy to Vercel |
| `feat/*` | Feature work | Lint + typecheck + test | Preview |
| `fix/*` | Bug fixes | Lint + typecheck + test | Preview |

## 12. Scalability Considerations

| Dimension | Capacity | Why It Works |
|---|---|---|
| Users | 1 (MVP), thousands (V3+) | RLS-ready schema, Supabase scales vertically |
| Habits per user | 100-500 | IndexedDB handles 10k+ records easily |
| Completions | 100k+/year | ~1KB/completion → <100MB for 10 years |
| Storage | 500MB (Supabase free) | Enough for 10+ years of data |

### Bottleneck Limits & Mitigations

| Bottleneck | Limit | Mitigation |
|---|---|---|
| Supabase free rows | 50,000 rows | ~50 years for single user |
| Supabase free bandwidth | 5 GB/month | ~1k calls/month for single user |
| iOS IndexedDB eviction | ~500MB | Supabase as backup; restore on reconnect |
| Vercel Hobby build minutes | 6,000/mo | Personal project uses <100/mo |

## 13. Cost Analysis

### MVP Monthly Cost

| Service | Plan | Monthly Cost |
|---|---|---|
| Vercel | Hobby | $0 |
| Supabase | Free | $0 |
| Sentry | Free | $0 |
| GitHub | Free | $0 |
| **Total** | | **$0** |

### Future Cost Projections

| Version | Services Added | Est. Monthly Cost |
|---|---|---|
| V1 (MVP) | As above | $0 |
| V2 | None | $0 |
| V3 | FastAPI on Render + Supabase Pro | $25-30/mo |
