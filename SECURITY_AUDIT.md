# Security Audit Report — habit app

**Date:** 2026-06-22
**Scope:** Full repository audit (14 phases)
**Auditor:** opencode security skill

---

## Executive Summary

The habit app follows a **zero-backend architecture** — all data flows directly from the browser to Supabase via the client-side Supabase JS SDK. Authentication is fully anonymous (no login screen). The security posture relies almost entirely on **Supabase Row-Level Security (RLS)** being correctly implemented, which it is.

No critical or high-severity vulnerabilities were found. The app has a small attack surface (no API routes, no server actions, no file uploads, no user-generated HTML). The most notable gaps are the absence of a middleware auth guard and missing CSP headers.

---

## Security Score: **85 / 100**

| Category | Score |
|---|---|
| Authentication | 85 |
| Authorization (RLS) | 95 |
| Secrets Management | 95 |
| Frontend Security | 90 |
| API Security | 95 |
| Infrastructure/CICD | 60 |
| Business Logic | 90 |

---

## Critical Findings (0)

None.

---

## High Findings (0)

None.

---

## Medium Findings (3)

### M-1: No server-side auth middleware

**File:** `apps/web/` — no `middleware.ts`

**Risk:** All pages are publicly accessible without any server-side auth check. While RLS protects the data layer, unauthenticated requests reach the server and consume resources. A malicious actor could enumerate routes or trigger server rendering for unauthenticated sessions.

**Remediation:** Add a `middleware.ts` at `apps/web/src/middleware.ts` that checks for a valid Supabase session and redirects unauthenticated users:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return res;
}

export const config = {
  matcher: ['/habits', '/stats', '/settings'],
};
```

### M-2: Missing Content-Security-Policy headers

**File:** `apps/web/next.config.mjs`

**Risk:** Without a CSP, if an XSS vulnerability were introduced in a dependency or via user input, an attacker could inject scripts freely. Currently no user content is rendered as HTML, but a CSP provides defense-in-depth.

**Remediation:** Add CSP headers in `next.config.mjs`:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'Strict-Transport-Security', value: '...' },
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://*.sentry.io; img-src 'self' data:; font-src 'self' data:; base-uri 'self'; form-action 'self'" },
      ],
    },
  ];
},
```

### M-3: No CI/CD security checks

**File:** `.github/workflows/` — empty directory

**Risk:** No automated linting, type-checking, testing, or dependency auditing runs on push or PR. Vulnerable dependencies (e.g., a CVE in Next.js or Supabase JS) would go undetected until manually audited.

**Remediation:** Create a CI workflow at `.github/workflows/ci.yml` that runs:

```yaml
name: CI
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install
      - run: pnpm audit --audit-level=high
      - run: pnpm typecheck --filter=web
      - run: pnpm lint --filter=web
      - run: pnpm test --filter=web
```

---

## Low Findings (4)

### L-1: Habit data stored in plain text in localStorage

**Files:**
- `apps/web/src/components/Providers.tsx:14-18` — TanStack Query cache persisted to `localStorage` key `HABIT_APP_QUERY_CACHE`
- `apps/web/src/lib/sync-queue.ts` — pending mutations stored in `localStorage` key `habit-pending-mutations`

**Risk:** Habit names, descriptions, and completion data are stored in plain text in the browser's localStorage. Any browser extension or script running on the same origin can read this data. The security spec (docs/security-specification.md) mentions obfuscation but it is not implemented.

**Remediation (optional):** Implement the XOR obfuscation described in `docs/security-specification.md` and apply it to data before writing to localStorage. Note: this is obfuscation, not encryption — it only prevents casual DevTools inspection.

### L-2: Empty SENTRY_DSN in production variables

**File:** `apps/web/.env.local:3` — `NEXT_PUBLIC_SENTRY_DSN=`

**Risk:** The Sentry DSN is empty. If the app is deployed without setting this variable, Sentry error monitoring will not function. When eventually configured, Sentry may capture habit names in error contexts (as noted in the security spec).

**Remediation:** Remove the unused Sentry config from `.env.local` or configure a real DSN via Vercel environment variables.

### L-3: Anonymous auth ties data to browser session

**File:** `apps/web/src/hooks/useAuth.tsx`

**Risk:** Because the app uses anonymous auth, clearing browser data (localStorage, IndexedDB) permanently orphans the user's data on the Supabase side and creates a new anonymous identity on next launch. There is no mechanism for users to recover or migrate their data.

**Remediation:** This is by design for MVP, but document this limitation prominently and consider implementing account linking (`supabase.auth.linkIdentity()`) in a future version.

### L-4: Viewport disables user scaling

