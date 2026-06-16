# Design Specification Document

## 1. Design Principles

| Principle | Description |
|---|---|
| **Clarity** | Every screen has a single purpose. Remove unnecessary elements. Content is king. |
| **Deference** | The UI recedes; the data (habits, streaks, calendars) takes center stage. |
| **Depth** | Subtle layers (shadows, elevations, card stacks) create a tactile, native feel. |
| **Consistency** | One pattern per action. Tap = complete. Swipe = complete. Bottom sheet = create/edit. No surprises. |
| **Human Touch** | Smooth spring animations, generous whitespace, and rounded corners make the app feel crafted, not mechanical. |

## 2. User Journeys

### Journey A: Morning Check-In (Daily Use)

```
1. Opens app → Today tab (default)
2. Sees list of habits scheduled for today
3. Taps/swipes each habit completed → checkmark animates, streak updates
4. Glances at streak numbers on cards
5. Closes app. Total time: <10 seconds.
```

### Journey B: Creating a New Habit

```
1. Taps Habits tab
2. Taps "+" button
3. Bottom sheet slides up
4. Fills in: name, description, category, frequency, reminder
5. Taps "Save" → sheet dismisses → new habit appears in list + Today view
6. Total time: <30 seconds.
```

### Journey C: Weekly Review

```
1. Opens Stats tab
2. Scans current streak, longest streak, completion rate
3. Scrolls to monthly calendar → sees color-coded grid
4. Switches to yearly heatmap → sees year at a glance
5. Identifies a pattern: "I always skip exercise on Wednesdays"
6. Adjusts schedule accordingly.
```

### Journey D: Offline Use

```
1. Opens app on subway (no signal)
2. Completions work identically to online mode
3. Subtle banner at top: "You're offline"
4. Exits subway → signal returns
5. Banner disappears → data synced silently
6. No user action required.
```

## 3. Information Architecture

```
App
├── Today (default landing)
│   ├── Date header
│   ├── Offline banner (conditional)
│   └── Habit list
│       ├── Habit card → name, schedule badge, streak badge, category dot, checkbox
│       └── Empty state (onboarding prompt)
│
├── Habits (manage)
│   ├── Page header: "Habits" + "+" button
│   ├── Category filter chips (scrollable horizontal)
│   └── Habit list (scrollable)
│       └── Habit card → same as Today + long-press context (edit/archive/delete)
│
├── Stats (analytics)
│   ├── Summary cards (current streak, longest streak, completion rate)
│   ├── Monthly calendar (interactive grid)
│   └── Yearly heatmap (GitHub-style)
│
└── Settings (configuration)
    ├── Theme toggle (dark/light)
    ├── Data section (export placeholder)
    └── About (version, tech info)
```

## 4. Navigation Structure

### Global Navigation

Fixed **bottom tab bar** with 4 tabs. Always visible. No hamburger menu.

| Tab | Icon | Label | Destination |
|---|---|---|---|
| 1 | `calendar-check` | Today | Today page (default) |
| 2 | `list` | Habits | Habit management |
| 3 | `chart-no-axes-column` | Stats | Statistics dashboard |
| 4 | `settings` | Settings | Settings page |

### Local Navigation

- **Habits page**: horizontal scrollable category filter chips below header
- **Stats page**: vertical scroll with sections (summary → monthly → yearly)
- **Modals/Bottom Sheets**: layered on top, dismissed via swipe-down or tap-outside

### Navigation Rules

- Tab bar never hides (exception: full-screen bottom sheet)
- No back button needed — tabs provide direct access
- No deep navigation beyond tab → page (single-level screens)

## 5. Screen Inventory

| # | Screen | Tab | P0/P1 | Description |
|---|---|---|---|---|
| 1 | Today | Today | P0 | Main daily check-in screen |
| 2 | Habits List | Habits | P0 | Browse, filter, manage habits |
| 3 | Habit Form (Bottom Sheet) | Habits | P0 | Create / edit habit |
| 4 | Statistics Dashboard | Stats | P0 | Streaks, rate, calendars |
| 5 | Settings | Settings | P1 | Theme, data, about |
| 6 | Empty State | Today/Habits | P0 | First launch, no habits |
| 7 | Offline Banner | All | P0 | Connection status indicator |

## 6. Wireframe Descriptions

### Screen 1: Today

