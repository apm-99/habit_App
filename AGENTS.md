# Habit App — AGENTS.md

## Monorepo layout

pnpm workspace (v9.1.0) + Turbo (v2). Two workspace roots: `apps/*` and `packages/*`.

| path | what |
|---|---|
| `apps/web` | Next.js 14 App Router PWA — the only active app |
| `apps/api` | empty placeholder (no backend yet) |
| `packages/db` | `@repo/db` — shared Zod schemas and TS types only (no runtime client) |

## Entrypoints

- App boot: `apps/web/src/app/layout.tsx` → `Providers.tsx` (React Query + Auth + ErrorBoundary + banners)
- Auth: anonymous Supabase session via `useAuth.tsx` → `lib/auth.ts` `ensureAnonymousSession()` — no login screen
- DB types shipped from `packages/db/src/index.ts` — re-exports types + Zod schemas

## Commands

All from repo root via `pnpm`:

| command | what |
|---|---|
| `pnpm dev` | Turbo dev (both apps) |
| `pnpm build` | Turbo build |
| `pnpm lint` | Turbo lint |
| `pnpm test` | Turbo test |
| `pnpm typecheck` | Turbo typecheck |
| `pnpm format` | Prettier all `*.{ts,tsx,md,json}` |
| `pnpm <cmd> --filter=web` | Scope to the web app (CI uses this) |

Run a single test file: `pnpm --filter=web vitest run src/test/<file>.test.ts`

## Key constraints

- **Build/Types order**: `turbo.json` declares `typecheck` depends on `^build` — so first build dependencies, then typecheck. CI runs: typecheck → lint → test → build on `--filter=web`.
- **Env required**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Placeholder values let the app start but Supabase calls will fail.
- **`.env.local`** is gitignored — never commit secrets. Example at `apps/web/.env.example`.
- **Vercel build** uses custom command: `cd apps/web && pnpm build` (defined in root `vercel.json`). DON'T use `npx --no-install next build` — pnpm hoists binaries to root `node_modules/.bin`, not under `apps/web/`.
- **Service Worker**: Serwist PWA. Source at `src/app/sw.ts`, compiled to `public/sw.js`. Offline fallback page at `/~offline`.
- **Dark-only**: Tailwind `dark` class always set on `<html>`. No light mode toggle.

## Testing

- Vitest + jsdom + `@testing-library/jest-dom`. Globals enabled.
- Config: `apps/web/vitest.config.ts` — test pattern `src/**/*.test.{ts,tsx}`, setup `src/test/setup.ts`
- Import alias `@/` resolves to `apps/web/src/`

## Supabase (local)

- Config: `supabase/config.toml`
- Migration: `supabase/migrations/20240616000001_init.sql` — creates `habits` + `habit_completions` tables with RLS and anonymous auth support
- Local ports: API 54321, DB 54322, Studio 54323, Inbucket 54324

## Style

- **Prettier**: single quotes, trailing commas all, printWidth 100, arrow parens always. `pnpm format` to fix.
- **React**: `'use client'` for interactive components. Server components in `app/` for layout/static pages only.
- **TanStack Query**: persistent cache in localStorage key `HABIT_APP_QUERY_CACHE`, stale time 5 min, gc 24h. Offline mutations queue in `lib/sync-queue.ts` (localStorage key `habit-pending-mutations`).
- **DB package**: `@repo/db` — no runtime Supabase client, pure types/Zod. The client is in `apps/web/src/lib/supabase.ts`.

## What to avoid

- Don't add a login page — the app uses anonymous auth only.
- Don't add a light mode — the app is dark-only.
- Don't modify `apps/api` — it's intentionally empty (no backend needed; Supabase is the backend).
