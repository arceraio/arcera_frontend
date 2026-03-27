# Sprint 4 Design Specification — Edge Cases & Polish

**Author:** Carmen (Arcera Design Agent)  
**Date:** March 26, 2026  
**Project:** `/home/kevin/Apps/Arcera/arcera_frontend/`  
**Sprint:** 4 of 4 (Edge Cases + Polish + Production Readiness)  
**Based on:** Factory Analysis + Sprint 1-3 Completion Reports

---

## Executive Summary

**Sprint 4 Scope:** 3 edge case improvements  
**Total Effort:** ~6 hours  
**Goal:** Production-ready edge case handling

| Feature | Effort | Impact | Priority | Factory Ref |
|---------|--------|--------|----------|-------------|
| Offline detection + error messages | 2h | 7 | **7** | C3-1 |
| Export retry button | 1h | 5 | **10** | C3-2 |
| Loading skeleton | 4h | 7 | **7** | C6-1 |
| Focus ring verification | 1h | 9 | **9** | C5-1 |

**Note:** Focus ring verification is a QA task (verify existing implementation), not new development.

---

## Current State Assessment

### ✅ Implemented (Sprints 1-3)
- Export functionality with success modal
- Basic error handling (alert on failure)
- Reduced motion support (3 media queries)
- Focus-visible styles exist in CSS
- Modular architecture (`readiness.js`, `export-modal.js`)

### ❌ Missing (Sprint 4 Scope)
- **Offline detection** — Generic error instead of "you're offline"
- **Retry mechanism** — No explicit retry button, just re-click export
- **Loading skeleton** — Empty state flashes before content loads
- **Focus ring verification** — Not tested with keyboard navigation

---

## Feature 1: Offline Detection + Better Error Messages

### User Story
> "As a user with spotty internet, I want to know if I'm offline when export fails so I don't keep retrying in vain."

### Current State
```javascript
// Current error handling (summary.js:485)
alert('Export failed. Please try again or contact support@arcera.com');
```

**Problem:** Generic error whether user is offline, server is down, or API fails.

### Proposed Error States

#### State 1: Offline Detected
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  You appear to be offline                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Please connect to the internet and try again.              │
│                                                             │
│  Your inventory is saved locally and will be                │
│  available when you're back online.                         │
│                                                             │
│         [  OK  ]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Trigger:** `navigator.onLine === false` when export clicked

**Behavior:**
- Check `navigator.onLine` before export
- If offline, show this message instead of calling API
- Export button remains enabled (user can retry when back online)

---

#### State 2: Network Error (Timeout/Server Down)
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Export failed                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  We couldn't reach the server. This could be due to:        │
│  • Slow internet connection                                 │
│  • Server temporarily unavailable                           │
│                                                             │
│         [  Try Again  ]    [  Contact Support  ]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Trigger:** API returns 5xx error or timeout

**Behavior:**
- "Try Again" button re-triggers export
- "Contact Support" opens mailto:support@arcera.com

---

#### State 3: Client Error (Invalid Data)
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Export failed                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  There was a problem with your inventory data.              │
│  Please contact support@arcera.com for assistance.          │
│                                                             │
│  Error: No items found in inventory                         │
│                                                             │
│         [  OK  ]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Trigger:** API returns 4xx error

**Behavior:**
- Show specific error message from API
- "OK" dismisses modal

---

### Detection Logic

```javascript
function getExportErrorType(err, isOnline) {
  if (!isOnline) {
    return 'offline';
  }
  
  if (err.name === 'TypeError' && err.message.includes('fetch')) {
    return 'network';  // Network error (timeout, server down)
  }
  
  if (err.message.includes('400') || err.message.includes('401') || 
      err.message.includes('403') || err.message.includes('404')) {
    return 'client';  // Client error (invalid data, auth)
  }
  
  if (err.message.includes('500') || err.message.includes('502') || 
      err.message.includes('503')) {
    return 'server';  // Server error
  }
  
  return 'unknown';  // Generic error
}
```

