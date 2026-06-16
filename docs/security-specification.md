# Security Specification Document

## 1. Threat Modeling

### Architecture Overview (Security Context)

```
┌─────────────────────────────────────────────┐
│                   Browser                     │
│                                               │
│  ┌─────────────┐    ┌──────────────────────┐ │
│  │ Next.js App  │    │   IndexedDB           │ │
│  │ (Client)     │    │   (Obfuscated)        │ │
│  │              │    │   - habits [encoded]  │ │
│  │ - Supabase   │    │   - completions [enc] │ │
│  │   anon key   │    │   - TanStack cache    │ │
│  │ - Anonymous  │    └──────────────────────┘ │
│  │   JWT         │                             │
│  │ - UI code    │                             │
│  └──────┬───────┘                             │
└─────────┼─────────────────────────────────────┘
          │ HTTPS (TLS 1.3)
          │
          ▼
┌──────────────────────────────────────────────┐
│              Supabase                         │
│                                               │
│  ┌────────────────┐  ┌──────────────────────┐│
│  │ Auth Service    │  │ PostgreSQL             ││
│  │ (GoTrue)        │  │                        ││
│  │                 │  │ - habits (RLS via      ││
│  │ - Anonymous     │  │   auth.uid() = user_id)││
│  │   sign-in       │  │ - completions (RLS)   ││
│  │ - JWT issuance  │  │ - auth.users (anon)   ││
│  │ - V3: email/    │  └──────────────────────┘│
│  │   social auth   │                          │
│  └────────────────┘                           │
└──────────────────────────────────────────────┘
```

### Trust Boundaries

| Boundary | From | To | Trust Level |
|---|---|---|---|
| T1 | Browser → Supabase | Client-side code → Supabase API | Low |
| T2 | Browser local storage | App code → IndexedDB | Medium |
| T3 | Service worker | SW → Cache API | Medium |
| T4 | Vercel CDN | Vercel edge → Browser | High |

### Assets

| Asset | Location | Sensitivity | Impact if Compromised |
|---|---|---|---|
| Habit data (names, descriptions) | Supabase DB + IndexedDB | Low-Personal | Embarrassment, pattern disclosure |
| Completion history | Supabase DB + IndexedDB | Low-Personal | Daily schedule exposure |
| Anonymous JWT | Browser localStorage | Medium | Session hijack |
| Supabase anon key | Client bundle (public) | Low | Designed to be public |

### Threat Matrix (STRIDE)

| Category | Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| **S**poofing | Attacker impersonates user via stolen JWT | Low | Medium | Short-lived JWT; HTTPS-only |
| **T**ampering | Attacker modifies habit data via network | Very Low | Low | RLS; TLS in transit |
| **R**epudiation | User denies creating/deleting habits | Very Low | Low | Timestamp tracking on all records |
| **I**nformation Disclosure | Habit data exposed via network inspection | Low | Low | RLS scoped to anonymous user |
| **D**enial of Service | Malicious requests exhaust Supabase free tier | Very Low | Low | Supabase rate limiting |
| **E**levation of Privilege | Attacker reads other users' data | Very Low | Medium | RLS enforced via `auth.uid()` |

## 2. Authentication Strategy

### MVP: Supabase Anonymous Authentication

```typescript
// lib/auth.ts
import { supabase } from './supabase';

export async function ensureAnonymousSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;

  return data.session;
}
```

### Key Behaviors

- Anonymous user created on first app launch
- Session auto-refreshed by Supabase JS client (refresh token in local storage)
- If session expires, new anonymous identity is created (old data orphaned)
- V3: `supabase.auth.linkIdentity()` to convert anonymous → authenticated

### Session Lifecycle

| Event | Action |
|---|---|
| First launch | `signInAnonymously()` → session stored |
| Page reload | `getSession()` from local storage → reuse |
| Token expiry | `onAuthStateChange` triggers refresh |
| Refresh failure | `SIGNED_OUT` → re-create anonymous session |
| Browser data clear | Lost session → new anonymous identity |

## 3. Authorization Strategy

### Row-Level Security (RLS)

All database access is governed by RLS policies scoped to `auth.uid()` — even for anonymous users.

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

### Supabase API Key Usage

| Key | Used Where | Purpose | Risk if Exposed |
|---|---|---|---|
| `anon` key | Client bundle (public) | Authenticate to Supabase | Minimal — RLS protects data |
| `service_role` key | Server-side only (never client) | Bypass RLS, admin ops | **Critical** — never in client |

## 4. Session Management

