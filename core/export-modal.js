// ── Export Success Modal ──────────────────────────────────────────

export function showExportSuccess() {
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
  
  // Auto-dismiss after 8 seconds
  setTimeout(() => {
    if (overlay.parentElement) {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
    }
  }, 8000);
}
