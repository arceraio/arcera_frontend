import { supabase } from './supabaseClient.js';

export const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiFetch(path, options = {}) {
  const token = await getToken();
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('[apiFetch] No token — request will be unauthenticated', path);
  }
  return fetch(`${API}${path}`, { ...options, headers });
}
