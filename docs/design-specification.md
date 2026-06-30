# Design Specification v2 — Habit App
**Stack:** Next.js 14 (App Router) + Supabase + TanStack Query + Tailwind CSS + Serwist
**Goal:** Move from "generic dark dashboard" to "crafted, Todoist-grade" feel.

This is a delta spec. Sections not mentioned here (IA, navigation rules, journeys) stay as-is from v1. Everything below replaces v1 Section 8 and touches the Today screen wireframe.

---

## 1. Why the current build feels generic (root causes)

- Background and card surface are nearly the same value (`#111111` vs `#1C1C1E`) → no visible elevation, everything reads as one flat mass.
- Accent color is iOS system blue (`#0A84FF`) — the most recognizable "default/unstyled" color in mobile UI. Needs to be a deliberate, owned color.
- The checkbox/completion control is a bare outlined circle with no weight — this is the single highest-frequency interaction in the app, so if it doesn't feel satisfying, nothing else compensates.
- The circular weekly date-picker is a separate ornamental widget that doesn't share visual language with the cards below it.
- Card internals lack type-size hierarchy — title, frequency, and count badge all compete at similar weight.

Fix priority: **checkbox interaction > color/surface system > date header simplification > card typography.** In that order, because the checkbox is felt on every single open of the app.

---

## 2. Color System (Tailwind config — extend, don't replace defaults)

Add to `tailwind.config.ts` under `theme.extend.colors`:

```ts
colors: {
  surface: {
    DEFAULT: '#0B0B0D',   // app background — slightly warm near-black, not pure #000/#111
    card: '#17171A',      // card background — clearly lighter than bg
    cardHover: '#1E1E22', // card hover/press state
    elevated: '#202024',  // sheets, modals
    border: '#2A2A2F',    // hairline borders on cards (1px, NOT shadow-only depth)
  },
  text: {
    primary: '#F5F5F7',
    secondary: '#9A9AA2',
    tertiary: '#5C5C63',
  },
  accent: {
    DEFAULT: '#FF6B4A',   // warm coral-orange — distinct from iOS blue, reads as "owned"
    soft: '#FF6B4A1A',    // 10% opacity, for backgrounds/highlights
  },
  success: '#3DD68C',
  destructive: '#FF5C5C',
}
```

**Why this works:** raising the bg from `#111` to `#0B0B0D` and the card to `#17171A` creates a ~15-20% luminance gap that's actually visible — cards will look lifted without needing heavy shadows. The coral accent (`#FF6B4A`) is close in spirit to Todoist's red without copying it, and is warm enough to feel intentional rather than default-Tailwind/default-iOS.

Also **add a real border** to every card: `border border-surface-border`. On near-black backgrounds, a 1px hairline border reads more clearly than a soft shadow — use both, but the border is doing most of the work.

---

## 3. The completion checkbox (highest priority fix)

Current: plain `<circle>` outline, instant state flip on tap.

Build this instead, as a dedicated `<CompletionCheck />` client component:

- Default: 22px circle, 1.5px stroke in `text-tertiary`, transparent fill.
- On tap: stroke animates to `accent` (or `success` if you want green-on-complete), fill scales in from center (0 → 100%, ease-out, ~180ms), then a checkmark path draws in (stroke-dashoffset animation, ~150ms, starting ~80ms into the fill animation so they overlap slightly rather than running sequentially).
- Use Framer Motion (`npm i framer-motion`) for this rather than CSS — you need the overlapping-timing control and spring physics that raw CSS keyframes make painful.
- Card itself: on completion, opacity drops to `0.55` and a subtle scale `0.99 → 1` settle happens over 200ms, so the card "settles" rather than abruptly dimming.
- Haptic-feeling touch: `active:scale-95` on the tap target itself (the 44x44 hit area, not just the visible 22px circle) for instant tactile feedback before the animation even starts.

