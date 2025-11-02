/**
 * Calculate dimensions and position for cover and contain modes
 * Based on 03-render-engine.md specifications
 */

export interface Dimensions {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * COVER mode: Fill entire canvas, crop excess (background behavior)
 */
export function calculateCover(
  canvas: Dimensions,
  image: Dimensions
): Position {
  const canvasRatio = canvas.width / canvas.height;
  const imageRatio = image.width / image.height;

  let width: number;
  let height: number;

  if (imageRatio > canvasRatio) {
    // Image is wider - fit height, crop width
    height = canvas.height;
    width = height * imageRatio;
  } else {
    // Image is taller - fit width, crop height
    width = canvas.width;
    height = width / imageRatio;
  }

  // Center the image
  const x = (canvas.width - width) / 2;
  const y = (canvas.height - height) / 2;

  return { x, y, width, height };
}

/**
 * CONTAIN mode: Fit entire image within canvas, no cropping (poster behavior)
 * Supports padding percentage
 */
export function calculateContain(
  canvas: Dimensions,
  image: Dimensions,
  paddingPct: number = 0
): Position {
  // Apply padding
  const minDim = Math.min(canvas.width, canvas.height);
  const padding = (minDim * paddingPct) / 100;
  const availableWidth = canvas.width - padding * 2;
  const availableHeight = canvas.height - padding * 2;

  const canvasRatio = availableWidth / availableHeight;
  const imageRatio = image.width / image.height;

  let width: number;
  let height: number;

  if (imageRatio > canvasRatio) {
    // Image is wider - fit width
    width = availableWidth;
    height = width / imageRatio;
  } else {
    // Image is taller - fit height
    height = availableHeight;
    width = height * imageRatio;
  }

  // Center the image
  const x = (canvas.width - width) / 2;
  const y = (canvas.height - height) / 2;

  return { x, y, width, height };
}

/**
 * Calculate scale factor for contain mode
 */
export function calculateScale(
  canvas: Dimensions,
  image: Dimensions,
  paddingPct: number = 0
): number {
  const minDim = Math.min(canvas.width, canvas.height);
  const padding = (minDim * paddingPct) / 100;
  const availableWidth = canvas.width - padding * 2;
  const availableHeight = canvas.height - padding * 2;

  const scaleX = availableWidth / image.width;
  const scaleY = availableHeight / image.height;

  return Math.min(scaleX, scaleY);
}

/**
 * Check if image meets minimum scale requirement
 */
export function meetsMinimumScale(
  canvas: Dimensions,
  image: Dimensions,
  minScale: number,
  paddingPct: number = 0
): boolean {
  const scale = calculateScale(canvas, image, paddingPct);
  return scale >= minScale;
}