```
┌──────────────────────────────────────┐
│  [status bar]                        │
│  ┌──────────────────────────────────┐ │
│  │ You're offline — changes will    │ │ ← conditional banner
│  │ sync when connected              │ │
│  └──────────────────────────────────┘ │
│                                      │
│  Monday, June 15                     │ ← date header
│                                      │
│  ┌──────────────────────────────────┐ │
│  │ ● Drink Water         Daily  12  │ │ ← habit card (active, completed)
│  │ ✅                               │ │
│  └──────────────────────────────────┘ │
│                                      │
│  ┌──────────────────────────────────┐ │
│  │ ● Exercise            3x/week  3 │ │ ← habit card (active, not done)
│  │ ○                               │ │
│  └──────────────────────────────────┘ │
│                                      │
│  ┌──────────────────────────────────┐ │
│  │ ● Read               Mon/Wed/Fri│ │ ← habit card (scheduled, done)
│  │ ✅                               │ │
│  └──────────────────────────────────┘ │
│                                      │
│                                      │
│  ─────── ─────── ─────── ───────    │ ← bottom tab bar
│  Today    Habits   Stats    Settings │
└──────────────────────────────────────┘
```

**Key behaviors:**
- Cards stack vertically with 12px gap
- Tapping `○` fills it → green checkmark with spring animation
- Swiping right reveals green background with white checkmark, then snaps to completed state
- Completed cards show reduced opacity
- Streak badge: small rounded pill in top-right of card (accent color text)
- Category dot (`●`): 8px circle, left of name, color derived from category
- Schedule badge: "Daily", "3x/week", "Mon/Wed/Fri" — subtle text below name

### Screen 2: Habits

```
┌──────────────────────────────────────┐
│  Habits                     [+ add]  │ ← header with title + CTA
│                                      │
│  ┌──────────┬──────┬──────┬──────┐  │
│  │ All      │Health│Mind  │Body  │  │ ← category filter chips
│  └──────────┴──────┴──────┴──────┘  │
│                                      │
│  ┌──────────────────────────────────┐ │
│  │ ● Drink Water         Daily      │ │
│  │                       12         │ │
│  └──────────────────────────────────┘ │
│                                      │
│  ┌──────────────────────────────────┐ │
│  │ ● Exercise            3x/week    │ │
│  │                       3          │ │
│  └──────────────────────────────────┘ │
│                                      │
│  ─────── ─────── ─────── ───────    │
│  Today    Habits   Stats    Settings │
└──────────────────────────────────────┘
```

**Key behaviors:**
- "+" button opens bottom sheet
- Tap card → opens bottom sheet in edit mode
- Long press → context menu: Edit, Archive, Delete
- Archived habits: hidden by default, shown via filter toggle
- No checkboxes — this is management, not tracking

### Screen 3: Habit Form (Bottom Sheet)

```
┌──────────────────────────────────────┐
▒  ─────────────────────────────────   ▒ ← drag handle
▒  New Habit               [Cancel]   ▒ ← header
▒                                      ▒
▒  Name                                ▒
▒  ┌────────────────────────────────┐  ▒
▒  │ e.g., Drink water              │  ▒
▒  └────────────────────────────────┘  ▒
▒                                      ▒
▒  Description (optional)              ▒
▒  ┌────────────────────────────────┐  ▒
▒  │ 8 glasses per day              │  ▒
▒  └────────────────────────────────┘  ▒
▒                                      ▒
▒  Category (optional)                 ▒
▒  ┌────────────────────────────────┐  ▒
▒  │ Health                    ▼    │  ▒ ← dropdown/picker
▒  └────────────────────────────────┘  ▒
▒                                      ▒
▒  Frequency                           ▒
▒  ┌────────────────────────────────┐  ▒
▒  │ ○ Daily                        │  ▒ ← radio group
▒  │ ○ X times per week    [3]      │  ▒
▒  │ ○ Custom days                  │  ▒
▒  │   [Mon][Tue][Wed][Thu][Fri]    │  ▒ ← day chips
▒  └────────────────────────────────┘  ▒
▒                                      ▒
▒  Reminder                            ▒
▒  ┌────────────────────────────────┐  ▒
▒  │ Enable reminder     [toggle]   │  ▒
▒  │ Time:            [08:00 AM]    │  ▒
▒  └────────────────────────────────┘  ▒
▒                                      ▒
▒  ┌────────────────────────────────┐  ▒
▒  │         Save Habit             │  ▒ ← primary button (full width)
▒  └────────────────────────────────┘  ▒
└──────────────────────────────────────┘
```

