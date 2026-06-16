# Functional Specification Document

## 1. Product Vision

A personal habit tracking application that helps users build and maintain daily routines through fast interaction, beautiful design, and insightful long-term visualization — without gamification, subscriptions, or complexity. The user owns their data completely.

## 2. Problem Statement

Existing habit trackers fail their users in common ways:

| Problem | Impact |
|---|---|
| Paid subscriptions for basic features | Users abandon the app or pay for what should be free |
| Overly complex UIs with onboarding tunnels | High drop-off before the first habit is even created |
| Gamification (XP, levels, coins, achievements) | Distracts from the core goal of building habits; alienates users who prefer simplicity |
| Poor long-term habit visualization | Users cannot see patterns, trends, or streaks over months/years |
| Third-party tracking and ads | Users do not trust the app with their personal data |
| No offline support | Users lose tracking when commuting, traveling, or in low-connectivity areas |

**This product solves all of the above** by providing a free, fast, offline-first, privacy-respecting PWA with clean analytics and beautiful visualization — designed for a single user with a multi-user-ready architecture.

## 3. Target Users

### Primary Persona: Agustin

| Attribute | Detail |
|---|---|
| Occupation | Software engineering student |
| Devices | iPhone + Desktop (daily) |
| Workflow | Needs to track habits in under 5 seconds per interaction |
| Aesthetic preference | Minimalist, Apple-inspired design |
| Motivation | Long-term behavior change backed by data |
| Dislikes | Gamification, clutter, slow apps, paid subscriptions |

### Secondary Persona (V3+)

Future multi-user support will serve similar individuals — students, professionals, productivity enthusiasts who want a clean, free, private habit tracker.

### Anti-Personas (Not Targeting)

- Users who want social features, challenges, or leaderboards
- Users who want intensive gamification with RPG elements
- Enterprise or team habit tracking
- Users who prefer pen-and-paper or non-digital tracking

## 4. User Stories

### Epic: Habit Management

| ID | Story | Priority | Estimation |
|---|---|---|---|
| H-01 | As a user, I can create a habit with a name, description, category, frequency, and optional reminder | P0 | Medium |
| H-02 | As a user, I can edit any field of an existing habit | P0 | Small |
| H-03 | As a user, I can archive a habit so it hides from my daily view but retains historical data | P0 | Small |
| H-04 | As a user, I can delete a habit and all its completion history permanently | P0 | Small |
| H-05 | As a user, I can view all my active habits in a clean list | P0 | Medium |
| H-06 | As a user, I can filter/group habits by category | P1 | Small |
| H-07 | As a user, I can reorder my habits by priority | P2 | Medium |

### Epic: Habit Completion

| ID | Story | Priority | Estimation |
|---|---|---|---|
| C-01 | As a user, I can tap a habit to mark it complete for today | P0 | Small |
| C-02 | As a user, I can swipe a habit to mark it complete | P0 | Medium |
| C-03 | As a user, I can undo a completion within 5 seconds | P0 | Small |
| C-04 | As a user, I can complete a habit for past dates (backfill) | P1 | Medium |
| C-05 | As a user, I see a visual indicator of whether a habit is already completed today | P0 | Small |

### Epic: Schedules & Frequency

| ID | Story | Priority | Estimation |
|---|---|---|---|
| S-01 | As a user, I can set a habit to repeat every day | P0 | Small |
| S-02 | As a user, I can set a habit to repeat X times per week | P0 | Medium |
| S-03 | As a user, I can pick specific days of the week (e.g., Mon/Wed/Fri) | P0 | Medium |
| S-04 | As a user, I only see habits I'm supposed to do today in my Today view | P0 | Medium |

### Epic: Dashboard & Statistics

| ID | Story | Priority | Estimation |
|---|---|---|---|
| D-01 | As a user, I can see my current streak for each habit | P0 | Medium |
| D-02 | As a user, I can see my longest-ever streak for each habit | P0 | Medium |
| D-03 | As a user, I can see my completion rate as a percentage | P0 | Small |
| D-04 | As a user, I can see a monthly calendar with color-coded completion | P0 | Large |
| D-05 | As a user, I can see a yearly GitHub-style activity heatmap | P0 | Large |
| D-06 | As a user, I can see trend charts over configurable time periods | P1 | Large |
| D-07 | As a user, I can see aggregated stats across all habits | P1 | Medium |

