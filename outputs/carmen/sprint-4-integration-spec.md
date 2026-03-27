# Sprint 4 Integration Specification for Andrew

**Author:** Carmen (Arcera Design Agent)  
**Date:** March 26, 2026  
**Priority:** High (Sprint 4 — Edge Cases + Polish + Production Readiness)  
**Trigger:** `.agent-complete-carmen`

---

## Overview

**Sprint 4 Features:**
1. Offline detection + better error messages (2h)
2. Export retry button (1h)
3. Loading skeleton for perceived performance (4h)

**Files to Modify:**
- `objects/summary.js` — Offline detection, error states, retry (~100 lines)
- `core/api.js` — Timeout handling, better error types (~30 lines)
- `styles/main.css` — Skeleton, retry button, error states (~150 lines)

**New Files:**
- `objects/loading-skeleton.js` — Loading skeleton module (~80 lines)

**Total:** ~360 lines across 4 files (3 existing, 1 new)

---

## Part 1: Offline Detection + Error Messages

### File: `objects/summary.js`

#### Add error type detection function (add before `handleExport()`)

```javascript
function getExportErrorType(err, isOnline) {
  if (!isOnline) {
    return 'offline';
  }
  
  if (err.name === 'TypeError' && err.message.includes('fetch')) {
    return 'network';  // Network error (timeout, server down)
  }
  
  const errStr = err.message || String(err);
  
  if (errStr.includes('400') || errStr.includes('401') || 
      errStr.includes('403') || errStr.includes('404')) {
    return 'client';  // Client error (invalid data, auth)
  }
  
  if (errStr.includes('500') || errStr.includes('502') || 
      errStr.includes('503')) {
    return 'server';  // Server error
  }
  
  return 'unknown';  // Generic error
}
```

#### Add error message config (add at module level)

```javascript
const EXPORT_ERROR_MESSAGES = {
  offline: {
    title: 'You appear to be offline',
    body: 'Please connect to the internet and try again.\n\nYour inventory is saved locally and will be available when you\'re back online.',
    primary: 'OK',
    secondary: null,
    icon: '⚠️'
  },
  network: {
    title: 'Export failed',
    body: 'We couldn\'t reach the server. This could be due to:\n• Slow internet connection\n• Server temporarily unavailable',
    primary: 'Try Again',
    secondary: 'Contact Support',
    icon: '⚠️'
  },
  client: {
    title: 'Export failed',
    body: 'There was a problem with your inventory data.\n\nPlease contact support@arcera.com for assistance.',
    primary: 'OK',
    secondary: 'Contact Support',
    icon: '⚠️'
  },
  server: {
    title: 'Export failed',
    body: 'Our server is experiencing issues. Please try again in a few minutes.',
    primary: 'Try Again',
    secondary: 'Contact Support',
    icon: '⚠️'
  },
  unknown: {
    title: 'Export failed',
    body: 'An unexpected error occurred. Please try again or contact support@arcera.com',
    primary: 'Try Again',
    secondary: 'Contact Support',
    icon: '⚠️'
  }
};
```

#### Add error modal function (add before `handleExport()`)

```javascript
function showExportError(errorType, errorMessage, onRetry) {
  const config = EXPORT_ERROR_MESSAGES[errorType] || EXPORT_ERROR_MESSAGES.unknown;
  
  // Override body with specific error message for client errors
  let body = config.body;
  if (errorType === 'client' && errorMessage) {
    body += `\n\nError: ${errorMessage}`;
  }
  
  const overlay = document.createElement('div');
  overlay.className = 'export-error-overlay open';
  overlay.innerHTML = `
    <div class="export-error-modal" role="alertdialog" aria-modal="true" aria-labelledby="export-error-title">
      <div class="export-error-icon">${config.icon}</div>
      <h3 class="export-error-title" id="export-error-title">${config.title}</h3>
      <p class="export-error-body">${body.replace(/\n/g, '<br/>')}</p>
      <div class="export-error-actions">
        ${config.primary === 'Try Again' ? `
          <button class="export-error-retry" onclick="this.closest('.export-error-overlay').remove(); ${onRetry ? 'handleExportRetry()' : ''}">
            🔄 ${config.primary}
          </button>
        ` : ''}
        <button class="export-error-${config.primary === 'OK' ? 'primary' : 'secondary'}" onclick="this.closest('.export-error-overlay').remove()">
          ${config.primary}
        </button>
        ${config.secondary ? `
          <a href="mailto:support@arcera.com" class="export-error-secondary">
            ${config.secondary}
          </a>
        ` : ''}
      </div>
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
  
  // Close on Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}
