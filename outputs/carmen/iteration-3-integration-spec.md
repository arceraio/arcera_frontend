# Iteration 3 — Integration Specification for James

**Author:** Carmen (Arcera Design Agent)  
**Date:** March 26, 2026  
**Priority:** High (Export functionality is critical path)  
**Trigger:** `.agent-complete-carmen`

---

## Overview

This spec implements:
1. **Export functionality** — Wire up export button, add success state
2. **Animation refinements** — Smoother transitions, reduced motion
3. **Performance optimizations** — Lazy loading, debouncing
4. **Polish** — Export success UI, empty state improvements

**Files to modify:**
- `objects/summary.js` — Export wiring, success state, empty state (~150 lines)
- `styles/main.css` — Export styles, animations (~200 lines)

---

## Part 1: Wire Up Export Button (`objects/summary.js`)

### Add API import at top of file

**Add after line 1:**
```javascript
import { apiFetch } from '../core/api.js';
import { supabase } from '../core/supabaseClient.js';
```

### Update `init()` function — Add export handler

**Find the end of `init()` function (around line 430):**
```javascript
  // ── Click delegation: data-navigate buttons ─────────────────────
  // (Navigation is handled globally by app.js; no wiring needed here.)
}
```

**Add before the closing `}`:**
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
        const response = await apiFetch('/export', { method: 'GET' });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Export failed' }));
          throw new Error(error.error || 'Export failed');
        }
        
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
        alert('Export failed. Please try again or contact support@arcera.com');
      }
    });
  }
```

---

## Part 2: Add Export Success Function (`objects/summary.js`)

### Add new function before `render()` (around line 350)

**Add after `renderEmpty()` function:**
```javascript
function showExportSuccess() {
  const overlay = document.createElement('div');
  overlay.className = 'export-success-overlay open';
  overlay.innerHTML = `
    <div class="export-success-card" role="dialog" aria-modal="true" aria-labelledby="export-success-title">
      <div class="export-success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h3 class="export-success-title" id="export-success-title">Export Complete</h3>
      <p class="export-success-desc">
        Your inventory has been downloaded. This file is ready to submit
        with your insurance claim.
      </p>
      <div class="export-success-actions">
        <button class="export-success-primary" onclick="this.closest('.export-success-overlay').remove()">
          Got It
        </button>
        <button class="export-success-secondary" onclick="
          if (navigator.share) {
            navigator.share({
              title: 'Arcera Inventory',
              text: 'My home inventory export',
              url: window.location.href
            }).catch(() => {});
          }
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
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
    }
  });
  
  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  // Auto-dismiss after 8 seconds (give user time to read)
  setTimeout(() => {
    if (overlay.parentElement) {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
    }
  }, 8000);
}
```

---

## Part 3: Update Empty State (`objects/summary.js`)

### Replace `renderEmpty()` function (around line 280)

**Replace the entire function with:**
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

---

## Part 4: Performance Optimizations (`objects/summary.js`)

### Update `renderMiniCard()` — Add explicit dimensions

**Find `renderMiniCard()` (around line 160) and update the thumb img:**

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

  const valueText = item.cost != null ? fmtValueShort(item.cost) : '';
  const timeText = dateLabel(item.created_at);

  return `
    <div class="home-mini-card item-card" data-id="${item.id}">
      ${thumb}
      <div class="home-mini-body">
        <div class="home-mini-name">${item.label}</div>
        ${item.room ? `<span class="home-mini-room">${item.room}</span>` : ''}
        ${valueText ? `<div class="home-mini-meta"><span class="home-mini-cost">${valueText}</span></div>` : ''}
        <span class="home-mini-time">${timeText}</span>
      </div>
    </div>
  `;
}
```

### Update `renderTimeline()` — Reduce items shown

**Find `renderTimeline()` (around line 220) and change:**
```javascript
const limit = 8;  // Changed from 15
```

### Add debouncing to `countUp()` function

**Update `countUp()` function (around line 320):**
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

---

## Part 5: CSS — Export Styles (`styles/main.css`)

### Add after `.home-export-btn` rules (around line 640)

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
  animation: export-spin 0.75s linear infinite;
  margin-right: 8px;
  display: inline-block;
  vertical-align: middle;
}

@keyframes export-spin {
  to { transform: rotate(360deg); }
}

/* Export icon pulse when unlocked */
.home-export-card.unlocked .home-export-icon {
  animation: export-pulse 2s ease-in-out infinite;
}

@keyframes export-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

---

## Part 6: CSS — Empty State Styles (`styles/main.css`)

### Add after `.home-onboard` rules (around line 1400)

```css
/* Empty State (Updated) */
.home-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px;
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
}

