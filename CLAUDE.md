# Arcera Frontend App — CLAUDE.md

## Product Overview

**Arcera** is an AI-powered home documentation and insurance claims advocacy service.

This document covers the **frontend platform app** — the authenticated, post-login product experience (not the marketing landing page). Users scan items with their phone camera, YOLO AI identifies objects, and the inventory is stored for insurance claims purposes.

---

## Tech Stack

- **Runtime**: Vanilla JavaScript ES modules — no React, no Vue, no framework
- **Build tool**: Vite
- **Styling**: Plain CSS with custom properties (no Tailwind, no CSS-in-JS)
- **Auth**: Supabase (`@supabase/supabase-js`)
- **Backend**: Python Flask via `VITE_API_URL` environment variable
- **Deployment**: Netlify (static, no SSR)
- **No TypeScript** — plain `.js` files throughout

### File Structure

```
/
├── index.html          ← Entry point; loads app.js as module
├── app.js              ← Root orchestrator; handles auth state, navigation
├── items.js            ← Item data layer; renders home/items views
├── styles/
│   ├── main.css        ← All component styles + CSS custom properties
│   └── size.css        ← Responsive sizing tokens only
├── core/
│   ├── api.js          ← Fetch wrapper for Flask backend
│   ├── camera.js       ← Camera sheet + YOLO scanning flow
│   ├── drawer.js       ← Left-side nav drawer
│   ├── footer.js       ← Bottom navigation bar
│   ├── header.js       ← Top app bar
│   ├── item-sheet.js   ← Item detail bottom sheet + fullscreen photo viewer
│   ├── login.js        ← Auth UI (sign in / sign up)
│   └── supabaseClient.js ← Supabase client singleton
└── objects/
    ├── items-list.js   ← Items grid view
    └── summary.js      ← Summary stats cards
```

**Max 500 lines per file.** Split into submodules before exceeding this.

---

## Design System

### Color Palette

```css
/* Core brand */
--color-bg:       #F9F7F4;  /* warm cream — default page/app background */
--color-navy:     #0D1B2A;  /* deep navy — headers, footer, primary buttons */
--color-gold:     #C9A84C;  /* accent gold — CTAs, active states, underlines */
--color-body:     #2C2C2C;  /* primary body text */
--color-muted:    #6B7280;  /* secondary / muted text */
--color-divider:  #E8E4DF;  /* borders, dividers, section lines */
--white:          #FFFFFF;  /* card surfaces, sheet backgrounds */

/* Status (used inline — not in :root) */
/* Success: #059669 bg: rgba(5,150,105,0.08) */
/* Danger:  #EF4444 / #DC2626 — delete actions only */
/* Warning: bg #FEF3C7 / border #FCD34D / text #92400E */
```

### Typography

| Use | Font | Weight | Notes |
|-----|------|--------|-------|
| H1, H2 headlines | Cormorant Garamond | 600 | Serif — heritage + trust feel |
| Section titles | Cormorant Garamond | 600 | `color: var(--color-navy)` |
| Body copy | DM Sans | 400 / 500 | Clean sans for legibility |
| Field labels | DM Sans | 500 | `text-transform: uppercase; letter-spacing: 0.4–0.7px; font-size: 0.62–0.72rem` |
| Item names | DM Sans | 700 | `text-transform: capitalize` |
| Large stats / numbers | DM Mono | 400 | `font-variant-numeric: tabular-nums; letter-spacing: 0.04em` |
| Timestamps / muted | DM Sans | 400 | `color: var(--color-muted)` |

