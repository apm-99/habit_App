# Project Roadmap

## 1. Milestone Overview

| Milestone | Version | Theme | Estimated Duration | Dependencies |
|---|---|---|---|---|
| **M0: Foundation** | Pre-v1 | Project scaffolding, tooling, dev environment | 3 days | None |
| **M1: Core Habits** | v0.1 | Habit CRUD, Supabase integration, RLS, local obfuscation | 5 days | M0 |
| **M2: Habit Completion** | v0.2 | Tap/swipe complete, schedules, offline-first, optimism | 5 days | M1 |
| **M3: Statistics** | v0.3 | Streaks, heatmaps, calendars, completion rate | 5 days | M2 |
| **M4: PWA & Polish** | v1.0 (MVP) | Service worker, offline, animations, testing, deploy | 5 days | M3 |
| **V2: Reminders & Data** | v2.0 | Push notifications, data export, light mode | 10 days | M4 |
| **V3: Multi-User** | v3.0 | Authentication, cloud sync, multi-device | 15 days | V2 |

**Total MVP timeline: ~23 working days (5 weeks)**

---

## 2. Milestone M0 — Foundation (3 days)

### Epic M0.1: Repository Setup

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Initialize Turborepo monorepo with `pnpm` workspaces | None | 30 min |
| P0 | Create `apps/web` (Next.js 14 + App Router + TypeScript) | M0.1.1 | 30 min |
| P0 | Create `packages/db` (shared types, Zod schemas, Supabase config) | M0.1.1 | 30 min |
| P0 | Configure `tsconfig` for path aliases across packages | M0.1.2, M0.1.3 | 15 min |
| P0 | Set up `turbo.json` pipeline (build, lint, test, typecheck) | M0.1.2 | 15 min |
| P0 | Configure ESLint + Prettier (shared config) | M0.1.2 | 20 min |

### Epic M0.2: Dependencies & Configuration

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Install & configure Tailwind CSS + `tailwind.config.ts` | M0.1.2 | 20 min |
| P0 | Install shadcn/ui (`npx shadcn@latest init`) + base components | M0.1.2 | 30 min |
| P0 | Install and configure TanStack Query with persist client | M0.1.2 | 30 min |
| P0 | Install Lucide React, date-fns, Zod | M0.1.2 | 10 min |
| P0 | Install `@use-gesture/react` | M0.1.2 | 10 min |
| P0 | Install Serwist (`@serwist/next`) | M0.2.4 | 30 min |
| P0 | Install `@sentry/nextjs` | M0.1.2 | 20 min |
| P1 | Install recharts (for trend charts, V2) | M0.1.2 | 10 min |

### Epic M0.3: Supabase & Database

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create Supabase project (cloud) | None | 10 min |
| P0 | Initialize Supabase local (`supabase init` + `supabase start`) | M0.1.2 | 20 min |
| P0 | Create migration: `habits` table | M0.3.2 | 30 min |
| P0 | Create migration: `habit_completions` table | M0.3.3 | 20 min |
| P0 | Create migration: indexes and unique constraints | M0.3.4 | 15 min |
| P0 | Create migration: RLS policies + triggers | M0.3.5 | 30 min |
| P0 | Create `lib/supabase.ts` client singleton | M0.1.3, M0.3.2 | 15 min |
| P0 | Apply migrations to cloud Supabase | M0.3.6 | 10 min |

### Epic M0.4: Testing Foundation

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Install Vitest + Testing Library + jsdom | M0.1.2 | 15 min |
| P0 | Create `vitest.config.ts` with path aliases | M0.4.1 | 15 min |
| P0 | Create test setup file (`src/test/setup.ts`) | M0.4.2 | 15 min |
| P0 | Write first sanity test (verify test runner works) | M0.4.3 | 10 min |
| P1 | Install MSW (Mock Service Worker) for integration tests | M0.4.3 | 15 min |

### Epic M0.5: CI/CD

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `.github/workflows/ci.yml` (lint, typecheck, test, build) | M0.1.5 | 30 min |
| P0 | Configure `vercel.json` for deployments | M0.1.2 | 15 min |
| P0 | Link Vercel project to GitHub repo | M0.5.2 | 10 min |
| P0 | Set environment variables in Vercel Dashboard | M0.3.1 | 10 min |
| P1 | Add `pnpm audit` step to CI workflow | M0.5.1 | 10 min |

