'use client';

import { useState, useCallback, useRef } from 'react';
import { renderHDCanvas, RenderSettings, CachedImages } from './useCanvasRenderer';
import { extractColorsFromImage } from '@/lib/colorExtractor';
import JSZip from 'jszip';

interface BatchFile {
  id: string;
  file: File;
  url: string;
  name: string;
  status?: 'pending' | 'processing' | 'done' | 'error';
}

interface UseBatchExportOptions {
  settings: RenderSettings;
  templateSlug: string;
  backgroundUrl?: string;
  watermarkUrl?: string;
  onProgress?: (current: number, total: number) => void;
  onComplete?: (successCount: number, totalCount: number) => void;
  onError?: (error: Error, fileName: string) => void;
}

export function useBatchExport({
  settings,
  templateSlug,
  backgroundUrl,
  watermarkUrl,
  onProgress,
  onComplete,
  onError,
}: UseBatchExportOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [files, setFiles] = useState<BatchFile[]>([]);
  const abortRef = useRef(false);

  const addFiles = useCallback((newFiles: File[]) => {
    const batchItems: BatchFile[] = newFiles
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        file: f,
        url: URL.createObjectURL(f),
        name: f.name,
        status: 'pending' as const,
      }));
    
    setFiles(prev => [...prev, ...batchItems]);
    return batchItems;
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const clearFiles = useCallback(() => {
    files.forEach(f => URL.revokeObjectURL(f.url));
    setFiles([]);
    setProgress({ current: 0, total: 0 });
  }, [files]);

  const updateFileStatus = useCallback((id: string, status: BatchFile['status']) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  }, []);

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const exportAll = useCallback(async (asZip: boolean = false) => {
    if (files.length === 0 || isExporting) return;

    setIsExporting(true);
    abortRef.current = false;
    setProgress({ current: 0, total: files.length });

    let successCount = 0;
    const zip = asZip ? new JSZip() : null;

    // Pre-load background and watermark images once (they're the same for all posters)
    let backgroundImage: HTMLImageElement | null = null;
    let watermarkImage: HTMLImageElement | null = null;

    try {
      if (backgroundUrl) {
        backgroundImage = await loadImage(backgroundUrl);
      }
      if (watermarkUrl) {
        watermarkImage = await loadImage(watermarkUrl);
      }
    } catch (err) {
      console.warn('Failed to load template images:', err);
    }

    for (let i = 0; i < files.length; i++) {
      if (abortRef.current) break;

      const file = files[i];
      setProgress({ current: i + 1, total: files.length });
      onProgress?.(i + 1, files.length);
      updateFileStatus(file.id, 'processing');

      try {
        // Load the poster image
        const posterImage = await loadImage(file.url);

        // Handle Dynamic Background Color
        let currentDynamicColor = settings.dynamicBackgroundColor;
        
        if (settings.backgroundColor === '#DYNAMIC') {
          try {
            const colors = await extractColorsFromImage(file.url);
            currentDynamicColor = colors.dominant;
          } catch (err) {
            console.warn(`Failed to extract color for ${file.name}, using default`, err);
            // Fallback to current setting or white if null
            currentDynamicColor = currentDynamicColor || '#FFFFFF';
          }
        }

        // Create updated settings for this specific image
        const currentSettings: RenderSettings = {
          ...settings,
          dynamicBackgroundColor: currentDynamicColor,
        };

        // Create images object for rendering with template background & watermark
        const images: CachedImages = {
          background: backgroundImage,
          poster: posterImage,
          watermark: watermarkImage,
        };

        // Render HD canvas
        const blob = await renderHDCanvas(currentSettings, images);

        if (!blob) {
          throw new Error('Failed to create image blob');
        }

        const fileName = file.name.replace(/\.[^/.]+$/, '');
        const finalFileName = `poster-HD-${fileName}-${templateSlug}-${Date.now()}.png`;

        if (asZip && zip) {
           zip.file(finalFileName, blob);
        } else {
          // Download individually
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = finalFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }

        updateFileStatus(file.id, 'done');
        successCount++;

        // Small delay between downloads to prevent browser blocking
        if (!asZip) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error(`Failed to export ${file.name}:`, error);
        updateFileStatus(file.id, 'error');
        onError?.(error as Error, file.name);
      }
    }

    if (asZip && zip && successCount > 0) {
        try {
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `posters-batch-${templateSlug}-${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to generate ZIP:', error);
            onError?.(error as Error, 'ZIP generation');
        }
    }

    setIsExporting(false);
    onComplete?.(successCount, files.length);
  }, [files, isExporting, settings, templateSlug, backgroundUrl, watermarkUrl, onProgress, onComplete, onError, updateFileStatus]);

  const abortExport = useCallback(() => {
    abortRef.current = true;
  }, []);

  return {
    files,
    isExporting,
    progress,
    addFiles,
    removeFile,
    clearFiles,
    exportAll,
    abortExport,
    setFiles,
  };
}
