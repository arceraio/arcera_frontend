import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Shared cookie storage — readable/writable across all *.arcera.io subdomains.
// Falls back to host-scoped cookies on localhost for local dev.
const _domain = window.location.hostname.endsWith('.arcera.io') ? '; domain=.arcera.io' : '';

const cookieStorage = {
  getItem(key) {
    const prefix = key + '=';
    for (const c of document.cookie.split('; ')) {
      if (c.startsWith(prefix)) return decodeURIComponent(c.slice(prefix.length));
    }
    return null;
  },
  setItem(key, value) {
    document.cookie = `${key}=${encodeURIComponent(value)}${_domain}; path=/; max-age=31536000; SameSite=Lax; Secure`;
  },
  removeItem(key) {
    document.cookie = `${key}=${_domain}; path=/; max-age=0; SameSite=Lax`;
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: cookieStorage, autoRefreshToken: true, persistSession: true },
});