**Fonts loaded via Google Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@400;500;700&family=DM+Mono&display=swap" rel="stylesheet" />
```

### Elevation / Shadow

```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
--shadow-md: 0 4px 12px rgba(0,0,0,0.08);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
```

### Border Radius

```css
--radius: 12px;   /* cards, sheets, buttons, inputs */
/* 8px — secondary elements (thumbnails, chips inner, small inputs) */
/* 50% — circular avatars, icon buttons */
/* 20px — pill chips */
/* 24px — bottom sheet top corners */
```

### Visual Language

- **Generous white space**: 80–120px between major sections; breathing room = premium feel
- **No loud gradients on content areas** — gradients only on the drawer and hero placeholder
- **Thin line icons only** — `stroke-width: 1.5–2`, never filled icons
- **Photography aesthetic**: warm interiors (Architectural Digest feel)
- **No startup-y animations** — subtle transitions only; fade-in on scroll is acceptable
- **Split layout pattern**: deep navy panel paired with content or photo
- **Gold as a sharp accent**: use `var(--color-gold)` for active states, CTAs, underlines, and stat callouts — not as a background fill

---

## Responsive Sizing System

All spacing, font sizes, and layout dimensions use CSS custom properties defined in `styles/size.css`. **Never hardcode these values in component CSS** — always use the token.

### Available Tokens

| Token | Controls |
|-------|----------|
| `--header-padding` | Header top/side padding |
| `--content-padding` | Main content padding (includes bottom-nav clearance) |
| `--nav-padding` | Bottom nav internal padding |
| `--logo-svg` | Logo icon size |
| `--logo-font` | Logo wordmark font size |
| `--drawer-width` | Left drawer width |
| `--hero-padding` | Hero banner padding |
| `--hero-title-font` | Hero section headline font size |
| `--hero-subtitle-font` | Hero section subtext font size |
| `--chip-font` | Room filter chip font size |
| `--grid-columns` | Item grid column count |
| `--grid-gap` | Item grid gap |
| `--card-inner-padding` | Item card internal padding |
| `--card-name-font` | Item card name font size |
| `--card-cost-font` | Item card cost font size |

### Breakpoints

| Breakpoint | Target |
|------------|--------|
| `< 375px` | Default (very small phones) |
| `375px+` | Standard small phones |
| `480px+` | Large phones |
| `768px+` | Tablets |
| `1024px+` | Small desktops |
| `1440px+` | Large desktops |

**Navigation switches at 768px:**
- `≤ 768px`: bottom nav visible; header is `position: fixed`; hamburger hidden
- `≥ 769px`: bottom nav hidden; hamburger button visible; left drawer used instead

---

## Component Reference

### Header (`.header`)

- Sticky on desktop, fixed on mobile
- Left: hamburger (desktop only) + logo
- Right: Login button (unauthenticated) / Add button + Profile button (authenticated)
- Auto-hides on scroll down (mobile only) via `.header--hidden` class

**Logo:** Wordmark in Cormorant Garamond, `color: var(--color-navy)`; small diagonal triangle SVG in gold `var(--color-gold)`

**Add button style:** Gold-tinted icon button (`.header-btn-add`)
```css
background: rgba(201,168,76,0.12);
color: var(--color-gold);
```

**Login button style:**
```css
background: var(--color-navy);
color: #fff;
border-radius: 8px;
```

---

### Left Drawer (`.drawer`)

- Slides in from left over an overlay
- Background: `var(--color-navy)` — deep navy, solid
- White text throughout
- User avatar area at top (avatar icon + name + email)
- Nav items with `data-nav` attribute for routing
- Footer section with logout

**Active state:** `background: rgba(255,255,255,0.18)`
**Hover state:** `background: rgba(255,255,255,0.12)`

---

### Bottom Navigation (`.bottom-nav`)

Mobile only (hidden at 769px+). Three items:
1. **Home** — dashboard tab
2. **Camera** (center, elevated) — floating circle button, `background: var(--color-navy)`, positioned `-20px` above nav baseline
3. **Resources** — resources tab

Active tab indicator: thin `3px` gold bar at top of nav item, animates with `scaleX`.

```css
.nav-item::before {
  background: var(--color-gold);
  /* transitions from scaleX(0) → scaleX(1) */
}
```

---

### Summary Stats Cards (`.summary-stat`)

Three-column grid on home screen. Each card has:
- `border-top: 4px solid var(--stat-color)` — color-coded accent
- Large stat value (`2.5rem`, weight 800)
- Uppercase label (`0.62rem`, weight 700)
- Progress bar at bottom
- CSS custom property `--stat-color` drives the accent, label, and bar fill

**Warn variant:** `.summary-stat-value--warn` — `color: #D97706`

---

### Hero Banner (`.hero-banner`)

Used at top of views before items appear.
```css
background: var(--color-bg);
border: 1px solid var(--color-divider);
border-radius: var(--radius);
text-align: center;
```
Icon (36px gold `var(--color-gold)`), title in Cormorant Garamond navy, subtitle in DM Sans muted. Responsive padding via `--hero-padding` token.

---

