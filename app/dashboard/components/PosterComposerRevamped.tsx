'use client';

import { useState, useRef, useEffect } from 'react';
import { usePosterStore } from '@/lib/store';
import { toast, Toaster } from 'sonner';
import { Download, Copy, RotateCcw, History, Settings2, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TemplateManager from './TemplateManager';
import ThemeToggle from './ThemeToggle';

export default function PosterComposerRevamped() {
  const {
    selectedTemplate,
    posterUrl,
    setPosterUrl,
    padding,
    setPadding,
    watermarkOpacity,
    setWatermarkOpacity,
    exportedUrl,
    setExportedUrl,
    recentExports,
    addRecentExport,
    reset,
  } = usePosterStore();

  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Handle file upload
  const handleFileSelect = async (file: File) => {
    if (!file) return;
    if (!selectedTemplate) {
      toast.error('Please select a template first!');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file!');
      return;
    }

    setIsUploading(true);

    try {
      // Create local URL for immediate preview
      const localUrl = URL.createObjectURL(file);
      setPosterUrl(localUrl);
      toast.success('Poster loaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to load poster. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Render canvas preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedTemplate) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = 1080;
    const height = 1440;
    canvas.width = width;
    canvas.height = height;

    setIsRendering(true);

    const render = async () => {
      try {
        // Clear with background color
        ctx.fillStyle = selectedTemplate.settings.backgroundColor || '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Layer 1: Background image
        if (selectedTemplate.backgroundUrl) {
          const bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve) => {
            bgImg.onload = () => {
              try {
                ctx.drawImage(bgImg, 0, 0, width, height);
              } catch (err) {
                console.error('Background draw error:', err);
              }
              resolve();
            };
            bgImg.onerror = () => {
              console.warn('Background failed to load, skipping');
              resolve();
            };
            // Add timestamp to prevent caching issues
            bgImg.src = selectedTemplate.backgroundUrl + (selectedTemplate.backgroundUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
          });
        }

        // Layer 2: Poster image (with padding)
        if (posterUrl) {
          const posterImg = new Image();
          posterImg.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve) => {
            posterImg.onload = () => {
              try {
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

                ctx.drawImage(posterImg, x, y, posterWidth, posterHeight);
              } catch (err) {
                console.error('Poster draw error:', err);
              }
              resolve();
            };
            posterImg.onerror = () => {
              console.warn('Poster failed to load');
              resolve();
            };
            posterImg.src = posterUrl;
          });
        }

        // Layer 3: Watermark (with opacity)
        if (selectedTemplate.watermarkUrl && watermarkOpacity > 0) {
          const wmImg = new Image();
          wmImg.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve) => {
            wmImg.onload = () => {
              try {
                ctx.globalAlpha = watermarkOpacity / 100;
                ctx.drawImage(wmImg, 0, 0, width, height);
                ctx.globalAlpha = 1.0;
              } catch (err) {
                console.error('Watermark draw error:', err);
                ctx.globalAlpha = 1.0;
              }
              resolve();
            };
            wmImg.onerror = () => {
              console.warn('Watermark failed to load, skipping');
              resolve();
            };
            wmImg.src = selectedTemplate.watermarkUrl + (selectedTemplate.watermarkUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
          });
        }

        setIsRendering(false);
      } catch (error) {
        console.error('Render error:', error);
        setIsRendering(false);
      }
    };

    render();
  }, [selectedTemplate, posterUrl, padding, watermarkOpacity]);

  // Export as PNG
  const handleExport = async () => {
    if (!posterUrl) {
      toast.error('Please upload a poster first!');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('Canvas not ready!');
      return;
    }

    setIsExporting(true);
    toast.loading('Exporting poster...');

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      // Create download URL
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `poster-${selectedTemplate?.brandSlug}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Store in history
      setExportedUrl(url);
      addRecentExport({
        url: url,
        thumbnail: url,
        templateName: selectedTemplate?.name || 'Unknown',
      });

      toast.success('Poster exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      toast.dismiss();
    }
  };

  // Copy canvas as image
  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          toast.success('Copied to clipboard!');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                  Poster Composer Studio
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Professional 3:4 poster creation tool
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 hover:bg-muted rounded-lg"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                  {recentExports.length > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-primary text-white rounded-full">
                      {recentExports.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - 3 Column Layout */}
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT: Template Selection */}
            <div className="lg:col-span-3">
              <div className="sticky top-24">
                <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Templates</h2>
                      <p className="text-xs text-muted-foreground">Select your brand</p>
                    </div>
                  </div>
                  <TemplateManager />
                </div>
              </div>
            </div>

            {/* CENTER: Live Preview */}
            <div className="lg:col-span-6">
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      Live Preview
                      {isRendering && (
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      )}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      1080 × 1440 pixels • 3:4 aspect ratio
                    </p>
                  </div>
                  {selectedTemplate && (
                    <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                      {selectedTemplate.name}
                    </div>
                  )}
                </div>

                {/* Canvas or Upload Zone */}
                {!posterUrl ? (
                  <div
                    className={`
                      relative border-2 border-dashed rounded-2xl transition-all duration-300 overflow-hidden
                      ${dragActive 
                        ? 'border-primary bg-primary/5 scale-[1.02]' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                      }
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    style={{ aspectRatio: '3/4' }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
                        <Upload className="w-10 h-10 text-primary" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Upload Your Poster
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                        Drag and drop your image here, or click to browse
                      </p>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!selectedTemplate || isUploading}
                        className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? 'Uploading...' : 'Choose File'}
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                      />

                      <p className="text-xs text-muted-foreground mt-4">
                        Supports: JPG, PNG, WebP (Max 10MB)
                      </p>
                    </div>

                    {/* Decorative gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Canvas Preview */}
                    <div className="relative rounded-2xl overflow-hidden bg-muted/30 shadow-2xl" style={{ aspectRatio: '3/4' }}>
                      <canvas
                        ref={canvasRef}
                        className="w-full h-full"
                        style={{ display: 'block' }}
                      />
                      {isRendering && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Change Poster Button */}
                    <button
                      onClick={() => {
                        reset();
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Upload Different Poster
                    </button>
                  </div>
                )}

                {/* Quick Guide */}
                {!posterUrl && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <span>💡</span> Quick Start Guide
                    </h4>
                    <ol className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">1.</span>
                        <span>Select a brand template from the left</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">2.</span>
                        <span>Upload your poster image</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">3.</span>
                        <span>Adjust settings and export</span>
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Settings & Export */}
            <div className="lg:col-span-3">
              <div className="sticky top-24 space-y-6">
                
                {/* Settings Card */}
                <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Settings2 className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-foreground">Settings</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Padding Control */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-foreground">
                          Padding
                        </label>
                        <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                          {padding}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={padding}
                        onChange={(e) => setPadding(Number(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>No padding</span>
                        <span>Max padding</span>
                      </div>
                    </div>

                    {/* Watermark Opacity Control */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-foreground">
                          Watermark Opacity
                        </label>
                        <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                          {watermarkOpacity}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Transparent</span>
                        <span>Opaque</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export Card */}
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-2xl border border-primary/20 shadow-lg p-6">
                  <h3 className="text-sm font-bold text-foreground mb-4">
                    Export Options
                  </h3>

                  <div className="space-y-3">
                    {/* Download Button */}
                    <button
                      onClick={handleExport}
                      disabled={!posterUrl || isExporting}
                      className="w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isExporting ? (
                        <>
                          <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Exporting...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          <span>Download PNG</span>
                        </>
                      )}
                    </button>

                    {/* Copy to Clipboard */}
                    <button
                      onClick={handleCopyToClipboard}
                      disabled={!posterUrl}
                      className="w-full px-6 py-3 bg-card hover:bg-muted text-foreground rounded-xl font-medium border border-border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy to Clipboard</span>
                    </button>
                  </div>

                  <div className="mt-4 p-3 bg-card/50 rounded-lg">
                    <p className="text-xs text-muted-foreground text-center">
                      High quality 1080×1440 PNG format
                    </p>
                  </div>
                </div>

                {/* Export Success Message */}
                <AnimatePresence>
                  {exportedUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                        <span className="text-xl">✓</span>
                        <span className="font-semibold">Export Complete!</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your poster has been downloaded successfully
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>

          </div>
        </div>

        {/* History Modal */}
        <AnimatePresence>
          {showHistory && recentExports.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setShowHistory(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card rounded-2xl border border-border shadow-2xl p-6 max-w-5xl w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Export History</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your recently exported posters
                    </p>
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <span className="text-2xl text-muted-foreground">×</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {recentExports.map((item) => (
                    <div
                      key={item.id}
                      className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-muted border border-border hover:border-primary transition-all hover:shadow-xl"
                    >
                      <img
                        src={item.thumbnail}
                        alt="Export"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-xs text-white font-medium mb-2 truncate">
                            {item.templateName}
                          </p>
                          <a
                            href={item.url}
                            download
                            className="block w-full px-3 py-2 bg-white text-black rounded-lg text-xs font-medium text-center hover:bg-white/90 transition-colors"
                          >
                            <Download className="w-3 h-3 inline mr-1" />
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.2s;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.2s;
        }
        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </>
  );
}
