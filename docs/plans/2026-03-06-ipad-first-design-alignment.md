# iPad-First Design Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Arcera frontend app to be iPad-first, visually consistent with arcera.io, and elevated in premium feel — fixing layout, typography, navigation, button consistency, and spacing throughout.

**Architecture:** All changes are pure CSS + minimal JS in existing vanilla JS modules. No new dependencies. Changes are isolated to `styles/main.css`, `styles/size.css`, and targeted component files. Each task is independently shippable.

**Tech Stack:** Vanilla JS ES modules, plain CSS custom properties, Vite, Supabase auth. No framework.

---

## Context: What We Found

### Website (arcera.io) vs App — Key Gaps

| Area | Website | App (current) | Problem |
|---|---|---|---|
| Primary device | Desktop/mobile marketing | Phone-first | iPad gets leftover "desktop" treatment |
| Typography | Large impactful headlines | 1.05rem hero title | Feels cramped, not premium |
| Navigation (tablet) | N/A (marketing) | Hamburger → full drawer | Extra tap; no persistent sidebar |
| Camera CTA | N/A | 36px icon in header (tablet) | Primary workflow buried on iPad |
| Button radius | Rounded, generous | Mixed (0px, 8px, 12px) | Inconsistent across components |
| Safe areas | N/A | Missing | Bottom nav clips on iPhone |
| Login screen | Luxury positioning | Generic SaaS feel | Doesn't match brand |
| Dashboard | Emotional copy | Raw stats, no greeting | Misses brand storytelling |
| Spacing | Generous white space | Tight on mobile | Doesn't feel premium |

### Critical Missing Breakpoints

iPad Air (820px), iPad mini (834px), iPad Pro 11" (1024px), iPad Pro 12.9" (1194px) are all lumped into the 768px+ "desktop" bucket with no tablet-optimized treatment.

---

## Task 1: iPad Breakpoints + Safe Area Tokens in size.css

**Files:**
- Modify: `styles/size.css`

This is the foundation. All subsequent tasks depend on these tokens.

**Step 1: Add iPad-specific breakpoints and safe-area tokens**

Open `styles/size.css` and add the following after the existing `/* Tablets (768px+) */` block (after line ~79) and update the 1024px block:

```css
/* iPad portrait: 820px+ (iPad Air, iPad mini 6) */
@media (min-width: 820px) {
  :root {
    --header-padding: 18px 36px;
    --content-padding: 36px 36px 36px;
    --drawer-width: 280px;
    --hero-padding: 44px 48px;
    --hero-title-font: 1.55rem;
    --hero-subtitle-font: 1rem;
    --chip-font: 0.88rem;
    --grid-columns: repeat(2, 1fr);
    --grid-gap: 20px;
    --card-inner-padding: 22px;
    --card-name-font: 1.05rem;
    --card-cost-font: 1.2rem;
  }
}

/* iPad Pro 11" / landscape iPad Air: 1024px+ */
@media (min-width: 1024px) {
  :root {
    --header-padding: 18px 0px;
    --content-padding: 40px 48px 40px;
    --drawer-width: 260px;
    --hero-padding: 48px 56px;
    --hero-title-font: 1.65rem;
    --hero-subtitle-font: 1.05rem;
    --chip-font: 0.9rem;
    --grid-columns: repeat(3, 1fr);
    --grid-gap: 22px;
    --card-inner-padding: 24px;
    --card-name-font: 1.08rem;
    --card-cost-font: 1.25rem;
  }
}

/* iPad Pro 12.9": 1194px+ */
@media (min-width: 1194px) {
  :root {
    --grid-columns: repeat(3, 1fr);
    --grid-gap: 24px;
  }
}
```

Also add safe-area token support at the bottom of the `:root` block and update the `.bottom-nav` section. Append to the end of `size.css`:

```css
/* ── Safe area insets (iPhone notch / Dynamic Island / home indicator) ── */

.bottom-nav {
  padding-bottom: calc(var(--nav-padding-bottom, 10px) + env(safe-area-inset-bottom, 0px));
}

.main-content {
  padding-bottom: calc(var(--content-bottom, 90px) + env(safe-area-inset-bottom, 0px));
}
```

**Step 2: Verify tokens render correctly**