### Epic M0.6: Design Tokens & Theme

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Define CSS custom properties (--bg-primary, --text-primary, etc.) | M0.2.1 | 30 min |
| P0 | Configure Tailwind `darkMode` class strategy | M0.2.1 | 10 min |
| P0 | Create global CSS with Inter font import, base styles | M0.6.1 | 20 min |
| P1 | Create `ThemeProvider` component | M0.6.3 | 30 min |

### Epic M0.7: Anonymous Auth

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `lib/auth.ts` — `ensureAnonymousSession()` | M0.3.6 | 30 min |
| P0 | Create `AuthProvider` — initialize on app mount | M0.7.1, M0.1.2 | 30 min |
| P0 | Wire provider into root layout | M0.7.2 | 10 min |
| P0 | Test RLS with anonymous user (Supabase dashboard) | M0.3.7, M0.7.3 | 20 min |

**M0 Exit Criteria:**
- [x] `pnpm dev` starts the app at localhost:3000
- [x] Supabase local instance running with all migrations applied
- [x] Anonymous auth flow creates a session on first load
- [x] `pnpm test` runs and passes sanity test
- [x] `pnpm lint` passes with zero errors
- [x] `pnpm build` completes successfully
- [x] GitHub Actions CI passes on a test PR
- [x] Vercel auto-deploys from `main` branch

---

## 3. Milestone M1 — Core Habits (5 days)

### Epic M1.1: Shared Types & Validation

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Define `Habit` type in `packages/db/src/types.ts` | M0.1.3 | 20 min |
| P0 | Define `HabitCompletion` type | M0.1.3 | 15 min |
| P0 | Define `FrequencyType` union type | M0.1.3 | 10 min |
| P0 | Define Zod schemas for habit creation and update | M0.1.3 | 30 min |
| P0 | Write unit tests for Zod validation | M1.1.4 | 30 min |
| P0 | Export all types and schemas from `packages/db/src/index.ts` | M1.1.4 | 10 min |

### Epic M1.2: TanStack Query Hooks — Habits

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `useHabits` query hook | M0.2.3, M1.1.5 | 30 min |
| P0 | Create `useHabit(id)` query hook | M1.2.1 | 20 min |
| P0 | Create `useCreateHabit` mutation hook | M1.2.1 | 30 min |
| P0 | Create `useUpdateHabit` mutation hook | M1.2.1 | 30 min |
| P0 | Create `useArchiveHabit` mutation hook | M1.2.1 | 20 min |
| P0 | Create `useDeleteHabit` mutation hook | M1.2.1 | 20 min |
| P0 | Add optimistic updates to all mutation hooks | M1.2.3–6 | 30 min |
| P0 | Write unit tests for all habit hooks | M1.2.7 | 45 min |

### Epic M1.3: Local Persistence (TanStack Persist)

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Configure `persistQueryClient` with IndexedDB storage adapter | M0.2.3 | 30 min |
| P0 | Implement IndexedDB obfuscation layer (XOR) | M0.6.1 | 30 min |
| P0 | Create `lib/storage.ts` — custom storage adapter wrapping obfuscation | M1.3.2 | 30 min |
| P0 | Wire storage adapter into persist configuration | M1.3.3 | 15 min |
| P0 | Test: verify cache survives page reload | M1.3.4 | 20 min |
| P0 | Test: verify obfuscated data in DevTools IndexedDB tab | M1.3.5 | 15 min |

### Epic M1.4: UI — Habit Cards

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `HabitCard` component | M0.2.2, M1.1.5 | 45 min |
| P0 | Create `CategoryDot` component (8px colored circle) | M1.4.1 | 15 min |
| P0 | Create `ScheduleBadge` component | M1.4.1 | 30 min |
| P0 | Create `StreakBadge` component (number pill) | M1.4.1 | 20 min |
| P0 | Create `HabitList` component | M1.4.1 | 30 min |
| P0 | Style all components per design spec | M1.4.2–5 | 30 min |

### Epic M1.5: UI — Habit Form (Bottom Sheet)

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `HabitFormSheet` component (shadcn Sheet) | M0.2.2, M1.1.5 | 1 hr |
| P0 | Implement form fields: name, description, category | M1.5.1 | 30 min |
| P0 | Implement frequency selector (radio group) | M1.5.1 | 45 min |
| P0 | Implement day picker (7 chips: Mon-Sun) | M1.5.1 | 30 min |
| P0 | Implement reminder toggle + time picker | M1.5.1 | 30 min |
| P0 | Wire form submit to `useCreateHabit` / `useUpdateHabit` | M1.5.6, M1.2.3 | 30 min |
| P0 | Add Zod validation display | M1.5.7 | 30 min |
| P0 | Add swipe-down-to-dismiss gesture | M1.5.1 | 20 min |