### Epic: PWA & Offline

| ID | Story | Priority | Estimation |
|---|---|---|---|
| P-01 | As a user, I can install the app on my iPhone/Android/Desktop home screen | P0 | Medium |
| P-02 | As a user, the app loads and functions fully without internet | P0 | Large |
| P-03 | As a user, completions I make offline sync automatically when connectivity returns | P0 | Medium |
| P-04 | As a user, I see a subtle indicator when I'm offline | P0 | Small |
| P-05 | As a user, I receive browser notification reminders | P1 | Medium |
| P-06 | As a user, I receive push notifications even when the browser is closed | P2 | Large |

### Epic: Settings & Data

| ID | Story | Priority | Estimation |
|---|---|---|---|
| E-01 | As a user, I can export my habit data as JSON | P2 | Medium |
| E-02 | As a user, I can export my habit data as CSV | P2 | Medium |
| E-03 | As a user, I can toggle dark/light theme | P1 | Small |
| E-04 | As a user, I can see app version and basic about info | P1 | X-Small |

## 5. Use Cases

### UC-01: Create a Habit
**Actors:** User  
**Trigger:** User taps "+" button on Habits page  
**Preconditions:** None  
**Postconditions:** Habit is saved locally and to Supabase  

**Flow:**
1. User taps "+" button
2. System displays HabitFormDialog
3. User enters name (required), description (optional), category (optional)
4. User selects frequency type: Daily, X times per week, or Custom days
5. User optionally enables reminder and sets time/days
6. User taps "Save"
7. System validates required fields
8. System creates habit record in IndexedDB
9. System creates habit record in Supabase
10. System closes dialog and refreshes habit list
11. System shows success toast

**Alternative Flows:**
- 7a. Name is empty: system shows validation error, does not save
- 9a. Supabase write fails: system retries on next online event, habit already saved locally

### UC-02: Complete a Habit (Swipe)
**Actors:** User  
**Trigger:** User swipes right on a HabitCard on Today page  
**Preconditions:** Habit exists and is scheduled for today  
**Postconditions:** Completion is recorded locally and synced  

**Flow:**
1. User swipes right on HabitCard
2. System detects swipe via `@use-gesture`
3. System applies animated checkmark overlay
4. System optimistically updates UI (checkmark filled, streak updated)
5. System writes completion to IndexedDB
6. System writes completion to Supabase
7. System shows "Undo" toast (5-second window)
8. If user taps "Undo": system removes completion from local + Supabase

### UC-03: View Monthly Calendar
**Actors:** User  
**Trigger:** User navigates to Stats tab, selects monthly view  
**Preconditions:** At least one habit has completion data  
**Postconditions:** None (read-only)

**Flow:**
1. User taps Stats tab in bottom navigation
2. User selects monthly calendar view
3. System queries completions for the displayed month
4. System renders a calendar grid with color-coded days:
   - No color = no habit scheduled (or no completion)
   - Light blue = partial completion
   - Dark blue = all habits completed
   - Green = current streak day
5. User can navigate to previous/next months via arrows

### UC-04: Offline Completion & Sync
**Actors:** User, System  
**Trigger:** User completes a habit while offline  
**Preconditions:** App is open, no internet connection  
**Postconditions:** Completion is queued and synced when online

**Flow:**
1. User completes a habit (same interaction as UC-02)
2. System detects offline status via `navigator.onLine`
3. System writes completion to IndexedDB with `synced: false` flag
4. System shows offline indicator (subtle banner)
5. System queues the write operation
6. When `window.online` event fires:
   a. System replays all queued writes to Supabase
   b. System marks records as `synced: true`
   c. System hides offline indicator
   d. System reconciles any conflicts (last-write-wins)

## 6. Functional Requirements

### FR-01: Habit CRUD

