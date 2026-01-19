/**
 * Image Utilities
 * 
 * Helpers for Next.js Image optimization including blur placeholders.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Blur Placeholder Data URLs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default blur placeholder - gray shimmer
 * Used as placeholder while images are loading
 */
export const BLUR_DATA_URL = 
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+';

/**
 * Product placeholder - light gray with product icon hint
 */
export const PRODUCT_BLUR_DATA_URL = 
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+';

/**
 * Avatar placeholder - circular gradient
 */
export const AVATAR_BLUR_DATA_URL = 
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2QxZDVkYiIvPjwvc3ZnPg==';

/**
 * Banner placeholder - wide gradient
 */
export const BANNER_BLUR_DATA_URL = 
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2VjZmRmNSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2Q1ZjVlMyIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=';

// ─────────────────────────────────────────────────────────────────────────────
// Image Props Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default image props for product images
 */
export const productImageProps = {
  placeholder: 'blur' as const,
  blurDataURL: PRODUCT_BLUR_DATA_URL,
};

/**
 * Default image props for avatars
 */
export const avatarImageProps = {
  placeholder: 'blur' as const,
  blurDataURL: AVATAR_BLUR_DATA_URL,
};

/**
 * Default image props for banners
 */
export const bannerImageProps = {
  placeholder: 'blur' as const,
  blurDataURL: BANNER_BLUR_DATA_URL,
};

// ─────────────────────────────────────────────────────────────────────────────
// Image URL Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get placeholder image URL for missing product images
 */
export function getProductPlaceholder(): string {
  return '/placeholder-product.png';
}

/**
 * Get safe image URL (returns placeholder if invalid)
 */
export function getSafeImageUrl(url: string | null | undefined): string {
  if (!url || url.trim() === '') {
    return getProductPlaceholder();
  }
  return url;
}

/**
 * Check if URL is a local/internal image
 */
export function isLocalImage(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

/**
 * Get optimized image sizes string based on context
 */
export function getImageSizes(context: 'card' | 'detail' | 'cart' | 'full'): string {
  switch (context) {
    case 'card':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw';
    case 'detail':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 40vw';
    case 'cart':
      return '80px';
    case 'full':
    default:
      return '100vw';
  }
}
