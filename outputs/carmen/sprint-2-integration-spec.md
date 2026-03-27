# Sprint 2 Integration Specification for Andrew

**Author:** Carmen (Arcera Design Agent)  
**Date:** March 26, 2026  
**Priority:** High (Sprint 2 — Discovery + Export Recovery + Performance)  
**Trigger:** `.agent-complete-carmen`

---

## Overview

**Sprint 2 Features:**
1. Search bar in Items view (5h)
2. Enhanced filters: Needs Photo, Needs Value, Needs Room (4h)
3. Export history with re-download (5h)
4. Loading skeleton for perceived performance (4h)

**Files to Modify:**
- `objects/items-list.js` — Search + enhanced filters (~150 lines)
- `objects/summary.js` — Export history access point (~100 lines)
- `styles/main.css` — Search, skeleton, filters (~200 lines)
- `core/api.js` — Export history API (~30 lines)

**New Files:**
- `core/export-history.js` — Export history module (~100 lines)
- `objects/loading-skeleton.js` — Loading skeleton module (~80 lines)

---

## Part 1: Search Bar (Items View)

### File: `objects/items-list.js`

#### Add search state at module level (after line 1)

```javascript
let searchQuery = '';
let searchDebounceTimer = null;
```

#### Add search input HTML (modify `render()` function)

**Find the `render()` function (around line 215) and update:**

```javascript
export function render(items, activeFilter = 0, searchQuery = '') {
  if (items.length === 0) {
    return buildEmptyState();
  }

  // Apply search filter
  const searchedItems = searchQuery.trim()
    ? items.filter(it => {
        const query = searchQuery.toLowerCase();
        const labelMatch = it.label.toLowerCase().includes(query);
        const roomMatch = it.room ? it.room.toLowerCase().includes(query) : false;
        return labelMatch || roomMatch;
      })
    : items;

  // Apply category filter
  const filtered = activeFilter === 0
    ? searchedItems
    : activeFilter === 'duplicates'
      ? searchedItems.filter(it => it.duplicate_of != null)
      : activeFilter === 'needsinfo'
        ? searchedItems.filter(it => it.cost == null || it.purchase_year == null)
        : activeFilter === 'needsphoto'
          ? searchedItems.filter(it => it.crop_url == null)
          : activeFilter === 'needsvalue'
            ? searchedItems.filter(it => it.cost == null)
            : activeFilter === 'needsroom'
              ? searchedItems.filter(it => it.room_id == null)
              : searchedItems.filter(it => it.room_id === activeFilter);

  const chipsHtml = buildFilterChips(items, activeFilter);
  const searchHtml = buildSearchBar(searchQuery);
  const headerHtml = buildSectionHeader(filtered.length, items.length, searchQuery);
  const cardsHtml = filtered.length > 0
    ? filtered.map(buildCard).join('')
    : buildNoResultsState(searchQuery);

  return `
    ${searchHtml}
    <div class="room-chips">${chipsHtml}</div>
    ${headerHtml}
    <div class="items-grid" id="itemsGrid">${cardsHtml}</div>
    ${buildBulkBar()}`;
}
```

#### Add search bar builder function (add before `render()`)

```javascript
function buildSearchBar(query) {
  const hasQuery = query && query.trim().length > 0;
  return `
    <div class="items-search-bar">
      <div class="items-search-input-wrap">
        <svg class="items-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input 
          type="search" 
          class="items-search-input" 
          placeholder="Search items..." 
          value="${query}"
          aria-label="Search items"
          id="itemsSearchInput"
        />
        ${hasQuery ? `
          <button class="items-search-clear" aria-label="Clear search" id="itemsSearchClear">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        ` : ''}
      </div>
      ${hasQuery ? `<span class="items-search-count" aria-live="polite">Search results</span>` : ''}
    </div>
  `;
}
```

#### Add no results state function (add before `render()`)

```javascript
function buildNoResultsState(query) {
  return `
    <div class="empty-state" style="grid-column:1/-1">
      <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <h2 class="empty-state-title">No items match "${escapeHtml(query)}"</h2>
      <p class="empty-state-subtitle">
        Try a different search term, or browse all items by clearing the search.
      </p>
      <button class="empty-state-cta" id="clearSearchBtn" aria-label="Clear search">
        Clear Search
      </button>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

