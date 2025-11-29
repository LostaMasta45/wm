'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface CachedImages {
  background: HTMLImageElement | null;
  poster: HTMLImageElement | null;
  watermark: HTMLImageElement | null;
}

interface ImageUrls {
  backgroundUrl: string;
  posterUrl: string;
  watermarkUrl: string;
}

export function useImageCache(urls: ImageUrls) {
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const posterImageRef = useRef<HTMLImageElement | null>(null);
  const watermarkImageRef = useRef<HTMLImageElement | null>(null);
  
  const lastBackgroundUrlRef = useRef<string>('');
  const lastPosterUrlRef = useRef<string>('');
  const lastWatermarkUrlRef = useRef<string>('');
  
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load background image
  useEffect(() => {
    if (!urls.backgroundUrl) {
      backgroundImageRef.current = null;
      lastBackgroundUrlRef.current = '';
      return;
    }
    
    if (urls.backgroundUrl === lastBackgroundUrlRef.current) return;
    
    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      backgroundImageRef.current = img;
      lastBackgroundUrlRef.current = urls.backgroundUrl;
      setImagesLoaded(prev => prev + 1);
      setIsLoading(false);
    };
    img.onerror = () => setIsLoading(false);
    img.src = urls.backgroundUrl + '?t=' + Date.now();
  }, [urls.backgroundUrl]);

  // Load poster image
  useEffect(() => {
    if (!urls.posterUrl) {
      posterImageRef.current = null;
      lastPosterUrlRef.current = '';
      return;
    }
    
    if (urls.posterUrl === lastPosterUrlRef.current) return;
    
    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      posterImageRef.current = img;
      lastPosterUrlRef.current = urls.posterUrl;
      setImagesLoaded(prev => prev + 1);
      setIsLoading(false);
    };
    img.onerror = () => setIsLoading(false);
    img.src = urls.posterUrl;
  }, [urls.posterUrl]);

  // Load watermark image
  useEffect(() => {
    if (!urls.watermarkUrl) {
      watermarkImageRef.current = null;
      lastWatermarkUrlRef.current = '';
      return;
    }
    
    if (urls.watermarkUrl === lastWatermarkUrlRef.current) return;
    
    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      watermarkImageRef.current = img;
      lastWatermarkUrlRef.current = urls.watermarkUrl;
      setImagesLoaded(prev => prev + 1);
      setIsLoading(false);
    };
    img.onerror = () => setIsLoading(false);
    img.src = urls.watermarkUrl + '?t=' + Date.now();
  }, [urls.watermarkUrl]);

  const getCachedImages = useCallback((): CachedImages => ({
    background: backgroundImageRef.current,
    poster: posterImageRef.current,
    watermark: watermarkImageRef.current,
  }), []);

  const clearCache = useCallback(() => {
    backgroundImageRef.current = null;
    posterImageRef.current = null;
    watermarkImageRef.current = null;
    lastBackgroundUrlRef.current = '';
    lastPosterUrlRef.current = '';
    lastWatermarkUrlRef.current = '';
    setImagesLoaded(0);
  }, []);

  return {
    getCachedImages,
    clearCache,
    imagesLoaded,
    isLoading,
    images: {
      background: backgroundImageRef.current,
      poster: posterImageRef.current,
      watermark: watermarkImageRef.current,
    },
  };
}