### UI Implementation

**Replace current alert() with modal:**

```javascript
function showExportError(errorType, errorMessage) {
  const messages = {
    offline: {
      title: 'You appear to be offline',
      body: 'Please connect to the internet and try again.\n\nYour inventory is saved locally and will be available when you\'re back online.',
      primary: 'OK',
      secondary: null
    },
    network: {
      title: 'Export failed',
      body: 'We couldn\'t reach the server. This could be due to:\n• Slow internet connection\n• Server temporarily unavailable',
      primary: 'Try Again',
      secondary: 'Contact Support'
    },
    client: {
      title: 'Export failed',
      body: `There was a problem with your inventory data.\n\nError: ${errorMessage}`,
      primary: 'OK',
      secondary: 'Contact Support'
    },
    server: {
      title: 'Export failed',
      body: 'Our server is experiencing issues. Please try again in a few minutes.',
      primary: 'Try Again',
      secondary: 'Contact Support'
    },
    unknown: {
      title: 'Export failed',
      body: `${errorMessage}\n\nPlease try again or contact support@arcera.com`,
      primary: 'Try Again',
      secondary: 'Contact Support'
    }
  };
  
  const config = messages[errorType] || messages.unknown;
  // ... render modal with config
}
```

---

### Browser Online/Offline Events

**Listen for connectivity changes:**

```javascript
// In app.js or summary.js init()
window.addEventListener('online', () => {
  // Update UI to show back online
  console.log('Back online');
});

window.addEventListener('offline', () => {
  // Update UI to show offline indicator
  console.log('Went offline');
});
```

**Optional: Add offline indicator to header**

```
┌─────────────────────────────────────────────────────────────┐
│  [≡] Logo                              ⚠️ Offline  [+] [👤] │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature 2: Export Retry Button

### User Story
> "As a user whose export failed, I want a clear 'Retry' button so I know I can try again without navigating away."

### Current State
- Export button re-enables after error
- User must realize they can click again
- No explicit "Retry" CTA

### Proposed Design

#### Error State with Retry

**Current export button:**
```
┌─────────────────────────────────────────────────────────────┐
│  📥  Export Your Inventory                                  │
│      Claim-ready CSV for your adjuster                      │
└─────────────────────────────────────────────────────────────┘
```

**Loading state:**
```
┌─────────────────────────────────────────────────────────────┐
│  ⏳  Preparing your export...                               │
│      Please wait                                            │
└─────────────────────────────────────────────────────────────┘
```

**Success state:**
```
┌─────────────────────────────────────────────────────────────┐
│  ✅  Export complete!                                       │
│      Your inventory has been downloaded                      │
└─────────────────────────────────────────────────────────────┘
```

**Error state (NEW):**
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Export failed                                          │
│      We couldn't complete your export                        │
│                                                             │
│         [  🔄 Retry  ]                                      │
│                                                             │
│      or                                                     │
│                                                             │
│         [  Contact Support  ]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

**Modify export button state management:**

```javascript
let exportState = 'idle'; // 'idle' | 'loading' | 'success' | 'error'

function updateExportButton(state, errorMessage) {
  const btn = document.getElementById('homeExportBtn');
  
  switch (state) {
    case 'idle':
      btn.innerHTML = `
        <svg>...</svg>
        <span>Export Your Inventory</span>
        <small>Claim-ready CSV for your adjuster</small>
      `;
      btn.disabled = false;
      break;
      
    case 'loading':
      btn.innerHTML = `
        <svg class="spin">...</svg>
        <span>Preparing your export...</span>
        <small>Please wait</small>
      `;
      btn.disabled = true;
      break;
      
    case 'success':
      btn.innerHTML = `
        <svg>...</svg>
        <span>Export complete!</span>
        <small>Your inventory has been downloaded</small>
      `;
      btn.disabled = false;
      setTimeout(() => updateExportButton('idle'), 3000);
      break;
      
    case 'error':
      btn.innerHTML = `
        <svg>...</svg>
        <span>Export failed</span>
        <small>${errorMessage || 'Please try again'}</small>
        <button class="export-retry-btn" onclick="handleExportRetry()">
          🔄 Retry
        </button>
      `;
      btn.disabled = false;
      break;
  }
}

