import { supabase } from './supabaseClient.js';

export function renderLogin() {
  document.body.innerHTML = `
    <div class="login-page">
      <h1 class="login-title">Arcera</h1>
      <input id="loginEmail" type="email" placeholder="your@email.com" />
      <button id="loginBtn">Send login link</button>
      <p id="loginMsg"></p>
    </div>
  `;

  document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const { error } = await supabase.auth.signInWithOtp({ email });
    document.getElementById('loginMsg').textContent = error
      ? error.message
      : 'Check your email for the login link!';
  });
}
