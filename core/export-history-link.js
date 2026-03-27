/* ── Export History Link Handler ───────────────────────────────── */

export function initExportHistoryLink() {
  const exportHistoryLink = document.querySelector('.home-export-history-link');
  if (exportHistoryLink) {
    exportHistoryLink.addEventListener('click', async () => {
      const { getExportHistory, showExportHistoryModal } = await import('./export-history.js');
      const exports = await getExportHistory();
      showExportHistoryModal(exports);
    });
  }
}