| ID | Requirement | Verification |
|---|---|---|
| FR-01.1 | System shall allow creating a habit with all mandatory fields | Manual test |
| FR-01.2 | System shall require a non-empty name (max 100 chars) | Unit test |
| FR-01.3 | System shall allow editing all habit fields post-creation | Manual test |
| FR-01.4 | System shall soft-delete habits via `archived` flag | Unit test |
| FR-01.5 | System shall hard-delete habits and cascading completions | Unit test |
| FR-01.6 | System shall display active habits sorted by creation date (default) | Manual test |

### FR-02: Frequency System

| ID | Requirement | Verification |
|---|---|---|
| FR-02.1 | System shall support `daily`, `weekly`, and `custom_days` frequency types | Unit test |
| FR-02.2 | For `weekly`: system shall accept target count 1-7 | Unit test |
| FR-02.3 | For `custom_days`: system shall accept an array of 0-6 (Sun-Sat) | Unit test |
| FR-02.4 | System shall schedule a habit for today based on frequency rules | Unit test |

### FR-03: Completion System

| ID | Requirement | Verification |
|---|---|---|
| FR-03.1 | System shall record habit completion with habit_id and completed_at timestamp | Unit test |
| FR-03.2 | System shall allow one completion per habit per day (upsert idempotent) | Unit test |
| FR-03.3 | System shall support undo within 5 seconds | Manual test |
| FR-03.4 | System shall support swipe-to-complete gesture >= 50px threshold | Manual test |
| FR-03.5 | System shall support tap-to-complete | Manual test |
| FR-03.6 | System shall update streak immediately on completion (optimistic) | Manual test |

### FR-04: Streak Calculation

| ID | Requirement | Verification |
|---|---|---|
| FR-04.1 | Current streak = consecutive days up to today where habit was completed per its schedule | Unit test |
| FR-04.2 | Longest streak = max historical consecutive days meeting schedule | Unit test |
| FR-04.3 | Streak calculation must account for frequency type (e.g., 3x/week allows gaps) | Unit test |
| FR-04.4 | Streak breaks when a scheduled day is missed | Unit test |

### FR-05: Statistics

| ID | Requirement | Verification |
|---|---|---|
| FR-05.1 | Completion rate = completed days / scheduled days * 100 for selected period | Unit test |
| FR-05.2 | Monthly calendar shows color intensity based on completion ratio | Manual test |
| FR-05.3 | Yearly heatmap shows 12 months of daily activity | Manual test |
| FR-05.4 | All statistics must compute from locally-cached data (no network required) | Unit test |

### FR-06: PWA

| ID | Requirement | Verification |
|---|---|---|
| FR-06.1 | App must have a valid manifest.json with name, icons, theme_color, display | Lighthouse audit |
| FR-06.2 | App must register a service worker | Lighthouse audit |
| FR-06.3 | App must precache static assets (App Shell) | Lighthouse audit |
| FR-06.4 | App must serve a fallback offline page | Manual test |
| FR-06.5 | App must achieve Lighthouse PWA score >= 90 | Lighthouse audit |

### FR-07: Offline Sync

| ID | Requirement | Verification |
|---|---|---|
| FR-07.1 | System shall store completions locally when offline | Unit test |
| FR-07.2 | System shall detect online/offline transitions | Unit test |
| FR-07.3 | System shall replay queued writes to Supabase on reconnect | Integration test |
| FR-07.4 | System shall use last-write-wins conflict resolution | Integration test |
| FR-07.5 | System shall show an offline indicator when disconnected | Manual test |

### FR-08: Security & Privacy

| ID | Requirement | Verification |
|---|---|---|
| FR-08.1 | All Supabase connections must use HTTPS | Config review |
| FR-08.2 | No third-party analytics, tracking, or advertising code shall be included | Code review |
| FR-08.3 | No user data shall be sent to any endpoint other than Supabase and Sentry | Code review |
| FR-08.4 | Supabase RLS policies shall be in place for multi-user readiness | SQL review |

## 7. Acceptance Criteria

Each P0 story must meet these criteria before marking done:

