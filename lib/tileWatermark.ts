/**
 * Tile watermark positioning algorithm
 * Based on 03-render-engine.md specifications
 */

export interface TileConfig {
  angleDeg: number;
  gap: number;
  scale: number;
}

export interface TilePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

/**
 * Calculate tile positions for watermark pattern
 */
export function calculateTilePositions(
  canvasWidth: number,
  canvasHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  config: TileConfig
): TilePosition[] {
  const { angleDeg, gap, scale } = config;
  const angleRad = (angleDeg * Math.PI) / 180;

  // Scale watermark
  const scaledWidth = watermarkWidth * scale;
  const scaledHeight = watermarkHeight * scale;

  // Calculate diagonal dimension to cover rotated canvas
  const diagonal = Math.sqrt(
    canvasWidth * canvasWidth + canvasHeight * canvasHeight
  );

  // Calculate step size (watermark + gap)
  const stepX = scaledWidth + gap;
  const stepY = scaledHeight + gap;

  const positions: TilePosition[] = [];

  // Generate grid that covers canvas + extra for rotation
  const startX = -diagonal / 2;
  const startY = -diagonal / 2;
  const endX = diagonal;
  const endY = diagonal;

  for (let y = startY; y < endY; y += stepY) {
    for (let x = startX; x < endX; x += stepX) {
      // Apply rotation transformation
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      
      const rotatedX = x * cos - y * sin + canvasWidth / 2;
      const rotatedY = x * sin + y * cos + canvasHeight / 2;

      positions.push({
        x: rotatedX,
        y: rotatedY,
        width: scaledWidth,
        height: scaledHeight,
        rotation: angleDeg,
      });
    }
  }

  return positions;
}

/**
 * Calculate single centered watermark position (contain mode)
 */
export function calculateCenteredWatermark(
  canvasWidth: number,
  canvasHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  containScale: number
): TilePosition {
  const minDim = Math.min(canvasWidth, canvasHeight);
  const targetSize = minDim * containScale;

  const wmRatio = watermarkWidth / watermarkHeight;
  let width: number;
  let height: number;

  if (wmRatio > 1) {
    // Wider watermark
    width = targetSize;
    height = targetSize / wmRatio;
  } else {
    // Taller watermark
    height = targetSize;
    width = targetSize * wmRatio;
  }

  return {
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
    width,
    height,
    rotation: 0,
  };
}

/**
 * Calculate full canvas watermark (full mode)
 */
export function calculateFullWatermark(
  canvasWidth: number,
  canvasHeight: number
): TilePosition {
  return {
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
    rotation: 0,
  };
}
