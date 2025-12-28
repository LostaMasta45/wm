'use client';

import { useRef, useEffect, useCallback } from 'react';

export interface RenderSettings {
  padding: number;
  watermarkOpacity: number;
  watermarkSize: number;
  borderRadius: number;
  aspectRatio: '3:4' | '4:5';
  backgroundColor: string;
  dynamicBackgroundColor: string | null;
  blurIntensity: number; // 0-100, used when backgroundColor === '#BLUR'
}

export interface CachedImages {
  background: HTMLImageElement | null;
  poster: HTMLImageElement | null;
  watermark: HTMLImageElement | null;
}

export function useCanvasRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  settings: RenderSettings,
  images: CachedImages,
  deps: unknown[] = []
) {
  const renderFrameRef = useRef<number>(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Calculate dimensions
    const width = 1080;
    const height = settings.aspectRatio === '3:4' ? 1440 : 1350;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Background color or blur
    const isBlurMode = settings.backgroundColor === '#BLUR';
    const bgColor = settings.backgroundColor === '#DYNAMIC' && settings.dynamicBackgroundColor
      ? settings.dynamicBackgroundColor
      : settings.backgroundColor || '#FFFFFF';

    // For blur mode, draw blurred poster first as background
    if (isBlurMode && images.poster) {
      try {
        const posterImg = images.poster;
        // Calculate how to cover the entire canvas
        const scale = Math.max(width / posterImg.width, height / posterImg.height) * 1.2;
        const scaledWidth = posterImg.width * scale;
        const scaledHeight = posterImg.height * scale;
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;

        // Apply blur filter
        const blurAmount = Math.round(settings.blurIntensity * 0.5); // Scale blur to reasonable pixel values
        ctx.filter = `blur(${blurAmount}px)`;
        ctx.drawImage(posterImg, x, y, scaledWidth, scaledHeight);
        ctx.filter = 'none';

        // Add semi-transparent overlay for better poster visibility
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, width, height);
      } catch (err) {
        console.error('Blur background draw error:', err);
        // Fallback to solid color
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      // Standard solid color background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Background image (only if not blur mode)
    if (images.background && !isBlurMode) {
      try {
        ctx.drawImage(images.background, 0, 0, width, height);
      } catch (err) {
        console.error('Background draw error:', err);
      }
    }

    // Poster image
    if (images.poster) {
      try {
        const posterImg = images.poster;
        const paddingPx = (Math.min(width, height) * settings.padding) / 100;
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
        if (settings.borderRadius > 0) {
          ctx.save();
          ctx.beginPath();
          const radius = Math.min(settings.borderRadius, posterWidth / 2, posterHeight / 2);
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

        if (settings.borderRadius > 0) {
          ctx.restore();
        }
      } catch (err) {
        console.error('Poster draw error:', err);
      }
    }

    // Watermark
    if (images.watermark && settings.watermarkOpacity > 0) {
      try {
        const wmImg = images.watermark;
        ctx.globalAlpha = settings.watermarkOpacity / 100;

        const wmAspectRatio = wmImg.width / wmImg.height;
        const canvasAspectRatio = width / height;
        const sizeMultiplier = settings.watermarkSize / 100;

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
      } catch (err) {
        console.error('Watermark draw error:', err);
        ctx.globalAlpha = 1.0;
      }
    }
  }, [canvasRef, settings, images]);

  // Render with requestAnimationFrame
  useEffect(() => {
    if (renderFrameRef.current) {
      cancelAnimationFrame(renderFrameRef.current);
    }

    renderFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (renderFrameRef.current) {
        cancelAnimationFrame(renderFrameRef.current);
      }
    };
  }, [render, ...deps]);

  return { render };
}

