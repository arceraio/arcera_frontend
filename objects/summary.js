import { apiFetch } from '../core/api.js';
import { supabase } from '../core/supabaseClient.js';
import { showExportSuccess } from '../core/export-modal.js';
import { calculateClaimReadiness, getReadinessLevel, getExportRequirements, EXPORT_THRESHOLD } from '../core/readiness.js';
import { renderHomeLoading } from './loading-skeleton.js';
import { initExportHistoryLink } from '../core/export-history-link.js';
import { checkMilestone } from '../core/milestone-celebration.js';
import { optimizeImageUrl, buildSrcset } from '../core/image-optimizer.js';
import { getExportErrorType, showExportError } from '../core/export-error.js';
const handleExportRetry = () => handleExport(), TOTAL_ROOMS = 8, RECENT_COUNT = 4, TIMELINE_LIMIT = 8, DAY_MS = 86_400_000;
const fmtFull = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtValueShort = (v) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 10_000 ? `$${Math.round(v / 1_000)}K` : v >= 1_000 ? `$${(v / 1_000).toFixed(1)}K` : fmtFull.format(v);
const dateLabel = (isoString) => { const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate()), d = new Date(isoString), day = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return day.getTime() === today.getTime() ? 'Today' : day.getTime() === today.getTime() - DAY_MS ? 'Yesterday' : day >= new Date(today.getTime() - 6 * DAY_MS) ? 'This Week' : d.toLocaleString('default', { month: 'long', year: 'numeric' }); };
let countUpAnimationId = null;

function renderHero(total, readinessScore, lastScannedAt) {
  const lastScanned = lastScannedAt ? dateLabel(lastScannedAt) : null;
  return `
    <div class="home-hero">
      <span class="home-hero-eyebrow">Your Home, Documented</span>
      <span class="home-hero-number" data-countup="${total}" data-countup-duration="800">0</span>
      <span class="home-hero-label">Total items documented</span>
      ${lastScanned ? `<span class="home-hero-last-scanned">Last scanned: ${lastScanned}</span>` : ''}
      <div class="home-hero-completion">
        <div class="home-hero-completion-bar">
          <div class="home-hero-completion-fill" style="width: ${readinessScore}%"></div>
        </div>
        <span class="home-hero-completion-label">${readinessScore}% claim-ready</span>
      </div>
    </div>
  `;
}

function renderTrustBadge() {
  return `<div class="home-trust-badge"><div class="home-trust-badge-header">
    <svg class="home-trust-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg><span class="home-trust-badge-title">Encrypted & Timestamped</span>
  </div><p class="home-trust-badge-desc">Your proof is stored securely. Ready for any claim.</p>
  <div class="home-trust-badge-proof"><em>"Recovered $80k for Pacific Palisades homeowner — 7 days"</em></div>
  <div class="home-trust-badge-metric">Trusted by 2,000+ homeowners</div></div>`;
}

function renderExportCard(readinessScore, itemsNeeded) {
  const isReady = readinessScore >= EXPORT_THRESHOLD;
  return `<div class="home-export-card ${isReady ? 'unlocked' : ''}">
    <svg class="home-export-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="6 17 12 11 18 17"/>
    </svg><h3 class="home-export-title">Claim-Ready Export</h3>
    <p class="home-export-desc">${isReady ? 'Your documentation is complete. Export your claim-ready inventory.'
          : `Your documentation is ${readinessScore}% complete. Add details to ${itemsNeeded} more items to unlock export.`
        }
      </p>
      <div class="home-export-progress" role="progressbar" aria-valuenow="${readinessScore}" aria-valuemin="0" aria-valuemax="100">
        <div class="home-export-progress-fill" style="width: ${readinessScore}%"></div>
      </div>
      <button class="home-export-btn" ${isReady ? '' : 'disabled'} aria-label="${isReady ? 'Export your inventory' : 'Export locked - complete more items'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        ${isReady ? 'Export Your Inventory' : 'Export Preview (Locked)'}
      </button>
      ${isReady ? `<div class="home-export-security"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>256-bit encrypted</span></div>` : ''}
      <button class="home-export-history-link" aria-label="View export history">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        View export history
      </button>
    </div>
  `;
}