### Client-Side Session Storage

| Storage | Content | Protection |
|---|---|---|
| `localStorage` (`sb-<ref>-auth-token`) | Supabase JWT + refresh token | Same-origin policy |
| `localStorage` (`habit-device-id`) | Random UUID for obfuscation seed | Not sensitive |
| IndexedDB | TanStack Query cache (obfuscated) | Same-origin; values obfuscated |

### Session Token Properties

| Property | Value |
|---|---|
| Token type | JWT |
| Issuer | Supabase Auth (GoTrue) |
| Claims | `sub` (user_id), `role`, `aud`, `exp`, `iat` |
| Expiry | 1 hour (configurable) |
| Refresh token expiry | 30 days |
| Storage | `localStorage` (auto-managed) |
| Transmission | `Authorization: Bearer <jwt>` header |

## 5. Data Protection

### Data Classification

| Classification | Data Types | Storage | Protection |
|---|---|---|---|
| Public | Supabase anon key | Client bundle | None needed |
| Personal | Habit names, descriptions, categories | Supabase DB + IndexedDB | RLS + obfuscation |
| Behavioral | Completion timestamps, streaks | Supabase DB + IndexedDB | RLS + obfuscation |
| Session | JWT, refresh token | Browser localStorage | Supabase SDK auto-management |

### Data in Transit

| Path | Protocol | Encryption |
|---|---|---|
| Browser → Supabase | HTTPS (TLS 1.3) | AES-256-GCM |
| Browser → Vercel | HTTPS (TLS 1.3) | AES-256-GCM |
| Browser → Sentry | HTTPS (TLS 1.3) | AES-256-GCM |

### HSTS

```typescript
// next.config.js
async headers() {
  return [{
    source: '/(.*)',
    headers: [{
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    }],
  }];
},
```

### Data at Rest

| Location | Encryption | Mechanism |
|---|---|---|
| Supabase PostgreSQL | AES-256 | Supabase-managed |
| Supabase backups | AES-256 | Supabase-managed |
| Browser IndexedDB | Obfuscated (XOR + base64) | Client-side |
| Sentry servers | AES-256 | Sentry-managed |

## 6. Encryption Requirements

### Local Data Obfuscation (IndexedDB)

**Purpose:** Prevent casual inspection of habit data via DevTools. This is obfuscation, not cryptographic security.

```typescript
// lib/crypto.ts
const OBFUSCATION_KEY = 'habit-app-v1';

function obfuscate(value: string): string {
  const encoded = new TextEncoder().encode(value);
  const keyBytes = new TextEncoder().encode(OBFUSCATION_KEY);
  const result = new Uint8Array(encoded.length);
  for (let i = 0; i < encoded.length; i++) {
    result[i] = encoded[i] ^ keyBytes[i % keyBytes.length];
  }
  return btoa(String.fromCharCode(...result));
}

function deobfuscate(obfuscated: string): string {
  const decoded = Uint8Array.from(atob(obfuscated), c => c.charCodeAt(0));
  const keyBytes = new TextEncoder().encode(OBFUSCATION_KEY);
  const result = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    result[i] = decoded[i] ^ keyBytes[i % keyBytes.length];
  }
  return new TextDecoder().decode(result);
}
```

**Limitations:**
- Does NOT protect against determined attackers with device access
- Does NOT protect against XSS (attacker reads key from JS context)
- Does protect against casual DevTools IndexedDB inspection

## 7. Secrets Management

### Environment Variables

| Variable | Scope | Security Level |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (client) | Low |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (client) | Low |
| `NEXT_PUBLIC_SENTRY_DSN` | Public (client) | Low |
| `SENTRY_AUTH_TOKEN` | Secret (CI only) | High |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret (server only, V3+) | **Critical** |

### Rules

1. All `NEXT_PUBLIC_*` variables are compiled into the client bundle
2. Non-public variables only accessible in server components/API routes
3. `service_role` key is never used in MVP; if added in V3, stays server-only
4. `.env.local` is in `.gitignore` — never committed

## 8. OWASP Top 10 Considerations

| OWASP Category | Risk Level | Mitigation |
|---|---|---|
| A01: Broken Access Control | Low | RLS ensures users see only their own data |
| A02: Cryptographic Failures | Low | TLS 1.3 for all traffic |
| A03: Injection | Low | Supabase JS Client parameterizes queries; Zod validates input |
| A04: Insecure Design | Low | Minimal attack surface — no custom API server |
| A05: Security Misconfiguration | Low | Default Supabase config with RLS |
| A06: Vulnerable Components | Medium | `pnpm audit` in CI; Dependabot alerts |
| A07: Auth Failures | Low | Anonymous auth, no passwords to leak |
| A08: Data Integrity Failures | Low | Last-write-wins with timestamps |
| A09: Logging & Monitoring | Medium | Sentry captures errors |
| A10: SSRF | N/A | No server-side code making outbound requests |