```

#### Add retry handler function (add before `handleExport()`)

```javascript
function handleExportRetry() {
  handleExport(); // Re-trigger export
}
```

#### Update `handleExport()` function (around line 420)

**Find the existing `handleExport()` function and replace the error handling:**

```javascript
async function handleExport() {
  const btn = document.getElementById('homeExportBtn');
  if (!btn || btn.disabled) return;
  
  // Check if online before starting
  const isOnline = navigator.onLine;
  
  // Analytics: export clicked
  if (window._arceraAnalytics) {
    window._arceraAnalytics.push({ event: 'export_clicked', ts: Date.now() });
  }
  
  // Update button to loading state
  btn.disabled = true;
  btn.innerHTML = `
    <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
    </svg>
    <span>Preparing your export...</span>
    <small>Please wait</small>
  `;
  
  try {
    const response = await apiFetch('/export', { method: 'GET' });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Export failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
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
    
    // Analytics: export succeeded
    if (window._arceraAnalytics) {
      window._arceraAnalytics.push({ event: 'export_success', ts: Date.now() });
    }
    
    // Show success modal
    showExportSuccess();
    
    // Reset button after delay
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>Export Your Inventory</span>
        <small>Claim-ready CSV for your adjuster</small>
      `;
    }, 3000);
    
  } catch (err) {
    // Analytics: export error
    if (window._arceraAnalytics) {
      window._arceraAnalytics.push({ event: 'export_error', ts: Date.now(), error: err.message });
    }
    
    console.error('Export error:', err);
    
    // Get error type and show appropriate error modal
    const errorType = getExportErrorType(err, isOnline);
    showExportError(errorType, err.message, 'handleExportRetry()');
    
    // Reset button to error state with retry
    btn.disabled = false;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>Export failed</span>
      <small>Please try again</small>
      <button class="export-retry-btn" onclick="handleExportRetry()">
        🔄 Retry
      </button>
    `;
  }
}
```

#### Add online/offline event listeners (in `init()` function)

```javascript
// Listen for connectivity changes
window.addEventListener('online', () => {
  console.log('Back online');
  // Optionally update UI to show back online
});

