/* ── Export Error Handling Module ──────────────────────────────── */

const EXPORT_ERROR_MESSAGES = {
  offline: { title: 'You appear to be offline', body: 'Please connect to the internet and try again.\n\nYour inventory is saved locally and will be available when you\'re back online.', primary: 'OK', secondary: null },
  network: { title: 'Export failed', body: 'We couldn\'t reach the server. This could be due to:\n• Slow internet connection\n• Server temporarily unavailable', primary: 'Try Again', secondary: 'Contact Support' },
  client: { title: 'Export failed', body: 'There was a problem with your inventory data.\n\nPlease contact support@arcera.com for assistance.', primary: 'OK', secondary: 'Contact Support' },
  server: { title: 'Export failed', body: 'Our server is experiencing issues. Please try again in a few minutes.', primary: 'Try Again', secondary: 'Contact Support' },
  unknown: { title: 'Export failed', body: 'An unexpected error occurred. Please try again or contact support@arcera.com', primary: 'Try Again', secondary: 'Contact Support' }
};

export function getExportErrorType(err, isOnline) {
  if (!isOnline) return 'offline';
  if (err.name === 'TypeError' && err.message.includes('fetch')) return 'network';
  const errStr = err.message || String(err);
  if (errStr.includes('400') || errStr.includes('401') || errStr.includes('403') || errStr.includes('404')) return 'client';
  if (errStr.includes('500') || errStr.includes('502') || errStr.includes('503')) return 'server';
  return 'unknown';
}

export function showExportError(errorType, errorMessage, onRetry) {
  const config = EXPORT_ERROR_MESSAGES[errorType] || EXPORT_ERROR_MESSAGES.unknown;
  const overlay = document.createElement('div');
  overlay.className = 'export-error-overlay open';
  overlay.innerHTML = `
    <div class="export-error-modal" role="alertdialog" aria-modal="true" aria-labelledby="export-error-title">
      <div class="export-error-icon">⚠️</div>
      <h3 class="export-error-title" id="export-error-title">${config.title}</h3>
      <p class="export-error-body">${config.body.replace(/\n/g, '<br/>')}</p>
      <div class="export-error-actions">
        ${config.primary === 'Try Again' ? `<button class="export-error-retry" onclick="this.closest('.export-error-overlay').remove(); ${onRetry || 'handleExportRetry()'}">🔄 ${config.primary}</button>` : ''}
        <button class="export-error-${config.primary === 'OK' ? 'primary' : 'secondary'}" onclick="this.closest('.export-error-overlay').remove()">${config.primary}</button>
        ${config.secondary ? `<a href="mailto:support@arcera.com" class="export-error-secondary">${config.secondary}</a>` : ''}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.classList.remove('open'); setTimeout(() => overlay.remove(), 300); } });
  const handleEscape = (e) => { if (e.key === 'Escape') { overlay.classList.remove('open'); setTimeout(() => overlay.remove(), 300); document.removeEventListener('keydown', handleEscape); } };
  document.addEventListener('keydown', handleEscape);
}