| Criterion | Definition |
|---|---|
| Functionality | The feature works as described in the user story |
| Offline | The feature works without internet |
| Sync | Data persists correctly to both local and remote stores |
| Visual | The feature follows the design system (dark theme, spacing, typography) |
| Performance | The feature responds within user expectations (<200ms for completions, <2s page load) |
| No regressions | Existing tests pass |
| New tests | Risk-relevant unit tests are added for new logic |

## 8. MVP Definition (Version 1.0)

The MVP is complete when all P0 user stories pass their acceptance criteria:

**Habit Management (H-01 through H-05)**
- Create, edit, archive, delete, and list habits

**Habit Completion (C-01, C-02, C-03, C-05)**
- Tap-to-complete, swipe-to-complete, undo, visual completion state

**Schedules (S-01, S-02, S-03, S-04)**
- Daily, X-times-per-week, custom days, smart Today view

**Statistics (D-01, D-02, D-03, D-04, D-05)**
- Current streak, longest streak, completion rate, monthly calendar, yearly heatmap

**PWA (P-01, P-02, P-03, P-04)**
- Installable, fully offline, sync on reconnect, offline indicator

### Out of MVP Scope (V2/V3)

- Push notifications (P-05, P-06)
- Past-date completion (C-04)
- Category filtering (H-06)
- Habit reordering (H-07)
- Trend charts (D-06)
- Aggregated stats (D-07)
- Light mode (E-03)
- Data export (E-01, E-02)
- User accounts and cloud sync (multi-device)

## 9. Future Features (Post-MVP)

| Feature | Version | Dependencies |
|---|---|---|
| Push notifications (service worker push) | V2 | Service worker, notification API |
| Past-date completion | V2 | Date picker component |
| Category filtering and management | V2 | Category model extension |
| Light mode | V2 | CSS variable theming |
| Data export (JSON/CSV) | V2 | Data serialization logic |
| Trend line charts | V2 | Chart library integration |
| Multi-device sync | V3 | User accounts, conflict resolution |
| User authentication (Supabase Auth) | V3 | Auth UI, RLS policies |
| Shared habit templates | V3+ | Community features |
| Widget (iOS/Android) | V3+ | Native widget APIs |

## 10. Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | IndexedDB storage limits exceeded on mobile (typically 50MB-1GB depending on browser) | Low | Medium | Estimate storage per habit+completion (~1KB per record); warn user at 80% capacity |
| R-02 | Service worker update causes stale cache on user's device | Medium | Medium | Implement `onupdatefound` handler with "Update available" prompt |
| R-03 | Supabase free tier rate limits hit | Low | Low | Cache aggressively locally; batch writes |
| R-04 | Browser clears IndexedDB data (e.g., iOS Safari storage pressure) | Medium | High | Use Supabase as backup; restore on reconnection |
| R-05 | Swipe gesture conflicts with native browser scrolling | Medium | Medium | Use `@use-gesture` axis locking; thorough testing on iOS Safari |
| R-06 | PWA not installable on iOS due to missing features | Low | Medium | Follow all Apple PWA requirements (manifest, SW, HTTPS, viewport meta) |
| R-07 | Date/timezone bugs in streak calculation | Medium | High | Store all timestamps in UTC; compute streaks in user's local timezone |

## 11. Assumptions

| # | Assumption |
|---|---|
| A-01 | User has a modern browser (Chrome 90+, Safari 15+, Firefox 90+, Edge 90+) |
| A-02 | User has JavaScript enabled |
| A-03 | User has storage available on their device |
| A-04 | Supabase free tier (500MB database, 5GB bandwidth, 50,000 rows) is sufficient for single-user MVP |
| A-05 | Vercel Hobby tier is sufficient for single-user frontend hosting |
| A-06 | One completion per habit per day is sufficient (no multi-completion tracking like "drank 3 glasses of water") |
| A-07 | User's local clock is reasonably accurate (within 1 hour of real time) |
| A-08 | User wants dark mode as the default and primary experience for MVP |
| A-09 | No need for habit templates, suggestions, or pre-built habit libraries |
| A-10 | The application will not need i18n/localization for MVP |
