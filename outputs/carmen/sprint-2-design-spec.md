# Sprint 2 Design Specification — High Value Improvements

**Author:** Carmen (Arcera Design Agent)  
**Date:** March 26, 2026  
**Project:** `/home/kevin/Apps/Arcera/arcera_frontend/`  
**Sprint:** 2 of 3 (Discovery + Export Recovery + Performance)  
**Based on:** Factory Analysis (`outputs/carmen/factory-analysis-improvements.md`)

---

## Executive Summary

**Sprint 2 Scope:** 4 high-value improvements  
**Total Effort:** ~21 hours  
**Expected Impact:** Improved discoverability, export recovery, perceived performance

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Search bar (Items view) | 5h | 8 | **8** |
| Filters (Needs Value/Photo) | 4h | 8 | **8** |
| Export history | 5h | 7 | **7** |
| Loading skeleton | 4h | 7 | **7** |
| Bulk bar enhancements | 2h | 6 | **6** |
| Touch target audit | 3h | 7 | **7** |

---

## Feature 1: Search Bar (Items View)

### User Story
> "As a user with 50+ items, I want to search for specific items by name so I can find what I'm looking for quickly without scrolling."

### Current State
- Filter chips exist (All, Duplicates, Needs Info, Rooms)
- No text search functionality
- Items sorted by date (newest first)

### Proposed Design

#### UX Flow
```
User taps Items tab
  → Items view loads with filter chips + search bar
  → User types "wine"
  → Results filter in real-time (no "Search" button)
  → Results show "5 items match 'wine'"
  → User clears search → all items visible again
```

#### UI Placement
```
┌─────────────────────────────────────────────────────────────┐
│  [≡] Logo                                    [+] [Profile]  │ ← Header
├─────────────────────────────────────────────────────────────┤
│  [🔍 Search items...]                           [Filter ▾]  │ ← Search bar (NEW)
├─────────────────────────────────────────────────────────────┤
│  [All 247] [⚠ Duplicates 12] [Needs Info 34] [Kitchen 45]  │ ← Filter chips
├─────────────────────────────────────────────────────────────┤
│  [Item Card] [Item Card] [Item Card] [Item Card]           │
│  [Item Card] [Item Card] [Item Card] [Item Card]           │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

#### Search Behavior

| State | UI | Behavior |
|-------|-----|----------|
| **Empty** | `🔍 Search items...` | Placeholder, tap to focus |
| **Typing** | `🔍 wine` | Real-time filtering (debounced 200ms) |
| **Results** | `🔍 wine` `5 items match` | Shows matching items |
| **No Results** | `🔍 xyz` `No items match` | Empty state with suggestions |
| **Clear** | `✕` button appears | Tap to clear search |

#### Search Algorithm

**Searchable Fields:**
- `label` (item name) — Primary, weight: 3x
- `room` (room name) — Secondary, weight: 1x
- `notes` (if exists) — Tertiary, weight: 1x

**Matching:**
- Case-insensitive
- Partial match (substring)
- Prioritize starts-with matches

**Example:**
```
Search: "wine"
Matches:
  - "Wine Bottle - Cabernet 2019" ✓ (label, starts-with)
  - "Wine Rack" ✓ (label, starts-with)
  - "Kitchen Wine Shelf" ✓ (label, contains)
  - "Kitchen" ✓ (room, contains)
