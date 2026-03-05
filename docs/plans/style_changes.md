  Design Consistency Audit: App → Landing                                       
                                                                                
  What the landing page does distinctively                                    

  Before the gap list — a few things the landing does that define the brand:

  1. Sharp-cornered buttons with a gold "wipe" slide on hover — every CTA uses
  ::before { transform: translateX(-101%) } → slide gold across. Zero
  border-radius. Editorial luxury, not SaaS.

  2. DM Mono for all small labels — eyebrows, section steps, nav sub-bar, footer
   labels. Weight 300, letter-spacing: 0.3em. Creates a refined, architectural
  feel.

  3. Gold-tinted details throughout — the nav border-bottom: 1px solid
  rgba(201,168,76,0.15), subtle grid textures, corner ornaments on cards.
  
  4. Font tokens formalized — --font-serif, --font-sans, --font-mono live in
  :root so nothing is hardcoded.

  ---
  The Gaps (by priority)

  HIGH — Most visible, breaks brand tone

  1. header-btn-login — rounded and no wipe
  /* Current — softened SaaS look */
  .header-btn-login {
    border-radius: 8px;           /* ← rounds it */
    background: var(--color-navy);
  }
  .header-btn-login:hover { background: #1a2f45; } /* ← just a tint, no wipe */
  Landing's nav CTA: zero radius, gold wipe slide on hover. The app's login
  button is the first thing unauthenticated users see and it should behave
  identically to the landing's "Sign In" / "Schedule a Call" buttons. Fix:
  remove border-radius, add ::before wipe.

  2. .camera-action-btn — rounded and no wipe
  /* Current */
  border-radius: var(--radius);  /* 12px — rounded */
  background: var(--color-navy);
  /* hover: just background: #1a2f45 */
  This is the primary action button in the scan flow — the most-used button in
  the whole app. It should feel like a brand CTA, not a generic form button.
  Fix: remove radius, add gold wipe.

  3. .item-sheet-save — no wipe hover
  .item-sheet-save:hover { opacity: 0.88; }  /* ← opacity fade, not wipe */
  Same issue — the save button should be on-brand. It currently has no
  border-radius (✅ sharp already) but the hover is wrong. Fix: add gold wipe.

  ---
  MEDIUM — Typographic refinement

  4. Missing CSS font tokens in :root

  Landing has in :root:
  --font-serif: 'Cormorant Garamond', serif;
  --font-sans:  'DM Sans', sans-serif;
  --font-mono:  'DM Mono', monospace;
  --gold-hover: #dbb95e;
  App hardcodes 'Cormorant Garamond', serif in ~12 places across main.css.
  Should add these tokens to :root and do a find-replace sweep. The missing
  --gold-hover token means hover shades are currently #1a2f45 (hardcoded navy
  lightening) instead of using gold.

  5. .drawer-section-title — DM Sans 700 vs. DM Mono 300

  /* Current */
  .drawer-section-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.62rem;
    font-weight: 700;       /* ← heavy */
    letter-spacing: 0.7px;  /* ← minimal */
  }
  Landing's equivalent small labels (.footer-col-label, .how-step, nav sub-bar)
  all use DM Mono weight 300, wide letter-spacing (0.2–0.3em). The drawer
  section titles ("NAVIGATION", "SETTINGS") should match. Fix: DM Mono, weight
  300, letter-spacing ~0.2em.

  6. Item sheet field labels — DM Sans vs. DM Mono

  /* Current item-sheet-field label */
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.4px;
  Landing's form labels (.form-header-label, .cal-label) use DM Mono, weight
  400, letter-spacing: 0.22–0.24em. These are the same class of label — small
  uppercase field identifiers. The app's version uses minimal letter-spacing and
   DM Sans. Fix: switch to DM Mono, weight 300, letter-spacing: 0.22em.

  7. Header border-bottom — plain divider vs. gold-tint

  /* Current */
  border-bottom: 1px solid var(--color-divider);  /* #E8E4DF — warm neutral */

  /* Landing nav */
  border-bottom: 1px solid rgba(201,168,76,0.15); /* subtle gold */
  Barely perceptible, but every page load the header is the first thing
  rendered. The gold tint ties it back to the brand. One-line change.

  8. .camera-pick-label — DM Sans 700 vs. DM Mono 300

  /* Current */
  font-weight: 700;
  letter-spacing: 0.08em;
  The upload area label ("Tap to select a photo") should feel editorial like
  landing's step labels. Fix: DM Mono, weight 300, letter-spacing: 0.2em.

  ---
  LOWER — Polish and completeness

  9. Add .section-eyebrow utility class to app CSS

  The landing's most distinctive typographic motif — the small gold DM Mono
  eyebrow above every heading:
  .section-eyebrow {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 300;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--color-gold);
  }
  The app has nowhere to hook this in today. Could be applied to:
  - Camera sheet: "New Scan" above the sheet title
  - Hero banner subtitle: "Your Inventory" above the banner heading (when items
  exist)
  - Summary section: small "Overview" label above the stats grid

  10. .summary-stat-label — DM Sans 500 vs. DM Mono

  /* Current */
  font-family: DM Sans, weight 500, letter-spacing: 0.7px
  The stat labels ("ITEMS", "VALUE", "ROOMS") are exactly the kind of small mono
   uppercase label the landing page uses DM Mono for. The stat value already
  correctly uses DM Mono. Making the label match would unify the stat card's
  full type hierarchy.

  11. Login wordmark size: 13px → 16px

  Landing's login-wordmark is 16px. App's is 13px. Minor, but the landing
  version has more presence. One-line change.

  12. --footer-bg token missing

  Landing has --footer-bg: #070f18 (deeper than navy, near-black). The app
  doesn't define this. Currently the drawer (which is navy) and any dark
  surfaces all use var(--color-navy). Adding --footer-bg and using it on deep
  surfaces would give better depth contrast — the camera sheet overlay, for
  instance.

  ---
  Summary Table

  ┌───────────────────────┬──────────────────────┬─────────────────────────┐
  │       Component       │        Issue         │         Change          │
  ├───────────────────────┼──────────────────────┼─────────────────────────┤
  │ header-btn-login      │ Rounded (8px) + no   │ Remove radius, add gold │
  │                       │ wipe hover           │  wipe                   │
  ├───────────────────────┼──────────────────────┼─────────────────────────┤
  │ camera-action-btn     │ Rounded (12px) + no  │ Remove radius, add gold │
  │                       │ wipe hover           │  wipe                   │
  ├───────────────────────┼──────────────────────┼─────────────────────────┤
  │ item-sheet-save       │ Opacity fade hover   │ Replace with gold wipe  │
  ├───────────────────────┼──────────────────────┼─────────────────────────┤
  │ :root tokens          │ Missing --font-*,    │ Add 4 tokens, sweep     │
  │                       │ --gold-hover         │ hardcoded values        │
  ├───────────────────────┼──────────────────────┼─────────────────────────┤
  │ .drawer-section-title │ DM Sans 700, tight   │ DM Mono 300, wide       │
  │                       │ spacing              │ spacing                 │
  ├───────────────────────┼──────────────────────┼─────────────────────────┤
  │ Item sheet field      │ DM Sans 500          │ DM Mono 300, wider      │
  │ labels                │                      │ tracking                │
  ├───────────────────────┼──────────────────────┼─────────────────────────┤
  │ Header border-bottom  │ Warm divider         │ Gold-tinted rgba(gold,  │
  │                       │                      │ 0.15)                   │
  ├───────────────────────┼──────────────────────┼─────────────────────────┤
  │ .camera-pick-label    │ DM Sans 700          │ DM Mono 300             │
  ├───────────────────────┼──────────────────────┼─────────────────────────┤
  │ .section-eyebrow      │ Doesn't exist in app │ Add utility class,      │
  │                       │                      │ apply to 3 spots        │
  ├───────────────────────┼──────────────────────┼─────────────────────────┤
  │ .summary-stat-label   │ DM Sans              │ DM Mono (matches stat   │
  │                       │                      │ value)                  │
  ├───────────────────────┼──────────────────────┼─────────────────────────┤
  │ Login wordmark        │ 13px                 │ 16px                    │
  └───────────────────────┴──────────────────────┴─────────────────────────┘

  ---
  The three highest-impact changes by visual effect are (in order): the button
  wipe-transitions on camera + item sheet + header login, removing border-radius
   from those same buttons, and switching small label typography to DM Mono.
  Those three alone would make the app feel cohesively on-brand with the
  landing. Want me to proceed with any or all of these?

