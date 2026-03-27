/* ── Items Grid View ── */
/* Magazine-grid inventory for Arcera */

import { optimizeImageUrl } from '../core/image-optimizer.js';

const ROOMS = [
  "Living Room", "Bedroom", "Kitchen", "Bathroom",
  "Dining Room", "Office", "Garage", "Other",
];

const fmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

/* ─ Search State ─ */
let searchQuery = '';
let searchDebounceTimer = null;

/* ─ Helpers ─ */

function getInitial(label) {
  return label ? label.trim().charAt(0).toUpperCase() : '?';
}

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

  const countSpan = (count) => `<span class="room-chip-count">${count}</span>`;

  const chips = [
    `<button class="room-chip${activeFilter === 0 ? ' active' : ''}" data-room="0" aria-pressed="${activeFilter === 0}">
      All ${countSpan(items.length)}
    </button>`,
  ];

  if (duplicateCount > 0) {
    chips.push(
      `<button class="room-chip room-chip--warning${activeFilter === 'duplicates' ? ' active' : ''}" 
              data-room="duplicates" aria-pressed="${activeFilter === 'duplicates'}">
        ⚠ Duplicates ${countSpan(duplicateCount)}
      </button>`
    );
  }

  if (needsInfoCount > 0) {
    chips.push(
      `<button class="room-chip room-chip--info${activeFilter === 'needsinfo' ? ' active' : ''}" 
              data-room="needsinfo" aria-pressed="${activeFilter === 'needsinfo'}">
        ℹ️ Needs Info ${countSpan(needsInfoCount)}
      </button>`
    );
  }

  if (needsPhotoCount > 0) {
    chips.push(
      `<button class="room-chip room-chip--photo${activeFilter === 'needsphoto' ? ' active' : ''}" 
              data-room="needsphoto" aria-pressed="${activeFilter === 'needsphoto'}">
        📷 Needs Photo ${countSpan(needsPhotoCount)}
      </button>`
    );
  }

  if (needsValueCount > 0) {
    chips.push(
      `<button class="room-chip room-chip--value${activeFilter === 'needsvalue' ? ' active' : ''}" 
              data-room="needsvalue" aria-pressed="${activeFilter === 'needsvalue'}">
        💰 Needs Value ${countSpan(needsValueCount)}
      </button>`
    );
  }

  if (needsRoomCount > 0) {
    chips.push(
      `<button class="room-chip room-chip--room${activeFilter === 'needsroom' ? ' active' : ''}" 
              data-room="needsroom" aria-pressed="${activeFilter === 'needsroom'}">
        🏠 Needs Room ${countSpan(needsRoomCount)}
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
          ${name} ${countSpan(roomCounts[id])}
        </button>`
      );
    });

  return chips.join('');
}

const CARD_OVERLAY_BTNS = (it) => `
  ${it.duplicate_of != null ? `
    <span class="item-card-duplicate-badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      Duplicate
    </span>` : ''}
  <button class="item-card-delete" data-id="${it.id}" aria-label="Remove ${it.label}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </button>
  <div class="item-card-select-check" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  </div>`;

function buildImageArea(it) {
  if (it.crop_url) {
    return `
      <div class="item-card-image-wrap">
        ${CARD_OVERLAY_BTNS(it)}
        <img class="item-card-thumb" src="${optimizeImageUrl(it.crop_url)}" alt="${it.label}" loading="lazy" />
      </div>`;
  }

  return `
    <div class="item-card-image-wrap">
      ${CARD_OVERLAY_BTNS(it)}
      <div class="item-card-thumb-placeholder">
        <span class="item-card-initial">${getInitial(it.label)}</span>
      </div>
    </div>`;
}

function buildCardBody(it) {
  const hasCost = it.cost != null;
  const missingInfo = !hasCost || it.purchase_year == null;

  const costHtml = hasCost
    ? `<div class="item-card-cost">${fmt.format(it.cost)}</div>`
    : `<div class="item-card-cost item-card-cost--missing">—</div>`;

  const metaHtml = `
    <div class="item-card-meta">
      ${it.room
        ? `<span class="item-card-room">${it.room}</span>`
        : '<span></span>'}
      ${it.purchase_year
        ? `<span class="item-card-year">${it.purchase_year}</span>`
        : ''}
    </div>`;

  const needsInfoHtml = missingInfo ? `
    <span class="item-card-needs-info">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      Needs Info
    </span>` : '';

  return `
    <div class="item-card-body">
      <div class="item-card-name">${it.label}</div>
      ${costHtml}
      ${metaHtml}
      ${needsInfoHtml}
    </div>`;
}

function buildCard(it) {
  return `
    <div class="item-card" data-id="${it.id}">
      ${buildImageArea(it)}
      ${buildCardBody(it)}
    </div>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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

function buildEmptyState() {
  return `
    <div class="empty-state">
      <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <h2 class="empty-state-title">No items yet</h2>
      <p class="empty-state-subtitle">Scan a room with your camera and our AI will document everything for your insurance records.</p>
      <button class="empty-state-cta nav-camera-btn" aria-label="Scan your first item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span>Scan Your First Item</span>
      </button>
    </div>`;
}

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

function buildBulkBar() {
  return `
    <div class="items-bulk-bar" id="itemsBulkBar">
      <span class="items-bulk-count" id="itemsBulkCount">0 selected</span>
      <div class="items-bulk-actions">
        <button class="items-bulk-cancel" id="itemsBulkCancel">Cancel</button>
        <button class="items-bulk-delete" id="itemsBulkDelete" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          Delete
        </button>
      </div>
    </div>`;
}

/* ─ Main export ─ */

export function render(items, activeFilter = 0, query = '') {
  if (!items || items.length === 0) {
    return buildEmptyState();
  }

  // Apply search filter
  const searchedItems = query && query.trim()
    ? items.filter(it => {
        const q = query.toLowerCase();
        const labelMatch = it.label.toLowerCase().includes(q);
        const roomMatch = it.room ? it.room.toLowerCase().includes(q) : false;
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
  const searchHtml = buildSearchBar(query);
  const headerHtml = buildSectionHeader(filtered.length, items.length, query);
  const cardsHtml = filtered.length > 0
    ? filtered.map(buildCard).join('')
    : buildNoResultsState(query);

  return `
    ${searchHtml}
    <div class="room-chips">${chipsHtml}</div>
    ${headerHtml}
    <div class="items-grid" id="itemsGrid">${cardsHtml}</div>
    ${buildBulkBar()}`;
}

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
  }

  // Clear search button (in input)
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchQuery = '';
      if (onSearchChange) {
        onSearchChange('');
      }
      const input = document.getElementById('itemsSearchInput');
      if (input) {
        input.value = '';
        input.focus();
      }
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