## 9. Secure API Practices

| Rule | Reason | Enforcement |
|---|---|---|
| Never use `service_role` key client-side | Bypasses RLS | Code review; naming convention |
| Always use `.select()` with explicit columns | Prevents over-fetching | TypeScript types |
| Use `.single()` for single-record queries | Prevents array handling | TypeScript return types |
| Validate input with Zod before Supabase insert | Catches malformed data | Schema enforcement in hooks |

## 10. Secure Storage Practices

| Consideration | Implementation |
|---|---|
| Same-origin policy | IndexedDB scoped to origin |
| Data obfuscation | XOR obfuscation before writing to IndexedDB |
| Storage quota | Browser-managed (typically 50% of disk) |
| Eviction | Supabase is authoritative backup |

## 11. Dependency Management

| Practice | Implementation |
|---|---|
| Lockfile | `pnpm-lock.yaml` committed |
| Audit | `pnpm audit` in CI |
| Updates | `pnpm outdated` checked monthly |
| Critical packages | Dependabot alerts enabled for Next.js, Supabase, Sentry |
| Supply chain | All packages from npm registry |

## 12. Security Testing Strategy

| Test Type | Scope | Frequency | Tool |
|---|---|---|---|
| RLS validation | Verify RLS blocks cross-user access | Manual, once | Direct SQL in Supabase dashboard |
| Input validation | Habit creation with malicious input | Automated, CI | Zod schema tests |
| Dependency audit | Known CVEs | Automated, CI | `pnpm audit` |
| HTTPS enforcement | Verify all requests use HTTPS | Manual, once | Browser DevTools |
| XSS check | No unescaped user content | Automated, CI | ESLint `react/no-danger` |

## 13. Privacy Considerations

### Data Collected

| Data Point | Purpose | Retention |
|---|---|---|
| Habit names/descriptions | User's personal tracking data | Until user deletes habit |
| Completion timestamps | Streak calculation, statistics | Until user deletes habit |
| Anonymous user ID | Data ownership (RLS scoping) | Until session expires |
| Device ID (local) | Obfuscation seed | Until browser data cleared |
| Error reports (Sentry) | Bug detection | 30 days (Sentry free tier) |

### Data NOT Collected

- Email address (until V3)
- Real name
- IP address (not logged by app code)
- Location data
- Device fingerprint
- Usage analytics (no third-party analytics)
- Advertising identifiers

### Privacy Guarantees

1. **Zero third-party analytics** — no Google Analytics, Mixpanel, etc.
2. **Zero advertising** — no ad networks, no tracking pixels
3. **Data ownership** — user can delete all data by deleting habits
4. **Transparent data flow** — only Supabase and Sentry endpoints

### Third-Party Data Processors

| Processor | Data Received | Purpose |
|---|---|---|
| Supabase | Habit data, anonymous user ID | Database and auth |
| Sentry | Error stack traces (habit names may appear in context) | Error monitoring |
| Vercel | Page request metadata | Hosting, CDN |

## 14. Incident Response Recommendations

### Severity Levels

| Level | Definition | Response Time |
|---|---|---|
| L1 | Data exfiltration to third party | Within 1 week |
| L2 | Unauthorized database access | Within 1 month |
| L3 | Service unavailable | Wait for provider resolution |
| L4 | Self-inflicted data loss | Restore from Supabase |

### Incident Response Plan

1. **Detect**: Sentry alerts or manual observation
2. **Assess**: Determine affected data and exposure scope
3. **Contain**: Revoke anon key (Supabase dashboard); disable Sentry
4. **Remediate**: Apply patch; update dependencies; rotate exposed keys
5. **Recover**: Restore from Supabase (authoritative source)
6. **Postmortem**: Document root cause; update threat model

### Key Recovery Information

| Item | Location |
|---|---|
| Supabase project credentials | Supabase dashboard |
| Sentry DSN/Token | Vercel Dashboard environment variables |
| Vercel deployment | Vercel Dashboard |
| GitHub repository | GitHub (personal account) |
| Database backups | Supabase daily backups (Pro) / Manual `supabase db dump` (Free) |