.home-empty-illustration {
  margin-bottom: 24px;
}

.home-empty-illustration svg {
  width: 200px;
  height: 160px;
}

.home-empty-title {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--color-navy);
  margin-bottom: 12px;
  line-height: 1.3;
}

.home-empty-desc {
  font-size: 0.95rem;
  color: var(--color-muted);
  line-height: 1.6;
  margin-bottom: 24px;
  max-width: 360px;
}

.home-empty-sub {
  font-size: 0.75rem;
  color: var(--color-muted);
  margin-top: 16px;
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

## Part 7: CSS — Animation Refinements (`styles/main.css`)

### Add smooth scroll to `html` (around line 50)

**Update `html` rule:**
```css
html {
  scroll-behavior: smooth;
}
```

### Update card animations (around line 680 for stat cards, 900 for mini cards)

**Update `.home-stat-card`:**
```css
.home-stat-card {
  background: var(--white);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius);
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  opacity: 0;
  transform: translateY(8px) scale(0.98);
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.home-stat--visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}
```

**Update `.home-mini-card`:**
```css
.home-mini-card {
  flex-shrink: 0;
  width: 140px;
  background: var(--white);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius);
  padding: 12px;
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

### Add hover micro-interactions (around line 830)

**Update `.home-action-btn--primary:hover`:**
```css
.home-action-btn--primary:hover {
  background: var(--color-navy-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13,27,42,0.2);
}
```

**Update `.home-action-btn--outline:hover`:**
```css
.home-action-btn--outline:hover {
  border-color: var(--color-gold);
  color: var(--color-gold);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(201,168,76,0.15);
}
```

### Add reduced motion support (add at end of file, before last `}`)

```css
/* Reduced Motion */
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
  
  .home-export-card.unlocked .home-export-icon {
    animation: none !important;
  }
}
```

---

## Testing Checklist

### Functional Tests
- [ ] Export button works when readiness ≥ 80%
- [ ] Export button is disabled when readiness < 80%
- [ ] CSV file downloads with correct filename
- [ ] Success modal appears after export
- [ ] Success modal closes on click outside
- [ ] Success modal closes on Escape key
- [ ] Success modal auto-dismisses after 8 seconds
- [ ] Export error shows alert message

### Visual Tests
- [ ] Stat cards have subtle scale + rotate on entry
- [ ] Mini cards have subtle rotate on entry
- [ ] Export icon pulses when unlocked
- [ ] Export spinner animates during loading
- [ ] Empty state shows illustration + social proof
- [ ] Hover states have lift + shadow

### Performance Tests
- [ ] Images have explicit width/height (no layout shift)
- [ ] Timeline shows 8 items per section (not 15)
- [ ] Page scrolls smoothly
- [ ] Animations run at 60fps (DevTools Performance)

### Accessibility Tests
- [ ] Export button has `aria-disabled` when locked
- [ ] Success modal has `role="dialog"` and `aria-modal`
- [ ] Spinner has `aria-label` or is hidden from SR
- [ ] Reduced motion preference is respected
- [ ] Keyboard navigation works in modal (Tab, Escape)
- [ ] All interactive elements are 44px minimum

---

## Rollback Plan

If issues arise:

```bash
cd /home/kevin/Apps/Arcera/arcera_frontend
git checkout objects/summary.js styles/main.css
```

---

## Post-Implementation

1. **Build:** `npm run build`
2. **Test export:** Add items until readiness ≥ 80%, click export
3. **Test on mobile:** iOS Safari, Android Chrome
4. **Test reduced motion:** System preference → verify animations disabled
5. **Commit:** `feat: Iteration 3 — Export functionality + animation polish`

---

*End of Integration Spec*
