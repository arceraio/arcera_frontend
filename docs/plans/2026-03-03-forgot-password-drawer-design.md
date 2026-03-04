# Design: Drawer Identity + Forgot Password Flow

Date: 2026-03-03

## Changes

### 1. Drawer: User Identity
- Pass `session.user` into `initDrawer(openCamera, navigate, user)` from `app.js`
- In `init()`, populate `.drawer-user-name` and `.drawer-user-email` from user metadata
- Avatar: replace generic SVG with initials circle (`var(--color-gold)` tint, white border)

### 2. Drawer: Active State Density
- Add `border-radius: 10px`, `margin: 0 12px`, `padding: 12px 16px` to `.drawer-menu li.active`
- Adjust default item padding so unselected items align

### 3. Forgot Password — 3 States in `login.js`
State variable: `view = 'signin' | 'signup' | 'forgot' | 'forgot-sent' | 'reset'`

- `forgot` — Enter email, Send Reset Link button, step dots ● ○ ○, spam callout
- `forgot-sent` — Confirmation screen, shows email sent to, Back to Login, step dots ● ● ○
- `reset` — New password + confirm inputs, Set New Password, step dots ● ● ●

`app.js` handles `PASSWORD_RECOVERY` event by calling new `renderResetPassword()` export from `login.js`.

## Approach
Approach A: All forgot-password states live inside `login.js` as a view state machine. No new files.
