---
name: nextjs-supabase-security-audit
description: MUST be used before releases, deployments, major refactors, authentication changes, Supabase migrations, or whenever a user requests a security review of a Next.js and Supabase application.
---

# Next.js + Supabase Security Auditor

Use this skill whenever:

- The user asks for a security audit.
- The project uses Next.js.
- The project uses Supabase.
- The user wants a production readiness review.
- Authentication, RLS, API routes, middleware, or database migrations are involved.

## Goal

Perform a complete security review of the repository and generate a file named:

SECURITY_AUDIT.md

The audit must focus on real exploitable risks and prioritize findings by severity.

---

## Phase 1: Discover the Project

Inspect:

- package.json
- next.config.*
- middleware.ts
- app/
- src/
- pages/
- supabase/
- migrations/
- Dockerfile
- docker-compose*
- .github/workflows

Identify:

- Next.js version
- Supabase usage
- Authentication mechanism
- API routes
- Server Actions
- Edge Functions
- Storage Buckets

---

## Phase 2: Secrets Review

Search for:

- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_ANON_KEY
- OPENAI_API_KEY
- JWT_SECRET
- DATABASE_URL
- PRIVATE_KEY
- TOKEN
- SECRET

Verify:

- service_role keys are never exposed to client code
- secrets are not committed
- .env files are ignored

Severity:

- CRITICAL if service role reaches browser code
- HIGH if secrets are committed

---

## Phase 3: Authentication Review

Inspect:

- middleware.ts
- auth helpers
- login flows
- session management

Verify:

- authentication enforced
- session validation exists
- protected routes are protected

Report missing checks.

---

## Phase 4: Authorization Review

Verify users can only access their own data.

Inspect:

- habit queries
- profile queries
- statistics queries
- update operations
- delete operations

Look for ownership validation.

Flag any cross-user access risks.

Severity:

- CRITICAL

if a user can access another user's data.

---

## Phase 5: Supabase RLS Review

Inspect all migrations.

For each table:

Verify:

- RLS enabled
- policies exist
- policies are restrictive

Flag:

- missing RLS
- USING (true)
- WITH CHECK (true)
- unrestricted FOR ALL policies

Severity:

- HIGH or CRITICAL

---

## Phase 6: API Security Review

Inspect:

- app/api
- pages/api

Verify:

- authentication
- authorization
- input validation
- rate limiting

Flag:

- unauthenticated writes
- missing validation

---

## Phase 7: Server Actions Review

Inspect all "use server" actions.

Verify:

- auth checks
- ownership checks
- input validation

---

## Phase 8: Frontend Security

Search for:

- dangerouslySetInnerHTML
- innerHTML
- localStorage tokens
- sessionStorage tokens

Flag:

- XSS risks
- token exposure

---

## Phase 9: Storage Security

Inspect storage bucket usage.

Verify:

- upload restrictions
- bucket policies
- ownership enforcement

---

## Phase 10: CI/CD Review

Inspect:

- GitHub Actions
- deployment workflows

Verify:

- secrets handling
- pinned actions
- no secret leakage in logs

---

## Phase 11: Docker Review

Inspect:

- Dockerfile
- docker-compose

Flag:

- USER root
- latest tags
- missing .dockerignore

---

## Phase 12: Dependency Review

Review:

- package.json
- lock files

Look for:

- vulnerable packages
- abandoned packages
- outdated security dependencies

---

## Phase 13: Business Logic Review

For habit-tracking applications verify:

- users cannot modify another user's habits
- users cannot fake streaks
- users cannot alter statistics
- date validation exists
- ownership checks exist everywhere

This phase is mandatory.

---

## Phase 14: Generate Report

Create SECURITY_AUDIT.md.

Include:

- Executive Summary
- Security Score (0-100)
- Critical Findings
- High Findings
- Medium Findings
- Low Findings
- Positive Findings
- Top 10 Remediations
- OWASP Mapping
- Methodology

Always include file paths and remediation steps.