#### Update `buildSectionHeader()` to show search count

**Find `buildSectionHeader()` (around line 173) and update:**

```javascript
function buildSectionHeader(filteredCount, totalCount, searchQuery = '') {
  const label = searchQuery && searchQuery.trim()
    ? `${filteredCount} item${filteredCount !== 1 ? 's' : ''} match`
    : filteredCount === totalCount
      ? `${totalCount} ${totalCount === 1 ? 'Item' : 'Items'}`
      : `${filteredCount} of ${totalCount} Items`;

  return `
    <div class="items-section-header">
      <span class="items-count">${label}</span>
      <div style="display:flex;align-items:center;gap:12px">
        <span class="items-sort-label">
          Recent
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
        <button class="items-select-toggle" id="itemsSelectToggle" aria-label="Select items">Select</button>
      </div>
    </div>`;
}
```

#### Add search event handlers in `init()` function

**Add `init()` function at end of file:**

```javascript
export function init(onSearchChange) {
  const searchInput = document.getElementById('itemsSearchInput');
  const searchClear = document.getElementById('itemsSearchClear');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  // Search input handler (debounced)
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      
      // Clear existing timer
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
      
      // Set new timer (200ms debounce)
      searchDebounceTimer = setTimeout(() => {
        searchQuery = query;
        if (onSearchChange) {
          onSearchChange(query);
        }
      }, 200);
    });

    // Focus on mount (optional - may be annoying)
    // searchInput.focus();
  }

  // Clear search button (in input)
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchQuery = '';
      if (onSearchChange) {
        onSearchChange('');
      }
      searchInput.value = '';
      searchInput.focus();
    });
  }

  // Clear search button (empty state)
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchQuery = '';
      if (onSearchChange) {
        onSearchChange('');
      }
    });
  }

  // Escape key clears search
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchQuery) {
      searchQuery = '';
      if (onSearchChange) {
        onSearchChange('');
      }
    }
  });
}
```

---

## Part 2: Enhanced Filters

### File: `objects/items-list.js`

#### Update `buildFilterChips()` function (around line 20)

**Replace the function with:**

```javascript
function buildFilterChips(items, activeFilter) {
  const roomCounts = {};
  items.forEach(it => {
    const rid = it.room_id;
    if (rid && rid >= 1 && rid <= ROOMS.length) {
      roomCounts[rid] = (roomCounts[rid] || 0) + 1;
    }
  });

  const duplicateCount = items.filter(it => it.duplicate_of != null).length;
  const needsInfoCount = items.filter(it => it.cost == null || it.purchase_year == null).length;
  const needsPhotoCount = items.filter(it => it.crop_url == null).length;
  const needsValueCount = items.filter(it => it.cost == null).length;
  const needsRoomCount = items.filter(it => it.room_id == null).length;

  const chips = [
    `<button class="room-chip${activeFilter === 0 ? ' active' : ''}" data-room="0" aria-pressed="${activeFilter === 0}">
      All <span class="room-chip-count">${items.length}</span>
    </button>`,
  ];

  if (duplicateCount > 0) {
    chips.push(
      `<button class="room-chip room-chip--warning${activeFilter === 'duplicates' ? ' active' : ''}" 
              data-room="duplicates" aria-pressed="${activeFilter === 'duplicates'}">
        ⚠ Duplicates <span class="room-chip-count">${duplicateCount}</span>
      </button>`
    );
  }

  if (needsInfoCount > 0) {
    chips.push(
      `<button class="room-chip room-chip--info${activeFilter === 'needsinfo' ? ' active' : ''}" 
              data-room="needsinfo" aria-pressed="${activeFilter === 'needsinfo'}">
        ℹ️ Needs Info <span class="room-chip-count">${needsInfoCount}</span>
      </button>`
    );
  }

  if (needsPhotoCount > 0) {
    chips.push(
      `<button class="room-chip room-chip--photo${activeFilter === 'needsphoto' ? ' active' : ''}" 
              data-room="needsphoto" aria-pressed="${activeFilter === 'needsphoto'}">
        📷 Needs Photo <span class="room-chip-count">${needsPhotoCount}</span>
      </button>`
    );
  }

  if (needsValueCount > 0) {
    chips.push(
      `<button class="room-chip room-chip--value${activeFilter === 'needsvalue' ? ' active' : ''}" 
              data-room="needsvalue" aria-pressed="${activeFilter === 'needsvalue'}">
        💰 Needs Value <span class="room-chip-count">${needsValueCount}</span>
      </button>`
    );
  }

  if (needsRoomCount > 0) {
    chips.push(
      `<button class="room-chip room-chip--room${activeFilter === 'needsroom' ? ' active' : ''}" 
              data-room="needsroom" aria-pressed="${activeFilter === 'needsroom'}">
        🏠 Needs Room <span class="room-chip-count">${needsRoomCount}</span>
      </button>`
    );
  }

  Object.keys(roomCounts)
    .sort((a, b) => roomCounts[b] - roomCounts[a])
    .forEach(rid => {
      const id = parseInt(rid);
      const name = ROOMS[id - 1];
      chips.push(
        `<button class="room-chip${activeFilter === id ? ' active' : ''}" 
                data-room="${id}" aria-pressed="${activeFilter === id}">
          ${name} <span class="room-chip-count">${roomCounts[id]}</span>
        </button>`
      );
    });

  return chips.join('');
}
```