function handleExportRetry() {
  updateExportButton('loading');
  handleExport(); // Re-trigger export
}
```

### CSS for Retry Button

```css
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
}

.export-retry-btn:hover {
  background: var(--color-gold-hover);
}

.export-retry-btn:focus-visible {
  outline: 2px solid var(--color-navy);
  outline-offset: 2px;
}
```

---

## Feature 3: Loading Skeleton

### User Story
> "As a user opening the app, I want to see a loading state instead of a blank screen so I know the app is working."

### Current State
- No loading state
- Items view shows empty state briefly, then content pops in
- Perceived performance issue

### Proposed Loading Skeleton

#### Home Dashboard Skeleton

```
┌─────────────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← Hero (shimmer)
│  ░░░░░░░░░░░░  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
├─────────────────────────────────────────────────────────────┤
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← Trust badge
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ ░░░░░░░░ │  │ ░░░░░░░░ │  │ ░░░░░░░░ │                  │ ← Stat cards
│  │ ░░░░░░░░ │  │ ░░░░░░░░ │  │ ░░░░░░░░ │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐    │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │ ← Export card
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │
│  └────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  ░░░░░░░░░░░░  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← Recently Added
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │
│  │ ░░░░ │ │ ░░░░ │ │ ░░░░ │ │ ░░░░ │                      │
│  └──────┘ └──────┘ └──────┘ └──────┘                      │
└─────────────────────────────────────────────────────────────┘
```

#### Items View Skeleton

```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        │ ← Search bar
├─────────────────────────────────────────────────────────────┤
│  [░░░░░] [░░░░░░░░░░] [░░░░░░░░░░] [░░░░░░░░]              │ ← Filter chips
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │          │ │          │ │          │ │          │      │
│  │  ░░░░░░  │ │  ░░░░░░  │ │  ░░░░░░  │ │  ░░░░░░  │      │ ← Item cards
│  │  ░░░░░░  │ │  ░░░░░░  │ │  ░░░░░░  │ │  ░░░░░░  │      │
│  │  ░░░░    │ │  ░░░░    │ │  ░░░░    │ │  ░░░░    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Animation

**Shimmer Effect:**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg) 0%,
    var(--color-divider) 50%,
    var(--color-bg) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Duration:** 1.5s loop  
**Easing:** Linear  
**Respects reduced motion:** Disabled if `prefers-reduced-motion: reduce`

### Implementation Pattern

**Create loading module:**

```javascript
// objects/loading-skeleton.js

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
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
```

### When to Show

**Show skeleton when:**
- `items === null` (loading)
- `items === undefined` (loading)

**Show content when:**
- `items !== null && items !== undefined`

**Show empty state when:**
- `items !== null && items.length === 0`

### Fast Load Optimization

**Skip skeleton if load is very fast (<200ms):**

```javascript
let loadStartTime = Date.now();

async function loadItems() {
  loadStartTime = Date.now();
  const items = await apiFetch('/items');
  const loadTime = Date.now() - loadStartTime;
  
  if (loadTime < 200) {
    // Skip skeleton, show content directly
    render(items);
  } else {
    // Show skeleton during load
    renderLoading();
    render(items);
  }
}
```

---

## Feature 4: Focus Ring Verification (QA Task)

### User Story
> "As a keyboard user, I want to see where focus is so I can navigate the app without a mouse."

### Current State
- `:focus-visible` styles exist in CSS (line 65-74)
- Not tested with actual keyboard navigation

### Verification Checklist

**Test these elements with Tab key:**

