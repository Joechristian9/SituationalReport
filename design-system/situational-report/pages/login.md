# Auth pages (Login, Forgot/Reset/Confirm Password, Verify Email) — overrides MASTER

Applies to every page rendered in `Layouts/GuestLayout.jsx`.

## Deviations from MASTER (requested by the product owner, 2026-10-07)
- **Full-bleed brand background** instead of the light `bg-background` page: the landing page's navy radial gradient (lifted to a brighter blue at the centre), contour lines, dot grid, and radar (`Components/BrandBackdrop.jsx`).
- **Layout:** one full-bleed page (no split panels). From `lg` the brand block (seals, office name, tagline) sits on the left and the card on the right; below `lg` they stack, brand first.
- **Smoked-glass card** for the form, despite MASTER §1 "no glassmorphism":
  - `bg-[#0b1426]/45` + `backdrop-blur-2xl backdrop-saturate-150`, `border-white/15` hairline, inset top highlight, deep shadow, `rounded-3xl`, a static sky glow in the top-right corner of the card.
  - Inputs are soft translucent fills (`bg-background` = white 8%) with a near-invisible border; focus shows the blue ring.
  - Fallback without `backdrop-filter`: `#0b1426` at 95%.
  - History: a dark-tinted glass was rejected as too dark; a white frosted card and a clear glass followed; the owner chose this smoked glass from a reference.

## Rules that keep it fast and readable
- The card has the `auth-glass` class (`resources/css/app.css`), which re-points the design tokens: foreground white, muted light gray, primary brand blue with white text (5.2:1), links in `text-accent-foreground` (light blue), translucent `background`/`border`/`input`/`accent`, lighter status colours. Use tokens (`text-foreground`, `text-muted-foreground`, `border-input`, `Button`, `Input`), never raw palette classes.
- `background`, `border`, `input` and `accent` carry their own alpha inside `auth-glass`. Never put `/opacity` modifiers on them there: `bg-background/50` would produce invalid CSS.
- Inputs use `bg-background` (translucent white inside the card). Checkboxes use `text-primary` (blue when checked).
- No bright glow directly behind the card: it would drop white-text contrast below 4.5:1.
- Nothing animated may sit behind the glass: `backdrop-filter` re-blurs whenever what is beneath it changes. The radar stays in a corner (`lg` and up only).
- Motion is entrance-only (`enter` from `BrandBackdrop`) plus the corner radar; all `motion-safe`.
- One `h1` per page (the form heading); the office name above the card is a `p`.