```tsx
// rough shape, not copy-paste-final
<motion.button
  className="h-11 w-11 flex items-center justify-center active:scale-95 transition-transform"
  onClick={onToggle}
>
  <motion.svg viewBox="0 0 24 24" className="h-6 w-6">
    <motion.circle
      cx="12" cy="12" r="10"
      fill={done ? 'var(--accent)' : 'transparent'}
      stroke={done ? 'var(--accent)' : 'currentColor'}
      animate={{ fill: done ? 'var(--accent)' : 'transparent' }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    />
    <motion.path
      d="M7 12l3 3 7-7"
      stroke="white" strokeWidth="2" fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: done ? 1 : 0 }}
      transition={{ duration: 0.15, delay: done ? 0.08 : 0 }}
    />
  </motion.svg>
</motion.button>
```

This one component, done well, will do more for "feels crafted" than any other single change.

---

## 4. Date header (simplify, drop the ornamental ring widget)

Replace the circular Mon–Sun picker + separate progress bar with a single horizontal strip that's typographically driven, closer to Todoist's own date bar:

```
Today                                    7% · 0/4
Tuesday, June 30

Mon  Tue  Wed  Thu  Fri  Sat  Sun
 23   24   25   26   27   28   29        ← small day-of-month numbers
      ▔▔                                  ← thin underline on selected day only
```

- Day labels: `text-sm text-tertiary`, selected day: `text-primary font-semibold` with a 2px accent underline (not a circle/ring).
- No dotted progress rings around individual days — that visual metaphor doesn't map to anything (rings usually mean "progress around a goal," but here it's just a date picker).
- Fold the completion percentage into the header line itself (top-right, small, secondary text) instead of giving it its own progress bar component.
- This alone removes the biggest "trying too hard" element in the current screenshot.

---

## 5. Card typography & layout

Current cards give title, frequency, and weekly-count badge similar visual weight. Rebuild hierarchy:

```
[icon]  Read 10 min                                    ○
        Daily · 1/7 this week
```

- Title: `text-base font-medium text-primary` (16px/500) — this should be the loudest thing in the row besides the checkbox.
- Combine frequency + weekly progress into **one** secondary line (`Daily · 1/7 this week`) instead of two stacked lines — reduces vertical noise per card from 3 lines to 2.
- Drop the colored left-edge bar (yellow/orange/green stripe) per category — use the emoji/icon itself plus a tiny 6px color dot before the secondary line instead. The left-edge bars currently compete with the card border for "this is the card's boundary."
- Card padding: `p-4`, radius: `rounded-2xl` (16px — softer than v1's 14px, closer to Todoist's rounded language), gap between cards: `gap-2` (8px, tighter than v1's 12px — Todoist's lists feel dense/efficient, not airy).

---

## 6. Animation additions (on top of v1's table)

| Element | Animation | Notes |
|---|---|---|
| Checkbox complete | See Section 3 | Framer Motion, overlapping fill+check |
| List reorder on complete | Completed item smoothly slides to bottom of list (or fades, your call) instead of just dimming in place | `layout` prop in Framer Motion handles this almost for free on a `motion.div` per card |
| Page transition (tab switch) | Keep v1's cross-fade but add a 4px upward slide so it doesn't feel like a static swap | `initial={{opacity:0, y:4}}` |
| Pull/scroll | None added — keep `overscroll-behavior: none` as in v1 |

Install `framer-motion` — it's the single highest-leverage dependency for closing this gap; hand-rolled CSS keyframes will fight you on the overlapping/interruptible timing Todoist-style interactions need.

---

## 7. Concrete next steps

1. **Install Framer Motion**: `npm i framer-motion`.
2. **Update `tailwind.config.ts`** with the color tokens in Section 2.
3. **Rebuild `<CompletionCheck />`** per Section 3 first, in isolation — get this one component feeling right before touching anything else, ideally in a Storybook-less throwaway test page so you're not fighting layout simultaneously.
4. **Rebuild the date header** per Section 4.
5. **Update the `HabitCard`** component per Section 5 (typography, spacing, drop left-edge color bars).
6. **Re-screenshot and compare** against a real Todoist screenshot side by side — at that point we can do a final polish pass on anything that still feels off.

