/* ── Image Optimization Module ──────────────────────────────────── */

// Detect WebP support
let supportsWebp = null;
export function checkWebpSupport() {
  if (supportsWebp !== null) return supportsWebp;
  
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  try {
    supportsWebp = canvas.toDataURL('image/webp').indexOf('image/webp') > -1;
  } catch (e) {
    supportsWebp = false;
  }
  return supportsWebp;
}

// Convert image URL to WebP if supported
export function optimizeImageUrl(url) {
  if (!url || !checkWebpSupport()) return url;
  
  // If already WebP, return as-is
  if (url.includes('.webp')) return url;
  
  // Add .webp extension or quality param
  // This assumes backend supports on-the-fly conversion
  // Example: /images/photo.jpg → /images/photo.jpg?format=webp
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}format=webp&q=85`;
}

// Build responsive srcset for an image
export function buildSrcset(baseUrl, sizes = [400, 800, 1200]) {
  if (!baseUrl) return '';
  
  return sizes
    .map(size => {
      const url = baseUrl.includes('?') 
        ? `${baseUrl}&width=${size}` 
        : `${baseUrl}?width=${size}`;
      return `${optimizeImageUrl(url)} ${size}w`;
    })
    .join(', ');
}

// Build image HTML with optimization
export function buildOptimizedImage(url, alt, options = {}) {
  const {
    width = null,
    height = null,
    sizes = '(max-width: 480px) 400px, (max-width: 768px) 800px, 1200px',
    loading = 'lazy',
    decoding = 'async',
    className = ''
  } = options;
  
  const srcset = buildSrcset(url);
  const webpUrl = optimizeImageUrl(url);
  
  const attrs = [
    `src="${webpUrl}"`,
    srcset ? `srcset="${srcset}"` : '',
    `sizes="${sizes}"`,
    `alt="${alt}"`,
    loading ? `loading="${loading}"` : '',
    decoding ? `decoding="${decoding}"` : '',
    className ? `class="${className}"` : '',
    width ? `width="${width}"` : '',
    height ? `height="${height}"` : ''
  ].filter(Boolean).join(' ');
  
  return `<img ${attrs}>`;
}
