const ROOMS = [
  "Living Room", "Bedroom", "Kitchen", "Bathroom",
  "Dining Room", "Office", "Garage", "Other",
];

// COCO class IDs relevant to home inventory (furniture, appliances, electronics, kitchenware)
const HOUSEHOLD_CLASS_IDS = new Set([
  39,  // bottle
  40,  // wine glass
  41,  // cup
  42,  // fork
  43,  // knife
  44,  // spoon
  45,  // bowl
  56,  // chair
  57,  // couch
  58,  // potted plant
  59,  // bed
  60,  // dining table
  61,  // toilet
  62,  // tv
  63,  // laptop
  64,  // mouse
  65,  // remote
  66,  // keyboard
  67,  // cell phone
  68,  // microwave
  69,  // oven
  70,  // toaster
  71,  // sink
  72,  // refrigerator
  73,  // book
  74,  // clock
  75,  // vase
  76,  // scissors
  77,  // teddy bear
  78,  // hair drier
  79,  // toothbrush
]);

import { apiFetch } from './api.js';

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
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <span class="section-eyebrow">New Scan</span>
          <span class="camera-sheet-title">Scan Items</span>
        </div>
        <button class="camera-sheet-close" id="cameraClose" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
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
      <span class="camera-pick-sub">JPG, PNG, WEBP · one or more photos</span>
      <input type="file" id="cameraFileInput" accept="image/*" multiple style="display:none">
    </label>
    <button class="camera-action-btn" id="cameraScanBtn" disabled><span>Scan for Items</span></button>
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

async function doScan() {
  if (!currentFiles.length) return;

  const plural = currentFiles.length > 1;
  setBody(`
    <div class="camera-scanning">
      <div class="camera-spinner"></div>
      <p>Scanning your photo${plural ? 's' : ''}…</p>
    </div>
  `);

  let scanResults = [];

  try {
    if (currentFiles.length === 1) {
      // Single image flow
      const form = new FormData();
      form.append('image', currentFiles[0]);
      await apiFetch('/upload', { method: 'POST', body: form });
      const res = await apiFetch('/detect', { method: 'POST' });
      const data = await res.json();
      scanResults = [{
        localPath: data.path,
        storagePath: null,
        detections: data.detections || [],
      }];
    } else {
      // Multi-image flow
      const form = new FormData();
      currentFiles.forEach(f => form.append('images', f));
      await apiFetch('/multi-upload', { method: 'POST', body: form });
      const res = await apiFetch('/multiscan', { method: 'POST' });
      const data = await res.json();
      scanResults = (data.results || []).map(r => ({
        localPath: r.local_path,
        storagePath: r.storage_path,
        detections: r.detections || [],
      }));
    }
  } catch {
    setBody(`
      <div class="camera-scanning">
        <p class="camera-error">Could not reach the server. Is it running?</p>
        <button class="camera-action-btn" id="cameraRetryBtn" style="margin-top:16px"><span>Try Again</span></button>
      </div>
    `);
    document.getElementById('cameraRetryBtn').addEventListener('click', showPickScreen);
    return;
  }

  // Filter to household items and attach path metadata to each detection
  const allDetections = scanResults.flatMap((r, i) =>
    r.detections
      .filter(d => HOUSEHOLD_CLASS_IDS.has(d.class_id))
      .map(d => ({ ...d, localPath: r.localPath, storagePath: r.storagePath, fileIndex: i }))
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
        <p class="camera-error">Try a clearer photo with visible objects in frame.</p>
        <button class="camera-action-btn" id="cameraRetryBtn" style="margin-top:16px"><span>Try Again</span></button>
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
      <label class="camera-global-room-label">Room for all items</label>
      <select class="camera-select" id="cameraGlobalRoom">${roomOptions}</select>
    </div>
  `;

  const rows = detectionsWithCrops.map(d => `
    <div class="camera-item-row"
      data-class-id="${d.class_id}"
      data-bbox="${JSON.stringify(d.bbox || null)}"
      data-local-path="${d.localPath || ''}"
      data-storage-path="${d.storagePath || ''}">
      ${d.cropUrl ? `<img class="camera-item-thumb" src="${d.cropUrl}" alt="${d.label}">` : ''}
      <div class="camera-item-header">
        <div>
          <span class="camera-item-name">${d.label}</span>
          <span class="camera-item-conf">${Math.round(d.confidence * 100)}% match</span>
        </div>
        <button class="camera-item-remove" aria-label="Remove item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
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
        <div class="camera-field camera-field-room">
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
        storeBtn.querySelector('span').textContent = `Add ${count} Item${count !== 1 ? 's' : ''} to Inventory`;
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
    groups.get(key).items.push({
      class_id: parseInt(row.dataset.classId),
      purchase_year: parseInt(row.querySelector('[name="year"]').value) || null,
      cost: parseFloat(row.querySelector('[name="cost"]').value) || null,
      room_id: parseInt(row.querySelector('[name="room"]').value),
      bbox: JSON.parse(row.dataset.bbox || 'null'),
    });
  });

  setBody(`
    <div class="camera-scanning">
      <div class="camera-spinner"></div>
      <p>Saving items…</p>
    </div>
  `);

  try {
    for (const group of groups.values()) {
      const body = { items: group.items, path: group.localPath };
      if (group.storagePath) body.original_storage_path = group.storagePath;
      await apiFetch('/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
  } catch {
    // silent fail — items may have partially saved; refresh will show what landed
  }

  closeModal();
  onRefresh();
}
