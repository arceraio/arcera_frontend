# Iteration 2 — Integration Specification for James

**Author:** Carmen (Arcera Design Agent)  
**Date:** March 26, 2026  
**Priority:** Medium (Phase 2 polish + CSS cleanup)  
**Trigger:** `.agent-complete-carmen`

---

## Overview

This spec implements Phase 2 polish items and CSS color cleanup. All changes are non-breaking and build on Iteration 1 (claim readiness, trust badge, export card).

**Files to modify:**
1. `objects/summary.js` — Hero, mini cards, empty state
2. `styles/main.css` — Phase 2 CSS + ~45 color replacements

---

## Part 1: CSS Custom Properties (Do First)

### Add to `styles/main.css` `:root` block (after line 19)

```css
:root {
  /* ... existing colors ... */
  
  /* NEW: Status colors */
  --color-success: #059669;
  --color-success-bg: rgba(5,150,105,0.08);
  --color-success-text: #065f46;
  
  --color-danger: #EF4444;
  --color-danger-dark: #DC2626;
  --color-danger-bg: rgba(239,68,68,0.08);
  --color-danger-bg-light: #FEE2E2;
  --color-danger-text: #991b1b;
  
  --color-warning: #F59E0B;
  --color-warning-bg: #FEF3C7;
  --color-warning-border: #FCD34D;
  --color-warning-text: #92400E;
  --color-warning-alt: #D97706;
  
  /* NEW: Derived colors */
  --color-navy-dark: #1a2f45;
  --color-gold-dim: rgba(201,168,76,0.12);
  
  /* NEW: Utility */
  --color-black: #000000;
  --color-border-light: #E0DBD4;
  --color-placeholder: #C8C4BE;
}
```

---

## Part 2: CSS Color Replacements

### Run this sed command (or do manually)

```bash
cd /home/kevin/Apps/Arcera/arcera_frontend

# Backup first
cp styles/main.css styles/main.css.bak

# Replace hardcoded colors with custom properties
sed -i 's/color: #fff;/color: var(--white);/g' styles/main.css
sed -i 's/color: #D97706;/color: var(--color-warning-alt);/g' styles/main.css
sed -i 's/--stat-color: #D97706;/--stat-color: var(--color-warning-alt);/g' styles/main.css
sed -i 's/--stat-color: #059669;/--stat-color: var(--color-success);/g' styles/main.css
sed -i 's/--stat-color: #0D1B2A;/--stat-color: var(--color-navy);/g' styles/main.css
sed -i 's/background: #1a2f45;/background: var(--color-navy-dark);/g' styles/main.css
sed -i 's/color: #92400E;/color: var(--color-warning-text);/g' styles/main.css
sed -i 's/background: #FEF3C7;/background: var(--color-warning-bg);/g' styles/main.css
sed -i 's/border-color: #FCD34D;/border-color: var(--color-warning-border);/g' styles/main.css
sed -i 's/color: #78350F;/color: var(--color-warning-text);/g' styles/main.css
sed -i 's/border-color: #F59E0B;/border-color: var(--color-warning);/g' styles/main.css
sed -i 's/background: #F59E0B;/background: var(--color-warning);/g' styles/main.css
sed -i 's/background: #FEE2E2;/background: var(--color-danger-bg-light);/g' styles/main.css
sed -i 's/color: #EF4444;/color: var(--color-danger);/g' styles/main.css
sed -i 's/color: #DC2626;/color: var(--color-danger-dark);/g' styles/main.css
sed -i 's/background: #000;/background: var(--color-black);/g' styles/main.css
sed -i 's/background: #0D1B2A;/background: var(--color-navy);/g' styles/main.css
sed -i 's/color: #2C2C2C;/color: var(--color-body);/g' styles/main.css
sed -i 's/color: #C9A84C;/color: var(--color-gold);/g' styles/main.css
sed -i 's/background: #F9F7F4;/background: var(--color-bg);/g' styles/main.css
sed -i 's/border-top: 3px solid #C9A84C;/border-top: 3px solid var(--color-gold);/g' styles/main.css
sed -i 's/border-color: #C9A84C;/border-color: var(--color-gold);/g' styles/main.css
sed -i 's/background: #C9A84C;/background: var(--color-gold);/g' styles/main.css
sed -i 's/color: #6B7280;/color: var(--color-muted);/g' styles/main.css
sed -i 's/border-bottom: 1px solid #E0DBD4;/border-bottom: 1px solid var(--color-border-light);/g' styles/main.css
sed -i 's/color: #C8C4BE;/color: var(--color-placeholder);/g' styles/main.css

# Special case: gradient on line 573 (unlocked export card)
sed -i 's/background: linear-gradient(135deg, #059669 0%, #047857 100%);/background: linear-gradient(135deg, var(--color-success) 0%, #047857 100%);/g' styles/main.css

# Special case: settings messages (lines 2381-2382)
sed -i 's/background: rgba(5,150,105,0.08); color: #065f46; border-left: 2px solid #059669;/background: var(--color-success-bg); color: var(--color-success-text); border-left: 2px solid var(--color-success);/g' styles/main.css
sed -i 's/background: rgba(239,68,68,0.08);  color: #991b1b; border-left: 2px solid #ef4444;/background: var(--color-danger-bg); color: var(--color-danger-text); border-left: 2px solid var(--color-danger);/g' styles/main.css
```

