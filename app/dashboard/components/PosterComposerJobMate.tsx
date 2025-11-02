'use client';

import { useState, useRef, useEffect } from 'react';
import { usePosterStore } from '@/lib/store';
import { toast, Toaster } from 'sonner';
import { Download, Upload, Sparkles, Check, X, Sun, Moon, Settings, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import TemplateSettingsModal from './TemplateSettingsModal';
import SliderWithInput from './SliderWithInput';

export default function PosterComposerJobMate() {
  const {
    templates,
    selectedTemplate,
    setSelectedTemplate,
    posterUrl,
    setPosterUrl,
    padding,
    setPadding,
    watermarkOpacity,
    setWatermarkOpacity,
    watermarkSize,
    setWatermarkSize,
    addRecentExport,
    updateTemplate,
    reset,
    loadTemplatesFromDB,
  } = usePosterStore();

  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedTemplateForSettings, setSelectedTemplateForSettings] = useState<typeof templates[0] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'3:4' | '4:5'>('3:4');
  const [isSavingToHistory, setIsSavingToHistory] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use next-themes hook
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Fix hydration error - wait for client-side mount
  useEffect(() => {
    setMounted(true);
    // Load templates from Supabase on mount
    loadTemplatesFromDB();
  }, [loadTemplatesFromDB]);

  // Get current theme (resolvedTheme handles 'system' theme)
  const currentTheme = mounted ? (resolvedTheme || theme) : 'light';

  // Handle file upload
  const handleFileSelect = async (file: File) => {
    if (!file) return;
    if (!selectedTemplate) {
      toast.error('Pilih template dulu ya! 😊');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('File harus gambar ya!');
      return;
    }

    setIsUploading(true);

    try {
      const localUrl = URL.createObjectURL(file);
      setPosterUrl(localUrl);
      toast.success('Poster berhasil di-upload! 🎉');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal upload poster, coba lagi ya!');
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedTemplate) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Calculate dimensions based on aspect ratio
    const width = 1080;
    const height = aspectRatio === '3:4' ? 1440 : 1350; // 3:4 = 1080x1440, 4:5 = 1080x1350
    canvas.width = width;
    canvas.height = height;

    const render = async () => {
      try {
        // Background color
        ctx.fillStyle = selectedTemplate.settings.backgroundColor || '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Background image
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
            bgImg.onerror = () => resolve();
            bgImg.src = selectedTemplate.backgroundUrl + '?t=' + Date.now();
          });
        }

        // Poster image
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
            posterImg.onerror = () => resolve();
            posterImg.src = posterUrl;
          });
        }

        // Watermark
        if (selectedTemplate.watermarkUrl && watermarkOpacity > 0) {
          const wmImg = new Image();
          wmImg.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve) => {
            wmImg.onload = () => {
              try {
                ctx.globalAlpha = watermarkOpacity / 100;
                
                // Calculate watermark dimensions maintaining aspect ratio
                const wmAspectRatio = wmImg.width / wmImg.height;
                const canvasAspectRatio = width / height;
                
                // Size is a percentage (10-100)
                const sizeMultiplier = watermarkSize / 100;
                
                let wmWidth, wmHeight;
                if (wmAspectRatio > canvasAspectRatio) {
                  // Watermark is wider than canvas
                  wmWidth = width * sizeMultiplier;
                  wmHeight = wmWidth / wmAspectRatio;
                } else {
                  // Watermark is taller than canvas
                  wmHeight = height * sizeMultiplier;
                  wmWidth = wmHeight * wmAspectRatio;
                }
                
                // Center the watermark
                const wmX = (width - wmWidth) / 2;
                const wmY = (height - wmHeight) / 2;
                
                ctx.drawImage(wmImg, wmX, wmY, wmWidth, wmHeight);
                ctx.globalAlpha = 1.0;
              } catch (err) {
                console.error('Watermark draw error:', err);
                ctx.globalAlpha = 1.0;
              }
              resolve();
            };
            wmImg.onerror = () => resolve();
            wmImg.src = selectedTemplate.watermarkUrl + '?t=' + Date.now();
          });
        }
      } catch (error) {
        console.error('Render error:', error);
      }
    };

    render();
  }, [selectedTemplate, posterUrl, padding, watermarkOpacity, watermarkSize, aspectRatio]);

  // Handle template settings
  const handleOpenSettings = (e: React.MouseEvent, template: typeof templates[0]) => {
    e.stopPropagation();
    setSelectedTemplateForSettings(template);
    setSettingsModalOpen(true);
  };

  const handleUpdateTemplate = (data: { backgroundUrl?: string; watermarkUrl?: string }) => {
    if (selectedTemplateForSettings) {
      updateTemplate(selectedTemplateForSettings.id, data);
      toast.success('Template saved to database! 🎉');
      setSettingsModalOpen(false);
    }
  };

  // Auto-save settings changes to database (debounced)
  useEffect(() => {
    if (!selectedTemplate || !mounted) return;

    setIsSaving(true);
    const saveTimer = setTimeout(async () => {
      try {
        await fetch(`/api/templates/${selectedTemplate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: {
              padding,
              watermarkOpacity,
              watermarkSize,
              backgroundColor: selectedTemplate.settings.backgroundColor,
            },
          }),
        });
        setIsSaving(false);
      } catch (error) {
        console.error('Failed to auto-save settings:', error);
        setIsSaving(false);
      }
    }, 1500); // Debounce 1.5 seconds

    return () => {
      clearTimeout(saveTimer);
      setIsSaving(false);
    };
  }, [padding, watermarkOpacity, watermarkSize, selectedTemplate, mounted]);

  // Export handler
  const handleExport = async () => {
    if (!posterUrl) {
      toast.error('Upload poster dulu ya! 📸');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('Canvas belum siap!');
      return;
    }

    setIsExporting(true);
    toast.loading('Sedang export poster...', { id: 'export' });

    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      if (!blob) throw new Error('Failed to create image blob');

      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `poster-${selectedTemplate?.brandSlug}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const height = aspectRatio === '3:4' ? 1440 : 1350;
      addRecentExport({
        url: url,
        thumbnail: url,
        templateName: selectedTemplate?.name || 'Unknown',
        dimensions: `1080 × ${height}`,
        size: Math.round(blob.size / 1024) + ' KB',
      });

      toast.success('Poster berhasil di-download! 🎉', { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export gagal, coba lagi ya!', { id: 'export' });
    } finally {
      setIsExporting(false);
    }
  };

  // Save to history handler
  const handleSaveToHistory = async () => {
    if (!posterUrl || !selectedTemplate) {
      toast.error('Upload poster dan pilih template dulu ya!');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('Canvas belum siap!');
      return;
    }

    setIsSavingToHistory(true);
    toast.loading('Menyimpan ke history...', { id: 'save-history' });

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      if (!blob) throw new Error('Failed to create image blob');

      // Create object URL for the poster
      const posterDataUrl = canvas.toDataURL('image/png', 1.0);
      
      const height = aspectRatio === '3:4' ? 1440 : 1350;
      const fileSizeKB = Math.round(blob.size / 1024);

      // Save to database
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          template_name: selectedTemplate.name,
          brand_slug: selectedTemplate.brandSlug,
          poster_url: posterDataUrl, // Save as base64 data URL
          thumbnail_url: posterDataUrl,
          settings: {
            padding,
            watermarkOpacity,
            watermarkSize,
            aspectRatio,
            backgroundColor: selectedTemplate.settings.backgroundColor,
          },
          dimensions: `1080 × ${height}`,
          file_size: `${fileSizeKB} KB`,
          format: 'png',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save to history');
      }

      const result = await response.json();
      toast.success('Berhasil disimpan ke history! ✅', { id: 'save-history' });
    } catch (error) {
      console.error('Save to history error:', error);
      toast.error('Gagal menyimpan ke history!', { id: 'save-history' });
    } finally {
      setIsSavingToHistory(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      
      {/* Main Container - Minimalist B&W */}
      <div className="min-h-screen bg-white dark:bg-black">
        
        {/* Header - Compact */}
        <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
          <div className="w-full px-4 md:px-6 lg:px-8 py-3 md:py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-xl font-bold text-black dark:text-white truncate">
                  Poster Composer
                </h1>
              </div>
              
              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                  aria-label="Toggle theme"
                  title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {currentTheme === 'dark' ? (
                    <Sun className="w-5 h-5 text-white" />
                  ) : (
                    <Moon className="w-5 h-5 text-black" />
                  )}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content - Full Width Layout */}
        <div className="w-full px-4 md:px-6 lg:px-8 py-4 md:py-6">
          
          {/* Step 1: Template Selection */}
          <section className="mb-4 md:mb-6">
            <div className="mb-3">
              <h2 className="text-sm md:text-base font-semibold text-black dark:text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold">
                  1
                </span>
                <span>Choose Template</span>
              </h2>
            </div>

            {/* Template Cards - Horizontal Scroll */}
            <div className="relative -mx-4 md:mx-0">
              <div className="flex gap-2 sm:gap-2.5 md:gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide px-4 md:px-0">
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      relative flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] lg:w-[180px] rounded-lg overflow-hidden snap-start cursor-pointer border-2 transition-all
                      ${selectedTemplate?.id === template.id
                        ? 'border-black dark:border-white shadow-lg'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    {/* Template Preview */}
                    <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-900 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-3xl sm:text-4xl">🎨</div>
                      </div>
                      
                      {/* Selected Badge */}
                      {selectedTemplate?.id === template.id && (
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black dark:bg-white flex items-center justify-center">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white dark:text-black" />
                        </div>
                      )}
                    </div>

                    {/* Template Info */}
                    <div className={`
                      p-1.5 sm:p-2 md:p-2.5 transition-colors
                      ${selectedTemplate?.id === template.id
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-white dark:bg-black text-black dark:text-white'
                      }
                    `}>
                      <div className="flex items-center justify-between gap-1 sm:gap-1.5">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[11px] sm:text-xs md:text-sm truncate">{template.name}</h3>
                          <p className={`text-[9px] sm:text-[10px] truncate ${
                            selectedTemplate?.id === template.id
                              ? 'text-gray-300 dark:text-gray-700'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {template.brandSlug}
                          </p>
                        </div>
                        
                        {/* Edit Button */}
                        <button
                          onClick={(e) => handleOpenSettings(e, template)}
                          className={`
                            flex-shrink-0 p-0.5 sm:p-1 rounded transition-colors border
                            ${selectedTemplate?.id === template.id
                              ? 'border-white/30 dark:border-black/30 hover:bg-white/10 dark:hover:bg-black/10'
                              : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900'
                            }
                          `}
                          title="Edit"
                        >
                          <Settings className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Step 2 & 3: Grid Layout - Preview + Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            
            {/* Left: Preview */}
            <div className="lg:col-span-2">
              <div className="mb-2 sm:mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm md:text-base font-semibold text-black dark:text-white flex items-center gap-1.5 sm:gap-2">
                  <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold">
                    2
                  </span>
                  <span>Preview</span>
                </h2>
                
                {/* Aspect Ratio Selector */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setAspectRatio('3:4')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      aspectRatio === '3:4'
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    3:4
                  </button>
                  <button
                    onClick={() => setAspectRatio('4:5')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      aspectRatio === '4:5'
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    4:5
                  </button>
                </div>
              </div>

              {/* Preview Container */}
              <div className="bg-white dark:bg-black rounded-lg border-2 border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-3 sm:p-4 md:p-6">
                {!posterUrl ? (
                  /* Upload Zone */
                  <div
                    className={`
                      relative border-2 border-dashed rounded-lg transition-all
                      ${dragActive
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-900'
                        : 'border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white hover:bg-gray-50 dark:hover:bg-gray-900'
                      }
                    `}
                    style={{ aspectRatio: aspectRatio === '3:4' ? '3/4' : '4/5' }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-black dark:bg-white flex items-center justify-center mb-3 sm:mb-4">
                        <Upload className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white dark:text-black" />
                      </div>
                      
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-black dark:text-white mb-1.5 sm:mb-2">
                        {dragActive ? 'Drop Here' : 'Upload Poster'}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-xs px-2">
                        Drag & drop or click button
                      </p>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!selectedTemplate || isUploading}
                        className="px-4 py-2 sm:px-6 sm:py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold text-xs sm:text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                            <span>Uploading...</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            <span>Choose File</span>
                          </span>
                        )}
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                      />

                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-3 sm:mt-4">
                        JPG, PNG, WebP • Max 10MB
                      </p>
                    </div>
                  </div>
                  ) : (
                    /* Canvas Preview */
                    <div className="space-y-3">
                      <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800" style={{ aspectRatio: aspectRatio === '3:4' ? '3/4' : '4/5' }}>
                        <canvas
                          ref={canvasRef}
                          className="w-full h-full"
                          style={{ display: 'block' }}
                        />
                        
                        {/* Info Badge */}
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-1 sm:px-3 sm:py-1.5 bg-black dark:bg-white backdrop-blur-sm rounded text-white dark:text-black text-[10px] sm:text-xs font-semibold truncate max-w-[50%]">
                          {selectedTemplate?.name}
                        </div>
                        
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-1 sm:px-3 sm:py-1.5 bg-black dark:bg-white backdrop-blur-sm rounded text-white dark:text-black text-[10px] sm:text-xs font-mono">
                          1080×{aspectRatio === '3:4' ? '1440' : '1350'}
                        </div>
                      </div>

                      {/* Change Button */}
                      <button
                        onClick={() => {
                          reset();
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="w-full px-3 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white text-black dark:text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                      >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Change Poster</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Settings + Export (Only show when poster is uploaded) */}
            <AnimatePresence>
              {posterUrl && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="lg:col-span-1 space-y-3 sm:space-y-4 md:space-y-6"
                >
                  {/* Settings */}
                  <div>
                    <div className="mb-2 sm:mb-3">
                      <h2 className="text-sm md:text-base font-semibold text-black dark:text-white flex items-center gap-1.5 sm:gap-2">
                        <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold">
                          3
                        </span>
                        <span>Settings</span>
                      </h2>
                    </div>

                    <div className="bg-white dark:bg-black rounded-lg border-2 border-gray-200 dark:border-gray-800 p-3 sm:p-4 md:p-5">
                      <div className="space-y-4 sm:space-y-5 md:space-y-6">
                        {isSaving && (
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 animate-pulse text-center">
                            Auto-saving...
                          </div>
                        )}
                    
                        {/* Padding Control */}
                        <SliderWithInput
                          label="Padding"
                          value={padding}
                          onChange={setPadding}
                          min={0}
                          max={30}
                          step={1}
                          unit="%"
                          minLabel="0%"
                          maxLabel="30%"
                        />

                        {/* Watermark Size Control */}
                        <SliderWithInput
                          label="Watermark Size"
                          value={watermarkSize}
                          onChange={setWatermarkSize}
                          min={10}
                          max={100}
                          step={1}
                          unit="%"
                          minLabel="10%"
                          maxLabel="100%"
                        />

                        {/* Watermark Opacity Control */}
                        <SliderWithInput
                          label="Watermark Opacity"
                          value={watermarkOpacity}
                          onChange={setWatermarkOpacity}
                          min={0}
                          max={100}
                          step={1}
                          unit="%"
                          minLabel="0%"
                          maxLabel="100%"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Export & Save Buttons */}
                  <div className="bg-white dark:bg-black rounded-lg border-2 border-gray-200 dark:border-gray-800 p-3 sm:p-4 md:p-5 space-y-3">
                    {/* Download Button */}
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="w-full px-4 py-2.5 sm:py-3 md:py-4 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold text-xs sm:text-sm md:text-base hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isExporting ? (
                        <>
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                          <span>Exporting...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Download PNG</span>
                        </>
                      )}
                    </button>

                    {/* Save to History Button */}
                    <button
                      onClick={handleSaveToHistory}
                      disabled={isSavingToHistory}
                      className="w-full px-4 py-2.5 sm:py-3 bg-white dark:bg-black border-2 border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white text-black dark:text-white rounded-lg font-bold text-xs sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSavingToHistory ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/30 dark:border-white/30 border-t-black dark:border-t-white rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <History className="w-4 h-4" />
                          <span>Save to History</span>
                        </>
                      )}
                    </button>

                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 text-center">
                      1080×{aspectRatio === '3:4' ? '1440' : '1350'} px • High Quality
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>

      {/* Template Settings Modal */}
      {selectedTemplateForSettings && (
        <TemplateSettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          templateId={selectedTemplateForSettings.id}
          templateName={selectedTemplateForSettings.name}
          currentBackground={selectedTemplateForSettings.backgroundUrl}
          currentWatermark={selectedTemplateForSettings.watermarkUrl}
          onUpdate={handleUpdateTemplate}
        />
      )}

      {/* Custom Slider Styles */}
      <style jsx>{`
        .modern-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 4px;
          background: #E5E7EB;
          outline: none;
          transition: background 0.2s;
        }

        .dark .modern-slider {
          background: #1F2937;
        }

        .modern-slider:hover {
          background: #D1D5DB;
        }

        .dark .modern-slider:hover {
          background: #374151;
        }

        .modern-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #000000;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .dark .modern-slider::-webkit-slider-thumb {
          background: #FFFFFF;
          box-shadow: 0 2px 6px rgba(255, 255, 255, 0.2);
        }

        .modern-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
        }

        .dark .modern-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 3px 8px rgba(255, 255, 255, 0.3);
        }

        .modern-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #000000;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .dark .modern-slider::-moz-range-thumb {
          background: #FFFFFF;
          box-shadow: 0 2px 6px rgba(255, 255, 255, 0.2);
        }

        .modern-slider::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
        }

        .dark .modern-slider::-moz-range-thumb:hover {
          box-shadow: 0 3px 8px rgba(255, 255, 255, 0.3);
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
