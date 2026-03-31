const IMAGEKIT_ENDPOINT = process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/s975zogcgm';

export interface ImageKitOptions {
  width?: number;
  height?: number;
  quality?: number;
  blur?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  crop?: 'maintain_ratio' | 'force' | 'at_least';
  version?: string | number;
}

/**
 * Transforms a raw image or PDF URL into an optimized ImageKit URL.
 * If the URL is already a base64 string, it returns the string as is.
 */
export const getImageUrl = (url: string | null | undefined, options: ImageKitOptions = {}): string => {
  if (!url) return '';
  
  // Skip transformation for base64 data
  if (url.startsWith('data:')) return url;

  try {
    // 1. Extract the filename or path from the original URL
    let path = url;
    
    // If it's already an ImageKit URL, extract just the path after the endpoint
    if (url.startsWith(IMAGEKIT_ENDPOINT)) {
      // Remove endpoint AND any existing query params for transformation
      const cleanUrl = url.split('?')[0];
      path = cleanUrl.substring(IMAGEKIT_ENDPOINT.length);
    } 
    else if (url.startsWith('http')) {
      const urlObj = new URL(url);
      path = urlObj.pathname;
    }

    // 2. Build the ImageKit URL base
    let ikUrl = `${IMAGEKIT_ENDPOINT}${path.startsWith('/') ? '' : '/'}${path}`;

    // 3. Apply transformations
    const transforms: string[] = [];
    if (options.width) transforms.push(`w-${options.width}`);
    if (options.height) transforms.push(`h-${options.height}`);
    if (options.quality) transforms.push(`q-${options.quality}`);
    if (options.blur) transforms.push(`bl-${options.blur}`);
    if (options.format) transforms.push(`f-${options.format === 'auto' ? 'auto' : options.format}`);

    if (transforms.length > 0) {
      ikUrl += `?tr=${transforms.join(',')}`;
    }

    // 4. Handle Versioning (Cache Busting)
    if (options.version) {
      const separator = ikUrl.includes('?') ? '&' : '?';
      ikUrl += `${separator}v=${options.version}`;
    }

    return ikUrl;
  } catch (err) {
    console.error("ImageKit error for URL:", url, err);
    return url; // Fallback to original URL
  }
};
