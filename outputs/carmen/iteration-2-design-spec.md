# Iteration 2 — Phase 2 Polish + CSS Cleanup

**Author:** Carmen (Arcera Design Agent)  
**Date:** March 26, 2026  
**Project:** `/home/kevin/Apps/Arcera/arcera_frontend/`  
**Based on:** Iteration 1 (claim readiness, trust badge, export card — ✅ merged)  
**Scott QA Findings:** PASS overall | ~20 hardcoded CSS colors need custom properties

---

## Executive Summary

Iteration 1 successfully implemented the critical trust signals (trust badge, claim readiness, export CTA). Iteration 2 focuses on:

1. **Phase 2 Polish** — Hero refinement, recently added enhancements, timeline polish, empty state copy
2. **CSS Cleanup** — Replace ~20 hardcoded colors with `var(--*)` custom properties

---

## Phase 2: Polish Items

### 1. Hero Section Refinement

**Current State (Iteration 1):**
- Geometric gold polygon accent in top-right corner
- "Your Inventory" eyebrow
- Count-up number + "Total items documented" label

**Issues:**
- Polygon accent feels too abstract/techy for Arcera's warm, heritage brand
- No visual connection to completion/progress toward claim readiness
- "Your Inventory" is functional but not emotionally resonant

**Proposed Changes:**

#### A. Remove polygon accent, add subtle gold top border
```css
.home-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-gold), rgba(201,168,76,0.3));
}
```

#### B. Add completion bar under hero
Shows overall claim readiness progress at a glance.

```html
<div class="home-hero-completion">
  <div class="home-hero-completion-bar">
    <div class="home-hero-completion-fill" style="width: 45%"></div>
  </div>
  <span class="home-hero-completion-text">45% complete</span>
</div>
```

#### C. Update copy for emotional resonance
| Current | Proposed |
|---------|----------|
| "Your Inventory" | "Your Home, Documented" |
| "Total items documented" | "items protected. Ready for anything." |

**Priority:** Medium — Improves emotional resonance, adds progress visibility

---

### 2. Recently Added Enhancement

**Current State:**
- Shows thumbnail + item name + room badge
- No value displayed
- No timestamp

**Proposed Changes:**

Add value and timestamp to each mini card:

```html
<div class="home-mini-card item-card" data-id="${item.id}">
  ${thumb}
  <div class="home-mini-body">
    <div class="home-mini-name">${item.label}</div>
    <div class="home-mini-meta">
      ${item.cost ? `<span class="home-mini-cost">${fmtValueShort(item.cost)}</span>` : ''}
      ${item.room ? `<span class="home-mini-room">${item.room}</span>` : ''}
    </div>
    <div class="home-mini-time">${dateLabel(item.created_at)}</div>
  </div>
</div>
```

**Why:** Users should see not just *what* they added, but *how much it's worth* and *when* they added it. This reinforces the value being built.

**CSS:**
```css
.home-mini-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.home-mini-cost {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--color-body);
}

.home-mini-time {
  font-size: 0.62rem;
  color: var(--color-muted);
  margin-top: 2px;
}
```

**Priority:** Low — Nice to have, improves information density

---

### 3. Timeline Visual Polish

**Current State:**
- Date labels ("Today", "Yesterday", "This Week")
- Items grid
- "+X more — View all" button

**Proposed Changes:**

#### A. Add visual separation between sections
```css
.timeline-section {
  margin-bottom: 32px;
  position: relative;
}

/* Add subtle left border to connect sections visually */
.timeline-section::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-divider);
  border-radius: 2px;
}
```

#### B. Add dot indicator for each date label
```css
.timeline-label::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: var(--color-gold);
  border-radius: 50%;
  border: 2px solid var(--color-bg);
}

.timeline-label {
  position: relative;
  padding-left: 12px;
}
```

#### C. Improve "View all" CTA with arrow icon
```css
.timeline-see-more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: auto;
  padding: 8px 16px;
}

.timeline-see-more::after {
  content: '→';
  font-size: 1em;
  color: var(--color-gold);
}
```

**Priority:** Low — Visual polish, not functionally critical

---

### 4. Empty State Copy Update

**Current State (Iteration 1):**
```
Home Inventory
Document everything.
Claim with confidence.

[3 steps: Scan a room → AI identifies items → Build your record]

[Start Your First Scan]
```

**Proposed Changes:**

More specific, outcome-oriented copy:

```
Home Inventory
Document everything. Claim with confidence.

Your home inventory starts here. In 60 minutes, you'll have
claim-ready proof of everything you own.

[  Start Documenting Your Home  ]
     ↓ camera icon
```

