'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Crop, Palette, ZoomIn, ZoomOut, ImageIcon } from 'lucide-react';
import { Template } from '@/lib/store';
import { useCanvasRenderer, RenderSettings, CachedImages } from './hooks';

// Image Loading Skeleton Component
const ImageLoadingSkeleton = ({ aspectRatio }: { aspectRatio: '3:4' | '4:5' }) => (
  <div 
    className="absolute inset-0 bg-muted animate-pulse rounded-lg flex items-center justify-center"
    style={{ aspectRatio: aspectRatio === '3:4' ? '3/4' : '4/5' }}
  >
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-muted-foreground/20 animate-pulse" />
      <div className="h-3 w-24 bg-muted-foreground/20 rounded animate-pulse" />
    </div>
  </div>
);

interface PreviewCanvasProps {
  selectedTemplate: Template | null;
  posterUrl: string;
  aspectRatio: '3:4' | '4:5';
  settings: RenderSettings;
  images: CachedImages;
  imagesLoaded: number;
  dynamicBackgroundColor: string | null;
  isUploading: boolean;
  dragActive: boolean;
  isImageLoading?: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: () => void;
  onCrop: () => void;
  onRemove: () => void;
  onReset: () => void;
  onAspectRatioChange: (ratio: '3:4' | '4:5') => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export default function PreviewCanvas({
  selectedTemplate,
  posterUrl,
  aspectRatio,
  settings,
  images,
  imagesLoaded,
  dynamicBackgroundColor,
  isUploading,
  dragActive,
  isImageLoading = false,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  onCrop,
  onRemove,
  onReset,
  onAspectRatioChange,
  canvasRef,
}: PreviewCanvasProps) {
  // Track canvas ready state
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  
  // Zoom state
  const [zoom, setZoom] = useState(1);

  // Use canvas renderer hook
  useCanvasRenderer(canvasRef, settings, images, [imagesLoaded]);

  // Canvas ready state derived from props
  const isReady = !!(posterUrl && images.poster);
  
  // Sync canvas ready state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCanvasReady(isReady);
    }, 0);
    return () => clearTimeout(timer);
  }, [isReady]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
  }, []);

  // Reset zoom when poster changes
  const prevPosterUrl = useRef(posterUrl);
  useEffect(() => {
    if (prevPosterUrl.current !== posterUrl) {
      prevPosterUrl.current = posterUrl;
      const timer = setTimeout(() => setZoom(1), 0);
      return () => clearTimeout(timer);
    }
  }, [posterUrl]);

  return (
    <div className="lg:col-span-2">
      <div className="mb-2 sm:mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm md:text-base font-semibold text-foreground flex items-center gap-1.5 sm:gap-2">
          <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            2
          </span>
          <span>Preview</span>
        </h2>
        
        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onAspectRatioChange('3:4')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              aspectRatio === '3:4'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            3:4
          </button>
          <button
            onClick={() => onAspectRatioChange('4:5')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              aspectRatio === '4:5'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            4:5
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg border-2 border-border overflow-hidden">
        <div className="p-3 sm:p-4 md:p-6">
          {!posterUrl ? (
            /* Enhanced Upload Zone */
            <motion.div
              className={`
                relative border-2 border-dashed rounded-xl transition-all cursor-pointer
                ${dragActive
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-border hover:border-primary/50 hover:bg-accent/30'
                }
              `}
              style={{ aspectRatio: aspectRatio === '3:4' ? '3/4' : '4/5' }}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onClick={onFileSelect}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 ${dragActive ? 'animate-pulse' : ''}`} />
                {dragActive && (
                  <motion.div
                    className="absolute inset-4 border-2 border-primary/30 border-dashed rounded-lg"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center">
                {/* Animated Icon */}
                <motion.div 
                  className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 ${
                    dragActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-gradient-to-br from-primary/10 to-accent/10 text-primary'
                  }`}
                  animate={dragActive ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                  transition={{ duration: 0.5, repeat: dragActive ? Infinity : 0 }}
                >
                  {dragActive ? (
                    <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
                  ) : (
                    <Upload className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
                  )}
                </motion.div>
                
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-2">
                  {dragActive ? 'Release to Upload!' : 'Drop Your Poster Here'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6 max-w-xs px-2">
                  {dragActive ? 'Your file is ready to drop' : 'Drag & drop your image or click anywhere'}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileSelect();
                  }}
                  disabled={!selectedTemplate || isUploading}
                  className="px-5 py-2.5 sm:px-7 sm:py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm sm:text-base hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span>Processing...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span>Browse Files</span>
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-3 mt-4 sm:mt-5 text-[10px] sm:text-xs text-muted-foreground">
                  <span className="px-2 py-1 bg-muted rounded">JPG</span>
                  <span className="px-2 py-1 bg-muted rounded">PNG</span>
                  <span className="px-2 py-1 bg-muted rounded">WebP</span>
                  <span className="text-muted-foreground/60">Max 10MB</span>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Canvas Preview */
            <div className="space-y-3">
              {/* Canvas Container */}
              <div 
                className="relative rounded-lg overflow-hidden border border-border" 
                style={{ aspectRatio: aspectRatio === '3:4' ? '3/4' : '4/5' }}
              >
                {/* Loading Skeleton */}
                {(isImageLoading || !isCanvasReady) && posterUrl && (
                  <ImageLoadingSkeleton aspectRatio={aspectRatio} />
                )}
                
                {/* Canvas */}
                <canvas
                  ref={canvasRef}
                  className={`w-full h-full transition-opacity duration-300 ${
                    isCanvasReady ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ 
                    display: 'block',
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s ease-out',
                  }}
                />
                
                {/* Info Badge */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-1 sm:px-3 sm:py-1.5 bg-primary backdrop-blur-sm rounded text-primary-foreground text-[10px] sm:text-xs font-semibold truncate max-w-[50%]">
                  {selectedTemplate?.name}
                </div>
                
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-1 sm:px-3 sm:py-1.5 bg-primary backdrop-blur-sm rounded text-primary-foreground text-[10px] sm:text-xs font-mono">
                  1080x{aspectRatio === '3:4' ? '1440' : '1350'}
                </div>

                {/* Zoom Controls */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 p-1 bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="p-1.5 rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleZoomReset}
                    className="px-2 py-1 text-xs font-mono hover:bg-accent rounded-md transition-colors min-w-[3rem]"
                    title="Reset Zoom"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 2}
                    className="p-1.5 rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={onCrop}
                  className="flex-1 px-3 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  <Crop className="w-4 h-4" />
                  <span>Crop</span>
                </button>
                <button
                  onClick={onRemove}
                  className="flex-1 px-3 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  <X className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              </div>

              {/* Dynamic Color Badge */}
              {selectedTemplate?.settings.backgroundColor === '#DYNAMIC' && dynamicBackgroundColor && (
                <div className="w-full p-3 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <Palette className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Dynamic Color Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-lg border-2 border-white dark:border-black shadow-lg"
                        style={{ backgroundColor: dynamicBackgroundColor }}
                      />
                      <span className="text-xs font-mono text-muted-foreground">{dynamicBackgroundColor}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Change Button */}
              <button
                onClick={onReset}
                className="w-full px-3 py-1.5 sm:px-4 sm:py-2 bg-card border-2 border-border hover:border-black dark:hover:border-white text-foreground rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Change Poster</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
