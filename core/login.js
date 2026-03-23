import { supabase } from './supabaseClient.js';

// Inject login stylesheet once on first load
(function injectLoginCSS() {
  const id = 'login-css';
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id   = id;
    link.rel  = 'stylesheet';
    link.href = 'styles/components/login.css';
    document.head.appendChild(link);
  }
})();

export function renderLogin() {
  let isSignUp = false;

  function render() {
    document.body.innerHTML = `
      <div class="login-page">

        <!-- Left / Top: Navy brand panel -->
        <div class="login-panel-brand">
          <div class="login-brand-accent" aria-hidden="true">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="70" height="70" rx="6"
                stroke="#C9A84C" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.6"/>
              <line x1="1" y1="71" x2="71" y2="1"
                stroke="#C9A84C" stroke-width="1.5" opacity="0.4"/>
              <circle cx="36" cy="36" r="8"
                stroke="#C9A84C" stroke-width="1.5" opacity="0.5"/>
            </svg>
          </div>
          <div class="login-brand-content">
            <div class="login-wordmark">Arcera</div>
            <p class="login-tagline">AI-Powered Home Documentation</p>
          </div>
        </div>

        <!-- Right / Bottom: Form panel -->
        <div class="login-panel-form">
          <div class="login-card">
            <div class="login-heading-wrap">
              <h1 class="login-heading">${isSignUp ? 'Create Account' : 'Sign In'}</h1>
              <hr class="login-rule" />
            </div>

            <form id="authForm" novalidate>
              <div class="login-field" style="animation-delay:0.1s">
                <label for="loginEmail">Email Address</label>
                <div class="login-input-wrap">
                  <input
                    type="email"
                    id="loginEmail"
                    name="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div class="login-field" style="animation-delay:0.18s">
                <label for="loginPassword">Password</label>
                <div class="login-input-wrap">
                  <input
                    type="password"
                    id="loginPassword"
                    name="password"
                    autocomplete="${isSignUp ? 'new-password' : 'current-password'}"
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    class="login-password-toggle"
                    id="loginPasswordToggle"
                    aria-label="Toggle password visibility"
                  >show</button>
                </div>
              </div>

              ${!isSignUp ? `
              <div class="login-remember-row">
                <label class="login-checkbox-wrap" for="loginRemember">
                  <input type="checkbox" id="loginRemember" name="remember" />
                  <span class="login-checkbox-box" aria-hidden="true">
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3L3.5 5.5L8 1"
                        stroke="#0D1B2A" stroke-width="1.5"
                        stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </label>
                <label class="login-remember-label" for="loginRemember">
                  Remember me for 30 days
                </label>
              </div>
              ` : ''}

              <div id="loginMsg" class="login-msg" role="alert" aria-live="polite"></div>

              <button
                type="submit"
                class="login-btn-primary"
                id="loginSubmitBtn"
              >
                <span>${isSignUp ? 'Create Account' : 'Sign In'}</span>
              </button>

              <div class="login-links-row">
                ${!isSignUp
                  ? `<button type="button" class="login-link" id="loginForgotBtn">
                       Forgot password?
                     </button>`
                  : `<span></span>`}
                <button type="button" class="login-link" id="loginToggleBtn">
                  ${isSignUp ? 'Sign in instead' : 'Create account'}
                </button>
              </div>

              <div class="login-divider">
                <span class="login-divider-line"></span>
                <span class="login-divider-text">Or continue with</span>
                <span class="login-divider-line"></span>
              </div>

              <div class="login-social-row">
                <button type="button" class="login-btn-social" aria-label="Continue with Google">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.67 3.67 0 01-1.6 2.41v2h2.59c1.52-1.4 2.39-3.46 2.39-5.87z" fill="#4285F4"/>
                    <path d="M8 16c2.16 0 3.97-.71 5.3-1.93l-2.59-2a4.8 4.8 0 01-2.71.75c-2.08 0-3.84-1.4-4.47-3.29H.86v2.07A8 8 0 008 16z" fill="#34A853"/>
                    <path d="M3.53 9.53A4.8 4.8 0 013.28 8c0-.53.09-1.05.25-1.53V4.4H.86A8 8 0 000 8c0 1.29.31 2.51.86 3.6l2.67-2.07z" fill="#FBBC05"/>
                    <path d="M8 3.18c1.17 0 2.22.4 3.05 1.19l2.28-2.28C11.96.8 10.15 0 8 0A8 8 0 00.86 4.4L3.53 6.47C4.16 4.58 5.92 3.18 8 3.18z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button type="button" class="login-btn-social" aria-label="Continue with Facebook">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M16 8A8 8 0 100 8a8 8 0 0016 0z" fill="#1877F2"/>
                    <path d="M11.12 10.22l.37-2.4H9.18V6.27c0-.66.32-1.3 1.36-1.3h1.05V2.94s-.95-.16-1.86-.16c-1.9 0-3.14 1.15-3.14 3.23v1.81H4.49v2.4H6.6V16a8.1 8.1 0 002.58 0v-5.78h1.94z" fill="white"/>
                  </svg>
                  Facebook
                </button>
              </div>
            </form>
          </div>

          <p class="login-footer-note">
            <span class="login-footer-label">Serving</span>
            <span class="login-footer-locations">
              Los Angeles&nbsp;&bull;&nbsp;Brentwood&nbsp;&bull;&nbsp;Malibu&nbsp;&bull;&nbsp;Pacific Palisades&nbsp;&bull;&nbsp;Hancock Park&nbsp;&bull;&nbsp;Calabasas
            </span>
          </p>
        </div>

      </div>
    `;

    // Password toggle
    document.getElementById('loginPasswordToggle').addEventListener('click', () => {
      const input = document.getElementById('loginPassword');
      const btn   = document.getElementById('loginPasswordToggle');
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'hide';
        btn.setAttribute('aria-label', 'Hide password');
      } else {
        input.type = 'password';
        btn.textContent = 'show';
        btn.setAttribute('aria-label', 'Show password');
      }
    });

    // Sign-in / sign-up toggle
    document.getElementById('loginToggleBtn').addEventListener('click', () => {
      isSignUp = !isSignUp;
      render();
    });

    // Forgot password
    if (!isSignUp) {
      document.getElementById('loginForgotBtn').addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        if (!email) { showMsg('Enter your email address first.', 'error'); return; }
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) showMsg(error.message, 'error');
        else showMsg('Password reset email sent. Check your inbox.', 'success');
      });
    }

    // Form submit
    document.getElementById('authForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const btn      = document.getElementById('loginSubmitBtn');
      const label    = isSignUp ? 'Create Account' : 'Sign In';

      btn.disabled = true;
      btn.querySelector('span').textContent = isSignUp ? 'Creating account…' : 'Signing in…';

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) { showMsg(error.message, 'error'); }
        else { showMsg('Account created! Check your email to confirm.', 'success'); }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) showMsg(error.message, 'error');
      }

      btn.disabled = false;
      btn.querySelector('span').textContent = label;
    });
  }

  function showMsg(text, type) {
    const el = document.getElementById('loginMsg');
    el.textContent = text;
    el.className = `login-msg login-msg--${type}`;
    el.style.display = 'block';
  }

  render();
}
