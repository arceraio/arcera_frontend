import { supabase } from './supabaseClient.js';

export function renderLogin() {
  let isSignUp = false;

  function render() {
    document.body.innerHTML = `
      <div class="login-page">
        <h1 class="login-title">Arcera</h1>
        <form id="authForm">
          <input id="loginEmail" type="email" placeholder="your@email.com" required />
          <input id="loginPassword" type="password" placeholder="password" required />
          <button type="submit">${isSignUp ? 'Sign Up' : 'Sign In'}</button>
        </form>
        <p id="loginMsg"></p>
        <p class="login-toggle">
          ${isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <a id="toggleAuth" href="#">${isSignUp ? 'Sign In' : 'Sign Up'}</a>
        </p>
      </div>
    `;

    document.getElementById('toggleAuth').addEventListener('click', (e) => {
      e.preventDefault();
      isSignUp = !isSignUp;
      render();
    });

    document.getElementById('authForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const msg = document.getElementById('loginMsg');

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        msg.textContent = error
          ? error.message
          : 'Account created! Check your email to confirm.';
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) msg.textContent = error.message;
      }
    });
  }

  render();
}
