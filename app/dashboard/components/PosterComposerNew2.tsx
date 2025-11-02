'use client';

import { useState, useRef, useEffect } from 'react';
import { usePosterStore } from '@/lib/store';
import { toast, Toaster } from 'sonner';
import { Download, Copy, RotateCcw, History, Settings2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import TemplateGallery from './TemplateGallery';
import DragDropZone from './DragDropZone';
import ThemeToggle from './ThemeToggle';
import TemplateEditor from './TemplateEditor';

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
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  
  // Debounced values for smooth preview
  const [debouncedPadding] = useDebounce(padding, 100);
  const [debouncedOpacity] = useDebounce(watermarkOpacity, 100);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        
        // Add to history
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

  // Canvas preview effect with debounced values
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedTemplate) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1440;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = selectedTemplate.settings.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const drawLayers = async () => {
      // Layer 1: Background
      if (selectedTemplate.backgroundUrl) {
        const bgImg = new window.Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.src = selectedTemplate.backgroundUrl;
        await new Promise((resolve) => {
          bgImg.onload = () => {
            ctx.drawImage(bgImg, 0, 0, width, height);
            resolve(null);
          };
          bgImg.onerror = () => resolve(null);
        });
      }

      // Layer 2: Poster (contain mode)
      if (posterUrl) {
        const posterImg = new window.Image();
        posterImg.crossOrigin = 'anonymous';
        posterImg.src = posterUrl;
        await new Promise((resolve) => {
          posterImg.onload = () => {
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
          };
          posterImg.onerror = () => resolve(null);
        });
      }

      // Layer 3: Watermark
      if (selectedTemplate.watermarkUrl) {
        const wmImg = new window.Image();
        wmImg.crossOrigin = 'anonymous';
        wmImg.src = selectedTemplate.watermarkUrl;
        await new Promise((resolve) => {
          wmImg.onload = () => {
            ctx.globalAlpha = debouncedOpacity / 100;
            ctx.drawImage(wmImg, 0, 0, width, height);
            ctx.globalAlpha = 1.0;
            resolve(null);
          };
          wmImg.onerror = () => resolve(null);
        });
      }
    };

    drawLayers();
  }, [selectedTemplate, posterUrl, debouncedPadding, debouncedOpacity]);

  return (
    <>
      <Toaster position="top-right" richColors />
      <TemplateEditor isOpen={showTemplateEditor} onClose={() => setShowTemplateEditor(false)} />
      
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
        {/* Header */}
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 p-[2px]">
                  <div className="w-full h-full rounded-[6px] bg-white dark:bg-slate-900 flex items-center justify-center text-xl">
                    🎨
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 dark:from-cyan-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Poster Composer
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Create professional 3:4 posters in seconds
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {selectedTemplate && (
                  <button
                    onClick={() => setShowTemplateEditor(true)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-cyan-500 dark:hover:border-cyan-500"
                  >
                    <Settings className="w-4 h-4" />
                    Template Settings
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500"
                >
                  <History className="w-4 h-4" />
                  History
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Templates */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
                <TemplateGallery />
              </div>
            </div>

            {/* Center - Canvas Preview */}
            <div className="col-span-12 lg:col-span-6">
              <div className="space-y-4">
                {/* Canvas Area */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Live Preview
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        1080 × 1440 • 3:4 Ratio
                      </p>
                    </div>
                    {selectedTemplate && (
                      <div className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 dark:border-cyan-500/30 font-medium">
                        {selectedTemplate.name}
                      </div>
                    )}
                  </div>

                  {posterUrl ? (
                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-auto rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700"
                        style={{ maxHeight: '600px', objectFit: 'contain' }}
                      />
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
                      className="mt-4 w-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Upload Different Poster
                    </motion.button>
                  )}
                </div>

                {/* Export Result */}
                <AnimatePresence>
                  {exportedUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 backdrop-blur-sm rounded-2xl border border-green-200 dark:border-green-900/50 p-6 shadow-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="text-2xl">✅</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-green-900 dark:text-green-400 mb-1">
                            Export Successful!
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-400/80 mb-4">
                            Your poster is ready to download
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={exportedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg shadow-green-500/25"
                            >
                              <Download className="w-4 h-4" />
                              Download PNG
                            </a>
                            <button
                              onClick={handleCopyUrl}
                              className="px-4 py-2.5 text-sm font-medium text-green-700 dark:text-green-400 bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2 border border-green-200 dark:border-green-900/50"
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
            </div>

            {/* Right Sidebar - Settings & Actions */}
            <div className="col-span-12 lg:col-span-3">
              <div className="space-y-4">
                {/* Settings Card */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings2 className="w-5 h-5 text-cyan-500" />
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Adjust Settings
                    </h3>
                  </div>

                  <div className="space-y-5">
                    {/* Padding Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Padding
                        </label>
                        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 px-2 py-1 rounded bg-cyan-50 dark:bg-cyan-950/30">
                          {padding}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={padding}
                        onChange={(e) => setPadding(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider-cyan"
                      />
                    </div>

                    {/* Watermark Opacity Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Watermark Opacity
                        </label>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 px-2 py-1 rounded bg-purple-50 dark:bg-purple-950/30">
                          {watermarkOpacity}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider-purple"
                      />
                    </div>
                  </div>
                </div>

                {/* Export Actions */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-cyan-200 dark:border-cyan-900/30 p-6 shadow-lg">
                  <button
                    onClick={handleExport}
                    disabled={!posterUrl || isExporting || !selectedTemplate}
                    className="w-full px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-105"
                  >
                    {isExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export PNG
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-slate-600 dark:text-slate-400 mt-3">
                    High quality 1080×1440 PNG
                  </p>
                </div>

                {/* Info */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 backdrop-blur-sm rounded-2xl border border-amber-200 dark:border-amber-900/30 p-4 shadow-lg">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                    <span className="text-base">💡</span> Quick Guide
                  </h4>
                  <ul className="text-xs text-amber-800 dark:text-amber-400/80 space-y-1.5">
                    <li>1. Select a brand template</li>
                    <li>2. Upload or drag your poster</li>
                    <li>3. Adjust settings if needed</li>
                    <li>4. Click Export to download</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* History Panel (Modal/Slide-over) */}
          <AnimatePresence>
            {showHistory && recentExports.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                onClick={() => setShowHistory(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
                >
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                    Recent Exports
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {recentExports.map((item) => (
                      <div
                        key={item.id}
                        className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                      >
                        <img
                          src={item.thumbnail}
                          alt="Export"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-lg"
                          >
                            <Download className="w-5 h-5 text-slate-900 dark:text-slate-100" />
                          </a>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
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
