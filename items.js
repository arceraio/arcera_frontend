import { render as renderSummary, init as initSummary } from './objects/summary.js';
import { render as renderItemsList } from './objects/items-list.js';
import { apiFetch } from './core/api.js';

let allItems = [];
let roomFilter = 0;
let activeTab = 'home';

function renderMain() {
  const main = document.querySelector('.main-content');
  if (activeTab === 'resources') {
    main.innerHTML = `
      <div class="resources-page">
        <h2 class="resources-title">Resources</h2>
        <p class="resources-subtitle">Helpful links and guides coming soon.</p>
      </div>
    `;
  } else if (activeTab === 'items') {
    main.innerHTML = renderItemsList(allItems, roomFilter);
    bindMainEvents();
  } else {
    main.innerHTML = renderSummary(allItems);
    if (allItems.length > 0) initSummary();
  }
}

export function setView(tab) {
  activeTab = tab;
  renderMain();
}

export function setFilter(filter) {
  roomFilter = filter;
}

export function getItems() {
  return allItems;
}

function updateBulkBar() {
  const grid = document.getElementById('itemsGrid');
  const bar = document.getElementById('itemsBulkBar');
  const countEl = document.getElementById('itemsBulkCount');
  const deleteBtn = document.getElementById('itemsBulkDelete');
  if (!grid || !bar || !countEl || !deleteBtn) return;

  const selected = grid.querySelectorAll('.item-card--selected');
  const n = selected.length;
  countEl.textContent = n === 1 ? '1 selected' : `${n} selected`;
  deleteBtn.disabled = n === 0;
}

function enterSelectMode() {
  const grid = document.getElementById('itemsGrid');
  const bar = document.getElementById('itemsBulkBar');
  const toggle = document.getElementById('itemsSelectToggle');
  if (!grid || !bar || !toggle) return;
  grid.classList.add('items-selecting');
  bar.classList.add('active');
  toggle.textContent = 'Done';
  toggle.classList.add('active');
}

function exitSelectMode() {
  const grid = document.getElementById('itemsGrid');
  const bar = document.getElementById('itemsBulkBar');
  const toggle = document.getElementById('itemsSelectToggle');
  if (!grid || !bar || !toggle) return;
  grid.classList.remove('items-selecting');
  bar.classList.remove('active');
  grid.querySelectorAll('.item-card--selected').forEach(c => c.classList.remove('item-card--selected'));
  toggle.textContent = 'Select';
  toggle.classList.remove('active');
  updateBulkBar();
}

function bindMainEvents() {
  document.querySelectorAll('.room-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const raw = chip.dataset.room;
      roomFilter = raw === 'duplicates' ? 'duplicates'
        : raw === 'needsinfo' ? 'needsinfo'
        : parseInt(raw);
      renderMain();
    });
  });

  document.querySelectorAll('.item-card-delete').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      await apiFetch(`/items/${id}`, { method: 'DELETE' });
      await loadItems();
    });
  });

  // Select toggle
  document.getElementById('itemsSelectToggle')?.addEventListener('click', () => {
    const grid = document.getElementById('itemsGrid');
    if (grid?.classList.contains('items-selecting')) {
      exitSelectMode();
    } else {
      enterSelectMode();
    }
  });

  // Cancel bulk
  document.getElementById('itemsBulkCancel')?.addEventListener('click', exitSelectMode);

  // Bulk delete
  document.getElementById('itemsBulkDelete')?.addEventListener('click', async () => {
    const grid = document.getElementById('itemsGrid');
    if (!grid) return;
    const ids = [...grid.querySelectorAll('.item-card--selected[data-id]')]
      .map(c => c.dataset.id);
    if (!ids.length) return;
    await Promise.all(ids.map(id => apiFetch(`/items/${id}`, { method: 'DELETE' })));
    await loadItems();
  });
}

async function loadItems() {
  try {
    const res = await apiFetch('/items');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[loadItems] API error', res.status, err);
      allItems = [];
    } else {
      const data = await res.json();
      allItems = data.items || [];
    }
  } catch (e) {
    console.error('[loadItems] fetch failed', e);
    allItems = [];
  }
  renderMain();
}

export function init() {
  loadItems();
}

export function getItem(id) {
  return allItems.find(it => it.id === parseInt(id)) || null;
}

export { loadItems };
