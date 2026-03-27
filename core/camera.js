const ROOMS = [
  "Living Room", "Bedroom", "Kitchen", "Bathroom",
  "Dining Room", "Office", "Garage", "Other",
];

import { apiFetch } from './api.js';

// Inject camera stylesheet once on first load
(function injectCameraCSS() {
  const id = 'camera-css';
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id  = id;
    link.rel = 'stylesheet';
    link.href = 'styles/components/camera.css';
    document.head.appendChild(link);
  }
})();

let onRefresh = null;
let currentFiles = [];

export function init(refreshCb) {
  onRefresh = refreshCb;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="camera-overlay" id="cameraOverlay"></div>
    <div class="camera-sheet" id="cameraSheet">
      <div class="camera-sheet-handle"></div>
      <div class="camera-sheet-header">
        <span></span>
        <div class="camera-header-titles">
          <span class="camera-header-eyebrow">New Scan</span>
          <span class="camera-header-title">Scan Items</span>
        </div>
        <button class="camera-sheet-close" id="cameraClose" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="camera-header-rule"></div>
      <div class="camera-body" id="cameraBody"></div>
    </div>
  `);

  document.addEventListener('click', e => {
    if (e.target.closest('.nav-camera-btn')) openModal();
  });
  document.getElementById('cameraOverlay').addEventListener('click', closeModal);
  document.getElementById('cameraClose').addEventListener('click', closeModal);
}

export { openModal as open };

function openModal() {
  currentFiles = [];
  document.getElementById('cameraOverlay').classList.add('open');
  document.getElementById('cameraSheet').classList.add('open');
  showPickScreen();
}

function closeModal() {
  document.getElementById('cameraOverlay').classList.remove('open');
  document.getElementById('cameraSheet').classList.remove('open');
}

function setBody(html) {
  document.getElementById('cameraBody').innerHTML = html;
}

/* ── Step 1: Pick ── */

function showPickScreen() {
  setBody(`
    <label class="camera-pick-area" for="cameraFileInput">
      <div class="camera-pick-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </div>
      <span id="cameraPickLabel" class="camera-pick-label">Tap to select photos</span>
      <span class="camera-pick-sub">JPG, PNG, WEBP · one or more</span>
      <input type="file" id="cameraFileInput" accept=".jpg,.jpeg,.png,.webp" multiple style="display:none">
    </label>
    <button class="camera-action-btn" id="cameraScanBtn" disabled>
      <span>Scan for Items</span>
    </button>
    <div class="camera-tips">
      <span class="camera-tip">Good lighting</span>
      <span class="camera-tip">Multiple angles</span>
      <span class="camera-tip">Avoid blur</span>
      <span class="camera-tip">Fill the frame</span>
    </div>
  `);

  document.getElementById('cameraFileInput').addEventListener('change', e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    currentFiles = files;
    document.getElementById('cameraPickLabel').textContent =
      files.length === 1 ? files[0].name : `${files.length} photos selected`;
    document.getElementById('cameraScanBtn').disabled = false;
  });

  document.getElementById('cameraScanBtn').addEventListener('click', doScan);
}

/* ── Step 2: Upload + Detect ── */

function showScanProgress(step, progressNote = '') {
  const steps = ['Uploading photos…', 'Detecting items…'];
  setBody(`
    <div class="camera-scanning">
      <div class="camera-progress-steps">
        ${steps.map((label, i) => `
          <div class="camera-progress-step ${i === step ? 'active' : i < step ? 'done' : ''}">
            <span class="camera-progress-dot"></span>
            <span class="camera-progress-label">${label}</span>
          </div>
        `).join('')}
      </div>
      ${progressNote ? `<p class="camera-scanning-label" style="margin-top:8px;font-size:0.85rem;color:var(--color-muted)">${progressNote}</p>` : ''}
      <button class="camera-cancel-btn" id="cameraCancelBtn" aria-label="Cancel scan">Cancel</button>
    </div>
  `);
  document.getElementById('cameraCancelBtn').addEventListener('click', () => {
    if (window._cameraScanAbort) window._cameraScanAbort.abort();
    showPickScreen();
  });
}

async function doScan() {
  if (!currentFiles.length) return;

  const controller = new AbortController();
  window._cameraScanAbort = controller;
  const perImageMs = 20000;
  const timeoutMs = Math.max(30000, currentFiles.length * perImageMs);
  const timeoutId = setTimeout(() => {
    controller.abort();
    setBody(`
      <div class="camera-scanning">
        <p class="camera-error">
          Scan timed out after ${Math.round(timeoutMs / 1000)}s.
          ${currentFiles.length > 1 ? 'Try scanning fewer photos at a time.' : 'Try again.'}
        </p>
        <button class="camera-action-btn" id="cameraRetryBtn" style="margin-top:16px">
          <span>Try Again</span>
        </button>
      </div>
    `);
    document.getElementById('cameraRetryBtn')?.addEventListener('click', showPickScreen);
  }, timeoutMs);

  let scanResults = [];

  try {
    showScanProgress(0);
    if (currentFiles.length === 1) {
      const form = new FormData();
      form.append('image', currentFiles[0]);
      const uploadRes = await apiFetch('/upload', { method: 'POST', body: form, signal: controller.signal });
      if (!uploadRes.ok) throw new Error('Upload failed');
      showScanProgress(1);
      const res = await apiFetch('/detect', { method: 'POST', signal: controller.signal });
      const data = await res.json();
      scanResults = [{ localPath: data.path, storagePath: null, detections: data.detections || [] }];
    } else {
      const form = new FormData();
      currentFiles.forEach(f => form.append('images', f));
      const uploadRes = await apiFetch('/multi-upload', { method: 'POST', body: form, signal: controller.signal });
      if (!uploadRes.ok) throw new Error('Upload failed');
      showScanProgress(1);
      const res = await apiFetch('/multiscan', { method: 'POST', signal: controller.signal });
      const data = await res.json();
      scanResults = (data.results || []).map(r => ({
        localPath: r.local_path,
        storagePath: r.storage_path,
        detections: r.detections || [],
      }));
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') return; // user cancelled or timeout already handled
    setBody(`
      <div class="camera-scanning">
        <p class="camera-error">Could not reach the server. Check your connection and try again.</p>
        <button class="camera-action-btn" id="cameraRetryBtn" style="margin-top:16px">
          <span>Try Again</span>
        </button>
      </div>
    `);
    document.getElementById('cameraRetryBtn').addEventListener('click', showPickScreen);
    return;
  }

  clearTimeout(timeoutId);

  // Attach path metadata to each detection (backend already filters by class)
  const allDetections = scanResults.flatMap((r, i) =>
    r.detections.map(d => ({ ...d, localPath: r.localPath, storagePath: r.storagePath, fileIndex: i }))
  );

  showReviewScreen(allDetections);
}

/* ── Crop helper ── */

function cropDetections(file, detections) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const imgArea = img.naturalWidth * img.naturalHeight;
      const urls = detections.map(d => {
        if (!d.bbox) return null;
        const [x1, y1, x2, y2] = d.bbox;
        const bw = x2 - x1, bh = y2 - y1;
        if (bw <= 0 || bh <= 0) return null;

        const bboxArea = bw * bh;
        const padRatio = (bboxArea / imgArea) < 0.05 ? 1.6 : 1;
        const px = Math.round(bw * padRatio);
        const py = Math.round(bh * padRatio);
        const cx1 = Math.max(0, x1 - px);
        const cy1 = Math.max(0, y1 - py);
        const cx2 = Math.min(img.naturalWidth,  x2 + px);
        const cy2 = Math.min(img.naturalHeight, y2 + py);
        const cw = cx2 - cx1, ch = cy2 - cy1;

        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        canvas.getContext('2d').drawImage(img, cx1, cy1, cw, ch, 0, 0, cw, ch);
        return canvas.toDataURL('image/jpeg', 0.85);
      });
      URL.revokeObjectURL(url);
      resolve(urls);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(detections.map(() => null));
    };
    img.src = url;
  });
}

/* ── Step 3: Review detections ── */

async function showReviewScreen(allDetections) {
  if (allDetections.length === 0) {
    setBody(`
      <div class="camera-scanning">
        <p class="camera-noresult-title">No items detected</p>
        <p class="camera-error" style="text-align:left; line-height:1.5">
          The AI currently recognises furniture, TVs, laptops, lamps, and common
          household objects. It cannot yet detect jewellery, artwork, clothing,
          musical instruments, or most small valuables.
        </p>
        <p class="camera-error" style="text-align:left; margin-top:8px; line-height:1.5">
          For items not detected automatically, you can add them manually from
          the Items tab.
        </p>
        <button class="camera-action-btn" id="cameraRetryBtn" style="margin-top:16px">
          <span>Try Another Photo</span>
        </button>
      </div>
    `);
    document.getElementById('cameraRetryBtn').addEventListener('click', showPickScreen);
    return;
  }

  // Build crop previews per source file
  const cropUrlsByFileIndex = {};
  for (let i = 0; i < currentFiles.length; i++) {
    const detectionsForFile = allDetections.filter(d => d.fileIndex === i);
    if (detectionsForFile.length) {
      cropUrlsByFileIndex[i] = await cropDetections(currentFiles[i], detectionsForFile);
    }
  }

  // Assign crop URLs back to detections
  const fileCounters = {};
  const detectionsWithCrops = allDetections.map(d => {
    const idx = fileCounters[d.fileIndex] ?? 0;
    fileCounters[d.fileIndex] = idx + 1;
    return { ...d, cropUrl: (cropUrlsByFileIndex[d.fileIndex] || [])[idx] || null };
  });

  const roomOptions = ROOMS.map((r, i) => `<option value="${i + 1}">${r}</option>`).join('');

  const globalRoomPicker = `
    <div class="camera-global-room">
      <label class="camera-global-room-label">Room for all</label>
      <select class="camera-select" id="cameraGlobalRoom">${roomOptions}</select>
    </div>
  `;

  const placeholderSvg = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  `;

  const rows = detectionsWithCrops.map(d => `
    <div class="camera-item-row"
      data-class-id="${d.class_id}"
      data-bbox="${JSON.stringify(d.bbox || null)}"
      data-confidence="${d.confidence || 0}"
      data-local-path="${d.localPath || ''}"
      data-storage-path="${d.storagePath || ''}">
      <button class="camera-item-remove" aria-label="Remove item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div class="camera-item-card-inner">
        ${d.cropUrl
          ? `<img class="camera-item-thumb" src="${d.cropUrl}" alt="${d.label}">`
          : `<div class="camera-item-thumb-placeholder">${placeholderSvg}</div>`
        }
        <div class="camera-item-info">
          <input type="text" class="camera-item-name-input" name="label"
            value="${d.label}" aria-label="Item name" autocomplete="off" spellcheck="false">
          <span class="camera-item-conf">${Math.round(d.confidence * 100)}% match</span>
        </div>
      </div>
      <div class="camera-item-fields">
        <div class="camera-field">
          <label>Year</label>
          <input type="number" class="camera-input" name="year"
            placeholder="${new Date().getFullYear()}" min="1900" max="2099">
        </div>
        <div class="camera-field">
          <label>Cost ($)</label>
          <input type="number" class="camera-input" name="cost"
            placeholder="0.00" min="0" step="0.01">
        </div>
        <div class="camera-field">
          <label>Room</label>
          <select class="camera-select" name="room">${roomOptions}</select>
        </div>
      </div>
    </div>
  `).join('');

  setBody(`
    ${globalRoomPicker}
    <div class="camera-review-list">${rows}</div>
    <button class="camera-action-btn" id="cameraStoreBtn">
      <span>Add ${allDetections.length} Item${allDetections.length !== 1 ? 's' : ''} to Inventory</span>
    </button>
  `);

  // Global room picker syncs all item rows
  document.getElementById('cameraGlobalRoom').addEventListener('change', e => {
    document.querySelectorAll('.camera-item-row [name="room"]').forEach(sel => {
      sel.value = e.target.value;
    });
  });

  document.querySelectorAll('.camera-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.camera-item-row').remove();
      const count = document.querySelectorAll('.camera-item-row').length;
      const storeBtn = document.getElementById('cameraStoreBtn');
      if (count === 0) {
        storeBtn.querySelector('span').textContent = 'No Items Selected';
        storeBtn.disabled = true;
      } else {
        storeBtn.querySelector('span').textContent =
          `Add ${count} Item${count !== 1 ? 's' : ''} to Inventory`;
      }
    });
  });

  document.getElementById('cameraStoreBtn').addEventListener('click', doStore);
}

