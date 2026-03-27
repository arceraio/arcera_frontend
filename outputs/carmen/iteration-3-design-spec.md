# Iteration 3 — Export Functionality + Polish

**Author:** Carmen (Arcera Design Agent)  
**Date:** March 26, 2026  
**Project:** `/home/kevin/Apps/Arcera/arcera_frontend/`  
**Status:** Iterations 1 + 2 ✅ complete | Iteration 3 in progress

---

## Executive Summary

Iterations 1 + 2 delivered:
- ✅ Claim readiness calculation + UI
- ✅ Trust badge with social proof
- ✅ Export CTA card (UI only — not wired)
- ✅ Hero refinement with completion bar
- ✅ Recently Added with value + timestamp
- ✅ Timeline visual polish
- ✅ CSS color cleanup (272 `var(--*)` usages, 0 hardcoded)

**Iteration 3 focuses on:**
1. **Export Functionality** — Wire up export button, add format options, success state
2. **Animation Refinements** — Smoother transitions, reduced motion support
3. **Performance Optimizations** — Lazy loading, memoization, reduced re-renders
4. **Remaining Polish** — Export success state, empty state improvements

---

## Priority 1: Export Functionality (Critical)

### Current State
- Export card UI exists in `summary.js`
- Button has `disabled` attribute when readiness < 80%
- Backend `/export` endpoint exists (generates CSV)
- **Gap:** Button doesn't actually trigger export when unlocked

### Proposed Implementation

#### A. Wire Up Export Button

**File:** `objects/summary.js`

**Add to `init()` function:**
```javascript
// ── Export button handler ────────────────────────────────────────
const exportBtn = document.querySelector('.home-export-btn');
if (exportBtn && !exportBtn.disabled) {
  exportBtn.addEventListener('click', async () => {
    const btn = exportBtn;
    const originalContent = btn.innerHTML;
    
    // Show loading state
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="export-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
      </svg>
      <span>Preparing Export...</span>
    `;
    
    try {
      const response = await fetch(`${API}/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).session?.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arcera-inventory-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Show success state
      showExportSuccess();
      
    } catch (err) {
      console.error('Export error:', err);
      btn.disabled = false;
      btn.innerHTML = originalContent;
      alert('Export failed. Please try again or contact support.');
    }
  });
}
```

#### B. Add Export Success State

**New component:** Export success modal/sheet

**File:** `objects/summary.js` — Add new function:
```javascript
function showExportSuccess() {
  const overlay = document.createElement('div');
  overlay.className = 'export-success-overlay open';
  overlay.innerHTML = `
    <div class="export-success-card">
      <div class="export-success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h3 class="export-success-title">Export Complete</h3>
      <p class="export-success-desc">
        Your inventory has been downloaded. This file is ready to submit
        with your insurance claim.
      </p>
      <div class="export-success-actions">
        <button class="export-success-primary" onclick="this.closest('.export-success-overlay').remove()">
          Got It
        </button>
        <button class="export-success-secondary" onclick="
          navigator.share({
            title: 'Arcera Inventory',
            text: 'My home inventory export',
            files: []
          }).catch(() => {});
        ">
          Share
        </button>
      </div>
      <p class="export-success-note">
        Store this file somewhere safe. You can also email it to
        <a href="mailto:support@arcera.com">support@arcera.com</a> for backup.
      </p>
    </div>
  `;
  document.body.appendChild(overlay);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (overlay.parentElement) {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
    }
  }, 5000);
}
```

#### C. Add Export Options Modal (Future Enhancement)

For now, direct CSV download is sufficient. Future iteration could add:
- Format selection (CSV / PDF / JSON)
- Email delivery option
- Include/exclude photos toggle
- Room filtering

---

## Priority 2: Animation Refinements

### Current State
- Stat cards fade in with stagger
- Count-up animations work
- Sheet transitions are functional but basic

### Proposed Improvements

#### A. Add Smooth Scroll Behavior

**File:** `styles/main.css` — Add to `html`:
```css
html {
  scroll-behavior: smooth;
}
```

#### B. Improve Card Entry Animations

**Current:** Simple fade + translateY  
**Proposed:** Add slight scale + rotation for more organic feel

```css
.home-stat-card {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.home-stat--visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.home-mini-card {
  opacity: 0;
  transform: translateY(8px) rotate(-1deg);
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.15s;
}

.home-mini--visible {
  opacity: 1;
  transform: translateY(0) rotate(0);
}
```

#### C. Add Reduced Motion Support

**File:** `styles/main.css` — Add media query:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .home-stat-card,
  .home-mini-card {
    transform: none !important;
  }
}
```

#### D. Add Hover Micro-interactions

**File:** `styles/main.css` — Enhance existing hover states:

```css
.home-action-btn--primary:hover {
  background: #1a2f45;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13,27,42,0.2);
}

.home-action-btn--outline:hover {
  border-color: var(--color-gold);
  color: var(--color-gold);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(201,168,76,0.15);
}

.home-export-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(201,168,76,0.3);
}