**CSS:**
```css
.home-onboard-cta {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
}

.home-onboard-cta svg {
  width: 24px;
  height: 24px;
}

.home-onboard-cta span {
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}
```

**Priority:** Medium — Copy improvement, low technical risk

---

## CSS Cleanup: Hardcoded Colors → Custom Properties

Scott flagged ~20 hardcoded colors. Here's the complete fix list:

### Colors to Add to `:root`

Add these new custom properties:

```css
:root {
  /* Status colors */
  --color-success: #059669;
  --color-success-bg: rgba(5,150,105,0.08);
  --color-success-text: #065f46;
  
  --color-danger: #EF4444;
  --color-danger-dark: #DC2626;
  --color-danger-bg: rgba(239,68,68,0.08);
  --color-danger-text: #991b1b;
  
  --color-warning: #F59E0B;
  --color-warning-bg: #FEF3C7;
  --color-warning-border: #FCD34D;
  --color-warning-text: #92400E;
  --color-warning-alt: #D97706;  /* amber for low readiness */
  
  /* Derived colors */
  --color-navy-dark: #1a2f45;  /* hover state */
  --color-gold-light: #dbb95e;  /* already exists as --gold-hover */
  --color-gold-dim: rgba(201,168,76,0.12);
  
  /* Utility */
  --color-black: #000000;
  --color-cream: #F9F7F4;  /* alias for --color-bg */
  --color-border-light: #E0DBD4;
  --color-placeholder: #C8C4BE;
}
```

### File-by-File Replacements

#### `styles/main.css` — Lines to Fix

| Line | Current | Replace With |
|------|---------|--------------|
| 175 | `color: #fff;` | `color: var(--white);` |
| 482 | `color: #D97706;` | `color: var(--color-warning-alt);` |
| 573 | `background: linear-gradient(135deg, #059669 0%, #047857 100%);` | `background: linear-gradient(135deg, var(--color-success) 0%, #047857 100%);` |
| 725 | `--stat-color: #D97706;` | `--stat-color: var(--color-warning-alt);` |
| 729 | `--stat-color: #059669;` | `--stat-color: var(--color-success);` |
| 733 | `--stat-color: #0D1B2A;` | `--stat-color: var(--color-navy);` |
| 839 | `background: #1a2f45;` | `background: var(--color-navy-dark);` |
| 1065 | `color: #D97706;` | `color: var(--color-warning-alt);` |
| 1278 | `color: #92400E;` | `color: var(--color-warning-text);` |
| 1279 | `background: #FEF3C7;` | `background: var(--color-warning-bg);` |
| 1286 | `border-color: #FCD34D;` | `border-color: var(--color-warning-border);` |
| 1287 | `color: #78350F;` | `color: var(--color-warning-text);` |
| 1288 | `background: #FEF3C7;` | `background: var(--color-warning-bg);` |
| 1291 | `border-color: #F59E0B;` | `border-color: var(--color-warning);` |
| 1292 | `color: #78350F;` | `color: var(--color-warning-text);` |
| 1295 | `background: #F59E0B;` | `background: var(--color-warning);` |
| 1296-1297 | `color: #fff;` `border-color: #F59E0B;` | `color: var(--white);` `border-color: var(--color-warning);` |
| 1319 | `background: #FEE2E2;` | `background: #FEE2E2;` ⚠️ (add `--color-danger-bg-light`) |
| 1321 | `color: #EF4444;` | `color: var(--color-danger);` |
| 1629 | `color: #EF4444 !important;` | `color: var(--color-danger) !important;` |
| 1655 | `background: #000;` | `background: var(--color-black);` |
| 1710 | `color: #fff;` | `color: var(--white);` |
| 1804 | `color: #fff;` | `color: var(--white);` |
| 1824 | `color: #fff;` | `color: var(--white);` |
| 1898 | `color: #EF4444;` | `color: var(--color-danger);` |
| 1902 | `color: #DC2626;` | `color: var(--color-danger-dark);` |
| 1987 | `background: #FEE2E2;` | `background: #FEE2E2;` ⚠️ (add `--color-danger-bg-light`) |
| 1989 | `color: #EF4444;` | `color: var(--color-danger);` |
| 2248 | `color: #92660A;` | `color: var(--color-warning-text);` (or add `--color-pro-text`) |
| 2358 | `background: #1a2f45;` | `background: var(--color-navy-dark);` |
| 2381 | `background: rgba(5,150,105,0.08); color: #065f46; border-left: 2px solid #059669;` | `background: var(--color-success-bg); color: var(--color-success-text); border-left: 2px solid var(--color-success);` |
| 2382 | `background: rgba(239,68,68,0.08); color: #991b1b; border-left: 2px solid #ef4444;` | `background: var(--color-danger-bg); color: var(--color-danger-text); border-left: 2px solid var(--color-danger);` |
| 2392 | `background: #0D1B2A;` | `background: var(--color-navy);` |
| 2399 | `color: #2C2C2C;` | `color: var(--color-body);` |
| 2434 | `color: #C9A84C;` | `color: var(--color-gold);` |
| 2445 | `background: #F9F7F4;` | `background: var(--color-bg);` |
| 2447 | `border-top: 3px solid #C9A84C;` | `border-top: 3px solid var(--color-gold);` |
| 2465 | `border-color: #C9A84C;` | `border-color: var(--color-gold);` |
| 2478 | `color: #0D1B2A;` | `color: var(--color-navy);` |
| 2489 | `background: #C9A84C;` | `background: var(--color-gold);` |
| 2508 | `color: #6B7280;` | `color: var(--color-muted);` |
| 2522 | `background: #C9A84C;` | `background: var(--color-gold);` |
| 2531 | `border-bottom: 1px solid #E0DBD4;` | `border-bottom: 1px solid var(--color-border-light);` |
| 2537 | `color: #2C2C2C;` | `color: var(--color-body);` |
| 2540 | `color: #C8C4BE;` | `color: var(--color-placeholder);` |
| 2550 | `color: #6B7280;` | `color: var(--color-muted);` |
| 2557 | `color: #C9A84C;` | `color: var(--color-gold);` |
| 2586 | `border: 1px solid #E0DBD4;` | `border: 1px solid var(--color-border-light);` |
| 2598 | `border-color: #C9A84C; background: #C9A84C;` | `border-color: var(--color-gold); background: var(--color-gold);` |
| 2603 | `color: #6B7280;` | `color: var(--color-muted);` |