```

#### Empty State (No Results)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              🔍 (large, muted icon)                         │
│                                                             │
│         No items match "xyz"                                │
│                                                             │
│    Try a different search term, or                          │
│    browse all items by clearing the search.                 │
│                                                             │
│         [  Clear Search  ]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Mobile Considerations
- Search bar collapses to icon-only on very small screens (<375px)
- Keyboard type: `type="search"` for mobile keyboard optimization
- Auto-focus on mount (optional, may be annoying)
- Scroll to top when search starts

#### Accessibility
- `aria-label="Search items"` on input
- `aria-live="polite"` on results count
- `aria-describedby` linking to search tips
- Escape key clears search
- Focus visible on search input

---

## Feature 2: Enhanced Filters (Needs Value / Needs Photo)

### User Story
> "As a user trying to complete my inventory, I want to filter for items that need values or photos so I can bulk-complete them efficiently."

### Current State
- "Needs Info" filter exists (checks `cost == null || purchase_year == null`)
- No "Needs Photo" filter
- No "Needs Room" filter
- Filter chips show counts

### Proposed Enhancements

#### New Filter Chips

**Add to existing filter row:**
```
[All 247] [⚠ Duplicates 12] [Needs Info 34] [Needs Photo 28] [Needs Value 19] [Kitchen 45] [Bedroom 38] ...
```

#### Filter Definitions

| Filter | Criteria | Icon | Color |
|--------|----------|------|-------|
| **Needs Info** | `cost == null \|\| purchase_year == null` | ℹ️ | Blue |
| **Needs Photo** | `crop_url == null` | 📷 | Amber |
| **Needs Value** | `cost == null` | 💰 | Gold |
| **Needs Room** | `room_id == null` | 🏠 | Gray |

#### Filter Chip Design

**Active State:**
```
┌─────────────────────────────────┐
│  📷 Needs Photo [28]            │ ← Navy background, white text
└─────────────────────────────────┘
```

**Inactive State:**
```
┌─────────────────────────────────┐
│  📷 Needs Photo [28]            │ ← White background, navy border
└─────────────────────────────────┘
```

**Warning State (Duplicates):**
```
┌─────────────────────────────────┐
│  ⚠️ Duplicates [12]             │ ← Amber background, dark text
└─────────────────────────────────┘
```

#### Filter Logic

```javascript
const filterCriteria = {
  'duplicates': it => it.duplicate_of != null,
  'needsinfo': it => it.cost == null || it.purchase_year == null,
  'needsphoto': it => it.crop_url == null,
  'needsvalue': it => it.cost == null,
  'needsroom': it => it.room_id == null,
  '1-8': it => it.room_id === parseInt(filter),  // Room filters
};
```

#### Bulk Action Integration

**When filters active + bulk select enabled:**
```
"Select All 28 items that need photos"
  → User taps "Select All"
  → All 28 items selected
  → Bulk bar shows "28 selected"
  → User can bulk-delete or bulk-edit (future)
```

#### Empty State (Filtered)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              📷 (large, muted icon)                         │
│                                                             │
│         No items need photos                                │
│                                                             │
│    Great job! All your items have photos.                   │
│    Keep scanning to add more items.                         │
│                                                             │
│         [  Clear Filter  ]    [  Scan More  ]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Mobile Considerations
- Filter chips scroll horizontally (existing behavior)
- New chips maintain same height (32px)
- Counts use tabular numbers for alignment
- Active chip always visible when tapped (scroll into view)

#### Accessibility
- Filter chips are buttons with `aria-pressed`
- Counts announced by screen reader ("Needs Photo, 28 items")
- Focus visible on active chip
- Keyboard navigation (Tab between chips)

---

## Feature 3: Export History

### User Story
> "As a user who exported last month, I want to re-download my export so I can send it to my adjuster without re-exporting."

### Current State
- Export generates CSV download
- No history tracking
- No re-download capability
- Filename: `arcera-inventory-YYYY-MM-DD.csv`

### Backend Requirements (New API Endpoints)

#### GET /exports
**Response:**
```json
{
  "exports": [
    {
      "id": "exp_abc123",
      "created_at": "2026-03-26T20:30:00Z",
      "item_count": 247,
      "total_value": 47000,
      "format": "csv",
      "file_size_bytes": 52480,
      "download_url": "/exports/exp_abc123/download"
    },
    {
      "id": "exp_def456",
      "created_at": "2026-02-15T14:20:00Z",
      "item_count": 180,
      "total_value": 35000,
      "format": "csv",
      "file_size_bytes": 38912,
      "download_url": "/exports/exp_def456/download"
    }
  ]
}
```

#### GET /exports/:id/download
**Response:** CSV file download (same as current `/export`)

#### Backend Storage
**Option A: Store exports temporarily (Recommended)**
- Keep last 10 exports per user
- Auto-delete after 90 days
- Store in S3 or similar

**Option B: Regenerate on demand**
- Store metadata only
- Regenerate CSV when user downloads
- More compute, less storage

**Recommendation:** Option A for MVP (faster downloads, simpler)

### Frontend UI

#### Export History Modal
```
┌─────────────────────────────────────────────────────────────┐
│  Export History                                      [✕]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Your past exports are stored for 90 days.                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  📄  March 26, 2026                                   │ │
│  │      247 items · $47,000 · 51 KB                      │ │
│  │      [  Download  ]                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  📄  February 15, 2026                                │ │
│  │      180 items · $35,000 · 38 KB                      │ │
│  │      [  Download  ]                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  📄  January 3, 2026                                  │ │
│  │      120 items · $22,000 · 26 KB                      │ │
│  │      [  Download  ]                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Access Points