Run `npm run dev` (or `vite`) and check in browser devtools by toggling between iPhone 14, iPad Air, iPad Pro sizes. Confirm:
- iPad Air (820px): 2-column grid, generous padding
- iPad Pro (1024px): 3-column grid
- iPhone: bottom nav bottom matches safe area

**Step 3: Commit**

```bash
git add styles/size.css
git commit -m "style: add iPad breakpoints and safe-area inset support"
```

---

## Task 2: Persistent Sidebar Layout for iPad/Desktop

**Files:**
- Modify: `styles/main.css` (drawer + layout sections)
- Modify: `styles/size.css` (navigation visibility rules)

The drawer should become a **persistent sidebar** at 820px+. This is how iOS apps (Settings, Mail, etc.) work on iPad — the expected mental model.

**Step 1: Update navigation visibility rules in size.css**

Replace the existing `/* ── Navigation visibility ── */` block at the bottom of `size.css`:

```css
/* ── Navigation visibility ── */

/* Mobile only: show bottom nav, hide hamburger */
@media (max-width: 819px) {
  .hamburger-btn { display: none; }
}

/* iPad+ (820px+): hide bottom nav, show persistent sidebar */
@media (min-width: 820px) {
  .bottom-nav { display: none; }
  .hamburger-btn { display: none; }  /* no hamburger — sidebar is always visible */
  :root { --content-padding: 36px 36px 36px; }
}

@media (min-width: 1024px) {
  :root { --content-padding: 40px 48px 40px; }
}
```

**Step 2: Make drawer persistent on iPad in main.css**

Find the `.drawer` CSS block and add a persistent variant:

```css
/* Persistent sidebar on iPad+ */
@media (min-width: 820px) {
  .drawer-overlay { display: none; }  /* no overlay needed — always open */

  .drawer {
    position: sticky;
    top: 0;
    height: 100vh;
    transform: none !important;   /* always visible, no slide animation */
    flex-shrink: 0;
    box-shadow: none;
    border-right: 1px solid rgba(255,255,255,0.08);
  }

  .drawer-close { display: none; }  /* no close button needed */
}
```

**Step 3: Create app shell layout for sidebar + content**

The app shell in `app.js` renders: drawer + header + main + footer. We need a side-by-side layout wrapper. Add to `main.css`:

```css
/* ── App Shell Layout ── */

.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

@media (min-width: 820px) {
  .app-shell {
    flex-direction: row;
    overflow: hidden;
    height: 100vh;
  }

  .app-shell-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    min-width: 0;
  }

  /* Header becomes part of sidebar column on iPad */
  .header {
    border-bottom: 1px solid rgba(201,168,76,0.15);
    background: var(--white);
  }
}
```

**Step 4: Update app.js to wrap shell correctly**

In `app.js`, find `document.body.innerHTML = ...` (line 15) and update the structure:

```js
document.body.innerHTML = `
  ${renderDrawer()}
  <div class="app-shell-main">
    ${renderHeader()}
    <main class="main-content"></main>
    ${renderFooter()}
  </div>
`;
```

Also wrap the body itself with a flex class. In `main.css`, update `body`:

```css
body {
  display: flex;
  flex-direction: row;   /* was: column — now sidebar + content */
  width: 100%;
  margin: 0;
  position: relative;
  min-height: 100vh;
}

@media (max-width: 819px) {
  body {
    flex-direction: column;
  }
}
```

**Step 5: Update app.js header height compensation**

The `app.js` mobile header-height offset (line 42-46) now only applies to phones. The existing `if (window.matchMedia('(max-width: 768px)')` check needs to become `max-width: 819px`:

```js
if (window.matchMedia('(max-width: 819px)').matches) {
```

**Step 6: Update drawer init to skip hamburger wiring on iPad**

In `drawer.js` `init()` function, the hamburgerBtn open/close listeners are fine — hamburger is just hidden via CSS. No JS change needed.

**Step 7: Test**

In devtools, check:
- iPhone 14: bottom nav visible, full-width layout, no sidebar
- iPad Air (820px portrait): sidebar always visible, no bottom nav, content scrolls right of sidebar
- iPad Pro (1024px): same, wider content area
- Resize between breakpoints: no layout flash

**Step 8: Commit**