### Epic M1.6: UI — Habits Page

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `HabitsPage` (`app/habits/page.tsx`) | M1.4.6, M1.5.7 | 30 min |
| P0 | Create `PageHeader` with title and "+" button | M1.6.1 | 20 min |
| P0 | Create `CategoryFilter` horizontal scroll chips | M1.6.1 | 30 min |
| P0 | Wire "+" button to open `HabitFormSheet` in create mode | M1.6.2 | 15 min |
| P0 | Wire card tap to open `HabitFormSheet` in edit mode | M1.6.1 | 15 min |
| P0 | Wire long-press on card to context menu | M1.6.1 | 30 min |
| P0 | Create `EmptyState` component | M1.6.1 | 30 min |
| P0 | Add page transition animation | M1.6.1 | 20 min |
| P0 | Write component tests for HabitsPage | M1.6.1–8 | 30 min |

**M1 Exit Criteria:**
- [x] Can create, edit, archive, and delete habits
- [x] Habits persist across page reload (TanStack + IndexedDB)
- [x] Habits sync to Supabase
- [x] Form validates required fields
- [x] Empty state displays when no habits exist
- [x] All habit hooks have passing unit tests

---

## 4. Milestone M2 — Habit Completion (5 days)

### Epic M2.1: TanStack Query Hooks — Completions

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `useCompletions(dateRange)` query hook | M0.2.3, M1.1.2 | 30 min |
| P0 | Create `useCompletionsForHabit(habitId, dateRange)` query hook | M2.1.1 | 20 min |
| P0 | Create `useToggleCompletion` mutation hook | M2.1.1 | 45 min |
| P0 | Implement optimistic toggle | M2.1.3 | 30 min |
| P0 | Handle undo | M2.1.4 | 30 min |
| P0 | Create offline mutation queue (`lib/sync-queue.ts`) | M2.1.3 | 45 min |
| P0 | Write unit tests for toggle, undo, and offline queue | M2.1.3–6 | 45 min |

### Epic M2.2: Frequency Scheduling Engine

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `lib/schedule.ts` — `isScheduledToday()` | M1.1.3 | 45 min |
| P0 | Create `getScheduledDaysForMonth()` | M2.2.1 | 30 min |
| P0 | Create `getWeeklyTargetProgress()` | M2.2.1 | 30 min |
| P0 | Write exhaustive unit tests for schedule engine | M2.2.1–3 | 1 hr |
| P0 | Test: habit appears in Today view only when scheduled | M2.2.4, M1.4.6 | 30 min |

### Epic M2.3: UI — Complete Button

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `CompleteButton` (circular, 44x44px) | M0.2.2, M2.1.3 | 30 min |
| P0 | Implement animated fill | M2.3.1 | 45 min |
| P0 | Wire tap → `useToggleCompletion` | M2.3.2 | 15 min |
| P0 | Implement swipe gesture via `@use-gesture/react` | M1.4.1, M2.3.2 | 45 min |
| P0 | Swipe: reveal green background behind card | M2.3.4 | 30 min |
| P0 | Swipe: snap card back to completed state | M2.3.5 | 30 min |
| P0 | Create `UndoToast` (5-second window) | M2.1.5 | 30 min |
| P0 | Handle offline visual feedback | M2.1.6, M2.3.3 | 20 min |
| P0 | Write component tests for CompleteButton | M2.3.1–8 | 30 min |

### Epic M2.4: UI — Today Page

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `TodayPage` (`app/page.tsx`) | M2.3.3, M2.2.4 | 30 min |
| P0 | Create `DateHeader` | M2.4.1 | 15 min |
| P0 | Create `OfflineBanner` component | M2.4.1 | 20 min |
| P0 | Filter habits to "scheduled today" only | M2.4.1, M2.2.4 | 20 min |
| P0 | Order habits: uncompleted first, then completed | M2.4.1 | 20 min |
| P0 | Wire `OfflineBanner` to `navigator.onLine` events | M2.4.3 | 20 min |
| P0 | Style Today page per design spec | M2.4.1–6 | 30 min |