**Option A: Settings Page (Recommended)**
- Add "Export History" link in settings
- Opens modal with full history

**Option B: Home Dashboard**
- Add "View Export History" link below export card
- Only shown if user has exported before

**Option C: Both**
- Settings for full history
- Home dashboard for quick access

**Recommendation:** Option C (both access points)

#### Empty State (No Exports)
```
┌─────────────────────────────────────────────────────────────┐
│  Export History                                      [✕]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              📄 (large, muted icon)                         │
│                                                             │
│         No exports yet                                      │
│                                                             │
│    When you export your inventory, your past                │
│    exports will appear here for 90 days.                    │
│                                                             │
│         [  Go to Dashboard  ]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Download Behavior
- Same as current export (blob download)
- Filename: `arcera-inventory-YYYY-MM-DD.csv`
- Track download in analytics (which export, when)

#### Mobile Considerations
- Modal becomes bottom sheet on mobile
- Export cards stack vertically
- Download button full-width (44px+ touch target)

#### Accessibility
- Modal has `role="dialog"`, `aria-modal="true"`
- Each export card is a region with `aria-label`
- Download buttons have descriptive labels ("Download March 26, 2026 export")
- Keyboard navigation (Tab through downloads, Escape to close)
- Focus trap within modal

---

## Feature 4: Loading Skeleton

### User Story
> "As a user scanning items, I want to see a loading state instead of a blank screen so I know the app is working."

### Current State
- No loading state
- Items view shows empty state briefly, then content pops in
- Perceived performance issue

### Proposed Loading Skeleton

#### Skeleton Design

**Home Dashboard Skeleton:**
```
┌─────────────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← Hero (shimmer)
│  ░░░░░░░░░░░░  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ ░░░░░░░░ │  │ ░░░░░░░░ │  │ ░░░░░░░░ │                  │ ← Stat cards
│  │ ░░░░░░░░ │  │ ░░░░░░░░ │  │ ░░░░░░░░ │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐    │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │ ← Export card
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │    │
│  └────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  ░░░░░░░░░░░░  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← Recently Added
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │
│  │ ░░░░ │ │ ░░░░ │ │ ░░░░ │ │ ░░░░ │                      │
│  └──────┘ └──────┘ └──────┘ └──────┘                      │
└─────────────────────────────────────────────────────────────┘
```

**Items View Skeleton:**
```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        │ ← Search bar
├─────────────────────────────────────────────────────────────┤
│  [░░░░░] [░░░░░░░░░░] [░░░░░░░░░░] [░░░░░░░░]              │ ← Filter chips
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │          │ │          │ │          │ │          │      │
│  │  ░░░░░░  │ │  ░░░░░░  │ │  ░░░░░░  │ │  ░░░░░░  │      │ ← Item cards
│  │  ░░░░░░  │ │  ░░░░░░  │ │  ░░░░░░  │ │  ░░░░░░  │      │
│  │  ░░░░    │ │  ░░░░    │ │  ░░░░    │ │  ░░░░    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │          │ │          │ │          │ │          │      │
│  │  ░░░░░░  │ │  ░░░░░░  │ │  ░░░░░░  │ │  ░░░░░░  │      │
│  │  ░░░░░░  │ │  ░░░░░░  │ │  ░░░░░░  │ │  ░░░░░░  │      │
│  │  ░░░░    │ │  ░░░░    │ │  ░░░░    │ │  ░░░░    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

#### Animation

**Shimmer Effect:**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg) 0%,
    var(--color-divider) 50%,
    var(--color-bg) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Duration:** 1.5s loop  
**Easing:** Linear  
**Respects reduced motion:** Disabled if `prefers-reduced-motion: reduce`

#### Implementation Pattern

**Option A: Separate Loading Component (Recommended)**
```javascript
function renderLoading() {
  return `
    <div class="home-loading">
      <div class="home-loading-hero skeleton"></div>
      <div class="home-loading-stats">
        <div class="home-loading-stat skeleton"></div>
        <div class="home-loading-stat skeleton"></div>
        <div class="home-loading-stat skeleton"></div>
      </div>
      <div class="home-loading-export skeleton"></div>
    </div>
  `;
}
```

**Option B: Skeleton Overlay**
- Render actual structure with skeleton classes
- Replace with real content when loaded

**Recommendation:** Option A (simpler, cleaner)

#### Loading States