#### Update filter logic in `render()` (already done in Part 1)

The `render()` function update in Part 1 already includes the new filter cases for `needsphoto`, `needsvalue`, and `needsroom`.

---

## Part 3: Export History

### File: `core/export-history.js` (NEW)

**Create new file:**

```javascript
// ── Export History Module ──────────────────────────────────────

import { apiFetch } from './api.js';

const EXPORTS_KEY = 'arcera_export_history';

// Get export history from API
export async function getExportHistory() {
  try {
    const response = await apiFetch('/exports', { method: 'GET' });
    if (!response.ok) {
      throw new Error('Failed to fetch export history');
    }
    const data = await response.json();
    return data.exports || [];
  } catch (err) {
    console.error('Export history error:', err);
    return [];
  }
}

// Download a specific export
export async function downloadExport(exportId, createdAt) {
  try {
    const response = await apiFetch(`/exports/${exportId}/download`, { method: 'GET' });
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Format date for filename
    const date = new Date(createdAt);
    const dateStr = date.toISOString().split('T')[0];
    a.download = `arcera-inventory-${dateStr}.csv`;
    
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return true;
  } catch (err) {
    console.error('Download error:', err);
    return false;
  }
}

// Format file size for display
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Format date for display
export function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Show export history modal
export function showExportHistoryModal(exports) {
  const overlay = document.createElement('div');
  overlay.className = 'export-history-overlay open';
  overlay.innerHTML = `
    <div class="export-history-modal" role="dialog" aria-modal="true" aria-labelledby="export-history-title">
      <div class="export-history-header">
        <h2 class="export-history-title" id="export-history-title">Export History</h2>
        <button class="export-history-close" aria-label="Close export history">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      
      <p class="export-history-desc">
        Your past exports are stored for 90 days.
      </p>
      
      <div class="export-history-list">
        ${exports.length > 0 
          ? exports.map(exp => `
              <div class="export-history-item">
                <div class="export-history-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div class="export-history-info">
                  <div class="export-history-date">${formatDate(exp.created_at)}</div>
                  <div class="export-history-meta">
                    ${exp.item_count} items · ${formatCurrency(exp.total_value)} · ${formatFileSize(exp.file_size_bytes)}
                  </div>
                </div>
                <button class="export-history-download" data-id="${exp.id}" data-date="${exp.created_at}">
                  Download
                </button>
              </div>
            `).join('')
          : `
            <div class="export-history-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <h3 class="export-history-empty-title">No exports yet</h3>
              <p class="export-history-empty-desc">
                When you export your inventory, your past exports will appear here for 90 days.
              </p>
              <button class="export-history-cta" onclick="this.closest('.export-history-overlay').remove()">
                Go to Dashboard
              </button>
            </div>
          `}
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Format currency helper
  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
  
  // Close on X button
  const closeBtn = overlay.querySelector('.export-history-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
    });
  }
  
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
  
  // Download button handlers
  const downloadBtns = overlay.querySelectorAll('.export-history-download');
  downloadBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const exportId = btn.dataset.id;
      const exportDate = btn.dataset.date;
      
      btn.disabled = true;
      btn.textContent = 'Downloading...';
      
      const success = await downloadExport(exportId, exportDate);
      
      if (success) {
        btn.textContent = 'Downloaded ✓';
        setTimeout(() => {
          overlay.classList.remove('open');
          setTimeout(() => overlay.remove(), 300);
        }, 1000);
      } else {
        btn.disabled = false;
        btn.textContent = 'Download';
        alert('Download failed. Please try again or contact support@arcera.com');
      }
    });
  });
}
```

### File: `objects/summary.js`

#### Add export history access point

**Find the export card section in `render()` and add a link:**

```javascript
function renderExportCard(readinessScore, itemsNeeded) {
  const isReady = readinessScore >= EXPORT_THRESHOLD;
  return `<div class="home-export-card ${isReady ? 'unlocked' : ''}">
    ...existing content...
    <button class="home-export-btn" ${isReady ? '' : 'disabled'} aria-label="${isReady ? 'Export your inventory' : 'Export locked - complete more items'}">
      ...existing content...
    </button>
    <button class="home-export-history-link" aria-label="View export history">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      View export history
    </button>
  </div>`;
}
```

#### Add event handler for export history

**In `init()` function, add:**

```javascript
// Export history link handler
const exportHistoryLink = document.querySelector('.home-export-history-link');
if (exportHistoryLink) {
  exportHistoryLink.addEventListener('click', async () => {
    const { getExportHistory, showExportHistoryModal } = await import('../core/export-history.js');
    const exports = await getExportHistory();
    showExportHistoryModal(exports);
  });
}
```

---

## Part 4: Loading Skeleton

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

#### Import loading module

**Add at top of file:**

```javascript
import { renderHomeLoading } from './loading-skeleton.js';
```

#### Update `render()` to handle loading state

**Update the beginning of `render()` function:**

```javascript
export function render(items) {
  // Loading state
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

---

## Part 5: CSS Styles

### File: `styles/main.css`

#### Add search bar styles (add after `.items-section-header`)

```css
/* Search Bar */
.items-search-bar {
  padding: var(--content-padding);
  padding-bottom: 12px;
}

.items-search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.items-search-icon {
  position: absolute;
  left: 14px;
  width: 20px;
  height: 20px;
  color: var(--color-muted);
  pointer-events: none;
}

.items-search-input {
  width: 100%;
  padding: 12px 44px 12px 44px;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  background: var(--white);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.items-search-input:focus {
  outline: none;
  border-color: var(--color-gold);
  box-shadow: 0 0 0 3px var(--color-gold-dim);
}

.items-search-input::placeholder {
  color: var(--color-muted);
}

.items-search-clear {
  position: absolute;
  right: 12px;
  width: 28px;
  height: 28px;
  border: none;
  background: var(--color-bg);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.items-search-clear:hover {
  background: var(--color-divider);
}

.items-search-clear svg {
  width: 16px;
  height: 16px;
  color: var(--color-muted);
}

.items-search-count {
  display: block;
  font-size: 0.78rem;
  color: var(--color-muted);
  margin-top: 8px;
  padding-left: 12px;
}
```

#### Add enhanced filter chip styles (add after `.room-chip`)

```css
/* Filter Chip Icons */
.room-chip-count {
  font-family: var(--font-mono);
  font-size: 0.75em;
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}

.room-chip--photo.active {
  background: var(--color-warning);
  color: var(--white);
}

.room-chip--photo:not(.active) {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.room-chip--value.active {
  background: var(--color-gold);
  color: var(--white);
}

.room-chip--value:not(.active) {
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.room-chip--room.active {
  background: var(--color-muted);
  color: var(--white);
}

.room-chip--room:not(.active) {
  border-color: var(--color-muted);
  color: var(--color-muted);
}
```

#### Add loading skeleton styles (add at end of file)

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

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--color-divider);
  }
}
```

#### Add export history modal styles (add at end of file)

```css
/* Export History Modal */
.export-history-overlay {
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

.export-history-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.export-history-modal {
  background: var(--white);
  border-radius: var(--radius);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  transform: scale(0.95);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.export-history-overlay.open .export-history-modal {
  transform: scale(1);
}

.export-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-divider);
}