### Epic M2.5: Offline Sync Layer

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `useOnlineStatus` hook | None | 15 min |
| P0 | Create `lib/sync.ts` — `processSyncQueue()` | M2.1.6 | 45 min |
| P0 | Implement last-write-wins | M2.5.2 | 30 min |
| P0 | Wire `online` event → trigger `processSyncQueue()` | M2.5.2 | 15 min |
| P0 | Wire TanStack Query's `networkMode` | M2.5.1 | 20 min |
| P0 | Write unit tests for sync queue | M2.5.2–5 | 45 min |

**M2 Exit Criteria:**
- [x] Tap-to-complete with animated checkmark
- [x] Swipe-to-complete reveals green background
- [x] Undo works within 5 seconds
- [x] Today page shows only scheduled habits
- [x] Offline completions work, queued, and sync automatically
- [x] Offline banner appears when disconnected
- [x] Schedule engine passes all unit tests

---

## 5. Milestone M3 — Statistics (5 days)

### Epic M3.1: Streak Calculation Engine

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `lib/streaks.ts` — `calculateCurrentStreak()` | M2.2.3, M2.1.1 | 1 hr |
| P0 | Create `calculateLongestStreak()` | M3.1.1 | 45 min |
| P0 | Handle weekly frequency streaks | M3.1.2 | 30 min |
| P0 | Write exhaustive unit tests | M3.1.1–3 | 1 hr |

### Epic M3.2: Completion Rate Engine

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `lib/completion-rate.ts` — `calculateRate()` | M3.1.3, M2.2.2 | 45 min |
| P0 | Create aggregated rate across all habits | M3.2.1 | 20 min |
| P0 | Write unit tests | M3.2.2 | 30 min |

### Epic M3.3: TanStack Query Hooks — Statistics

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `useStreaks()` query hook | M3.1.3 | 30 min |
| P0 | Create `useCompletionRate(period)` query hook | M3.2.3 | 20 min |
| P0 | Create `useMonthlyData(year, month)` hook | M2.1.1, M3.3.1 | 30 min |
| P0 | Create `useYearlyData(year)` hook | M2.1.1, M3.3.1 | 30 min |
| P0 | Wire all stats hooks to compute from local cache | M3.3.1–4 | 20 min |
| P0 | Write unit tests for stats hooks | M3.3.1–5 | 30 min |

### Epic M3.4: UI — Summary Cards

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `SummaryCard` component | M0.2.2 | 20 min |
| P0 | Create `SummaryCards` row | M3.3.2, M3.4.1 | 30 min |
| P0 | Add animated streak counter increment | M3.4.2 | 20 min |

### Epic M3.5: UI — Monthly Calendar

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `MonthlyCalendar` component | M3.3.3, M0.2.2 | 1 hr |
| P0 | Implement 4-level color intensity | M3.5.1 | 30 min |
| P0 | Implement day tap → tooltip | M3.5.1 | 30 min |
| P0 | Add month navigation arrows | M3.5.1 | 20 min |
| P0 | Style per design spec | M3.5.1–4 | 20 min |

### Epic M3.6: UI — Yearly Heatmap

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `YearlyHeatmap` component (GitHub-style) | M3.3.4, M0.2.2 | 1 hr |
| P0 | Implement color scale | M3.6.1 | 30 min |
| P0 | Add month labels on top | M3.6.1 | 15 min |
| P0 | Add day labels on left | M3.6.1 | 10 min |
| P0 | Responsive sizing | M3.6.1 | 20 min |

### Epic M3.7: UI — Statistics Page

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `StatsPage` (`app/stats/page.tsx`) | M3.4.2, M3.5.5, M3.6.5 | 30 min |
| P0 | Assemble page: Summary → Monthly → Yearly | M3.7.1 | 20 min |
| P0 | Add scroll-to-section navigation | M3.7.2 | 15 min |
| P0 | Style per design spec | M3.7.2 | 20 min |

**M3 Exit Criteria:**
- [x] Current streak displays correctly (all frequency types)
- [x] Longest streak calculates accurately
- [x] Completion rate shows valid percentage
- [x] Monthly calendar renders with correct color intensity
- [x] Yearly heatmap renders GitHub-style
- [x] All statistics compute from local cache
- [x] Streak engine passes all unit tests

---

## 6. Milestone M4 — PWA & Polish → v1.0 MVP (5 days)

