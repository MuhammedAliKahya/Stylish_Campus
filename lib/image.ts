// Client-side image compression using browser-image-compression.
// Caps: max 1080x1080, WebP, target ≤ 150 KB, strip EXIF.
// localStorage budget is ~5 MB total; we enforce 3 images per listing at ~150 KB
// each to stay safely under quota. If a write would blow the quota, the store
// layer throws StorageQuotaError and the UI shows a friendly Turkish message.

import imageCompression from 'browser-image-compression';

export const MAX_IMAGE_BYTES = 150 * 1024; // 150 KB
export const MAX_IMAGES_PER_LISTING = 3;
export const MAX_DIMENSION = 1080;

export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Lütfen sadece resim dosyası yükleyin.');
  }
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: MAX_DIMENSION,
    maxSizeMB: MAX_IMAGE_BYTES / (1024 * 1024),
    useWebWorker: true,
    initialQuality: 0.8,
    fileType: 'image/webp',
  });
  return await imageCompression.getDataUrlFromFile(compressed);
}

export async function compressImages(files: File[]): Promise<string[]> {
  const slice = files.slice(0, MAX_IMAGES_PER_LISTING);
  return await Promise.all(slice.map(compressImage));
}