.export-history-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-navy);
}

.export-history-close {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--color-bg);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.export-history-close:hover {
  background: var(--color-divider);
}

.export-history-close svg {
  width: 18px;
  height: 18px;
  color: var(--color-muted);
}

.export-history-desc {
  padding: 16px 24px;
  font-size: 0.88rem;
  color: var(--color-muted);
  border-bottom: 1px solid var(--color-divider);
}

.export-history-list {
  padding: 16px 24px;
  overflow-y: auto;
  flex: 1;
}

.export-history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius);
  margin-bottom: 12px;
}

.export-history-icon {
  width: 40px;
  height: 40px;
  background: var(--color-gold-dim);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.export-history-icon svg {
  width: 22px;
  height: 22px;
  color: var(--color-gold);
}

.export-history-info {
  flex: 1;
  min-width: 0;
}

.export-history-date {
  font-family: var(--font-serif);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-navy);
  margin-bottom: 4px;
}

.export-history-meta {
  font-size: 0.78rem;
  color: var(--color-muted);
  font-family: var(--font-mono);
}

.export-history-download {
  padding: 10px 20px;
  background: var(--color-navy);
  color: var(--white);
  border: none;
  border-radius: 8px;
  font-family: var(--font-sans);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.export-history-download:hover {
  background: var(--color-navy-dark);
}

.export-history-download:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-history-empty {
  text-align: center;
  padding: 40px 20px;
}

.export-history-empty svg {
  width: 64px;
  height: 64px;
  color: var(--color-muted);
  margin-bottom: 16px;
}

.export-history-empty-title {
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-navy);
  margin-bottom: 8px;
}