**File:** `apps/web/src/app/layout.tsx:26` — `userScalable: false, maximumScale: 1`

**Risk:** Prevents users from zooming, which can be an accessibility issue for visually impaired users. Not a security vulnerability but listed as a best-practice finding.

**Remediation:** Remove `userScalable: false` and increase `maximumScale` to at least `3`.

---

## Positive Findings

| Finding | Details |
|---|---|
| ✅ **RLS correctly implemented** | Both `habits` and `habit_completions` tables have RLS enabled with proper `auth.uid() = user_id` policies for SELECT, INSERT, UPDATE, DELETE |
| ✅ **Trigger-enforced user_id** | BEFORE INSERT triggers auto-set `user_id` to `auth.uid()`, preventing user_id spoofing |
| ✅ **No service_role key in client** | The `service_role` key is never referenced in client code |
| ✅ **No committed secrets** | `.env.local` is properly gitignored; no secrets found in committed files |
| ✅ **No XSS vectors** | Zero instances of `dangerouslySetInnerHTML` or `innerHTML` |
| ✅ **No API routes** | Attack surface minimized — no custom API endpoints that could bypass RLS |
| ✅ **No Server Actions** | No `"use server"` functions — all mutations go through Supabase directly |
| ✅ **HSTS configured** | Strict-Transport-Security header set with `max-age=63072000; includeSubDomains; preload` |
| ✅ **Zod input validation** | `CreateHabitSchema` and `UpdateHabitSchema` validate input on the client before sending to Supabase |
| ✅ **Client-side ownership filtering** | All queries include `.eq('user_id', userId)` for defense-in-depth |
| ✅ **Offline sync queue** | Mutations are queued in localStorage and can be replayed, preventing data loss offline |
| ✅ **No Docker/CI secrets exposure** | No Dockerfile or docker-compose files that might hardcode secrets |

---

## Top 10 Remediations (Priority Order)

| # | Finding | Severity | Effort |
|---|---|---|---|
| 1 | Add `middleware.ts` for server-side auth check | Medium | 1h |
| 2 | Add Content-Security-Policy headers | Medium | 30min |
| 3 | Create CI/CD workflow with `pnpm audit` | Medium | 1h |
| 4 | Add localStorage obfuscation for query cache | Low | 2h |
| 5 | Remove empty SENTRY_DSN or configure properly | Low | 5min |
| 6 | Increase `maximumScale` for accessibility | Low | 1min |
| 7 | Add account linking documentation | Low | 30min |
| 8 | Review and update dependencies monthly | Info | 30min |
| 9 | Monitor Supabase project for unusual API usage | Info | Ongoing |
| 10 | Consider adding `@supabase/auth-helpers-nextjs` for server-side auth utilities | Info | 2h |

---

## OWASP Top 10 (2021) Mapping

| OWASP Category | Status | Notes |
|---|---|---|
| A01: Broken Access Control | ✅ Mitigated | RLS + client-side user_id filtering |
| A02: Cryptographic Failures | ✅ Mitigated | TLS 1.3 via HSTS |
| A03: Injection | ✅ Mitigated | Supabase parameterized queries + Zod |
| A04: Insecure Design | ✅ Mitigated | Minimal attack surface |
| A05: Security Misconfiguration | ⚠️ Partial | Missing CSP; otherwise solid |
| A06: Vulnerable Components | ⚠️ Partial | No automated dependency scanning |
| A07: Identification & Auth Failures | ✅ Mitigated | Anonymous auth with JWT |
| A08: Data Integrity | ✅ Mitigated | RLS + triggers enforce integrity |
| A09: Logging & Monitoring | ⚠️ Partial | Sentry not configured |
| A10: SSRF | ✅ N/A | No server-side HTTP requests |

---

## Methodology

This audit was conducted using the Next.js + Supabase Security Auditor skill (14 phases) covering:

1. **Project Discovery** — package.json, next.config, middleware, file structure
2. **Secrets Review** — grep for API keys, tokens, secrets in committed files
3. **Authentication Review** — middleware, auth helpers, session management
4. **Authorization Review** — ownership checks on all data queries
5. **RLS Review** — Supabase migration file analysis
6. **API Security** — route inspection
7. **Server Actions** — `"use server"` search
8. **Frontend Security** — XSS vectors, token exposure
9. **Storage Security** — bucket policies
10. **CI/CD Review** — workflow files
11. **Docker Review** — Dockerfile/compose check
12. **Dependency Review** — package.json audit
13. **Business Logic Review** — habit-tracking-specific risks
14. **Report Generation** — this document

All source files in `apps/web/src/`, `packages/db/src/`, `supabase/`, `.github/`, and root configs were inspected.