### Verify no remaining hardcoded colors

```bash
# Should only show :root definitions
grep -n "#[0-9A-Fa-f]\{3,8\}" styles/main.css | grep -v "^[0-9]*:  --" | grep -v "^[0-9]*:"
```

---

## Part 3: Hero Section Refinement (`objects/summary.js`)

### Update `renderHero()` function (around line 100)

**Replace:**
```javascript
function renderHero(total) {
  return `
    <div class="home-hero">
      ${renderHeroAccent()}
      <span class="home-hero-eyebrow">Your Inventory</span>
      <span class="home-hero-number" data-countup="${total}" data-countup-duration="800">0</span>
      <span class="home-hero-label">Total items documented</span>
    </div>
  `;
}
```

**With:**
```javascript
function renderHero(total, readinessScore) {
  return `
    <div class="home-hero">
      <span class="home-hero-eyebrow">Your Home, Documented</span>
      <span class="home-hero-number" data-countup="${total}" data-countup-duration="800">0</span>
      <span class="home-hero-label">items protected. Ready for anything.</span>
      <div class="home-hero-completion">
        <div class="home-hero-completion-bar" role="progressbar" aria-valuenow="${readinessScore}" aria-valuemin="0" aria-valuemax="100">
          <div class="home-hero-completion-fill" style="width: ${readinessScore}%"></div>
        </div>
        <span class="home-hero-completion-text">${readinessScore}% complete</span>
      </div>
    </div>
  `;
}
```

### Update `render()` call to pass readinessScore

**Find in `render()` function (around line 250):**
```javascript
return `
  ${renderHero(total)}
  ${trustBadgeHtml}
  ...
```

**Replace with:**
```javascript
return `
  ${renderHero(total, readinessScore)}
  ${trustBadgeHtml}
  ...
```

---

## Part 4: Recently Added Enhancement (`objects/summary.js`)

### Update `renderMiniCard()` function (around line 130)

**Replace:**
```javascript
function renderMiniCard(item) {
  const thumb = item.crop_url
    ? `<img class="home-mini-thumb" src="${item.crop_url}" alt="${item.label}" loading="lazy">`
    : `<div class="home-mini-thumb-placeholder">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
           <rect x="3" y="3" width="18" height="18" rx="2"/>
           <circle cx="8.5" cy="8.5" r="1.5"/>
           <polyline points="21 15 16 10 5 21"/>
         </svg>
       </div>`;

  return `
    <div class="home-mini-card item-card" data-id="${item.id}">
      ${thumb}
      <div class="home-mini-body">
        <div class="home-mini-name">${item.label}</div>
        ${item.room ? `<span class="home-mini-room">${item.room}</span>` : ''}
      </div>
    </div>
  `;
}
```

