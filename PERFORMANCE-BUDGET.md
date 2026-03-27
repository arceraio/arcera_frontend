# Lighthouse CI — Performance Budget

**Project:** Arcera Frontend  
**Date:** March 26, 2026  
**Config:** `lighthouserc.json`

---

## Performance Budgets

| Metric | Target | Threshold | Priority |
|--------|--------|-----------|----------|
| **Performance Score** | ≥ 90% | Warn if < 90% | High |
| **Accessibility Score** | ≥ 95% | **Error** if < 95% | **Critical** |
| **Best Practices** | ≥ 90% | Warn if < 90% | Medium |
| **SEO** | ≥ 90% | Warn if < 90% | Low |
| **First Contentful Paint** | < 1.8s | Warn if > 1.8s | High |
| **Largest Contentful Paint** | < 2.5s | Warn if > 2.5s | High |
| **Cumulative Layout Shift** | < 0.1 | Warn if > 0.1 | High |
| **Total Page Weight** | < 1.5MB | Warn if > 1.5MB | Medium |

---

## CI Integration

### GitHub Actions

Add to `.github/workflows/lighthouse.yml`:

```yaml
name: Lighthouse CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run Lighthouse CI
        run: npx @lhci/cli@latest autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
      
      - name: Upload reports
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-reports
          path: ./outputs/lighthouse-reports
```

### Local Testing

```bash
# Install Lighthouse CI
npm install -D @lhci/cli

# Run locally
npx @lhci/cli autorun

# View reports
open ./outputs/lighthouse-reports/*.html
```

---

## Optimization Checklist

### Images (Sprint 3)
- [x] WebP format detection
- [x] Lazy loading (`loading="lazy"`)
- [x] Async decoding (`decoding="async"`)
- [x] Explicit dimensions (width/height)
- [ ] Responsive srcset (backend support required)
- [ ] Image compression (backend support required)

### JavaScript
- [x] Under 500 lines per file
- [x] Vanilla JS only (no frameworks)
- [x] Debounced animations
- [ ] Code splitting (future)
- [ ] Tree shaking (future)

### CSS
- [x] Custom properties (no hardcoded colors)
- [x] Reduced motion support
- [ ] Critical CSS inlining (future)
- [ ] CSS minification (build step)

### Accessibility
- [x] ARIA labels on interactive elements
- [x] Focus rings visible
- [x] Keyboard navigation
- [x] Screen reader support (aria-live, aria-pressed)
- [ ] Screen reader audit (manual testing)

---

## Monitoring

### Weekly Lighthouse Reports

Set up cron job to run Lighthouse weekly:

```bash
# Add to crontab
0 9 * * 1 cd /home/kevin/Apps/Arcera/arcera_frontend && npx @lhci/cli autorun >> ~/logs/lighthouse.log 2>&1
```

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Performance | < 85% | < 75% |
| Accessibility | < 90% | < 85% |
| LCP | > 3s | > 4s |
| CLS | > 0.15 | > 0.25 |

---

## Baseline Scores (Post-Sprint 3)

**Run Date:** March 26, 2026  
**Device:** Desktop (simulated)  
**Connection:** 4G

| Category | Score | Status |
|----------|-------|--------|
| Performance | TBD | 🟡 Pending |
| Accessibility | TBD | 🟡 Pending |
| Best Practices | TBD | 🟡 Pending |
| SEO | TBD | 🟡 Pending |

**Run Lighthouse to establish baseline:**
```bash
npx @lhci/cli autorun
```

---

## Notes

- Accessibility score must stay ≥ 95% (error threshold)
- Performance budgets are warnings, not errors (allow iteration)
- Image optimization budgets disabled pending backend support
- Reports saved to `outputs/lighthouse-reports/`
