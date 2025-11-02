'use client';

import { useState, useRef, useEffect } from 'react';
import { usePosterStore } from '@/lib/store';
import { toast, Toaster } from 'sonner';
import { Download, Copy, RotateCcw, History, Settings2, X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import TemplateManager from './TemplateManager';
import DragDropZone from './DragDropZone';
import ThemeToggle from './ThemeToggle';
import SliderControl from './SliderControl';
import { Maximize2, Droplet } from 'lucide-react';

export default function PosterComposer() {
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
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Handle responsive sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Debounced values for smooth preview
  const [debouncedPadding] = useDebounce(padding, 100);
  const [debouncedOpacity] = useDebounce(watermarkOpacity, 100);
  const [isRendering, setIsRendering] = useState(false);

  // Upload handler
  const handlePosterUpload = async (file: File) => {
    if (!file) return;
    if (!selectedTemplate) {
      toast.error('Please select a template first!');
      return;
    }

    setIsUploading(true);
    toast.loading('Uploading poster...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'poster');
      formData.append('brandSlug', selectedTemplate.brandSlug);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.status === 'success') {
        setPosterUrl(result.data.url);
        toast.success('Poster uploaded successfully!');
      } else {
        toast.error(`Upload failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      toast.dismiss();
    }
  };

  // Export handler
  const handleExport = async () => {
    if (!posterUrl) {
      toast.error('Please upload a poster first!');
      return;
    }

    if (!selectedTemplate) {
      toast.error('Please select a template first!');
      return;
    }

    setIsExporting(true);
    toast.loading('Rendering poster...');
    
    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posterUrl,
          backgroundUrl: selectedTemplate.backgroundUrl,
          watermarkUrl: selectedTemplate.watermarkUrl,
          settings: {
            width: 1080,
            height: 1440,
            backgroundColor: selectedTemplate.settings.backgroundColor,
            paddingPct: padding,
            watermarkOpacity: watermarkOpacity / 100,
          },
          brandSlug: selectedTemplate.brandSlug,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setExportedUrl(result.data.url);
        
        addRecentExport({
          url: result.data.url,
          thumbnail: result.data.url,
          templateName: selectedTemplate.name,
        });
        
        toast.success('Export successful!');
      } else {
        toast.error(`Export failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      toast.dismiss();
    }
  };

  // Reset handler
  const handleReset = () => {
    reset();
    toast.success('Reset complete!');
  };

  // Copy URL handler
  const handleCopyUrl = () => {
    if (exportedUrl) {
      navigator.clipboard.writeText(exportedUrl);
      toast.success('URL copied to clipboard!');
    }
  };

  // Smooth canvas preview with requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedTemplate) return;

    const ctx = canvas.getContext('2d', { 
      alpha: false,
      willReadFrequently: false 
    });
    if (!ctx) return;

    const width = 1080;
    const height = 1440;
    canvas.width = width;
    canvas.height = height;

    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsRendering(true);

    // Clear canvas with background
    ctx.fillStyle = selectedTemplate.settings.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const drawLayers = async () => {
      try {
        // Layer 1: Background
        if (selectedTemplate.backgroundUrl) {
          try {
            const bgImg = new window.Image();
            bgImg.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              bgImg.onload = () => {
                try {
                  ctx.drawImage(bgImg, 0, 0, width, height);
                  resolve(null);
                } catch (err) {
                  console.error('Background draw error:', err);
                  resolve(null);
                }
              };
              bgImg.onerror = (err) => {
                console.error('Background load error:', err);
                resolve(null);
              };
              bgImg.src = selectedTemplate.backgroundUrl;
            });
          } catch (err) {
            console.error('Background layer error:', err);
          }
        }

        // Layer 2: Poster (contain mode)
        if (posterUrl) {
          try {
            const posterImg = new window.Image();
            posterImg.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              posterImg.onload = () => {
                try {
                  const paddingPx = (Math.min(width, height) * debouncedPadding) / 100;
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
                  resolve(null);
                } catch (err) {
                  console.error('Poster draw error:', err);
                  resolve(null);
                }
              };
              posterImg.onerror = (err) => {
                console.error('Poster load error:', err);
                resolve(null);
              };
              posterImg.src = posterUrl;
            });
          } catch (err) {
            console.error('Poster layer error:', err);
          }
        }

        // Layer 3: Watermark
        if (selectedTemplate.watermarkUrl) {
          try {
            const wmImg = new window.Image();
            wmImg.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              wmImg.onload = () => {
                try {
                  ctx.globalAlpha = debouncedOpacity / 100;
                  ctx.drawImage(wmImg, 0, 0, width, height);
                  ctx.globalAlpha = 1.0;
                  resolve(null);
                } catch (err) {
                  console.error('Watermark draw error:', err);
                  ctx.globalAlpha = 1.0;
                  resolve(null);
                }
              };
              wmImg.onerror = (err) => {
                console.error('Watermark load error:', err);
                resolve(null);
              };
              wmImg.src = selectedTemplate.watermarkUrl;
            });
          } catch (err) {
            console.error('Watermark layer error:', err);
          }
        }
      } catch (error) {
        console.error('DrawLayers error:', error);
        toast.error('Failed to render preview');
      }
    };

    // Use requestAnimationFrame for smooth rendering
    animationFrameRef.current = requestAnimationFrame(() => {
      drawLayers().then(() => {
        setIsRendering(false);
      });
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [selectedTemplate, posterUrl, debouncedPadding, debouncedOpacity]);

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      
      <div className="min-h-screen bg-background transition-colors duration-200">
        {/* Header - Mobile Optimized */}
        <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                  Poster Composer
                </h1>
                <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Create professional 3:4 posters
                </p>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="hidden sm:flex px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors items-center gap-2 hover:bg-muted rounded-lg"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden md:inline">History</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Left Sidebar - Mobile Drawer */}
            <AnimatePresence>
              {(showSidebar || isLargeScreen) && (
                <motion.div
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25 }}
                  className="fixed lg:relative inset-y-0 left-0 z-40 lg:col-span-3 w-72 lg:w-auto"
                >
                  {/* Mobile Overlay */}
                  <div 
                    className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowSidebar(false)}
                  />
                  
                  <div className="relative h-full lg:h-auto bg-card backdrop-blur-sm rounded-none lg:rounded-xl border-r lg:border border-border shadow-2xl lg:shadow-lg p-4 sm:p-6 overflow-y-auto">
                    <div className="flex items-center justify-between lg:hidden mb-4">
                      <h2 className="font-semibold">Templates</h2>
                      <button
                        onClick={() => setShowSidebar(false)}
                        className="p-2 hover:bg-muted rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <TemplateManager />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Center - Canvas Preview */}
            <div className="lg:col-span-6 space-y-4">
              {/* Canvas Card */}
              <div className="bg-card backdrop-blur-sm rounded-xl border border-border shadow-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                      Live Preview
                      {isRendering && (
                        <span className="inline-flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      1080 × 1440 • 3:4 Ratio
                    </p>
                  </div>
                  {selectedTemplate && (
                    <div className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                      {selectedTemplate.name}
                    </div>
                  )}
                </div>

                {posterUrl ? (
                  <div className="relative rounded-lg overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-auto rounded-lg shadow-2xl"
                      style={{ maxHeight: '70vh', objectFit: 'contain' }}
                    />
                    {isRendering && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <DragDropZone
                    onFileSelect={handlePosterUpload}
                    isUploading={isUploading}
                  />
                )}

                {posterUrl && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleReset}
                    className="mt-4 w-full px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Upload Different Poster
                  </motion.button>
                )}
              </div>

              {/* Export Success Card */}
              <AnimatePresence>
                {exportedUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="bg-success/10 backdrop-blur-sm rounded-xl border border-success/30 p-4 sm:p-6 shadow-lg"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">✅</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base sm:text-lg font-semibold text-success mb-1">
                          Export Successful!
                        </h4>
                        <p className="text-sm text-foreground/80 mb-3 sm:mb-4">
                          Your poster is ready to download
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <a
                            href={exportedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-success hover:bg-success/90 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download PNG
                          </a>
                          <button
                            onClick={handleCopyUrl}
                            className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copy URL
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Sidebar - Settings - Mobile Bottom Sheet */}
            <div className="lg:col-span-3">
              {/* Mobile Settings Toggle */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="lg:hidden w-full mb-4 px-4 py-3 text-sm font-medium text-foreground bg-card border border-border rounded-lg flex items-center justify-between shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  Settings & Export
                </span>
                <span className="text-muted-foreground">{showSettings ? '▲' : '▼'}</span>
              </button>

              <div className={`space-y-4 ${showSettings || 'hidden lg:block'}`}>
                {/* Settings Card */}
                <div className="bg-card backdrop-blur-sm rounded-xl border border-border shadow-lg p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings2 className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Settings
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {/* Padding Slider */}
                    <SliderControl
                      label="Padding"
                      value={padding}
                      min={0}
                      max={30}
                      unit="%"
                      icon={<Maximize2 className="w-4 h-4" />}
                      onChange={setPadding}
                      color="primary"
                    />

                    {/* Watermark Opacity Slider */}
                    <SliderControl
                      label="Watermark Opacity"
                      value={watermarkOpacity}
                      min={0}
                      max={100}
                      unit="%"
                      icon={<Droplet className="w-4 h-4" />}
                      onChange={setWatermarkOpacity}
                      color="primary"
                    />
                  </div>
                </div>

                {/* Export Button Card */}
                <div className="bg-card backdrop-blur-sm rounded-xl border border-border shadow-lg p-4 sm:p-6">
                  <button
                    onClick={handleExport}
                    disabled={!posterUrl || isExporting || !selectedTemplate}
                    className="w-full px-6 py-3.5 text-sm font-medium text-white bg-gradient-to-r from-primary via-primary to-secondary hover:opacity-90 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                  >
                    {isExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Export PNG
                      </>
                    )}
                  </button>

                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    High quality 1080×1440 PNG
                  </p>
                </div>

                {/* Quick Guide Card */}
                <div className="hidden lg:block bg-primary/5 backdrop-blur-sm rounded-xl border border-primary/20 p-4 shadow-md">
                  <h4 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                    <span>💡</span> Quick Guide
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li>1. Select a brand template</li>
                    <li>2. Upload or drag your poster</li>
                    <li>3. Adjust settings if needed</li>
                    <li>4. Click Export to download</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* History Panel Modal */}
          <AnimatePresence>
            {showHistory && recentExports.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowHistory(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card rounded-2xl border border-border shadow-2xl p-4 sm:p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-foreground">
                      Recent Exports
                    </h3>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {recentExports.map((item) => (
                      <div
                        key={item.id}
                        className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-muted border border-border shadow-md hover:shadow-xl transition-shadow"
                      >
                        <img
                          src={item.thumbnail}
                          alt="Export"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                            title="Download"
                          >
                            <Download className="w-5 h-5 text-white" />
                          </a>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90">
                          <p className="text-xs text-white font-medium truncate">
                            {item.templateName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