```bash
git add styles/main.css styles/size.css app.js
git commit -m "feat: persistent sidebar layout for iPad (820px+)"
```

---

## Task 3: Header Redesign — iPad Sidebar Header

**Files:**
- Modify: `styles/main.css` (header section)
- Modify: `core/header.js`

On iPad with the persistent sidebar, the top header becomes the app bar for the content area only (not full-width). On mobile, it remains fixed full-width.

**Step 1: Update header styles for the sidebar layout**

In `main.css`, find `.header` and add:

```css
@media (min-width: 820px) {
  .header {
    position: sticky;
    top: 0;
    z-index: 50;   /* below drawer's z-index */
    background: var(--white);
    border-bottom: 1px solid rgba(201,168,76,0.15);
  }

  /* No hamburger on iPad — hide it */
  .hamburger-btn {
    display: none;
  }
}
```

**Step 2: Add an "Add Item" button that's more prominent on iPad**

In `core/header.js`, the current add button is a 36px icon. For iPad, we want a labeled button. Update the header render to add a wider CTA class:

```js
// Replace the header-btn-add button with:
<button class="header-btn header-btn-add" id="headerAddBtn" aria-label="Add item">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
  <span class="header-btn-add-label">Scan</span>
</button>
```

Add to `main.css`:

```css
.header-btn-add-label {
  display: none;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-gold);
  letter-spacing: 0.04em;
}

@media (min-width: 820px) {
  .header-btn-add {
    width: auto;
    padding: 0 14px;
    gap: 6px;
    border-radius: 8px;
  }
  .header-btn-add-label { display: block; }
}
```

**Step 3: Test**

- iPhone: header full-width fixed, no label on add button
- iPad: header sticky within content area, "Scan" label visible next to + icon

**Step 4: Commit**

```bash
git add styles/main.css core/header.js
git commit -m "style: iPad header — sticky within content area, labeled scan button"
```

---

## Task 4: Button Consistency Pass

**Files:**
- Modify: `styles/main.css`

Three primary button styles exist with inconsistent `border-radius`. Fix all to use `--radius` (12px).

**Step 1: Audit current button radius values**