### Epic M4.1: Service Worker (Serwist)

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Configure Serwist in `next.config.js` | M0.2.6 | 30 min |
| P0 | Create service worker: precache static assets | M4.1.1 | 30 min |
| P0 | Implement network-first strategy for Supabase calls | M4.1.1 | 30 min |
| P0 | Implement stale-while-revalidate for static assets | M4.1.1 | 20 min |
| P0 | Create offline fallback page | M4.1.1 | 20 min |
| P0 | Register service worker in root layout | M4.1.2 | 15 min |
| P0 | Test offline: DevTools → Network → Offline | M4.1.6 | 30 min |

### Epic M4.2: PWA Manifest & Installation

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `manifest.json` | M0.2.6 | 30 min |
| P0 | Generate PWA icons (192x192, 512x512) | M4.2.1 | 20 min |
| P0 | Generate iOS splash screen images | M4.2.2 | 15 min |
| P0 | Add apple-touch-icon, apple-mobile-web-app-capable meta tags | M4.2.3 | 15 min |
| P0 | Add viewport-fit=cover for iOS safe areas | M4.2.4 | 10 min |
| P0 | Test install flow on Android Chrome, iOS Safari, Desktop | M4.2.5 | 30 min |
| P0 | Achieve Lighthouse PWA score >= 90 | M4.2.6 | 30 min |

### Epic M4.3: Navigation & Layout

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Create `BottomNav` component (4 tabs) | M1.6.1, M0.2.4 | 45 min |
| P0 | Create `AppShell` layout component | M4.3.1 | 30 min |
| P0 | Wire Next.js layout to use AppShell | M4.3.2 | 15 min |
| P0 | Implement tab switching with cross-fade animation | M4.3.2 | 30 min |
| P0 | Ensure proper safe area padding on mobile | M4.2.5 | 20 min |

### Epic M4.4: Settings Page

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P1 | Create `SettingsPage` (`app/settings/page.tsx`) | M0.2.2 | 30 min |
| P1 | Implement theme toggle | M0.6.3 | 20 min |
| P1 | Add About section | M4.4.1 | 15 min |
| P1 | Add placeholder for data export | M4.4.1 | 15 min |

### Epic M4.5: Animations & Polish

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Add card entry stagger animation | M1.4.6 | 30 min |
| P0 | Add bottom sheet slide-in/out animation | M1.5.1 | 20 min |
| P0 | Add completion checkmark draw animation | M2.3.2 | 30 min |
| P0 | Add swipe reveal animation | M2.3.5 | 30 min |
| P0 | Add streak counter increment animation | M3.4.3 | 20 min |
| P0 | Add `prefers-reduced-motion` support | M4.5.1–5 | 20 min |
| P0 | Add loading skeletons for all pages | M4.5.6 | 30 min |
| P0 | Add 404 page | M4.5.7 | 15 min |

### Epic M4.6: Performance & Lighthouse

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Run Lighthouse audit — address all issues | M4.2.7 | 1 hr |
| P0 | Verify all targets: LCP < 2.5s, FID < 100ms, CLS < 0.1 | M4.6.1 | 30 min |

### Epic M4.7: Final Testing & QA

| Priority | Task | Dependencies | Est. Time |
|---|---|---|---|
| P0 | Run full test suite, fix failures | M4.6.3 | 45 min |
| P0 | Manual QA: iPhone Safari | M4.2.6 | 30 min |
| P0 | Manual QA: Android Chrome | M4.2.6 | 30 min |
| P0 | Manual QA: Desktop Chrome | M4.2.6 | 30 min |
| P0 | Manual QA: Desktop Firefox | M4.7.3 | 20 min |
| P0 | Manual QA: offline → online sync | M2.5.3 | 20 min |
| P0 | Final build: `pnpm build` clean, deployed to production | M4.7.1–6 | 20 min |

**M4 Exit Criteria — MVP v1.0 Complete:**
- [x] All P0 user stories passing acceptance criteria
- [x] App installable on iPhone, Android, Desktop
- [x] Full offline support
- [x] Automatic sync on reconnect (last-write-wins)
- [x] Lighthouse PWA score >= 90
- [x] All Lighthouse scores >= 80
- [x] Full test suite passes
- [x] Manual QA passed on all target platforms
- [x] Deployed to Vercel production

---

## 7. V2 — Reminders & Data (Future, 10 days)

### Epic V2.1: Push Notifications