### Room Filter Chips (`.room-chip`)

Horizontally scrollable row, hidden scrollbar. Pill shape (`border-radius: 20px`).

- Default: white background, `var(--color-divider)` border, `var(--color-body)` text
- Hover: `var(--color-gold)` border, `var(--color-navy)` text
- Active: `var(--color-navy)` background, white text
- Warning variant (`.room-chip--warning`): amber tones for duplicate-flagged rooms

---

### Item Cards (`.item-card`)

Two-column grid by default (responsive via `--grid-columns`). White cards with subtle shadow.

Structure:
```
.item-card
  img.item-card-thumb (4:3 aspect ratio) OR .item-card-thumb-placeholder
  .item-card-name      — bold, var(--color-navy), capitalized
  .item-card-cost      — medium weight, var(--color-body)
  .item-card-room      — gold-tinted pill badge
  .item-card-year      — muted timestamp
  button.item-card-delete  — top-right, 26px circle, opacity 0.35 → 1 on hover
```

**Hover:** `translateY(-2px)` lift + increased shadow

**Duplicate badge** (`.item-card-duplicate`):
```css
color: #92400E;
background: #FEF3C7;
```

---

### Camera / Scan Sheet (`.camera-sheet`)

Bottom sheet that slides up from `translateY(100%)`.
- White background, `border-radius: 20px 20px 0 0`
- Drag handle bar at top
- Three internal states: **pick** (upload), **scanning** (spinner), **review** (editable list)

**Upload area** (`.camera-pick-area`):
- Dashed border, `var(--color-divider)`
- Hover: `var(--color-gold)` border + `rgba(201,168,76,0.06)` background

**Primary action button** (`.camera-action-btn`):
```css
background: var(--color-navy);
border-radius: var(--radius);
font-weight: 600;
width: 100%;
padding: 14px;
```

**Scanning spinner** (`.camera-spinner`):
```css
border: 3px solid var(--color-divider);
border-top-color: var(--color-gold);
animation: camera-spin 0.75s linear infinite;
```

---

### Item Detail Sheet (`.item-sheet`)

Bottom sheet for editing an item. Background `var(--color-bg)`, `border-radius: 24px 24px 0 0`.

Structure:
```
.item-sheet-handle     — drag handle
.item-sheet-hero       — 220px photo hero (navy bg if no image)
  .item-sheet-hero-overlay  — gradient overlay with item name
  .item-sheet-close    — X button, top-right
.item-sheet-body
  .item-sheet-field    — label + input pairs
  .item-sheet-save     — navy primary button
  .item-sheet-delete   — red text-only button
```

**Field labels:**
```css
font-size: 0.72rem;
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.4px;
color: var(--color-muted);
font-family: 'DM Sans', sans-serif;
```

**Inputs (`.item-sheet-input`):**
```css
border: 1px solid var(--color-divider);
border-radius: 10px;
background: var(--white);
/* focus: border-color: var(--color-gold) */
```

---

### Fullscreen Photo Viewer (`.photo-fullscreen`)

Fixed overlay, black background. Supports:
- Pinch-to-zoom (mobile)
- Scroll-to-zoom (desktop)
- Drag-to-pan when zoomed
- YOLO bounding box overlay (`.photo-yolo-box`) in gold `var(--color-gold)`

---

### Empty State (`.empty-state`)

Centered, 56px padding. Large muted icon (52px, `var(--color-divider)`), bold navy heading in Cormorant Garamond, muted description in DM Sans.

---

## CSS Conventions

### Naming

BEM-inspired but not strict. Pattern: `.block-element--modifier`

```
.item-card           ← block
.item-card-name      ← element
.item-card-delete    ← element
.item-card-duplicate ← modifier (visual variant)
```

### State Classes

| Class | Applied via |
|-------|-------------|
| `.open` | Overlays, sheets, drawer |
| `.active` | Nav items, filter chips |
| `.header--hidden` | Header on scroll |
| `.bottom-nav--hidden` | Nav on scroll |

### Overlay Pattern

All sheets follow this pattern:
1. Overlay (`opacity: 0; pointer-events: none`) → `.open` transitions to `opacity: 1; pointer-events: auto`
2. Sheet (`transform: translateY(100%)`) → `.open` transitions to `transform: translateY(0)`
3. Z-index: overlay `200`, sheet `300`