| Element | Expected Behavior | Status |
|---------|-------------------|--------|
| Export button | Gold outline, 2px, offset 2px | ⏳ Verify |
| Action buttons (Scan, Add) | Gold outline, 2px, offset 2px | ⏳ Verify |
| Timeline "View all" | Gold outline, 2px, offset 2px | ⏳ Verify |
| Modal buttons (Close, Download) | Gold outline, 2px, offset 2px | ⏳ Verify |
| Filter chips | Gold outline, 2px, offset 2px | ⏳ Verify |
| Search input | Gold border (already implemented) | ✅ Verified |
| Export retry button | Gold outline, 2px, offset 2px | ⏳ Verify |

### Current Focus Styles (CSS line 65-74)

```css
*:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 2px;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 2px;
}
```

**Assessment:** Focus styles are already implemented! This is a QA verification task, not development.

---

## Edge Cases

### Offline Scenarios

| Scenario | Detection | User Message | Recovery |
|----------|-----------|--------------|----------|
| User goes offline before export | `navigator.onLine === false` | "You appear to be offline" | Wait for reconnection |
| User goes offline during export | Fetch fails with TypeError | "We couldn't reach the server" | Retry button |
| User goes offline after export starts | Response never arrives | Timeout after 30s | Retry button |
| User comes back online | `online` event fires | (No message needed) | Can retry export |

### Error Scenarios

| Error Type | HTTP Status | User Message | Action |
|------------|-------------|--------------|--------|
| No items | 400 | "No items found in inventory" | Add items first |
| Unauthorized | 401 | "Please log in again" | Redirect to login |
| Forbidden | 403 | "You don't have permission" | Contact support |
| Server error | 500 | "Our server is experiencing issues" | Retry |
| Timeout | N/A | "We couldn't reach the server" | Retry |
| Unknown | N/A | Generic error message | Retry + Contact support |

### Loading Scenarios

| Scenario | Behavior |
|----------|----------|
| Fast load (<200ms) | Skip skeleton, show content directly |
| Normal load (200ms-3s) | Show skeleton, then content |
| Slow load (>3s) | Show skeleton + timeout message at 10s |
| Load fails | Show error state with retry button |

---

## Accessibility Checklist

### Offline Detection
- [ ] Error modal has `role="alertdialog"`
- [ ] Error messages are announced by screen reader
- [ ] Retry button has `aria-label="Retry export"`

### Retry Button
- [ ] Retry button has visible focus ring
- [ ] Retry button is keyboard accessible (Enter/Space)
- [ ] Retry button has `aria-busy="true"` during retry

### Loading Skeleton
- [ ] Skeleton container has `aria-busy="true"`
- [ ] Skeleton has `aria-label="Loading inventory..."`
- [ ] Skeleton hidden from screen readers when content loads
- [ ] Reduced motion: static placeholder (no shimmer)

### Focus Rings (Verification)
- [ ] Export button focus visible
- [ ] Action buttons focus visible
- [ ] Modal buttons focus visible
- [ ] Filter chips focus visible
- [ ] Search input focus visible (already verified)

---

## Success Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Export retry rate | Unknown | <5% | Analytics (retry clicks / total exports) |
| Offline error rate | Unknown | Track separately | Analytics (offline errors / total exports) |
| Perceived load time | Unknown | <1s to skeleton | Lighthouse + user testing |
| Keyboard navigation success | Untested | 100% | Manual QA (tab through all elements) |

---

## Files to Modify

| File | Changes | Lines |
|------|---------|-------|
| `objects/summary.js` | Offline detection, error states, retry button | ~100 |
| `core/api.js` | Add timeout handling, better error types | ~30 |
| `styles/main.css` | Skeleton styles, retry button, error states | ~150 |
| `objects/loading-skeleton.js` | NEW: Loading skeleton module | ~80 |

**Total:** ~360 lines across 4 files (3 existing, 1 new)

---

## Next Steps

1. **Andrew** → Read `sprint-4-integration-spec.md`, implement features
2. **Scott** → QA testing (focus rings, offline scenarios, keyboard nav)
3. **Deploy** → Sprint 4 to staging
4. **Production** → All 4 sprints complete, ready for launch

---

*End of Sprint 4 Design Specification*