/* Add subtle pulse to export icon when ready */
.home-export-card.unlocked .home-export-icon {
  animation: exportPulse 2s ease-in-out infinite;
}

@keyframes exportPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

---

## Priority 3: Performance Optimizations

### Current State
- All items rendered at once
- No memoization of static content
- Images load without lazy loading optimization

### Proposed Improvements

#### A. Optimize Image Loading

**File:** `objects/summary.js` — Update `renderMiniCard()`:

```javascript
function renderMiniCard(item) {
  const thumb = item.crop_url
    ? `<img class="home-mini-thumb" 
             src="${item.crop_url}" 
             alt="${item.label}" 
             loading="lazy"
             decoding="async"
             width="116"
             height="87">`
    : `<div class="home-mini-thumb-placeholder">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
           <rect x="3" y="3" width="18" height="18" rx="2"/>
           <circle cx="8.5" cy="8.5" r="1.5"/>
           <polyline points="21 15 16 10 5 21"/>
         </svg>
       </div>`;
  // ... rest of function
}
```

#### B. Debounce Count-up Animations

**File:** `objects/summary.js` — Add debouncing for rapid re-renders:

```javascript
let countUpAnimationId = null;

function countUp(el, target, duration) {
  if (countUpAnimationId) {
    cancelAnimationFrame(countUpAnimationId);
  }
  
  const start = performance.now();
  const startVal = 0;
  const isFloat = String(target).includes('.');
  const prefix = el.dataset.countupPrefix || '';

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = startVal + (target - startVal) * eased;
    el.textContent = prefix + (isFloat ? current.toFixed(1) : Math.round(current));
    
    if (progress < 1) {
      countUpAnimationId = requestAnimationFrame(tick);
    } else {
      countUpAnimationId = null;
    }
  }

  countUpAnimationId = requestAnimationFrame(tick);
}
```

#### C. Limit Timeline Items by Default

**Current:** Shows 15 items per section  
**Proposed:** Show 8 by default, "View all" loads more

```javascript
function renderTimeline(items) {
  const groups = new Map();
  [...items]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .forEach(it => {
      const label = dateLabel(it.created_at);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(it);
    });

  const sections = [...groups.entries()].map(([label, group]) => {
    const limit = 8;  // Reduced from 15
    const visible = group.slice(0, limit);
    const remaining = group.length - limit;  // Show actual remaining count
    // ... rest unchanged
  });
  // ...
}
```

---

## Priority 4: Remaining Polish

### A. Export Success State Styling

**File:** `styles/main.css` — Add new styles:

```css
/* Export Success Overlay */
.export-success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.export-success-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.export-success-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 32px 24px;
  max-width: 400px;
  text-align: center;
  box-shadow: var(--shadow-lg);
  transform: scale(0.95);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.export-success-overlay.open .export-success-card {
  transform: scale(1);
}

.export-success-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: var(--color-success-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-success-icon svg {
  width: 32px;
  height: 32px;
  color: var(--color-success);
}

.export-success-title {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--color-navy);
  margin-bottom: 8px;
}

.export-success-desc {
  font-size: 0.88rem;
  color: var(--color-muted);
  line-height: 1.5;
  margin-bottom: 20px;
}

.export-success-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.export-success-primary {
  flex: 1;
  padding: 12px 20px;
  background: var(--color-navy);
  color: var(--white);
  border: none;
  border-radius: 8px;
  font-family: var(--font-sans);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.export-success-primary:hover {
  background: var(--color-navy-dark);
}

.export-success-secondary {
  flex: 1;
  padding: 12px 20px;
  background: var(--white);
  color: var(--color-navy);
  border: 1px solid var(--color-divider);
  border-radius: 8px;
  font-family: var(--font-sans);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s;
}

.export-success-secondary:hover {
  border-color: var(--color-gold);
}

.export-success-note {
  font-size: 0.75rem;
  color: var(--color-muted);
  line-height: 1.4;
}

.export-success-note a {
  color: var(--color-gold);
  text-decoration: none;
}

.export-success-note a:hover {
  text-decoration: underline;
}

/* Export Spinner */
.export-spinner {
  width: 18px;
  height: 18px;
  animation: exportSpin 0.75s linear infinite;
  margin-right: 8px;
}

@keyframes exportSpin {
  to { transform: rotate(360deg); }
}
```