Current state:
- `.hero-scan-btn`: `border-radius: 8px` — should be `var(--radius)`
- `.camera-action-btn`: no `border-radius` — inherits 0 — should be `var(--radius)`
- `.login-btn-primary`: check login CSS block (probably missing)
- `.header-btn-login`: `border-radius: 8px` — keep as 8px (it's a small inline button)
- `.header-btn`: `border-radius: 8px` — keep (icon buttons)

**Step 2: Fix hero-scan-btn**

Find `.hero-scan-btn` in `main.css` and change:
```css
/* Before */
border-radius: 8px;
/* After */
border-radius: var(--radius);
```

**Step 3: Fix camera-action-btn**

Find `.camera-action-btn` in `main.css` and add `border-radius: var(--radius)` to the block. Also add it to the existing properties before the `::before` pseudo-element.

**Step 4: Fix login-btn-primary**

Find `.login-btn-primary` in `main.css` — confirm and add/fix `border-radius: var(--radius)`.

**Step 5: Add gold slide animation to hero-scan-btn** (match camera-action-btn)

The camera action button has a premium gold-slide hover effect. The hero scan button does not. Add it:

```css
.hero-scan-btn {
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease;
}
.hero-scan-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--color-gold);
  transform: translateX(-101%);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.hero-scan-btn:hover::before { transform: translateX(0); }
.hero-scan-btn:hover { color: var(--color-navy); }
.hero-scan-btn span { position: relative; z-index: 1; }
```

Update `summary.js` hero scan button to wrap text in `<span>`:
```html
<button class="hero-scan-btn nav-camera-btn" aria-label="Scan items">
  <span>Scan Now</span>
  <svg ...>...</svg>
</button>
```

**Step 6: Test**

Check all three primary buttons hover state shows the gold slide. Verify radius is consistent across camera sheet, hero banner, and login.

**Step 7: Commit**

```bash
git add styles/main.css objects/summary.js
git commit -m "style: consistent border-radius and gold hover on all primary buttons"
```

---

## Task 5: Typography Elevation

**Files:**
- Modify: `styles/main.css`
- Modify: `styles/size.css`

The website uses large, impactful headline typography. The app feels cramped. Elevate the typographic scale.

**Step 1: Increase hero title size across all breakpoints in size.css**

Update the `--hero-title-font` tokens:
```css
/* Default (< 375px) */
--hero-title-font: 1.25rem;   /* was: 1.05rem */

/* 375px+ */
--hero-title-font: 1.35rem;   /* was: 1.12rem */

/* 480px+ */
--hero-title-font: 1.45rem;   /* was: 1.20rem */

/* 768px+ */
--hero-title-font: 1.65rem;   /* was: 1.35rem */

/* 820px+ (new iPad) */
--hero-title-font: 1.75rem;

/* 1024px+ */
--hero-title-font: 1.85rem;   /* was: 1.45rem */

/* 1440px+ */
--hero-title-font: 2rem;      /* was: 1.50rem */
```

**Step 2: Increase hero subtitle and body text sizes**

```css
/* Default */
--hero-subtitle-font: 0.9rem;   /* was: 0.82rem */

/* 375px+ */
--hero-subtitle-font: 0.93rem;

/* 480px+ */
--hero-subtitle-font: 0.96rem;

/* 768px+ */
--hero-subtitle-font: 1rem;     /* was: 0.92rem */
```

**Step 3: Fix section-eyebrow minimum readable size**

In `main.css`, find `.section-eyebrow`:
```css
.section-eyebrow {
  font-size: 10px;   /* was: 9px — below WCAG minimum */
}
```

**Step 4: Increase summary stat label clarity**

Find `.summary-stat-label` in `main.css`:
```css
.summary-stat-label {
  font-size: 0.65rem;   /* was: 0.62rem */
  letter-spacing: 0.18em;  /* slightly tighter than 0.2em — more readable */
}
```

**Step 5: Improve summary stat value on mobile**

The 2.5rem stat value is good. But on very small phones, it can overflow. Add responsive sizing:

```css
.summary-stat-value {
  font-size: clamp(1.8rem, 5vw, 2.5rem);  /* was fixed 2.5rem */
}
```

**Step 6: Test**

Check all screen sizes in devtools. Confirm no text overflow on iPhone SE (375px). Confirm iPad has impactful headline sizes.

**Step 7: Commit**

```bash
git add styles/main.css styles/size.css
git commit -m "style: elevate typography scale across breakpoints"
```

---

## Task 6: Dashboard Greeting + Premium Home Feel

**Files:**
- Modify: `objects/summary.js`
- Modify: `styles/main.css`
- Modify: `app.js` (pass user to summary render)

The website's emotional copy ("Before disaster forces you to prove what you own") sets a premium, reassuring tone. The dashboard should open with a greeting and a brief mission statement, not raw stats.

**Step 1: Update summary.js render() to accept user parameter**

Change the export signature:
```js
export function render(items, user) {
```

**Step 2: Add greeting header to the non-empty dashboard render**

In `summary.js` `render()`, inside the `if (total === 0)` branch (the empty hero banner), add a greeting. In the else branch (when items exist), prepend the greeting before the stats:

```js
const firstName = user
  ? (user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '')
      .split(' ')[0]
      .replace(/\b\w/g, c => c.toUpperCase())
  : '';

const greetingHtml = `
  <div class="dashboard-greeting">
    <h1 class="dashboard-greeting-name">
      ${firstName ? `${firstName}'s Home` : 'Your Home'}
    </h1>
    <p class="dashboard-greeting-sub">Your documentation is building. Keep going.</p>
  </div>
`;
```

Return `greetingHtml + the rest of the HTML` for the non-empty case.

**Step 3: Add greeting styles to main.css**

```css
/* ── Dashboard Greeting ── */

.dashboard-greeting {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-divider);
}

.dashboard-greeting-name {
  font-family: var(--font-serif);
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 600;
  color: var(--color-navy);
  line-height: 1.15;
  letter-spacing: -0.01em;
}

.dashboard-greeting-sub {
  font-size: 0.88rem;
  color: var(--color-muted);
  margin-top: 6px;
  line-height: 1.5;
}
```

**Step 4: Pass user into loadItems / render chain**

In `items.js`, the `render` function from summary is called as `render(items)`. It needs to receive the user. The simplest approach: store user at module level in `items.js`.

In `items.js`, add at top:
```js
let _user = null;
export function setUser(user) { _user = user; }
```

Update the summary render call inside `items.js` to `render(items, _user)`.

In `app.js`, after `initDrawer(...)`, call:
```js
import { setUser } from './items.js';
setUser(session.user);
```

**Step 5: Test**

- With items: greeting shows "Kevin's Home" + subtitle + stats
- Without items: empty hero banner (no greeting needed there)
- User with full_name metadata: shows first name
- User with only email: shows email prefix capitalized

**Step 6: Commit**

```bash
git add objects/summary.js styles/main.css items.js app.js
git commit -m "feat: personalized dashboard greeting matching brand tone"
```

---

## Task 7: Login Screen Polish

**Files:**
- Modify: `styles/main.css` (login section)
- Modify: `core/login.js`

The login screen should feel like the premium gateway to the arcera.io brand — not generic SaaS.

**Step 1: Elevate the login wordmark**

In `login.js`, the `.login-wordmark` is just the text "Arcera". Replace with the logo image:

```js
<div class="login-wordmark">
  <img src="/asset/logo/arcera-high-resolution-logo-transparent.png" alt="Arcera" class="login-wordmark-img" />
</div>
```

**Step 2: Add a premium tagline below the wordmark**

```js
<div class="login-wordmark">
  <img src="/asset/logo/arcera-high-resolution-logo-transparent.png" alt="Arcera" class="login-wordmark-img" />
  <p class="login-wordmark-tagline">Home Documentation &amp; Claims Advocacy</p>
</div>
```

**Step 3: Update login wordmark styles in main.css**

Find `.login-wordmark` and update:
```css
.login-wordmark {
  text-align: center;
  margin-bottom: 32px;  /* was: likely smaller */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.login-wordmark-img {
  height: 44px;
  width: auto;
  object-fit: contain;
}

.login-wordmark-tagline {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 300;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-muted);
}
```

**Step 4: Add a subtle value-prop line above the card**

In `login.js`, add before `.login-card`:
```js
<p class="login-promise">Your proof, documented before you need it.</p>
```

Style in `main.css`:
```css
.login-promise {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  font-weight: 400;
  font-style: italic;
  color: var(--color-navy);
  text-align: center;
  margin-bottom: 28px;
  opacity: 0.75;
}
```

**Step 5: Ensure login-btn-primary has gold slide animation**

Check if `.login-btn-primary` already has the gold slide effect (same as `.camera-action-btn`). If not, add it:
```css
.login-btn-primary {
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease;
}
.login-btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--color-gold);
  transform: translateX(-101%);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.login-btn-primary:hover::before { transform: translateX(0); }
.login-btn-primary:hover { color: var(--color-navy); }
.login-btn-primary > span { position: relative; z-index: 1; }
```

Wrap button text in `<span>` in `login.js` if not already done.

**Step 6: Test**

- Login page loads: logo image shows, tagline visible, italic promise line above card
- Primary button hover: gold slide from left, text turns navy
- Check on iPhone 375px — nothing clips or overflows
- Check on iPad — card centered properly

**Step 7: Commit**

```bash
git add styles/main.css core/login.js
git commit -m "style: premium login screen — logo, tagline, brand promise, button animation"
```

---

## Task 8: Camera Sheet — iPad Modal Treatment

**Files:**
- Modify: `styles/main.css` (camera sheet section)

On iPhone, the full-width bottom sheet is correct. On iPad, it looks like a giant stretched panel. It should be a centered modal dialog with max-width constraint.

**Step 1: Add iPad modal behavior to camera-sheet**

In `main.css`, find `.camera-sheet` and add:

```css
@media (min-width: 820px) {
  .camera-overlay {
    /* Already full-screen — fine */
  }

  .camera-sheet {
    left: 50%;
    right: auto;
    transform: translateX(-50%) translateY(100%);
    width: 560px;
    max-width: 90vw;
    border-radius: 20px;   /* all corners rounded — not just top */
    bottom: 50%;
    margin-bottom: -280px;  /* vertically center: half of typical sheet height */
    max-height: 80vh;
  }

  .camera-sheet.open {
    transform: translateX(-50%) translateY(0);
    bottom: 50%;
  }
}
```

> Note: If centered bottom calc is tricky, simpler alternative: position `top: 50%; transform: translate(-50%, -50%)` for true center. Use whichever renders better.

**Step 2: Add same treatment to item-sheet on iPad**

```css
@media (min-width: 820px) {
  .item-sheet {
    left: 50%;
    right: auto;
    width: 600px;
    max-width: 90vw;
    border-radius: 20px;
    bottom: 50%;
    margin-bottom: -300px;
    transform: translateX(-50%) translateY(100%);
  }

  .item-sheet.open {
    transform: translateX(-50%) translateY(0);
  }
}
```

**Step 3: Test**

- iPhone: full-width bottom sheet from bottom (unchanged)
- iPad: centered modal dialog, properly dismisses on overlay tap

**Step 4: Commit**

```bash
git add styles/main.css
git commit -m "style: camera and item sheets become centered modals on iPad"
```

---

## Task 9: Item Grid — Spacing and Card Padding on iPad

**Files:**
- Modify: `styles/main.css`

The item cards on iPad currently jump from 3-col (768px) to 4-col (1024px). With the sidebar taking ~260-300px, the actual content area is narrower. The Task 2 sidebar layout changes `--grid-columns` to `repeat(2, 1fr)` at 820px and `repeat(3, 1fr)` at 1024px. Confirm these render well.

**Step 1: Adjust item card thumbnail aspect ratio for iPad**

On iPad the 4:3 thumbnail can feel stubby. Add:

```css
@media (min-width: 820px) {
  .item-card-thumb,
  .item-card-thumb-placeholder {
    aspect-ratio: 3 / 2;   /* slightly wider on iPad */
  }
}
```

**Step 2: Improve item card hover on touch devices**

iPad supports hover through pointer:fine detection. Add:

```css
@media (hover: none) {
  .item-card:hover {
    transform: none;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03);
  }
}
```

**Step 3: Verify timeline section label spacing**

The `.timeline-label` uses `timeline-section` + `items-grid`. On iPad, the label should have slightly more breathing room above it. Check and add in `main.css`:

```css
@media (min-width: 820px) {
  .timeline-section + .timeline-section {
    margin-top: 40px;   /* was inheriting ~20px */
  }

  .timeline-label {
    font-size: 1rem;    /* slightly larger label on iPad */
    margin-bottom: 16px;
  }
}
```

**Step 4: Test**

Grid renders correctly on iPad Air (820px) in both portrait and landscape. Item cards aren't too wide or too narrow. Timeline labels have breathing room.

**Step 5: Commit**

```bash
git add styles/main.css
git commit -m "style: item grid and card polish for iPad — aspect ratio, hover, spacing"
```

---

## Task 10: Drawer — Active State Alignment + Section Labels

**Files:**
- Modify: `styles/main.css`
- Modify: `core/drawer.js`

The drawer has "Dashboard" (maps to home tab) and "My Items" (maps to items tab). The bottom nav calls these "Home" and no items tab. Align labels.

**Step 1: Rename "Dashboard" to "Home" in drawer.js**

In `core/drawer.js` line 32, find `data-nav="dashboard"` list item text and change `Dashboard` to `Home`.

**Step 2: Confirm active state styling on persistent sidebar**

On iPad, the active drawer item (`background: rgba(255,255,255,0.18)`) should have a gold left accent bar to match the bottom nav's gold indicator:

```css
@media (min-width: 820px) {
  .drawer-menu li {
    border-radius: 10px;
    margin: 2px 12px;
    padding: 13px 16px;
  }

  .drawer-menu li.active {
    background: rgba(255,255,255,0.16);
    box-shadow: inset 3px 0 0 var(--color-gold);
    border-radius: 0 10px 10px 0;
    margin-left: 0;
    padding-left: 28px;
  }
}
```

**Step 3: Add "Scan" item to drawer with camera icon at top of menu**

The camera/scan flow is the #1 action. It should be at the top of the drawer nav. In `drawer.js`, reorder the `<ul>` so Scan is the second item (after Home):

```html
<li data-nav="dashboard"> ... Home </li>
<li data-nav="scan"> ... Scan Items </li>
<li data-nav="items"> ... My Items </li>
...
```

**Step 4: Test**

- Drawer "Home" label matches bottom nav "Home"
- Active item has gold left bar on iPad persistent sidebar
- Scan is prominently near top

**Step 5: Commit**

```bash
git add core/drawer.js styles/main.css
git commit -m "style: drawer label alignment, gold active indicator on iPad sidebar"
```

---

## Task 11: Section and Content Spacing — Premium White Space Pass

**Files:**
- Modify: `styles/main.css`

The website uses "80–120px between major sections." The app is tight. This task adds breathing room throughout.

**Step 1: Increase margin between summary stats and timeline**

```css
.summary-stats {
  margin-bottom: 32px;   /* was: 20px */
}

@media (min-width: 820px) {
  .summary-stats {
    margin-bottom: 48px;
  }
}
```

**Step 2: Increase section-eyebrow top spacing when it follows content**

```css
.section-eyebrow {
  margin-bottom: 8px;   /* was: 6px */
  margin-top: 4px;
}
```

**Step 3: Add subtle top border to timeline sections**

```css
.timeline-section + .timeline-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--color-divider);
}
```

**Step 4: Increase hero-banner padding on larger screens**

The hero banner already uses `--hero-padding` token. The tablet values from Task 1 handle this. Just verify with devtools at 820px that the hero breathes well.

**Step 5: Test**

Scroll through the home view on iPhone, iPad portrait, iPad landscape, and browser. Confirm sections feel spacious and premium, not cramped.

**Step 6: Commit**

```bash
git add styles/main.css
git commit -m "style: white space pass — more breathing room between sections"
```

---

## Task 12: Final Polish — Accessibility and Edge Cases

**Files:**
- Modify: `styles/main.css`
- Modify: `index.html`

**Step 1: Add viewport meta with safe-area support**

In `index.html`, update the viewport meta:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
```

The `viewport-fit=cover` is required for `env(safe-area-inset-*)` to work on iPhone with notch/Dynamic Island.

**Step 2: Verify WCAG AA contrast on all small text**

Check with browser devtools accessibility panel:
- `.section-eyebrow` gold on cream: `#C9A84C` on `#F9F7F4` — verify passes 3:1 minimum for large text
- `.summary-stat-label` gold on card bg: same check
- `.drawer-section-title` white 35% opacity on navy: may fail — consider bumping to 45% opacity

Fix if any fail:
```css
.drawer-section-title {
  color: rgba(255,255,255,0.45);   /* was 0.35 */
}
```

**Step 3: Confirm touch target sizes meet 44px minimum**

Check: `.nav-item` (has `padding: 4px 20px` + 24px svg = ~32px height — too small). Fix:
```css
.nav-item {
  padding: 8px 20px;   /* was: 4px 20px */
  min-height: 44px;
}
```

**Step 4: Add focus-visible styles for keyboard navigation**

```css
:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 2px;
  border-radius: 4px;
}
```

**Step 5: Test on real device if available**

Priority order per product spec:
1. iPad (any) — persistent sidebar, 2-3 col grid, no bottom nav
2. iPhone — bottom nav, camera button prominent, safe area
3. Browser — sidebar, full layout

**Step 6: Final commit**

```bash
git add styles/main.css index.html
git commit -m "style: accessibility pass — contrast, touch targets, focus styles, safe area viewport"
```

---

## Summary of Changes

| Task | Files Changed | Impact |
|---|---|---|
| 1 | size.css | iPad breakpoints + safe area foundation |
| 2 | main.css, size.css, app.js | Persistent sidebar layout (biggest UX change) |
| 3 | main.css, header.js | iPad header with labeled Scan button |
| 4 | main.css, summary.js | Button consistency + gold slide everywhere |
| 5 | main.css, size.css | Typography scale elevation |
| 6 | summary.js, main.css, items.js, app.js | Personalized greeting |
| 7 | main.css, login.js | Premium login screen |
| 8 | main.css | Sheets become centered modals on iPad |
| 9 | main.css | Item grid polish for iPad |
| 10 | drawer.js, main.css | Drawer alignment + gold active indicator |
| 11 | main.css | White space / breathing room pass |
| 12 | main.css, index.html | Accessibility + final polish |

**Do tasks in order.** Tasks 1 and 2 are prerequisites for everything else. Tasks 3-12 can be done in any order after that.
