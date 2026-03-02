const WIXAUTH_URL = import.meta.env.VITE_WIX_AUTH_URL || '';
const USER_KEY = 'arcera_user';

// Columns we expect from the Wix redirect
const PARAM_KEYS = ['member_id', 'email', 'name', 'tier', 'access_token'];

// On every page load: if Wix redirected here with user info, capture it
const _qs = new URLSearchParams(window.location.search);
if (_qs.has('member_id')) {
  const user = {};
  PARAM_KEYS.forEach(k => { user[k] = _qs.get(k) ?? ''; });
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Clean the sensitive params out of the URL
  PARAM_KEYS.forEach(k => _qs.delete(k));
  window.history.replaceState(
    {}, '',
    window.location.pathname + (_qs.toString() ? '?' + _qs : '')
  );
}

/** Returns the stored user object, or null if not logged in. */
export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

/** Read a single column from the stored user info. */
export function get(column) {
  return getUser()?.[column] ?? null;
}

/**
 * Headers attached to every Flask API call.
 * Flask verifies the JWT (access_token) against Wix's public JWKS key —
 * no shared secret, just asymmetric signature verification.
 */
export function authHeaders() {
  const user = getUser();
  if (!user) return {};
  return {
    'Authorization': `Bearer ${user.access_token}`,
    'X-Member-ID':   user.member_id,
  };
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

/** Redirects to the Wix auth page if no session exists. */
export function requireAuth() {
  if (getUser()) return;
  const redirect = encodeURIComponent(window.location.href);
  window.location.href = WIXAUTH_URL
    ? `${WIXAUTH_URL}?redirect=${redirect}`
    : '/login-required';
}