function renderStatCard(number, label, barPct, delay, options = {}) {
  const { readinessLevel = '', statColor = '', benchmark = '' } = options;
  const colorStyle = statColor ? `style="--stat-color: ${statColor}"` : '';
  const benchmarkHtml = benchmark ? `<span class="home-stat-benchmark">${benchmark}</span>` : '';
  
  return `
    <div class="home-stat-card ${readinessLevel ? 'home-stat-card--readiness ' + readinessLevel : ''}" ${colorStyle} style="transition-delay: ${delay}s">
      <span class="home-stat-number" data-countup="${number}" data-countup-duration="800">0</span>
      <span class="home-stat-label">${label}</span>
      ${benchmarkHtml}
      <div class="home-stat-bar">
        <div class="home-stat-bar-fill" data-bar-target="${barPct}"></div>
      </div>
    </div>
  `;
}

function renderMiniCard(item) {
  const thumb = item.crop_url
    ? `<img class="home-mini-thumb" 
             src="${optimizeImageUrl(item.crop_url)}" 
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
    const limit     = TIMELINE_LIMIT;
    const visible   = group.slice(0, limit);
    const remaining = group.length - visible.length;

    return `
      <div class="timeline-section">
        <div class="timeline-section-header">
          <div class="timeline-dot"></div>
          <h3 class="timeline-label">${label}</h3>
        </div>
        <div class="items-grid">
          ${visible.map(it => `
            <div class="item-card" data-id="${it.id}">
              <div class="item-card-image-wrap">
                ${it.crop_url
                  ? `<img class="item-card-thumb" src="${optimizeImageUrl(it.crop_url)}" alt="${it.label}" loading="lazy">`
                  : `<div class="item-card-thumb-placeholder">
                       <span class="item-card-initial">${it.label ? it.label.trim().charAt(0).toUpperCase() : '?'}</span>
                     </div>`}
              </div>
              <div class="item-card-body">
                <div class="item-card-name">${it.label}</div>
                <div class="item-card-cost${it.cost == null ? ' item-card-cost--missing' : ''}">${it.cost != null ? fmtFull.format(it.cost) : '—'}</div>
                ${it.room ? `<span class="item-card-room">${it.room}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        ${remaining > 0 ? `
          <button class="timeline-see-more" data-navigate="items" aria-label="View ${remaining} more items">
            <span>+${remaining} more item${remaining !== 1 ? 's' : ''}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
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
      <div class="home-empty-illustration">
        <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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

function countUp(el, target, duration) {
  if (countUpAnimationId) cancelAnimationFrame(countUpAnimationId);
  const start = performance.now(), startVal = 0, isFloat = String(target).includes('.'), prefix = el.dataset.countupPrefix || '';
  const tick = (now) => {
    const elapsed = now - start, progress = Math.min(elapsed / duration, 1), eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = prefix + (isFloat ? (startVal + (target - startVal) * eased).toFixed(1) : Math.round(startVal + (target - startVal) * eased));
    if (progress < 1) countUpAnimationId = requestAnimationFrame(tick); else countUpAnimationId = null;
  };
  countUpAnimationId = requestAnimationFrame(tick);
}

// ── Public API ────────────────────────────────────────────────────

export function render(items) {
  // Loading state
  if (items === null || items === undefined) {
    return renderHomeLoading();
  }
  
  // Empty state
  if (items.length === 0) {
    return renderEmpty();
  }

  const total      = items.length;
  const totalValue = items.reduce((sum, it) => sum + (it.cost || 0), 0);
  const valued     = items.filter(it => it.cost != null).length;
  const rooms      = new Set(items.map(it => it.room_id).filter(Boolean)).size;
  
  // Calculate last scanned timestamp (most recent item)
  const lastScannedAt = items.length > 0 
    ? items.reduce((latest, it) => {
        const itDate = new Date(it.created_at).getTime();
        return itDate > latest.date ? { date: itDate, ts: it.created_at } : latest;
      }, { date: 0, ts: null }).ts 
    : null;

  // Calculate claim readiness + milestone check
  const readinessScore = calculateClaimReadiness(items);
  const readinessInfo = getReadinessLevel(readinessScore);
  const exportReq = getExportRequirements(items);
  checkMilestone(readinessScore);
  
  const roomPct   = Math.round((rooms  / TOTAL_ROOMS) * 100);
  const valuedPct = Math.round((valued / total) * 100);

  // Trust badge (NEW - Phase 1)
  const trustBadgeHtml = renderTrustBadge();

  // Export card (NEW - Phase 1)
  const exportCardHtml = renderExportCard(readinessScore, exportReq.itemsNeeded);

  // Stats with Claim Readiness replacing Rooms Covered (Phase 1)
  const statsHtml = `
    <div class="home-stats">
      ${renderStatCard(total, 'Total Items', roomPct, 0)}
      ${renderStatCard(fmtValueShort(totalValue), 'Est. Value', valuedPct, 0.1, {
        benchmark: `${valued}/${total} with values`
      })}
      ${renderStatCard(readinessScore + '%', 'Claim Readiness', readinessScore, 0.2, {
        readinessLevel: readinessInfo.level,
        statColor: readinessInfo.color,
        benchmark: exportReq.ready ? 'Ready to export' : `Add details to ${exportReq.itemsNeeded} more items`
      })}
    </div>
  `;

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
    ${renderHero(total, readinessScore, lastScannedAt)}
    ${trustBadgeHtml}
    ${statsHtml}
    ${exportCardHtml}
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

  if (heroNumber) {
    const target = parseFloat(heroNumber.dataset.countup || '0');
    const duration = parseInt(heroNumber.dataset.countupDuration || '800', 10);
    countUp(heroNumber, target, duration);
  }
  statCards.forEach((card, idx) => {
    const numEl = card.querySelector('.home-stat-number');
    if (!numEl) return;
    const text = numEl.dataset.countup || '0';
    const duration = parseInt(numEl.dataset.countupDuration || '800', 10);
    if (idx === 1) {
      const target = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
      const startTime = performance.now();
      const tickCurrency = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        numEl.textContent = fmtValueShort(target * eased);
        if (progress < 1) requestAnimationFrame(tickCurrency);
      };
      requestAnimationFrame(tickCurrency);
    } else {
      countUp(numEl, parseFloat(text) || 0, duration);
    }
  });
  // ── Export button handler + Analytics + Offline Detection ───────
  const exportBtn = document.querySelector('.home-export-btn');
  if (exportBtn && !exportBtn.disabled) {
    exportBtn.addEventListener('click', async () => {
      const isOnline = navigator.onLine;
      
      // Analytics: export clicked
      if (window._arceraAnalytics) {
        window._arceraAnalytics.push({ event: 'export_clicked', ts: Date.now() });
      }
      
      const btn = exportBtn;
      const originalContent = btn.innerHTML;
      
      // Show loading state
      btn.disabled = true;
      btn.innerHTML = `
        <svg class="export-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        
        // Analytics: export success
        if (window._arceraAnalytics) {
          window._arceraAnalytics.push({ event: 'export_success', ts: Date.now() });
        }
        
        // Show success state
        showExportSuccess();
        
        // Reset button after delay
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Export failed</span>
          <small>Please try again</small>
          <button class="export-retry-btn" onclick="handleExportRetry()">🔄 Retry</button>
        `;
      }
    });
  }

  window.addEventListener('online', () => console.log('Back online'));
  window.addEventListener('offline', () => console.log('Went offline'));
  initExportHistoryLink();
}