| View | Trigger | Duration |
|------|---------|----------|
| **Home** | Initial load, refresh | Until items loaded |
| **Items** | Initial load, filter change | Until filtered items rendered |
| **Scan** | During YOLO processing | Until results returned |

#### When to Show

**Show skeleton when:**
- `items === null` (loading)
- `items === undefined` (loading)

**Show content when:**
- `items !== null && items !== undefined`

**Show empty state when:**
- `items !== null && items.length === 0`

#### Mobile Considerations
- Skeleton matches responsive layout
- Same breakpoints as content
- Shimmer animation same on all devices

#### Accessibility
- `aria-busy="true"` on loading container
- `aria-label="Loading inventory..."` for screen readers
- Skeleton hidden from screen readers (`aria-hidden="true"`)
- Reduced motion: static placeholder (no shimmer)

---

## Feature 5: Bulk Bar Enhancements (Bonus)

### User Story
> "As a user with many items, I want to select and delete multiple items at once so I can clean up my inventory efficiently."

### Current State
- "Select" button exists
- Bulk bar shows count + delete button
- No "Select All" option

### Proposed Enhancements

#### Select All Button
```
┌─────────────────────────────────────────────────────────────┐
│  Select All 28 items that need photos                       │
└─────────────────────────────────────────────────────────────┘
```

#### Bulk Bar Improvements
**Current:**
```
┌─────────────────────────────────────────────────────────────┐
│  3 selected                    [Cancel]  [🗑 Delete]        │
└─────────────────────────────────────────────────────────────┘
```

**Enhanced:**
```
┌─────────────────────────────────────────────────────────────┐
│  3 of 247 selected             [Cancel]  [🗑 Delete]        │
└─────────────────────────────────────────────────────────────┘
```

**With "Select All":**
```
┌─────────────────────────────────────────────────────────────┐
│  3 of 247 selected    [Select All]  [Cancel]  [🗑 Delete]   │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Search usage | N/A | >20% of Items sessions | Analytics |
| Filter usage | Unknown | >30% use filters | Analytics |
| Export re-download rate | 0% | >15% of exports | Analytics |
| Perceived load time | Unknown | <1s to skeleton | Lighthouse |
| Time to complete inventory | Unknown | Reduce by 20% | Analytics + timestamps |

---

## Edge Cases

### Search
- **Special characters:** Escape regex, handle gracefully
- **Very long queries:** Truncate display, still search full query
- **Emoji in search:** Support emoji in item names
- **Search during load:** Queue search until items loaded

### Filters
- **Multiple filters:** Only one active at a time (radio behavior)
- **Filter + search:** Search within filtered results
- **Filter changes during scan:** Re-apply filter after new items added

### Export History
- **Expired exports:** Show "Expired" instead of download button
- **Download fails:** Retry mechanism, contact support link
- **10+ exports:** Show "Load more" or paginate

### Loading Skeleton
- **Fast load (<200ms):** Skip skeleton, show content directly
- **Very slow load (>10s):** Show timeout message, retry option
- **Load fails:** Show error state with retry button

---

## Accessibility Checklist

- [ ] Search input has `aria-label`
- [ ] Search results count has `aria-live="polite"`
- [ ] Filter chips have `aria-pressed`
- [ ] Export history modal has `role="dialog"`
- [ ] Download buttons have descriptive labels
- [ ] Loading skeleton has `aria-busy="true"`
- [ ] All touch targets 44px minimum
- [ ] Focus visible on all interactive elements
- [ ] Reduced motion disables shimmer animation
- [ ] Keyboard navigation works (Tab, Escape, Enter)

---

## Files to Modify

| File | Changes | Lines |
|------|---------|-------|
| `objects/items-list.js` | Search, enhanced filters | ~150 |
| `objects/summary.js` | Export history access, loading skeleton | ~100 |
| `core/api.js` | Add `/exports` endpoints | ~30 |
| `styles/main.css` | Search styles, skeleton, enhanced filters | ~200 |
| `core/export-history.js` | NEW: Export history module | ~100 |
| `objects/loading.js` | NEW: Loading skeleton module | ~80 |

**Total:** ~660 lines across 6 files (4 existing, 2 new)

---

## Next Steps

1. **Backend API** — Add `/exports` endpoints (Samuel/Andrew)
2. **Frontend implementation** — Andrew to implement from integration spec
3. **QA testing** — Scott to test edge cases, accessibility
4. **Analytics** — Implement tracking (C3-6 from Sprint 1)

---

*End of Sprint 2 Design Specification*