// HD Export renderer (2x resolution) - Uses OffscreenCanvas when available
export async function renderHDCanvas(
  settings: RenderSettings,
  images: CachedImages
): Promise<Blob | null> {
  const hdWidth = 2160;
  const hdHeight = settings.aspectRatio === '3:4' ? 2880 : 2700;

  // Background color
  const bgColor = settings.backgroundColor === '#DYNAMIC' && settings.dynamicBackgroundColor
    ? settings.dynamicBackgroundColor
    : settings.backgroundColor || '#FFFFFF';

  // Try OffscreenCanvas first for better performance (non-blocking)
  const useOffscreen = typeof OffscreenCanvas !== 'undefined';

  if (useOffscreen) {
    try {
      const offscreen = new OffscreenCanvas(hdWidth, hdHeight);
      const hdCtx = offscreen.getContext('2d', { alpha: false });
      if (!hdCtx) throw new Error('Cannot get context');

      await renderToCanvas(hdCtx, hdWidth, hdHeight, bgColor, settings, images);
      return await offscreen.convertToBlob({ type: 'image/png', quality: 1.0 });
    } catch (err) {
      console.warn('OffscreenCanvas failed, using fallback:', err);
    }
  }

  // Fallback to regular canvas
  return new Promise((resolve) => {
    const hdCanvas = document.createElement('canvas');
    hdCanvas.width = hdWidth;
    hdCanvas.height = hdHeight;
    const hdCtx = hdCanvas.getContext('2d', { alpha: false });
    if (!hdCtx) {
      resolve(null);
      return;
    }

    renderToCanvas(hdCtx, hdWidth, hdHeight, bgColor, settings, images);
    hdCanvas.toBlob(resolve, 'image/png', 1.0);
  });
}

// Shared rendering logic
function renderToCanvas(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  hdWidth: number,
  hdHeight: number,
  bgColor: string,
  settings: RenderSettings,
  images: CachedImages
): void {
  const isBlurMode = settings.backgroundColor === '#BLUR';

  // For blur mode, draw blurred poster first as background
  if (isBlurMode && images.poster) {
    try {
      const posterImg = images.poster;
      // Calculate how to cover the entire canvas
      const scale = Math.max(hdWidth / posterImg.width, hdHeight / posterImg.height) * 1.2;
      const scaledWidth = posterImg.width * scale;
      const scaledHeight = posterImg.height * scale;
      const x = (hdWidth - scaledWidth) / 2;
      const y = (hdHeight - scaledHeight) / 2;

      // Apply blur filter (scaled for HD resolution)
      const blurAmount = Math.round(settings.blurIntensity * 1.0); // Higher blur for HD
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(posterImg, x, y, scaledWidth, scaledHeight);
      ctx.filter = 'none';

      // Add semi-transparent overlay for better poster visibility
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, hdWidth, hdHeight);
    } catch (err) {
      console.error('Blur background draw error:', err);
      // Fallback to solid color
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, hdWidth, hdHeight);
    }
  } else {
    // Standard solid color background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, hdWidth, hdHeight);
  }

  // Background image (only if not blur mode)
  if (images.background && !isBlurMode) {
    ctx.drawImage(images.background, 0, 0, hdWidth, hdHeight);
  }

  // Poster image
  if (images.poster) {
    const posterImg = images.poster;
    const paddingPx = (Math.min(hdWidth, hdHeight) * settings.padding) / 100;
    const availableWidth = hdWidth - paddingPx * 2;
    const availableHeight = hdHeight - paddingPx * 2;

    const scale = Math.min(
      availableWidth / posterImg.width,
      availableHeight / posterImg.height
    );

    const posterWidth = posterImg.width * scale;
    const posterHeight = posterImg.height * scale;
    const x = (hdWidth - posterWidth) / 2;
    const y = (hdHeight - posterHeight) / 2;

    if (settings.borderRadius > 0) {
      ctx.save();
      ctx.beginPath();
      const radius = Math.min(settings.borderRadius * 2, posterWidth / 2, posterHeight / 2);
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

    if (settings.borderRadius > 0) {
      ctx.restore();
    }
  }

  // Watermark
  if (images.watermark && settings.watermarkOpacity > 0) {
    const wmImg = images.watermark;
    ctx.globalAlpha = settings.watermarkOpacity / 100;

    const wmAspectRatio = wmImg.width / wmImg.height;
    const canvasAspectRatio = hdWidth / hdHeight;
    const sizeMultiplier = settings.watermarkSize / 100;

    let wmWidth, wmHeight;
    if (wmAspectRatio > canvasAspectRatio) {
      wmWidth = hdWidth * sizeMultiplier;
      wmHeight = wmWidth / wmAspectRatio;
    } else {
      wmHeight = hdHeight * sizeMultiplier;
      wmWidth = wmHeight * wmAspectRatio;
    }

    const wmX = (hdWidth - wmWidth) / 2;
    const wmY = (hdHeight - wmHeight) / 2;

    ctx.drawImage(wmImg, wmX, wmY, wmWidth, wmHeight);
    ctx.globalAlpha = 1.0;
  }
}