window.addEventListener('offline', () => {
  console.log('Went offline');
  // Optionally show offline indicator in header
});
```

---

## Part 2: Export Retry Button

### File: `styles/main.css`

#### Add retry button styles (add after export button styles)

```css
/* Export Retry Button */
.export-retry-btn {
  margin-top: 12px;
  padding: 10px 20px;
  background: var(--color-gold);
  color: var(--white);
  border: none;
  border-radius: 8px;
  font-family: var(--font-sans);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.export-retry-btn:hover {
  background: var(--color-gold-hover);
}

.export-retry-btn:focus-visible {
  outline: 2px solid var(--color-navy);
  outline-offset: 2px;
}

/* Export Error Modal */
.export-error-overlay {
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

.export-error-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.export-error-modal {
  background: var(--white);
  border-radius: var(--radius);
  max-width: 420px;
  width: 100%;
  padding: 32px 24px;
  text-align: center;
  box-shadow: var(--shadow-lg);
  transform: scale(0.95);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.export-error-overlay.open .export-error-modal {
  transform: scale(1);
}

.export-error-icon {
  font-size: 2.5rem;
  margin-bottom: 16px;
}

.export-error-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-navy);
  margin-bottom: 12px;
}

.export-error-body {
  font-size: 0.95rem;
  color: var(--color-body);
  line-height: 1.6;
  margin-bottom: 24px;
  white-space: pre-line;
}

.export-error-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-error-retry {
  padding: 12px 24px;
  background: var(--color-gold);
  color: var(--white);
  border: none;
  border-radius: 8px;
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.export-error-retry:hover {
  background: var(--color-gold-hover);
}

.export-error-primary,
.export-error-secondary {
  padding: 12px 24px;
  border-radius: 8px;
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  text-decoration: none;
  display: inline-block;
}

.export-error-primary {
  background: var(--color-navy);
  color: var(--white);
  border: none;
}

.export-error-primary:hover {
  background: var(--color-navy-dark);
}

.export-error-secondary {
  background: var(--color-bg);
  color: var(--color-navy);
  border: 1px solid var(--color-divider);
}

.export-error-secondary:hover {
  background: var(--color-divider);
}

/* Mobile: Stack buttons full-width */
@media (max-width: 480px) {
  .export-error-actions {
    gap: 10px;
  }
  
  .export-error-retry,
  .export-error-primary,
  .export-error-secondary {
    width: 100%;
  }
}
```

---

## Part 3: Loading Skeleton

### File: `objects/loading-skeleton.js` (NEW)

**Create new file:**

```javascript
// ── Loading Skeleton Module ───────────────────────────────────

export function renderHomeLoading() {
  return `
    <div class="home-loading" aria-busy="true" aria-label="Loading inventory...">
      <div class="home-loading-hero skeleton"></div>
      <div class="home-loading-trust skeleton"></div>
      <div class="home-loading-stats">
        <div class="home-loading-stat skeleton"></div>
        <div class="home-loading-stat skeleton"></div>
        <div class="home-loading-stat skeleton"></div>
      </div>
      <div class="home-loading-export skeleton"></div>
      <div class="home-loading-actions">
        <div class="home-loading-action skeleton"></div>
        <div class="home-loading-action skeleton"></div>
      </div>
      <div class="home-loading-recent">
        <div class="home-loading-recent-header skeleton"></div>
        <div class="home-loading-recent-scroll">
          <div class="home-loading-mini skeleton"></div>
          <div class="home-loading-mini skeleton"></div>
          <div class="home-loading-mini skeleton"></div>
          <div class="home-loading-mini skeleton"></div>
        </div>
      </div>
    </div>
  `;
}

export function renderItemsLoading() {
  return `
    <div class="items-loading" aria-busy="true" aria-label="Loading items...">
      <div class="items-loading-search skeleton"></div>
      <div class="items-loading-chips">
        <div class="items-loading-chip skeleton"></div>
        <div class="items-loading-chip skeleton"></div>
        <div class="items-loading-chip skeleton"></div>
        <div class="items-loading-chip skeleton"></div>
      </div>
      <div class="items-loading-header skeleton"></div>
      <div class="items-loading-grid">
        ${Array(8).fill(`
          <div class="items-loading-card skeleton">
            <div class="items-loading-card-image"></div>
            <div class="items-loading-card-body">
              <div class="items-loading-card-line"></div>
              <div class="items-loading-card-line short"></div>
              <div class="items-loading-card-line"></div>
              <div class="items-loading-card-line short"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
```

### File: `objects/summary.js`

#### Import loading module (add at top)

```javascript
import { renderHomeLoading } from './loading-skeleton.js';
```

#### Update `render()` to handle loading state (around line 100)

**Find the beginning of the `render()` function and update:**

```javascript
export function render(items) {
  // Loading state - show skeleton
  if (items === null || items === undefined) {
    return renderHomeLoading();
  }
  
  // Empty state
  if (items.length === 0) {
    return renderEmpty();
  }
  
  // ... rest of existing render function
}
```

#### Add fast-load optimization (in `app.js` or wherever items are fetched)

```javascript
let loadStartTime = Date.now();

async function loadItems() {
  loadStartTime = Date.now();
  
  try {
    const items = await apiFetch('/items');
    const loadTime = Date.now() - loadStartTime;
    
    // Skip skeleton if load was very fast (<200ms)
    if (loadTime < 200) {
      render(items);
    } else {
      // Skeleton already showing, now render content
      render(items);
    }
  } catch (err) {
    console.error('Failed to load items:', err);
    render([]); // Show empty state on error
  }
}
```

---

## Part 4: CSS Styles for Loading Skeleton

### File: `styles/main.css`

#### Add skeleton styles (add at end of file, before reduced motion)

```css
/* Loading Skeleton */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg) 0%,
    var(--color-divider) 50%,
    var(--color-bg) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Home Loading */
.home-loading {
  padding: var(--content-padding);
}

.home-loading-hero {
  height: 120px;
  margin-bottom: 16px;
}

.home-loading-trust {
  height: 60px;
  margin-bottom: 20px;
}

.home-loading-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.home-loading-stat {
  height: 100px;
}

.home-loading-export {
  height: 180px;
  margin-bottom: 20px;
}

.home-loading-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.home-loading-action {
  flex: 1;
  height: 48px;
}

.home-loading-recent-header {
  height: 24px;
  width: 150px;
  margin-bottom: 16px;
}

.home-loading-recent-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
}

.home-loading-mini {
  flex-shrink: 0;
  width: 140px;
  height: 180px;
}

/* Items Loading */
.items-loading {
  padding: var(--content-padding);
}

.items-loading-search {
  height: 52px;
  margin-bottom: 16px;
}

.items-loading-chips {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.items-loading-chip {
  flex-shrink: 0;
  height: 32px;
  min-width: 100px;
  border-radius: 20px;
}

.items-loading-header {
  height: 24px;
  width: 200px;
  margin-bottom: 20px;
}

.items-loading-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.items-loading-card {
  height: 220px;
}

.items-loading-card-image {
  height: 140px;
  border-radius: var(--radius) var(--radius) 0 0;
}

.items-loading-card-body {
  padding: 12px;
}

.items-loading-card-line {
  height: 14px;
  margin-bottom: 8px;
}

.items-loading-card-line.short {
  width: 60%;
}

/* Reduced Motion - Disable shimmer */
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--color-divider);
  }
}
```

---

## Part 5: API Timeout Handling

### File: `core/api.js`

#### Add timeout to `apiFetch()` function

**Find the `apiFetch()` function and add timeout handling:**

```javascript
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const defaultOptions = {
    ...options,
    headers: {
      ...options.headers,
    }
  };
  
  // Add timeout (30 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    
    throw err;
  }
}
```

---

## Testing Checklist

### Offline Detection
- [ ] Disconnect wifi, click export → shows "You appear to be offline"
- [ ] Reconnect wifi → can retry export successfully
- [ ] Error modal closes on overlay click
- [ ] Error modal closes on Escape key
- [ ] "Contact Support" opens mailto link

### Retry Button
- [ ] Export fails → shows retry button on export card
- [ ] Click retry → re-triggers export
- [ ] Retry button has visible focus ring
- [ ] Retry button works with keyboard (Enter/Space)

### Loading Skeleton
- [ ] Refresh page → skeleton shows during load
- [ ] Skeleton matches content structure
- [ ] Shimmer animation smooth (60fps)
- [ ] Reduced motion: static placeholder (no shimmer)
- [ ] `aria-busy="true"` present on loading container
- [ ] Fast load (<200ms) skips skeleton

### Focus Rings (QA Verification)
- [ ] Tab to export button → gold outline visible
- [ ] Tab to action buttons → gold outline visible
- [ ] Tab to modal buttons → gold outline visible
- [ ] Tab to filter chips → gold outline visible
- [ ] Tab to search input → gold border visible

### Accessibility
- [ ] Error modal has `role="alertdialog"`
- [ ] Loading skeleton has `aria-label="Loading inventory..."`
- [ ] Retry button has `aria-label` or visible text
- [ ] Screen reader announces error messages
- [ ] Keyboard navigation works (Tab, Escape, Enter)

---

## Rollback Plan

If issues arise:

```bash
cd /home/kevin/Apps/Arcera/arcera_frontend
git checkout objects/summary.js core/api.js styles/main.css
rm objects/loading-skeleton.js
```

---

## Post-Implementation

1. **Build:** `npm run build`
2. **Test offline:** Disconnect wifi, try export
3. **Test retry:** Trigger error, click retry
4. **Test loading:** Refresh page, verify skeleton
5. **Test keyboard:** Tab through all elements, verify focus rings
6. **Commit:** `feat: Sprint 4 — Offline detection, retry button, loading skeleton`

---

*End of Integration Spec*