.export-history-empty-desc {
  font-size: 0.88rem;
  color: var(--color-muted);
  line-height: 1.5;
  margin-bottom: 20px;
}

.export-history-cta {
  padding: 12px 24px;
  background: var(--color-navy);
  color: var(--white);
  border: none;
  border-radius: 8px;
  font-family: var(--font-sans);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
}

/* Mobile: Export history becomes bottom sheet */
@media (max-width: 480px) {
  .export-history-modal {
    max-height: 90vh;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: var(--radius) var(--radius) 0 0;
  }
}
```

---

## Testing Checklist

### Search Bar
- [ ] Search filters in real-time (200ms debounce)
- [ ] Clear button appears when typing
- [ ] Escape key clears search
- [ ] Empty state shows when no results
- [ ] Search count updates dynamically
- [ ] Mobile keyboard is search-optimized

### Enhanced Filters
- [ ] Needs Photo filter shows items without `crop_url`
- [ ] Needs Value filter shows items without `cost`
- [ ] Needs Room filter shows items without `room_id`
- [ ] Filter counts update correctly
- [ ] Active filter has correct styling
- [ ] Filter + search work together

### Export History
- [ ] Modal opens from dashboard link
- [ ] Export list loads from API
- [ ] Download button works
- [ ] Empty state shows when no exports
- [ ] Modal closes on X, overlay click, Escape
- [ ] Mobile: modal becomes bottom sheet

### Loading Skeleton
- [ ] Skeleton shows while items loading
- [ ] Shimmer animation smooth (60fps)
- [ ] Reduced motion: static placeholder
- [ ] Skeleton matches responsive layout
- [ ] `aria-busy="true"` present

### Accessibility
- [ ] Search input has `aria-label`
- [ ] Search results count has `aria-live`
- [ ] Filter chips have `aria-pressed`
- [ ] Modal has `role="dialog"`
- [ ] All touch targets 44px minimum
- [ ] Focus visible on all interactive elements
- [ ] Keyboard navigation works

---

## Rollback Plan

If issues arise:

```bash
cd /home/kevin/Apps/Arcera/arcera_frontend
git checkout objects/items-list.js objects/summary.js styles/main.css
rm core/export-history.js objects/loading-skeleton.js
```

---

## Post-Implementation

1. **Build:** `npm run build`
2. **Test search:** Type "wine", verify filtering
3. **Test filters:** Click Needs Photo, Needs Value
4. **Test export history:** Open modal, download
5. **Test loading:** Refresh page, verify skeleton
6. **Commit:** `feat: Sprint 2 — Search, filters, export history, loading skeleton`

---

*End of Integration Spec*
