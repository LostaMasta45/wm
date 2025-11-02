'use client';

import { useState, useRef, useEffect } from 'react';
import { usePosterStore } from '@/lib/store';
import { toast, Toaster } from 'sonner';
import { Download, Upload, Sparkles, Check, X, Sun, Moon, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import TemplateSettingsModal from './TemplateSettingsModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function PosterComposerShadcn() {
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
    addRecentExport,
    updateTemplate,
    reset,
  } = usePosterStore();

  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedTemplateForSettings, setSelectedTemplateForSettings] = useState<typeof templates[0] | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  // Fix hydration error - wait for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

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

    const width = 1080;
    const height = 1440;
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
                ctx.drawImage(wmImg, 0, 0, width, height);
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
  }, [selectedTemplate, posterUrl, padding, watermarkOpacity]);

  // Handle template settings
  const handleOpenSettings = (e: React.MouseEvent, template: typeof templates[0]) => {
    e.stopPropagation();
    setSelectedTemplateForSettings(template);
    setSettingsModalOpen(true);
  };

  const handleUpdateTemplate = (data: { backgroundUrl?: string; watermarkUrl?: string }) => {
    if (selectedTemplateForSettings) {
      updateTemplate(selectedTemplateForSettings.id, data);
      toast.success('Template berhasil diupdate! 🎉');
      setSettingsModalOpen(false);
    }
  };

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

      addRecentExport({
        url: url,
        thumbnail: url,
        templateName: selectedTemplate?.name || 'Unknown',
        dimensions: '1080 × 1440',
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

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      
      {/* Main Container */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent truncate">
                  Poster Composer
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 hidden xs:block">
                  Buat poster profesional dalam hitungan detik ⚡
                </p>
              </div>
              
              {/* Theme Toggle - Only render after client mount to avoid hydration mismatch */}
              {mounted && (
                <Button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-[1.2rem] w-[1.2rem]" />
                  ) : (
                    <Moon className="h-[1.2rem] w-[1.2rem]" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
          
          {/* Step 1: Template Selection */}
          <section>
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="shrink-0" variant="default">1</Badge>
                <h2 className="text-lg sm:text-xl font-bold">Pilih Template Brand</h2>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground ml-9">
                Pilih template sesuai brand Anda
              </p>
            </div>

            {/* Template Cards - Horizontal Scroll */}
            <ScrollArea className="w-full">
              <div className="flex gap-3 sm:gap-4 pb-4">
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="shrink-0"
                  >
                    <Card 
                      className={`w-48 sm:w-56 lg:w-64 cursor-pointer transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'ring-2 ring-primary shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      {/* Template Preview */}
                      <CardContent className="p-0 relative aspect-[3/4] bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-6xl mb-2">🎨</div>
                            <div className="text-xs font-mono text-gray-600 dark:text-gray-400">3:4</div>
                          </div>
                        </div>
                        
                        {/* Selected Badge */}
                        {selectedTemplate?.id === template.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3"
                          >
                            <Badge className="bg-primary">
                              <Check className="w-3 h-3" />
                            </Badge>
                          </motion.div>
                        )}
                      </CardContent>

                      {/* Template Info */}
                      <CardHeader className={`p-3 sm:p-4 ${
                        selectedTemplate?.id === template.id
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : ''
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg truncate">
                              {template.name}
                            </CardTitle>
                            <CardDescription className={`text-xs sm:text-sm mt-0.5 truncate ${
                              selectedTemplate?.id === template.id ? 'text-blue-100' : ''
                            }`}>
                              {template.brandSlug}
                            </CardDescription>
                          </div>
                          
                          {/* Edit Button */}
                          <Button
                            variant={selectedTemplate?.id === template.id ? "secondary" : "ghost"}
                            size="icon"
                            className="shrink-0 h-7 w-7"
                            onClick={(e) => handleOpenSettings(e, template)}
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </section>

          <Separator />

          {/* Step 2: Live Preview */}
          <section>
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary">2</Badge>
                <h2 className="text-lg sm:text-xl font-bold">Live Preview</h2>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground ml-9">
                {posterUrl ? 'Lihat preview poster Anda' : 'Upload poster untuk melihat preview'}
              </p>
            </div>

            {/* Preview Container */}
            <Card>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                {!posterUrl ? (
                  /* Upload Zone */
                  <div
                    className={`
                      relative border-2 border-dashed rounded-xl transition-all duration-300
                      ${dragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                      }
                    `}
                    style={{ aspectRatio: '3/4' }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                      <motion.div
                        animate={{
                          y: dragActive ? -10 : 0,
                          scale: dragActive ? 1.1 : 1,
                        }}
                        className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-500 flex items-center justify-center mb-4 sm:mb-6 shadow-xl"
                      >
                        <Upload className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                      </motion.div>
                      
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">
                        {dragActive ? 'Drop poster di sini!' : 'Upload Poster Anda'}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm">
                        Drag & drop file di sini, atau klik tombol di bawah untuk pilih file
                      </p>

                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!selectedTemplate || isUploading}
                        size="lg"
                        className="relative"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Pilih File
                          </>
                        )}
                      </Button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                      />

                      <p className="text-xs text-muted-foreground mt-4">
                        JPG, PNG, WebP • Max 10MB
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Canvas Preview */
                  <div className="space-y-3 sm:space-y-4">
                    <div className="relative rounded-xl overflow-hidden shadow-xl" style={{ aspectRatio: '3/4' }}>
                      <canvas
                        ref={canvasRef}
                        className="w-full h-full"
                        style={{ display: 'block' }}
                      />
                      
                      {/* Info Badges */}
                      <Badge className="absolute top-2 left-2 sm:top-4 sm:left-4">
                        {selectedTemplate?.name}
                      </Badge>
                      
                      <Badge variant="secondary" className="absolute top-2 right-2 sm:top-4 sm:right-4">
                        1080 × 1440
                      </Badge>
                    </div>

                    {/* Change Button */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        reset();
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Upload Poster Lain
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Step 3: Settings (Only show when poster is uploaded) */}
          <AnimatePresence>
            {posterUrl && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Separator className="mb-6" />
                
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline">3</Badge>
                    <h2 className="text-lg sm:text-xl font-bold">Atur Pengaturan</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground ml-9">
                    Sesuaikan padding dan watermark sesuai kebutuhan
                  </p>
                </div>

                <Card>
                  <CardContent className="p-4 sm:p-6 lg:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                      
                      {/* Padding Control */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold">Padding (Jarak Tepi)</label>
                          <Badge variant="secondary" className="ml-2">{padding}%</Badge>
                        </div>
                        <Slider
                          value={[padding]}
                          onValueChange={([value]) => setPadding(value)}
                          min={0}
                          max={30}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Tidak ada</span>
                          <span>Maximum</span>
                        </div>
                      </div>

                      {/* Watermark Opacity Control */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold">Watermark Opacity</label>
                          <Badge variant="secondary" className="ml-2">{watermarkOpacity}%</Badge>
                        </div>
                        <Slider
                          value={[watermarkOpacity]}
                          onValueChange={([value]) => setWatermarkOpacity(value)}
                          min={0}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Transparan</span>
                          <span>Penuh</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Step 4: Download Button (Only show when poster is uploaded) */}
          <AnimatePresence>
            {posterUrl && (
              <motion.section
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 border-0 text-white">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl sm:text-3xl">Poster Siap Download! 🎉</CardTitle>
                    <CardDescription className="text-blue-100">
                      Klik tombol di bawah untuk download poster Anda
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <Button
                      onClick={handleExport}
                      disabled={isExporting}
                      size="lg"
                      variant="secondary"
                      className="font-bold text-lg shadow-xl"
                    >
                      {isExporting ? (
                        <>
                          <div className="w-5 h-5 border-3 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-5 w-5" />
                          Download Poster PNG
                        </>
                      )}
                    </Button>
                  </CardContent>
                  <CardFooter className="justify-center text-sm text-blue-100">
                    Format: PNG • Ukuran: 1080 × 1440 pixels • High Quality
                  </CardFooter>
                </Card>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Empty State Hint */}
          {!posterUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 sm:py-12"
            >
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Pilih template dan upload poster untuk mulai!
                </p>
              </div>
            </motion.div>
          )}
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
    </>
  );
}
