import { supabase } from './supabaseClient.js';

const PREFS_KEY = 'arcera_prefs';

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
}
function savePrefs(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }

function initials(user) {
  const name = user.user_metadata?.full_name || '';
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2);
  }
  return (user.email || '?')[0].toUpperCase();
}

function displayName(user) {
  return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
}

function tierLabel(user) {
  const tier = user.user_metadata?.subscription_tier || 'free';
  return { free: 'Free Plan', pro: 'Pro', enterprise: 'Enterprise' }[tier] ?? tier;
}

function tierSlug(user) {
  return user.user_metadata?.subscription_tier || 'free';
}

export function init(session) {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="settings-overlay" id="settingsOverlay"></div>
    <div class="settings-sheet" id="settingsSheet">
      <div class="settings-handle"></div>
      <div class="settings-header">
        <div class="settings-header-inner">
          <div class="settings-header-avatar" id="settingsHeaderAvatar"></div>
          <span class="settings-title">User Settings</span>
        </div>
        <button class="settings-close" id="settingsClose" aria-label="Close settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="settings-body" id="settingsBody"></div>
    </div>
  `);

  document.getElementById('settingsOverlay').addEventListener('click', close);
  document.getElementById('settingsClose').addEventListener('click', close);
}

export function open() {
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;
    renderBody(user);
    document.getElementById('settingsHeaderAvatar').textContent = initials(user);
    document.getElementById('settingsOverlay').classList.add('open');
    document.getElementById('settingsSheet').classList.add('open');
  });
}

function close() {
  document.getElementById('settingsOverlay').classList.remove('open');
  document.getElementById('settingsSheet').classList.remove('open');
}

function renderBody(user) {
  const prefs = loadPrefs();
  const notifications = prefs.notifications !== false;
  const darkMode      = prefs.darkMode === true;
  const language      = prefs.language || 'en';
  const sessionTimeout = prefs.sessionTimeout || '30';

  document.getElementById('settingsBody').innerHTML = `

    <!-- PROFILE -->
    <div class="settings-section">
      <p class="settings-section-label">Profile</p>
      <div class="settings-profile-row">
        <div class="settings-profile-avatar">${initials(user)}</div>
        <div class="settings-profile-info">
          <span class="settings-profile-name">${displayName(user)}</span>
          <span class="settings-profile-email">${user.email}</span>
        </div>
      </div>
      <div class="settings-info-rows">
        <div class="settings-info-row">
          <span class="settings-info-label">Email</span>
          <span class="settings-info-value">${user.email}</span>
        </div>
        <div class="settings-info-row">
          <span class="settings-info-label">Subscription</span>
          <span class="settings-tier-badge settings-tier-badge--${tierSlug(user)}">${tierLabel(user)}</span>
        </div>
      </div>
      <div class="settings-btn-row">
        <button class="settings-btn" id="settingsEditProfile">Edit Profile</button>
        <button class="settings-btn" id="settingsChangeAvatar">Change Avatar</button>
      </div>
    </div>

    <div class="settings-divider"></div>

    <!-- PREFERENCES -->
    <div class="settings-section">
      <p class="settings-section-label">Preferences</p>
      <div class="settings-pref-row">
        <span class="settings-pref-label">Notifications</span>
        <label class="settings-toggle">
          <input type="checkbox" id="prefNotifications" ${notifications ? 'checked' : ''}>
          <span class="settings-toggle-track"></span>
        </label>
      </div>
      <div class="settings-pref-row">
        <span class="settings-pref-label">Dark Mode</span>
        <label class="settings-toggle">
          <input type="checkbox" id="prefDarkMode" ${darkMode ? 'checked' : ''}>
          <span class="settings-toggle-track"></span>
        </label>
      </div>
      <div class="settings-pref-row">
        <span class="settings-pref-label">Language</span>
        <select class="settings-select" id="prefLanguage">
          <option value="en" ${language === 'en' ? 'selected' : ''}>English</option>
          <option value="es" ${language === 'es' ? 'selected' : ''}>Spanish</option>
          <option value="fr" ${language === 'fr' ? 'selected' : ''}>French</option>
        </select>
      </div>
    </div>

    <div class="settings-divider"></div>

    <!-- SECURITY -->
    <div class="settings-section">
      <p class="settings-section-label">Security</p>
      <div class="settings-pref-row">
        <span class="settings-pref-label">Two-Factor Auth</span>
        <label class="settings-toggle">
          <input type="checkbox" id="prefTwoFactor" disabled>
          <span class="settings-toggle-track"></span>
        </label>
      </div>
      <div class="settings-pref-row">
        <span class="settings-pref-label">Session Timeout</span>
        <select class="settings-select" id="prefSessionTimeout">
          <option value="15"  ${sessionTimeout === '15'  ? 'selected' : ''}>15 min</option>
          <option value="30"  ${sessionTimeout === '30'  ? 'selected' : ''}>30 min</option>
          <option value="60"  ${sessionTimeout === '60'  ? 'selected' : ''}>1 hour</option>
          <option value="120" ${sessionTimeout === '120' ? 'selected' : ''}>2 hours</option>
        </select>
      </div>
      <div class="settings-btn-row">
        <button class="settings-btn" id="settingsUpdatePassword">Update Password</button>
        <button class="settings-btn" id="settingsManageDevices">Manage Devices</button>
      </div>
    </div>

    <div class="settings-divider"></div>

    <!-- ACTIONS -->
    <div class="settings-footer">
      <button class="settings-save-btn" id="settingsSave">Save Changes</button>
      <button class="settings-cancel-btn" id="settingsCancel">Cancel</button>
    </div>

    <div id="settingsMsg" class="settings-msg" style="display:none"></div>
  `;

  document.getElementById('settingsCancel').addEventListener('click', close);

  document.getElementById('settingsSave').addEventListener('click', () => {
    savePrefs({
      notifications: document.getElementById('prefNotifications').checked,
      darkMode:       document.getElementById('prefDarkMode').checked,
      language:       document.getElementById('prefLanguage').value,
      sessionTimeout: document.getElementById('prefSessionTimeout').value,
    });
    showMsg('Settings saved.', 'success');
    setTimeout(close, 900);
  });

  document.getElementById('settingsUpdatePassword').addEventListener('click', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    showMsg(error ? error.message : 'Password reset email sent.', error ? 'error' : 'success');
  });

  document.getElementById('settingsEditProfile').addEventListener('click', () => {
    showMsg('Profile editing coming soon.', 'info');
  });

  document.getElementById('settingsChangeAvatar').addEventListener('click', () => {
    showMsg('Avatar upload coming soon.', 'info');
  });

  document.getElementById('settingsManageDevices').addEventListener('click', () => {
    showMsg('Device management coming soon.', 'info');
  });
}

function showMsg(text, type) {
  const el = document.getElementById('settingsMsg');
  el.textContent = text;
  el.className = `settings-msg settings-msg--${type}`;
  el.style.display = 'block';
}