---

## Animation Conventions

- **Transitions**: `0.15s` for micro-interactions (hover, color changes)
- **Sheet entry**: `0.35s cubic-bezier(0.4, 0, 0.2, 1)`
- **Drawer entry**: `0.3s cubic-bezier(0.4, 0, 0.2, 1)`
- **Overlay fade**: `0.3s` linear
- **Scroll hide**: `0.3s ease`
- **Stat bar fill**: `0.6s cubic-bezier(0.4, 0, 0.2, 1)`
- **Nav indicator**: `0.2s cubic-bezier(0.34, 1.56, 0.64, 1)` (spring bounce)
- **Camera button hover**: `transform: scale(1.06)`

**No keyframe animations except** the camera spinner (`camera-spin`) and subtle scroll-triggered fade-ins. No page transitions. No staggered reveals unless they serve a clear purpose. Keep motion purposeful and minimal.

---

## Icon Conventions

All icons are **inline SVG** with:
```
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
stroke-width="2"       (or 2.5 for emphasis)
stroke-linecap="round"
stroke-linejoin="round"
```

Color via `currentColor` — set on parent via CSS `color` property. Never `fill`-based icons. No icon libraries loaded — all SVG paths written inline.

Standard sizes:
- `14px` — delete/close buttons inside sheets
- `18–20px` — header icon buttons
- `22–24px` — nav items
- `26–28px` — drawer avatar, camera button
- `36–40px` — hero icons, camera pick area
- `52px` — empty state

---

## Module Pattern

Each JS module follows this structure:

```js
// 1. Constants at top
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// 2. Module-level state
let currentItem = null;
let onRefresh = null;

// 3. render() — returns HTML string (for shell components)
export function render() { return `<html string>`; }

// 4. init(callbacks) — wires up event listeners after HTML is in DOM
export function init(refreshCb) { ... }

// 5. open/close — for sheets and overlays
export function open(data) { ... }
```

**No component instances, no classes, no virtual DOM.** State lives in module-level `let` variables. DOM manipulation via `document.querySelector` and `.innerHTML`.

---

## Navigation / Routing

Client-side only — no URL changes. Navigation is tab-based:

| Tab key | View rendered |
|---------|--------------|
| `home` | Summary stats + recent timeline |
| `items` | Full items grid with room filter chips |
| `resources` | Resources view |

`navigate(tab)` in `app.js` calls `setView(tab)` in `items.js` and `setActiveTab(tab)` in `footer.js`.

**Deep links**: not supported. App always starts at `home` after auth.

---

## Authentication Flow

1. `supabase.auth.onAuthStateChange()` in `app.js` — single entry point
2. No session → `renderLogin()` replaces body
3. Session found → full app shell rendered, `refresh()` called
4. Login form: email + password only (Supabase signInWithPassword / signUp)

---

## Data Flow

```
User taps camera
  → camera.js opens sheet
  → User picks image
  → POST /scan → Flask API → YOLO → returns items[]
  → Review screen: user edits name/room/cost/year
  → POST /items → saved to backend
  → onRefresh() called → loadItems() re-fetches + re-renders
```

`items.js` owns the item cache. `getItem(id)` returns by ID. `setFilter(room)` applies room filtering.

---

## Relationship to Landing Page

The landing page (`arcera_landing` or similar) is a **separate project** but shares the same design language:

| | Frontend App | Landing Page |
|---|---|---|
| Colors | Gold + Cream + Navy | Gold + Cream + Navy |
| Font | Cormorant Garamond + DM Sans + DM Mono | Cormorant Garamond + DM Sans |
| Tone | Premium tool — functional but refined | Estate/luxury marketing |
| Framework | Vanilla JS | React + Tailwind |

The app and landing page share the same aesthetic identity. The app should feel like a premium, considered product — not generic SaaS. Heritage typography, warm neutrals, and gold accents carry through both.

---

## Development Constraints

- Max 500 lines per component file
- Mobile-first; primary usage is phone camera workflows
- WCAG AA accessibility — all interactive elements need `aria-label` if icon-only
- All images need `alt` text
- No gradients on content areas — gradients only on the drawer and hero placeholder
- `user-scalable=no` on viewport — intentional for the camera/zoom interaction
- Environment variable: `VITE_API_URL` (Flask backend URL)
- Supabase config: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
