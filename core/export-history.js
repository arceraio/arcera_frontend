/* ── Export History Module ────────────────────────────────────── */

import { apiFetch } from './api.js';

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

// Format currency for display
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
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
