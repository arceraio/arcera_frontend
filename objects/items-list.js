/* ── Items Grid View ── */
/* Magazine-grid inventory for Arcera */

const ROOMS = [
  "Living Room", "Bedroom", "Kitchen", "Bathroom",
  "Dining Room", "Office", "Garage", "Other",
];

const fmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

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
  const needsInfoCount = items.filter(
    it => it.cost == null || it.purchase_year == null
  ).length;

  const chips = [
    `<button class="room-chip${activeFilter === 0 ? ' active' : ''}" data-room="0">
      All <span style="font-family:'DM Mono',monospace;font-size:0.75em;opacity:0.7">${items.length}</span>
    </button>`,
  ];

  if (duplicateCount > 0) {
    chips.push(
      `<button class="room-chip room-chip--warning${activeFilter === 'duplicates' ? ' active' : ''}" data-room="duplicates">
        ⚠ Duplicates <span style="font-family:'DM Mono',monospace;font-size:0.75em;opacity:0.7">${duplicateCount}</span>
      </button>`
    );
  }

  if (needsInfoCount > 0) {
    chips.push(
      `<button class="room-chip room-chip--info${activeFilter === 'needsinfo' ? ' active' : ''}" data-room="needsinfo">
        Needs Info <span style="font-family:'DM Mono',monospace;font-size:0.75em;opacity:0.7">${needsInfoCount}</span>
      </button>`
    );
  }

  Object.keys(roomCounts)
    .sort((a, b) => roomCounts[b] - roomCounts[a])
    .forEach(rid => {
      const id = parseInt(rid);
      const name = ROOMS[id - 1];
      chips.push(
        `<button class="room-chip${activeFilter === id ? ' active' : ''}" data-room="${id}">
          ${name} <span style="font-family:'DM Mono',monospace;font-size:0.75em;opacity:0.7">${roomCounts[id]}</span>
        </button>`
      );
    });

  return chips.join('');
}

function buildImageArea(it) {
  if (it.crop_url) {
    return `
      <div class="item-card-image-wrap">
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
        <img class="item-card-thumb" src="${it.crop_url}" alt="${it.label}" loading="lazy" />
      </div>`;
  }

  return `
    <div class="item-card-image-wrap">
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

function buildSectionHeader(filteredCount, totalCount) {
  const label = filteredCount === totalCount
    ? `${totalCount} ${totalCount === 1 ? 'Item' : 'Items'}`
    : `${filteredCount} of ${totalCount} Items`;

  return `
    <div class="items-section-header">
      <span class="items-count">${label}</span>
      <span class="items-sort-label">
        Recent
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </span>
    </div>`;
}

/* ─ Main export ─ */

export function render(items, activeFilter = 0) {
  if (items.length === 0) {
    return buildEmptyState();
  }

  const filtered = activeFilter === 0
    ? items
    : activeFilter === 'duplicates'
      ? items.filter(it => it.duplicate_of != null)
      : activeFilter === 'needsinfo'
        ? items.filter(it => it.cost == null || it.purchase_year == null)
        : items.filter(it => it.room_id === activeFilter);

  const chipsHtml = buildFilterChips(items, activeFilter);
  const headerHtml = buildSectionHeader(filtered.length, items.length);
  const cardsHtml = filtered.length > 0
    ? filtered.map(buildCard).join('')
    : `<div class="empty-state" style="grid-column:1/-1">
        <p class="empty-state-title" style="font-size:1.2rem">No items match this filter</p>
        <p class="empty-state-subtitle">Try selecting a different room or removing the filter.</p>
       </div>`;

  return `
    <div class="room-chips">${chipsHtml}</div>
    ${headerHtml}
    <div class="items-grid">${cardsHtml}</div>`;
}