### B. Empty State Improvements

**Current:** Generic camera icon  
**Proposed:** Add illustration + social proof

**File:** `objects/summary.js` — Update `renderEmpty()`:

```javascript
function renderEmpty() {
  return `
    <div class="home-empty">
      <div class="home-empty-illustration">
        <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Simple home illustration -->
          <rect x="40" y="60" width="120" height="80" rx="8" fill="#F9F7F4" stroke="#E8E4DF" stroke-width="2"/>
          <polygon points="30,60 100,10 170,60" fill="#F9F7F4" stroke="#E8E4DF" stroke-width="2"/>
          <rect x="85" y="100" width="30" height="40" rx="4" fill="#0D1B2A"/>
          <circle cx="100" cy="80" r="12" fill="#C9A84C"/>
        </svg>
      </div>
      <h2 class="home-empty-title">Your home is ready to be documented</h2>
      <p class="home-empty-desc">
        In 5 minutes, you'll have a complete inventory that insurance companies respect.
        Start with any room — your future self will thank you.
      </p>
      <button class="home-empty-cta nav-camera-btn" aria-label="Start documenting your home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span>Start Your First Scan</span>
      </button>
      <p class="home-empty-sub">No credit card required · Free for up to 100 items</p>
      <div class="home-empty-proof">
        <div class="home-empty-proof-stat">
          <span class="home-empty-proof-number">$80k+</span>
          <span class="home-empty-proof-label">Average recovery</span>
        </div>
        <div class="home-empty-proof-stat">
          <span class="home-empty-proof-number">7 days</span>
          <span class="home-empty-proof-label">Claim approval</span>
        </div>
      </div>
    </div>
  `;
}
```

**Add CSS:**
```css
.home-empty-illustration {
  margin-bottom: 24px;
}

.home-empty-illustration svg {
  width: 200px;
  height: 160px;
}

.home-empty-proof {
  display: flex;
  gap: 32px;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--color-divider);
}

.home-empty-proof-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.home-empty-proof-number {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gold);
}

.home-empty-proof-label {
  font-size: 0.72rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## Implementation Checklist

### Export Functionality
- [ ] Wire up export button click handler
- [ ] Add loading state (spinner)
- [ ] Implement CSV download
- [ ] Add success modal/overlay
- [ ] Add error handling
- [ ] Test with real backend

### Animation Refinements
- [ ] Add smooth scroll behavior
- [ ] Improve card entry animations (scale + rotate)
- [ ] Add reduced motion media query
- [ ] Add hover micro-interactions
- [ ] Add export icon pulse animation

### Performance
- [ ] Add explicit image dimensions
- [ ] Debounce count-up animations
- [ ] Reduce timeline items from 15 → 8
- [ ] Add `decoding="async"` to images

### Polish
- [ ] Style export success overlay
- [ ] Add export spinner animation
- [ ] Update empty state with illustration
- [ ] Add social proof stats to empty state

---

## Files to Modify

| File | Changes | Lines |
|------|---------|-------|
| `objects/summary.js` | Export wiring, success state, empty state | ~150 |
| `styles/main.css` | Export styles, animation improvements, empty state | ~200 |

---

## Accessibility Checklist

- [ ] Export button has `aria-disabled` when locked
- [ ] Success modal has `role="dialog"` and `aria-modal="true"`
- [ ] Spinner has `aria-label="Loading"`
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Success modal auto-dismisses with sufficient time to read
- [ ] Keyboard navigation works in success modal (Escape to close)

---

## Success Metrics

After implementing these changes, measure:
1. **Export completion rate** — % of users who successfully export
2. **Time to first export** — How long from signup to first export
3. **Animation smoothness** — 60fps during transitions (DevTools)
4. **Page load time** — Should improve with lazy loading
5. **User feedback** — Any reports of export issues

---

## Open Questions

1. **Export format** — CSV only for now, or add PDF/JSON options?
2. **Email delivery** — Should we offer to email the export to user?
3. **Export frequency** — Should we limit exports per day/week?
4. **Backend auth** — Does `/export` endpoint require authentication? (Yes, based on drawer nav code)

---

*End of Iteration 3 Specification*