**With:**
```javascript
function renderMiniCard(item) {
  const thumb = item.crop_url
    ? `<img class="home-mini-thumb" src="${item.crop_url}" alt="${item.label}" loading="lazy">`
    : `<div class="home-mini-thumb-placeholder">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
           <rect x="3" y="3" width="18" height="18" rx="2"/>
           <circle cx="8.5" cy="8.5" r="1.5"/>
           <polyline points="21 15 16 10 5 21"/>
         </svg>
       </div>`;

  return `
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
  `;
}
```

---

## Part 5: Timeline Visual Polish (`styles/main.css`)

### Add after `.timeline-section` rule (around line 1970)

```css
.timeline-section {
  margin-bottom: 32px;
  position: relative;
  padding-left: 12px;
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

.timeline-label {
  font-size: 0.78rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--color-muted);
  margin-bottom: 10px;
  position: relative;
  padding-left: 12px;
}

/* Add dot indicator for each date label */
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

.timeline-see-more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: auto;
  padding: 8px 16px;
}

/* Add arrow icon to "View all" button */
.timeline-see-more::after {
  content: '→';
  font-size: 1em;
  color: var(--color-gold);
}
```

---

## Part 6: Empty State Copy Update (`objects/summary.js`)

### Update `renderEmpty()` function (around line 180)

**Find the CTA button:**
```html
<button class="home-onboard-cta nav-camera-btn" aria-label="Start your first scan">
  <svg ...>...</svg>
  <span>Start Your First Scan</span>
</button>
```

**Replace the button with:**
```html
<button class="home-onboard-cta nav-camera-btn" aria-label="Start documenting your home">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
  <span>Start Documenting Your Home</span>
</button>
```

**Optional: Add subtitle under the title**

Find:
```html
<h2 class="home-onboard-title">Document everything.<br>Claim with confidence.</h2>
<div class="home-onboard-accent-line"></div>
```

Add after:
```html
<p class="home-onboard-subtitle">
  Your home inventory starts here. In 60 minutes, you'll have
  claim-ready proof of everything you own.
</p>
```

**Add CSS for subtitle (in `styles/main.css`):**
```css
.home-onboard-subtitle {
  font-size: 0.88rem;
  color: var(--color-muted);
  line-height: 1.5;
  max-width: 320px;
  margin: 8px auto 20px;
}
```

---

## Part 7: Add Hero Completion Bar CSS (`styles/main.css`)

### Add after `.home-hero-label` rule (around line 780)

```css
.home-hero-completion {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.home-hero-completion-bar {
  flex: 1;
  height: 4px;
  background: var(--color-bg);
  border-radius: 2px;
  overflow: hidden;
}

.home-hero-completion-fill {
  height: 100%;
  background: var(--color-gold);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.home-hero-completion-text {
  font-size: 0.72rem;
  color: var(--color-muted);
  white-space: nowrap;
  font-family: var(--font-mono);
}
```

---

## Part 8: Add Mini Card Meta CSS (`styles/main.css`)

### Add after `.home-mini-room` rule (around line 950)

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

---

## Testing Checklist

### Visual Tests
- [ ] Hero shows completion bar with correct % (matches claim readiness)
- [ ] Hero has gold top border (not polygon accent)
- [ ] Recently Added cards show value + timestamp
- [ ] Timeline sections have left border + dot indicators
- [ ] "View all" button has arrow icon
- [ ] Empty state CTA says "Start Documenting Your Home"

### Code Quality Tests
- [ ] No hardcoded colors remaining (run grep command above)
- [ ] All CSS custom properties are defined in `:root`
- [ ] No console errors in browser dev tools

### Accessibility Tests
- [ ] Completion bar has `role="progressbar"` and aria attributes
- [ ] All decorative icons have `aria-hidden="true"`
- [ ] Color contrast passes WCAG AA

---

## Rollback Plan

If issues arise:

```bash
cd /home/kevin/Apps/Arcera/arcera_frontend
git checkout objects/summary.js styles/main.css
# Or restore from backup
cp styles/main.css.bak styles/main.css
```

---

## Post-Implementation

1. Run `npm run build` to verify no build errors
2. Test on mobile (iOS Safari, Android Chrome)
3. Test on tablet (iPad)
4. Test on desktop (Chrome, Safari, Firefox)
5. Commit with message: `feat: Iteration 2 polish + CSS color cleanup`

---

*End of Integration Spec*