**Additional color to add:**
```css
--color-danger-bg-light: #FEE2E2;  /* For delete button hover */
```

**Total replacements:** ~45 instances across the file

---

## Implementation Checklist

### Phase 2 Polish

- [ ] **Hero Section**
  - [ ] Remove polygon accent SVG
  - [ ] Add gold top border via `::before`
  - [ ] Add completion bar with readiness %
  - [ ] Update eyebrow to "Your Home, Documented"
  - [ ] Update label to "items protected. Ready for anything."

- [ ] **Recently Added**
  - [ ] Add `fmtValueShort()` call to mini cards
  - [ ] Add timestamp via `dateLabel()`
  - [ ] Update CSS for `.home-mini-meta`, `.home-mini-cost`, `.home-mini-time`

- [ ] **Timeline**
  - [ ] Add left border to sections
  - [ ] Add dot indicator to date labels
  - [ ] Add arrow icon to "View all" button

- [ ] **Empty State**
  - [ ] Update CTA button copy to "Start Documenting Your Home"
  - [ ] Add subtitle: "Your home inventory starts here. In 60 minutes, you'll have claim-ready proof of everything you own."

### CSS Cleanup

- [ ] Add new color custom properties to `:root`
- [ ] Replace all hardcoded colors (see table above)
- [ ] Run `grep` to verify no remaining hardcoded colors (except in `:root`)

---

## Files to Modify

| File | Changes | Lines Affected |
|------|---------|----------------|
| `objects/summary.js` | Hero update, mini card enhancement, empty state copy | ~50 |
| `styles/main.css` | Phase 2 CSS + color cleanup | ~45 replacements |

---

## Accessibility Checklist

- [ ] Completion bar has `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] All new icons have `aria-hidden="true"` (decorative)
- [ ] Color contrast meets WCAG AA (gold on navy: 4.5:1 minimum)
- [ ] Touch targets remain 44px minimum

---

## Success Metrics

After implementing these changes, measure:
1. **Visual polish perception** — Does the dashboard feel more refined?
2. **Information density** — Do users find value/timestamp helpful in Recently Added?
3. **Empty state conversion** — Does the new copy improve first-scan activation?
4. **Code quality** — Zero hardcoded colors remaining (except `:root` definitions)

---

## Open Questions

1. **Hero completion bar** — Should this show claim readiness % or a simpler "X of 8 rooms" metric?
2. **Mini card value display** — What if item has no value? Show "—" or hide the cost span entirely?
3. **Timeline left border** — Does this work on mobile, or should it be desktop-only?

---

*End of Iteration 2 Specification*
