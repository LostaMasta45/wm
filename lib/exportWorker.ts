// Export Worker for OffscreenCanvas rendering
// This moves heavy HD rendering off the main thread

export interface ExportWorkerMessage {
  type: 'render';
  settings: {
    width: number;
    height: number;
    padding: number;
    watermarkOpacity: number;
    watermarkSize: number;
    borderRadius: number;
    backgroundColor: string;
  };
  images: {
    background?: ImageBitmap;
    poster?: ImageBitmap;
    watermark?: ImageBitmap;
  };
}

export interface ExportWorkerResponse {
  type: 'success' | 'error';
  blob?: Blob;
  error?: string;
}

// Check if OffscreenCanvas is supported
export function isOffscreenCanvasSupported(): boolean {
  return typeof OffscreenCanvas !== 'undefined';
}

// Create export blob using OffscreenCanvas (if supported) or regular canvas
export async function renderExportCanvas(
  settings: {
    width: number;
    height: number;
    padding: number;
    watermarkOpacity: number;
    watermarkSize: number;
    borderRadius: number;
    backgroundColor: string;
  },
  images: {
    background: HTMLImageElement | null;
    poster: HTMLImageElement | null;
    watermark: HTMLImageElement | null;
  }
): Promise<Blob | null> {
  const { width, height, padding, watermarkOpacity, watermarkSize, borderRadius, backgroundColor } = settings;

  // Try OffscreenCanvas first for better performance
  if (isOffscreenCanvasSupported()) {
    try {
      const offscreen = new OffscreenCanvas(width, height);
      const ctx = offscreen.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Cannot get 2d context');

      // Render on offscreen canvas
      await renderToContext(ctx, width, height, settings, images);

      // Convert to blob
      const blob = await offscreen.convertToBlob({ type: 'image/png', quality: 1.0 });
      return blob;
    } catch (err) {
      console.warn('OffscreenCanvas failed, falling back to regular canvas:', err);
    }
  }

  // Fallback to regular canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  await renderToContext(ctx, width, height, settings, images);

  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png', 1.0);
  });
}

// Shared rendering logic
async function renderToContext(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  settings: {
    padding: number;
    watermarkOpacity: number;
    watermarkSize: number;
    borderRadius: number;
    backgroundColor: string;
  },
  images: {
    background: HTMLImageElement | null;
    poster: HTMLImageElement | null;
    watermark: HTMLImageElement | null;
  }
): Promise<void> {
  const { padding, watermarkOpacity, watermarkSize, borderRadius, backgroundColor } = settings;

  // Background color
  ctx.fillStyle = backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Background image
  if (images.background) {
    ctx.drawImage(images.background, 0, 0, width, height);
  }

  // Poster image
  if (images.poster) {
    const posterImg = images.poster;
    const paddingPx = (Math.min(width, height) * padding) / 100;
    const availableWidth = width - paddingPx * 2;
    const availableHeight = height - paddingPx * 2;

    const scale = Math.min(
      availableWidth / posterImg.width,
      availableHeight / posterImg.height
    );

    const posterWidth = posterImg.width * scale;
    const posterHeight = posterImg.height * scale;
    const x = (width - posterWidth) / 2;
    const y = (height - posterHeight) / 2;

    // Apply rounded corners
    if (borderRadius > 0) {
      ctx.save();
      ctx.beginPath();
      const radius = Math.min(borderRadius * 2, posterWidth / 2, posterHeight / 2);
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + posterWidth - radius, y);
      ctx.quadraticCurveTo(x + posterWidth, y, x + posterWidth, y + radius);
      ctx.lineTo(x + posterWidth, y + posterHeight - radius);
      ctx.quadraticCurveTo(x + posterWidth, y + posterHeight, x + posterWidth - radius, y + posterHeight);
      ctx.lineTo(x + radius, y + posterHeight);
      ctx.quadraticCurveTo(x, y + posterHeight, x, y + posterHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.clip();
    }

    ctx.drawImage(posterImg, x, y, posterWidth, posterHeight);

    if (borderRadius > 0) {
      ctx.restore();
    }
  }

  // Watermark
  if (images.watermark && watermarkOpacity > 0) {
    const wmImg = images.watermark;
    ctx.globalAlpha = watermarkOpacity / 100;

    const wmAspectRatio = wmImg.width / wmImg.height;
    const canvasAspectRatio = width / height;
    const sizeMultiplier = watermarkSize / 100;

    let wmWidth, wmHeight;
    if (wmAspectRatio > canvasAspectRatio) {
      wmWidth = width * sizeMultiplier;
      wmHeight = wmWidth / wmAspectRatio;
    } else {
      wmHeight = height * sizeMultiplier;
      wmWidth = wmHeight * wmAspectRatio;
    }

    const wmX = (width - wmWidth) / 2;
    const wmY = (height - wmHeight) / 2;

    ctx.drawImage(wmImg, wmX, wmY, wmWidth, wmHeight);
    ctx.globalAlpha = 1.0;
  }
}

// Batch export with chunked processing to prevent UI blocking
export async function batchExportWithChunks<T>(
  items: T[],
  processItem: (item: T, index: number) => Promise<void>,
  options: {
    chunkSize?: number;
    delayBetweenChunks?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<void> {
  const { chunkSize = 3, delayBetweenChunks = 100, onProgress } = options;

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    
    await Promise.all(
      chunk.map((item, idx) => processItem(item, i + idx))
    );

    onProgress?.(Math.min(i + chunkSize, items.length), items.length);

    // Give the UI thread a chance to breathe
    if (i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenChunks));
    }
  }
}
