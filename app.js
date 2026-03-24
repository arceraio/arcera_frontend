import { render as renderDrawer, init as initDrawer } from './core/drawer.js';
import { render as renderHeader } from './core/header.js';
import { render as renderFooter, setActiveTab, updateItemsBadge } from './core/footer.js';
import { loadItems, setView, getItem, setFilter, getItems } from './items.js';
import { init as initCamera, open as openCamera } from './core/camera.js';
import { init as initItemSheet, open as openItemSheet } from './core/item-sheet.js';
import { init as initSettings, open as openSettings } from './core/settings.js';
import { supabase } from './core/supabaseClient.js';
import { renderLogin } from './core/login.js';

let _appReady = false;

supabase.auth.onAuthStateChange((_event, session) => {
  document.getElementById('app-loading')?.remove();
  if (!session) { _appReady = false; renderLogin(); return; }
  if (_appReady) return;  // ignore TOKEN_REFRESHED and other repeat events
  _appReady = true;

  document.body.innerHTML = `
    ${renderDrawer()}
    <div class="app-shell-main">
      ${renderHeader()}
      <main class="main-content"></main>
      ${renderFooter()}
    </div>
  `;

  async function refresh() {
    await loadItems();
    updateItemsBadge(getItems().length);
  }

  function navigate(tab) {
    setView(tab);
    setActiveTab(tab);
    document.querySelectorAll('.drawer-menu [data-nav]').forEach(el => {
      const active = tab === 'home' ? el.dataset.nav === 'dashboard' : el.dataset.nav === tab;
      el.classList.toggle('active', active);
    });
  }

  initDrawer(openCamera, navigate, session.user, openSettings);
  initCamera(refresh);
  initItemSheet(refresh);
  initSettings();

  if (window.matchMedia('(max-width: 819px)').matches) {
    const hdr = document.querySelector('.header');
    const main = document.querySelector('.main-content');
    const existingPt = parseInt(getComputedStyle(main).paddingTop, 10);
    main.style.paddingTop = (hdr.offsetHeight + existingPt) + 'px';
  }

  refresh();

  document.getElementById('logoBtn').addEventListener('click', () => navigate('home'));
  document.getElementById('headerAddBtn').addEventListener('click', openCamera);
  document.getElementById('headerPersonBtn').addEventListener('click', openSettings);

  document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate(btn.dataset.tab);
    });
  });

  document.body.addEventListener('click', e => {
    const btn = e.target.closest('[data-navigate]');
    if (!btn) return;
    const filter = btn.dataset.filter;
    if (filter !== undefined) setFilter(filter);
    navigate(btn.dataset.navigate);
  });

  document.body.addEventListener('click', e => {
    if (e.target.closest('.item-card-delete')) return;
    const card = e.target.closest('.item-card[data-id]');
    if (!card) return;
    const grid = document.getElementById('itemsGrid');
    if (grid?.classList.contains('items-selecting')) {
      card.classList.toggle('item-card--selected');
      // update bulk bar count
      const countEl = document.getElementById('itemsBulkCount');
      const deleteBtn = document.getElementById('itemsBulkDelete');
      if (countEl && deleteBtn) {
        const n = grid.querySelectorAll('.item-card--selected').length;
        countEl.textContent = n === 1 ? '1 selected' : `${n} selected`;
        deleteBtn.disabled = n === 0;
      }
      return;
    }
    const item = getItem(card.dataset.id);
    if (item) openItemSheet(item);
  });

  // Autohide header + bottom nav on scroll down (mobile only)
  {
    const header = document.querySelector('.header');
    const bottomNav = document.querySelector('.bottom-nav');
    let lastY = 0;
    const DELTA = 6;     // ignore micro-jitter
    const OFFSET = 60;   // don't hide until scrolled past 60px

    const scrollEl = document.querySelector('.app-shell-main');
    if (scrollEl) {
      scrollEl.addEventListener('scroll', () => {
        if (!window.matchMedia('(max-width: 819px)').matches) return;
        const y = scrollEl.scrollTop;
        if (Math.abs(y - lastY) < DELTA) return;
        const hiding = y > lastY && y > OFFSET;
        header.classList.toggle('header--hidden', hiding);
        bottomNav.classList.toggle('bottom-nav--hidden', hiding);
        lastY = y;
      }, { passive: true });
    }
  }
});