/* ── Step 4: Store ── */

async function doStore() {
  const rows = document.querySelectorAll('.camera-item-row');
  if (!rows.length) { closeModal(); return; }

  // Group items by source image path
  const groups = new Map();
  rows.forEach(row => {
    const key = row.dataset.localPath + '|' + row.dataset.storagePath;
    if (!groups.has(key)) {
      groups.set(key, {
        localPath: row.dataset.localPath,
        storagePath: row.dataset.storagePath,
        items: [],
      });
    }
    const labelInput = row.querySelector('[name="label"]');
    groups.get(key).items.push({
      class_id: parseInt(row.dataset.classId),
      confidence: parseFloat(row.dataset.confidence) || 0,
      label: labelInput ? labelInput.value.trim() || undefined : undefined,
      purchase_year: parseInt(row.querySelector('[name="year"]').value) || null,
      cost: parseFloat(row.querySelector('[name="cost"]').value) || null,
      room_id: parseInt(row.querySelector('[name="room"]').value),
      bbox: JSON.parse(row.dataset.bbox || 'null'),
    });
  });

  setBody(`
    <div class="camera-scanning">
      <div class="camera-spinner"></div>
      <p class="camera-scanning-label">Saving items<span class="camera-scanning-dots">···</span></p>
    </div>
  `);

  const failures = [];

  for (const group of groups.values()) {
    try {
      const body = { items: group.items, path: group.localPath };
      if (group.storagePath) body.original_storage_path = group.storagePath;
      const res = await apiFetch('/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) failures.push(group);
    } catch {
      failures.push(group);
    }
  }

  if (failures.length > 0) {
    setBody(`
      <div class="camera-scanning">
        <p class="camera-error">
          ${failures.length === groups.size
            ? 'Could not save items. Please try again.'
            : `${groups.size - failures.length} of ${groups.size} photos saved. Some items may be missing — please re-scan the failed photos.`
          }
        </p>
        <button class="camera-action-btn" id="cameraRetryBtn" style="margin-top:16px">
          <span>OK</span>
        </button>
      </div>
    `);
    document.getElementById('cameraRetryBtn').addEventListener('click', () => {
      closeModal();
      onRefresh();
    });
    return;
  }

  closeModal();
  onRefresh();
}
