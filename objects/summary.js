const TOTAL_ROOMS = 8;
const RECENT_COUNT = 4;

// ── Formatters ────────────────────────────────────────────────────

const fmtFull = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

function fmtValueShort(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000)    return `$${Math.round(v / 1_000)}K`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);
}

function dateLabel(isoString) {
  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const weekAgo   = new Date(today.getTime() - 6 * 86_400_000);
  const d         = new Date(isoString);
  const day       = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (day.getTime() === today.getTime())     return 'Today';
  if (day.getTime() === yesterday.getTime()) return 'Yesterday';
  if (day >= weekAgo)                        return 'This Week';
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// ── Partial renderers ─────────────────────────────────────────────

function renderHeroAccent() {
  return `
    <svg class="home-hero-accent" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polygon points="120,0 120,120 0,0" fill="#C9A84C"/>
      <polygon points="120,0 120,80 40,0" fill="#C9A84C" opacity="0.4"/>
    </svg>
  `;
}

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

function renderStatCard(number, label, barPct, delay) {
  return `
    <div class="home-stat-card" style="transition-delay: ${delay}s">
      <span class="home-stat-number" data-countup="${number}" data-countup-duration="800">0</span>
      <span class="home-stat-label">${label}</span>
      <div class="home-stat-bar">
        <div class="home-stat-bar-fill" data-bar-target="${barPct}"></div>
      </div>
    </div>
  `;
}

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

function renderRecentItems(items) {
  const recent = [...items]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, RECENT_COUNT);

  if (recent.length === 0) return '';

  return `
    <section class="home-recent">
      <div class="home-recent-header">
        <h2 class="home-recent-title">Recently Added</h2>
        <button class="home-recent-viewall" data-navigate="items" aria-label="View all items">
          View all
        </button>
      </div>
      <div class="home-recent-scroll">
        ${recent.map(renderMiniCard).join('')}
      </div>
    </section>
  `;
}

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
    const limit     = 15;
    const visible   = group.slice(0, limit);
    const remaining = group.length - visible.length;

    return `
      <div class="timeline-section">
        <h3 class="timeline-label">${label}</h3>
        <div class="items-grid">
          ${visible.map(it => `
            <div class="item-card" data-id="${it.id}">
              ${it.crop_url
                ? `<img class="item-card-thumb" src="${it.crop_url}" alt="${it.label}" loading="lazy">`
                : `<div class="item-card-thumb item-card-thumb-placeholder">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                       <rect x="3" y="3" width="18" height="18" rx="2"/>
                       <circle cx="8.5" cy="8.5" r="1.5"/>
                       <polyline points="21 15 16 10 5 21"/>
                     </svg>
                   </div>`}
              <div class="item-card-name">${it.label}</div>
              <div class="item-card-cost">${it.cost != null ? fmtFull.format(it.cost) : '—'}</div>
              <span class="item-card-room">${it.room}</span>
            </div>
          `).join('')}
        </div>
        ${remaining > 0 ? `
          <button class="timeline-see-more" data-navigate="items" aria-label="View ${remaining} more items">
            +${remaining} more item${remaining !== 1 ? 's' : ''} — View all
          </button>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="home-timeline">
      <div class="home-timeline-divider">
        <div class="home-timeline-divider-line"></div>
        <span class="home-timeline-divider-label">All Items</span>
        <div class="home-timeline-divider-line"></div>
      </div>
      ${sections}
    </div>
  `;
}

function renderEmpty() {
  return `
    <div class="home-empty">
      <svg class="home-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <h2 class="home-empty-title">Your inventory is empty</h2>
      <p class="home-empty-sub">
        Scan a room with your phone camera to begin building your home inventory.
      </p>
      <button class="home-empty-btn nav-camera-btn" aria-label="Scan items">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        Scan Items
      </button>
    </div>
  `;
}

// ── Animation helpers ─────────────────────────────────────────────

function countUp(el, target, duration) {
  const start     = performance.now();
  const startVal  = 0;
  const isFloat   = String(target).includes('.');
  const prefix    = el.dataset.countupPrefix || '';

  function tick(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = startVal + (target - startVal) * eased;
    el.textContent = prefix + (isFloat ? current.toFixed(1) : Math.round(current));
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ── Public API ────────────────────────────────────────────────────

export function render(items) {
  if (!items || items.length === 0) {
    return renderEmpty();
  }

  const total      = items.length;
  const totalValue = items.reduce((sum, it) => sum + (it.cost || 0), 0);
  const valued     = items.filter(it => it.cost != null).length;
  const rooms      = new Set(items.map(it => it.room_id).filter(Boolean)).size;

  const roomPct   = Math.round((rooms  / TOTAL_ROOMS) * 100);
  const valuedPct = Math.round((valued / total) * 100);

  const statsHtml = `
    <div class="home-stats">
      ${renderStatCard(total,      'Total Items',     roomPct,   0)}
      ${renderStatCard(totalValue, 'Est. Value', valuedPct, 0.1)}
      ${renderStatCard(rooms,      'Rooms Covered',   roomPct,   0.2)}
    </div>
  `;

  // Override stat[1] number display — show currency, not raw integer
  // We pass raw value for count-up then swap label; see init() for format override.

  const actionsHtml = `
    <div class="home-actions">
      <button class="home-action-btn home-action-btn--primary nav-camera-btn" aria-label="Scan new items">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        Scan New Items
      </button>
      <button class="home-action-btn home-action-btn--outline" data-navigate="items" aria-label="View all items">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        View All Items
      </button>
    </div>
  `;

  return `
    ${renderHero(total)}
    ${statsHtml}
    ${actionsHtml}
    ${renderRecentItems(items)}
    ${renderTimeline(items)}
  `;
}

export function init() {
  // ── Stat cards: staggered fade-in ──────────────────────────────
  const statCards   = document.querySelectorAll('.home-stat-card');
  const miniCards   = document.querySelectorAll('.home-mini-card');
  const heroNumber  = document.querySelector('.home-hero-number');

  // Trigger visible class after a brief paint delay
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      statCards.forEach(card => card.classList.add('home-stat--visible'));
      miniCards.forEach(card => card.classList.add('home-mini--visible'));

      // Animate progress bars
      document.querySelectorAll('.home-stat-bar-fill').forEach(bar => {
        const target = bar.dataset.barTarget || '0';
        bar.style.width = target + '%';
      });
    });
  });

  // ── Count-up: hero number ───────────────────────────────────────
  if (heroNumber) {
    const target   = parseFloat(heroNumber.dataset.countup || '0');
    const duration = parseInt(heroNumber.dataset.countupDuration || '800', 10);
    countUp(heroNumber, target, duration);
  }

  // ── Count-up: stat cards ────────────────────────────────────────
  // Stat index 1 is total value — show currency format, not raw integer
  statCards.forEach((card, idx) => {
    const numEl    = card.querySelector('.home-stat-number');
    if (!numEl) return;

    const target   = parseFloat(numEl.dataset.countup || '0');
    const duration = parseInt(numEl.dataset.countupDuration || '800', 10);

    if (idx === 1) {
      // Currency stat: count up raw value then format with fmtValueShort
      const startTime = performance.now();
      function tickCurrency(now) {
        const elapsed  = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        numEl.textContent = fmtValueShort(target * eased);
        if (progress < 1) requestAnimationFrame(tickCurrency);
      }
      requestAnimationFrame(tickCurrency);
    } else {
      countUp(numEl, target, duration);
    }
  });

  // ── Click delegation: data-navigate buttons ─────────────────────
  // (Navigation is handled globally by app.js; no wiring needed here.)
}