| Priority | Task | Dependencies |
|---|---|---|
| P1 | Request notification permission flow | M4.2.6 |
| P1 | Create `useReminders` hook | V2.1.1 |
| P1 | Implement notification scheduling via SW | V2.1.2 |
| P1 | Wire habit reminder settings to notification | V2.1.3, M1.5.5 |
| P1 | Test notification delivery | V2.1.4 |

### Epic V2.2: Past-Date Completion

| Priority | Task | Dependencies |
|---|---|---|
| P1 | Add date picker to completion flow | M2.4.1 |
| P1 | Allow completing habits for past dates | V2.2.1, M2.1.3 |

### Epic V2.3: Data Export

| Priority | Task | Dependencies |
|---|---|---|
| P1 | Implement JSON export | M3.9.9 |
| P1 | Implement CSV export | V2.3.1 |

### Epic V2.4: Light Mode

| Priority | Task | Dependencies |
|---|---|---|
| P1 | Define light mode CSS custom properties | M0.6.1 |
| P1 | Implement light mode toggle | M4.4.2, V2.4.1 |
| P1 | Test all screens in light mode | V2.4.2 |

### Epic V2.5: Trend Charts

| Priority | Task | Dependencies |
|---|---|---|
| P1 | Integrate recharts line chart | M0.2.8 |
| P1 | Create `TrendChart` for 30/90/365 day views | V2.5.1, M3.1.3 |

---

## 8. V3 — Multi-User & Cloud Sync (Future, 15 days)

### Epic V3.1: Authentication

| Priority | Task | Dependencies |
|---|---|---|
| P2 | Enable Supabase Auth UI (email/social) | M0.3.6 |
| P2 | Create sign-in / sign-up page | V3.1.1 |
| P2 | Implement anonymous → authenticated linking | V3.1.2, M0.7.1 |
| P2 | Ensure RLS properly scoped | V3.1.3, M0.3.7 |

### Epic V3.2: Multi-Device Sync

| Priority | Task | Dependencies |
|---|---|---|
| P2 | Supabase Realtime subscriptions | V3.1.4 |
| P2 | Conflict resolution UI | V3.2.1 |
| P2 | User profile/settings per account | V3.2.2 |

### Epic V3.3: FastAPI Backend (Optional)

| Priority | Task | Dependencies |
|---|---|---|
| P2 | Scaffold `apps/api` with FastAPI + Python | None |
| P2 | Migrate sensitive operations to API | V3.3.1 |
| P2 | Add rate limiting and request validation | V3.3.2 |

---

## 9. Dependency Graph

```
M0: Foundation (3d)
 │
 ├──► M1: Core Habits (5d)
 │     │
 │     ├──► M2: Habit Completion (5d)
 │     │     │
 │     │     ├──► M3: Statistics (5d)
 │     │     │     │
 │     │     │     └──► M4: PWA & Polish → v1.0 (5d)
 │     │     │
 │     │     └──► V2.2: Past-Date (requires M2)
 │     │
 │     └──► V2.1: Notifications (requires M1)
 │
 └──► V3: Multi-User (requires all of MVP)
```

**Critical Path (MVP):** M0 → M1 → M2 → M3 → M4 = **23 days**

---

## 10. Effort Summary

| Milestone | Tasks | P0 Tasks | Estimated Hours |
|---|---|---|---|
| M0: Foundation | 36 | 35 | 12 |
| M1: Core Habits | 30 | 30 | 14 |
| M2: Habit Completion | 30 | 30 | 14 |
| M3: Statistics | 21 | 21 | 11 |
| M4: PWA & Polish | 28 | 27 | 12 |
| **MVP Total** | **145** | **143** | **63 hours** |
| V2: Reminders & Data | 12 | 0 | — |
| V3: Multi-User | 9 | 0 | — |

---

## 11. Risk-Driven Testing Focus

| Risk | Where Tested | Test Type |
|---|---|---|
| Streak calculation with weekly frequency | `lib/streaks.test.ts` | Unit |
| Timezone boundary in streak/schedule | `lib/streaks.test.ts`, `lib/schedule.test.ts` | Unit |
| Offline queue replay order | `lib/sync.test.ts` | Unit |
| Optimistic update rollback on error | `hooks/useCompletions.test.ts` | Integration |
| IndexedDB persist across browser close | Manual test | E2E |
| PWA installation on iOS | Lighthouse + manual | E2E |