**Key behaviors:**
- Slides up from bottom, covers ~80% of screen
- Dismiss: swipe down on drag handle OR tap "Cancel"
- Fields validate on save attempt
- Category: text input with autocomplete from existing categories
- Frequency selection: radio group changes visible options dynamically
- Save button: primary (#0A84FF), full-width, rounded

### Screen 4: Statistics Dashboard

```
┌──────────────────────────────────────┐
│  Statistics                          │
│                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ Cur. │ │Best  │ │Rate  │        │ ← summary cards (horizontal row)
│  │ 12   │ │ 45   │ │ 87%  │        │
│  │ days │ │ days │ │      │        │
│  └──────┘ └──────┘ └──────┘        │
│                                      │
│  Monthly Calendar                    │
│  ┌──────────────────────────────────┐ │
│  │  < June 2026 >                  │ │ ← month navigator
│  │  Su Mo Tu We Th Fr Sa           │ │
│  │        1  2  3  4  5  6         │ │
│  │   7  8  9 10 11 12 13          │ │ ← heatmap grid
│  │  14 15 16 17 18 19 20          │ │
│  │  21 22 23 24 25 26 27          │ │
│  │  28 29 30                      │ │
│  └──────────────────────────────────┘ │
│                                      │
│  Yearly Heatmap                      │
│  ┌──────────────────────────────────┐ │
│  │  ██████████████████████████████  │ │ ← 12 months of dots
│  │  ██████████████████████████████  │ │   GitHub-style
│  │  ██████████████████████████████  │ │
│  │  ██████████████████████████████  │ │
│  │  ██████████████████████████████  │ │
│  │  ██████████████████████████████  │ │
│  │  ██████████████████████████████  │ │
│  └──────────────────────────────────┘ │
│                                      │
│  ─────── ─────── ─────── ───────    │
│  Today    Habits   Stats    Settings │
└──────────────────────────────────────┘
```

**Key behaviors:**
- Summary cards: single row, scrollable horizontally if many stats
- Monthly calendar: filled circles in each day cell, 4 levels of opacity
- Yearly heatmap: GitHub-style, 7 rows × ~53 columns
- Tap a day in monthly calendar → shows breakdown: "3 of 4 habits completed"

### Screen 5: Settings

```
┌──────────────────────────────────────┐
│  Settings                            │
│                                      │
│  Appearance                          │
│  ┌──────────────────────────────────┐ │
│  │ Dark Mode              [toggle]  │ │
│  └──────────────────────────────────┘ │
│                                      │
│  Data                                │
│  ┌──────────────────────────────────┐ │
│  │ Export as JSON           [→]     │ │
│  │ Export as CSV            [→]     │ │ ← placeholder (disabled for MVP)
│  └──────────────────────────────────┘ │
│                                      │
│  About                               │
│  ┌──────────────────────────────────┐ │
│  │ Version              1.0.0       │ │
│  │ Built with   Next.js + Supabase │ │
│  └──────────────────────────────────┘ │
│                                      │
│  ─────── ─────── ─────── ───────    │
│  Today    Habits   Stats    Settings │
└──────────────────────────────────────┘
```

## 7. Accessibility Requirements

| Requirement | Target | Priority |
|---|---|---|
| Color contrast | All text meets WCAG AA (4.5:1 normal, 3:1 large) | MVP |
| Touch targets | All interactive elements >= 44x44px | MVP |
| Focus indicators | Visible focus ring on all interactive elements | P1 |
| Screen reader labels | All icons and buttons have `aria-label` | P1 |
| Semantic HTML | Use `<button>`, `<nav>`, `<main>`, `<h1>`-`<h3>` correctly | P1 |
| Reduced motion | Respect `prefers-reduced-motion` — disable spring animations | P1 |
| Keyboard navigation | All actions reachable via Tab/Enter | P2 |

## 8. Visual Design Guidelines

### Color System

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#111111` | Main background |
| `--bg-card` | `#1C1C1E` | Card background |
| `--bg-elevated` | `#2C2C2E` | Bottom sheet, modal background |
| `--text-primary` | `#FFFFFF` | Primary text |
| `--text-secondary` | `#8E8E93` | Secondary text (labels, descriptions) |
| `--accent-primary` | `#0A84FF` | Primary action buttons, active states |
| `--accent-secondary` | `#5AC8FA` | Secondary accent, streak highlights |
| `--success` | `#30D158` | Completion checkmark |
| `--destructive` | `#FF453A` | Delete actions |
| `--border` | `#38383A` | Card borders, dividers |

### Typography (Inter)

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `--text-xs` | 12px | 400 | 16px | Calendar day numbers, badges |
| `--text-sm` | 14px | 400 | 20px | Schedule badges, secondary text |
| `--text-base` | 16px | 500 | 24px | Habit name, body text |
| `--text-lg` | 20px | 600 | 28px | Section headers |
| `--text-xl` | 24px | 700 | 32px | Date header day name |
| `--text-2xl` | 32px | 700 | 40px | Streak numbers on summary cards |
| `--text-3xl` | 48px | 700 | 56px | Large statistics display |

### Spacing (8px grid)

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Inner padding inside badges |
| `--space-2` | 8px | Gap between icon and text |
| `--space-3` | 12px | Gap between cards |
| `--space-4` | 16px | Content padding inside cards |
| `--space-5` | 20px | Section padding |
| `--space-6` | 24px | Page horizontal padding |
| `--space-8` | 32px | Large section spacing |
| `--space-10` | 40px | Page top padding |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 6px | Badges, small indicators |
| `--radius-md` | 10px | Input fields, category chips |
| `--radius-lg` | 14px | Habit cards |
| `--radius-xl` | 20px | Bottom sheet top corners |

### Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.3)` | Cards (subtle depth) |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | Bottom sheet, elevated elements |
| `--shadow-lg` | `0 8px 30px rgba(0,0,0,0.5)` | Modals, active overlays |

### Iconography

- **Library**: Lucide React (consistent, clean, open-source)
- **Style**: outlined, 1.5px stroke, 24x24 default
- **Tab bar icons**: `calendar-check`, `list`, `chart-no-axes-column`, `settings`
- **Completion checkmark**: custom animated circle fill → checkmark reveal (Apple-style)
- **Category dots**: 8px solid circle, color derived from category name

### Animations

| Element | Animation | Duration | Curve |
|---|---|---|---|
| Habit completion (tap) | Scale down → fill circle → checkmark draw | 300ms | spring(0.3, 0.8) |
| Swipe reveal | Card slides right, green bg reveals, snaps back | 400ms | spring(0.5, 0.7) |
| Bottom sheet appear | Slide up from bottom + fade overlay | 350ms | ease-out |
| Bottom sheet dismiss | Slide down + fade overlay | 250ms | ease-in |
| Tab switch | Cross-fade content | 200ms | ease |
| Card entry (list) | Fade in + slide up, staggered by index (30ms delay) | 300ms | ease-out |
| Streak counter increment | Number scales 1→1.15→1 with color flash | 200ms | spring(0.4, 0.6) |
| Undo toast | Slide up from bottom, auto-dismiss after 5s | 300ms | ease-out |

### Dark Mode Only (MVP)

- All colors above are dark mode values
- Light mode tokens to be defined in V2
- Use CSS custom properties throughout so light mode is a palette swap

## 9. Responsive Behavior

### Breakpoints

| Breakpoint | Width | Target |
|---|---|---|
| Mobile (base) | < 768px | iPhone, Android phones — primary target |
| Tablet | 768px - 1024px | iPad, landscape phones |
| Desktop | > 1024px | Desktop browsers |

### Mobile (< 768px)

- Full-width layout, 16px horizontal padding
- Cards are full-width with 12px gap
- Bottom tab bar always visible
- Bottom sheet covers ~80% of viewport height
- Calendar grid: compact, 7 columns fill available width

### Tablet (768px - 1024px)

- Max-width container: 640px centered
- Same layout as mobile but centered with gutters
- Bottom tab bar still at bottom
- Bottom sheet: narrower, max-width 480px

### Desktop (> 1024px)

- Max-width container: 720px centered
- Bottom tab bar at bottom
- Hover states on cards (subtle lift shadow)
- Bottom sheet: max-width 480px, centered horizontally

## 10. Mobile and Desktop Considerations

### Mobile (Primary)

| Consideration | Implementation |
|---|---|
| Thumb zone | All primary actions in bottom 1/3 of screen |
| Safe areas | Respect notch and home indicator. Use `env(safe-area-inset-*)` |
| Touch feedback | Subtle scale animation on tap |
| Keyboard | Bottom sheet scrolls up when keyboard opens |
| iOS PWA quirks | `apple-mobile-web-app-capable`, `viewport-fit=cover` |
| Viewport | `<meta viewport="width=device-width, initial-scale=1, viewport-fit=cover">` |
| Pull to refresh | Disabled on Today page. `overscroll-behavior: none` on body |

### Desktop

| Consideration | Implementation |
|---|---|
| Windowed mode | App works in any browser window down to 320px width |
| Keyboard navigation | Tab through cards, Enter/Space to complete |
| Hover states | Card lifts 2px on hover + shadow increase |
| PWA window | `display: standalone` in manifest |

### Cross-Platform

| Consideration | Implementation |
|---|---|
| Scrollbar styling | Custom thin scrollbars via CSS (dark theme matching) |
| Font rendering | `-webkit-font-smoothing: antialiased` |
| Selection color | `::selection { background: #0A84FF40 }` |
| Tap highlight | `-webkit-tap-highlight-color: transparent` |
| Touch scrolling | Smooth scrolling via `scroll-behavior: smooth` |
| Loading state | Skeleton cards (shimmer animation) while data loads |
