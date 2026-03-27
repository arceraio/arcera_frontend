/* ── Loading Skeleton Module ─────────────────────────────────── */

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
