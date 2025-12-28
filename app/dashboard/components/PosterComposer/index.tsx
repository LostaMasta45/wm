'use client';

import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { usePosterStore } from '@/lib/store';
import { toast, Toaster } from 'sonner';
import { Sun, Moon, History, Layers, Undo2, Redo2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { extractColorsFromImage } from '@/lib/colorExtractor';

import { useImageCache, useKeyboardShortcuts, useBatchExport, useUndoRedo, renderHDCanvas, RenderSettings } from './hooks';
import TemplateSelector from './TemplateSelector';
import PreviewCanvas from './PreviewCanvas';
import SettingsPanel from './SettingsPanel';
import KeyboardShortcutsHint from './KeyboardShortcutsHint';
import BatchUploadPanel from './BatchUploadPanel';

// Lazy load modals for better performance
const TemplateSettingsModal = lazy(() => import('../TemplateSettingsModal'));
const AddTemplateModal = lazy(() => import('../AddTemplateModal'));
const DeleteConfirmDialog = lazy(() => import('../DeleteConfirmDialog'));
const CropModal = lazy(() => import('../CropModal'));

const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function PosterComposer() {
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
    borderRadius,
    setBorderRadius,
    blurIntensity,
    setBlurIntensity,
    dynamicBackgroundColor,
    setDynamicBackgroundColor,
    addRecentExport,
    updateTemplate,
    reset,
    loadTemplatesFromDB,
  } = usePosterStore();

  // Local state
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'3:4' | '4:5'>('3:4');
  const [isSavingToHistory, setIsSavingToHistory] = useState(false);

  // Modal states
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedTemplateForSettings, setSelectedTemplateForSettings] = useState<typeof templates[0] | null>(null);
  const [addTemplateModalOpen, setAddTemplateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<typeof templates[0] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');

  // Original image URL - preserved for re-cropping
  const [originalPosterUrl, setOriginalPosterUrl] = useState<string>('');

  // Batch upload state
  const [batchMode, setBatchMode] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Use image cache hook
  const { images, imagesLoaded } = useImageCache({
    backgroundUrl: selectedTemplate?.backgroundUrl || '',
    posterUrl: posterUrl,
    watermarkUrl: selectedTemplate?.watermarkUrl || '',
  });

  // Auto-save disabled - use manual save button instead
  // This prevents accidental saves when adjusting settings in batch mode
  // useAutoSave({
  //   templateId: selectedTemplate?.id,
  //   settings: {
  //     padding,
  //     watermarkOpacity,
  //     watermarkSize,
  //     borderRadius,
  //     backgroundColor: selectedTemplate?.settings.backgroundColor || '#FFFFFF',
  //   },
  //   enabled: mounted,
  //   onSaveStart: () => setIsSaving(true),
  //   onSaveEnd: () => setIsSaving(false),
  //   onSaveError: (error) => console.error('Auto-save failed:', error),
  // });

  // Use undo/redo hook for settings
  const {
    pushState: pushUndoState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory: resetUndoHistory,
  } = useUndoRedo(
    { padding, watermarkOpacity, watermarkSize, borderRadius },
    {
      onUndo: (state) => {
        setPadding(state.padding);
        setWatermarkOpacity(state.watermarkOpacity);
        setWatermarkSize(state.watermarkSize);
        setBorderRadius(state.borderRadius);
        toast.success('Undo!', { duration: 1000 });
      },
      onRedo: (state) => {
        setPadding(state.padding);
        setWatermarkOpacity(state.watermarkOpacity);
        setWatermarkSize(state.watermarkSize);
        setBorderRadius(state.borderRadius);
        toast.success('Redo!', { duration: 1000 });
      },
    }
  );

  const currentTheme = mounted ? (resolvedTheme || theme) : 'light';

  // Render settings for canvas (defined early for batch export hook)
  const renderSettings: RenderSettings = {
    padding,
    watermarkOpacity,
    watermarkSize,
    borderRadius,
    aspectRatio,
    backgroundColor: selectedTemplate?.settings.backgroundColor || '#FFFFFF',
    dynamicBackgroundColor,
    blurIntensity,
  };

  // Use batch export hook
  const {
    files: batchFiles,
    isExporting: isBatchExporting,
    progress: batchProgress,
    addFiles: addBatchFiles,
    removeFile: removeBatchFile,
    clearFiles: clearBatchFiles,
    exportAll: exportAllBatch,
  } = useBatchExport({
    settings: renderSettings,
    templateSlug: selectedTemplate?.brandSlug || 'poster',
    backgroundUrl: selectedTemplate?.backgroundUrl || '',
    watermarkUrl: selectedTemplate?.watermarkUrl || '',
    onProgress: (current, total) => {
      console.log(`Batch export progress: ${current}/${total}`);
    },
    onComplete: (success, total) => {
      toast.success(`Exported ${success}/${total} posters!`);
      setBatchMode(false);
    },
    onError: (error, fileName) => {
      toast.error(`Failed to export ${fileName}`);
    },
  });

  // Mount effect
  useEffect(() => {
    setMounted(true);
    loadTemplatesFromDB();
  }, [loadTemplatesFromDB]);

  // Handle file upload with compression
  const handleFileSelect = useCallback(async (file: File) => {
    if (!selectedTemplate) {
      toast.error('Pilih template dulu ya!');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('File harus gambar ya!');
      return;
    }

    setIsUploading(true);

    try {
      // Use original file without compression to maintain HD quality
      const localUrl = URL.createObjectURL(file);
      setPosterUrl(localUrl);
      setOriginalPosterUrl(localUrl); // Store original for re-cropping

      if (selectedTemplate?.settings.backgroundColor === '#DYNAMIC') {
        toast.loading('Extracting colors...', { id: 'color-extract' });
        try {
          const colors = await extractColorsFromImage(localUrl);
          setDynamicBackgroundColor(colors.dominant);
          toast.success('Colors extracted!', { id: 'color-extract' });
        } catch (error) {
          console.error('Color extraction error:', error);
          toast.error('Failed to extract color', { id: 'color-extract' });
        }
      }

      toast.success('Poster berhasil di-upload!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal upload poster, coba lagi ya!');
    } finally {
      setIsUploading(false);
    }
  }, [selectedTemplate, setPosterUrl, setDynamicBackgroundColor]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length === 0) return;

      if (batchMode) {
        // Batch mode: add all files
        const newItems = addBatchFiles(files);

        // If no poster is currently showing, show the first new one
        if (!posterUrl && newItems.length > 0) {
          setPosterUrl(newItems[0].url);
          setCurrentBatchIndex(0);

          // Extract color if needed
          if (selectedTemplate?.settings.backgroundColor === '#DYNAMIC') {
            try {
              const colors = await extractColorsFromImage(newItems[0].url);
              setDynamicBackgroundColor(colors.dominant);
            } catch (error) {
              console.error('Color extraction error:', error);
            }
          }
        }

        toast.success(`Added ${files.length} files to batch`);
      } else if (files.length > 1) {
        // Auto-enable batch mode
        setBatchMode(true);
        const newItems = addBatchFiles(files);

        if (newItems.length > 0) {
          setPosterUrl(newItems[0].url);
          setCurrentBatchIndex(0);

          // Extract color if needed
          if (selectedTemplate?.settings.backgroundColor === '#DYNAMIC') {
            try {
              const colors = await extractColorsFromImage(newItems[0].url);
              setDynamicBackgroundColor(colors.dominant);
            } catch (error) {
              console.error('Color extraction error:', error);
            }
          }
        }

        toast.success(`Batch mode activated with ${files.length} files`);
      } else {
        // Single file mode
        handleFileSelect(files[0]);
      }
    }
  }, [handleFileSelect, batchMode, addBatchFiles, posterUrl, setPosterUrl, selectedTemplate, setDynamicBackgroundColor]);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      if (files.length === 0) return;

      if (batchMode) {
        // Batch mode: add all files
        const newItems = addBatchFiles(files);

        // If no poster is currently showing, show the first new one
        if (!posterUrl && newItems.length > 0) {
          setPosterUrl(newItems[0].url);
          setCurrentBatchIndex(0);

          // Extract color if needed
          if (selectedTemplate?.settings.backgroundColor === '#DYNAMIC') {
            try {
              const colors = await extractColorsFromImage(newItems[0].url);
              setDynamicBackgroundColor(colors.dominant);
            } catch (error) {
              console.error('Color extraction error:', error);
            }
          }
        }

        toast.success(`Added ${files.length} files to batch`);
      } else if (files.length > 1) {
        // Auto-enable batch mode
        setBatchMode(true);
        const newItems = addBatchFiles(files);

        if (newItems.length > 0) {
          setPosterUrl(newItems[0].url);
          setCurrentBatchIndex(0);

          // Extract color if needed
          if (selectedTemplate?.settings.backgroundColor === '#DYNAMIC') {
            try {
              const colors = await extractColorsFromImage(newItems[0].url);
              setDynamicBackgroundColor(colors.dominant);
            } catch (error) {
              console.error('Color extraction error:', error);
            }
          }
        }

        toast.success(`Batch mode activated with ${files.length} files`);
      } else {
        // Single file mode
        handleFileSelect(files[0]);
      }
    }
  }, [handleFileSelect, batchMode, addBatchFiles, posterUrl, setPosterUrl, selectedTemplate, setDynamicBackgroundColor]);

  // Template handlers
  const handleSelectTemplate = useCallback((template: typeof templates[0]) => {
    setSelectedTemplate(template);
    const settings = template.settings;
    setPadding(settings.padding ?? 8);
    setWatermarkOpacity(settings.watermarkOpacity ?? 0);
    setWatermarkSize(settings.watermarkSize ?? 30);
    setBorderRadius(settings.borderRadius ?? 0);
  }, [setSelectedTemplate, setPadding, setWatermarkOpacity, setWatermarkSize, setBorderRadius]);

  const handleOpenSettings = useCallback((e: React.MouseEvent, template: typeof templates[0]) => {
    e.stopPropagation();
    setSelectedTemplateForSettings(template);
    setSettingsModalOpen(true);
  }, []);

  const handleOpenDelete = useCallback((e: React.MouseEvent, template: typeof templates[0]) => {
    e.stopPropagation();
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  }, []);

  const handleUpdateTemplate = useCallback((data: { backgroundUrl?: string; watermarkUrl?: string }) => {
    if (selectedTemplateForSettings) {
      updateTemplate(selectedTemplateForSettings.id, data);
      toast.success('Template saved!');
      setSettingsModalOpen(false);
    }
  }, [selectedTemplateForSettings, updateTemplate]);

  const handleDeleteTemplate = useCallback(async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);
    toast.loading('Deleting template...', { id: 'delete-template' });

    try {
      const response = await fetch(`/api/templates/${templateToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete template');

      if (selectedTemplate?.id === templateToDelete.id) {
        setSelectedTemplate(null);
        setPosterUrl('');
      }

      await loadTemplatesFromDB();
      toast.success('Template deleted!', { id: 'delete-template' });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error('Delete template error:', error);
      toast.error('Failed to delete template!', { id: 'delete-template' });
    } finally {
      setIsDeleting(false);
    }
  }, [templateToDelete, selectedTemplate, setSelectedTemplate, setPosterUrl, loadTemplatesFromDB]);

  // Save settings handler
  const handleSaveSettings = useCallback(() => {
    if (!selectedTemplate) return;

    const newSettings = {
      padding,
      watermarkOpacity,
      watermarkSize,
      backgroundColor: selectedTemplate.settings.backgroundColor,
      borderRadius,
    };

    updateTemplate(selectedTemplate.id, { settings: newSettings });
    toast.success(`Settings saved for ${selectedTemplate.name}!`);
  }, [selectedTemplate, padding, watermarkOpacity, watermarkSize, borderRadius, updateTemplate]);

  // Export handler
  const handleExport = useCallback(async () => {
    if (!posterUrl) {
      toast.error('Upload poster dulu ya!');
      return;
    }

    setIsExporting(true);
    toast.loading('Sedang export HD poster...', { id: 'export' });

    try {
      const blob = await renderHDCanvas(renderSettings, images);

      if (!blob) throw new Error('Failed to create HD image blob');

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `poster-HD-${selectedTemplate?.brandSlug}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addRecentExport({
        url,
        thumbnail: url,
        templateName: selectedTemplate?.name || 'Unknown',
        dimensions: `2160 x ${aspectRatio === '3:4' ? '2880' : '2700'}`,
        size: Math.round(blob.size / 1024) + ' KB',
      });

      toast.success('HD Poster berhasil di-download!', { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export gagal, coba lagi ya!', { id: 'export' });
    } finally {
      setIsExporting(false);
    }
  }, [posterUrl, renderSettings, images, selectedTemplate, aspectRatio, addRecentExport]);

  // Save to history handler
  const handleSaveToHistory = useCallback(async () => {
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
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      if (!blob) throw new Error('Failed to create image blob');

      const posterDataUrl = canvas.toDataURL('image/png', 1.0);
      const height = aspectRatio === '3:4' ? 1440 : 1350;
      const fileSizeKB = Math.round(blob.size / 1024);

      const response = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          template_name: selectedTemplate.name,
          brand_slug: selectedTemplate.brandSlug,
          poster_url: posterDataUrl,
          thumbnail_url: posterDataUrl,
          settings: { padding, watermarkOpacity, watermarkSize, aspectRatio, backgroundColor: selectedTemplate.settings.backgroundColor },
          dimensions: `1080 x ${height}`,
          file_size: `${fileSizeKB} KB`,
          format: 'png',
        }),
      });

      if (!response.ok) throw new Error('Failed to save to history');

      toast.success('Berhasil disimpan ke history!', { id: 'save-history' });
    } catch (error) {
      console.error('Save to history error:', error);
      toast.error('Gagal menyimpan ke history!', { id: 'save-history' });
    } finally {
      setIsSavingToHistory(false);
    }
  }, [posterUrl, selectedTemplate, aspectRatio, padding, watermarkOpacity, watermarkSize]);

  // Crop handler
  const handleCropComplete = useCallback((croppedImageUrl: string) => {
    setPosterUrl(croppedImageUrl);
    toast.success('Poster cropped successfully!');
  }, [setPosterUrl]);

  // Reset handler
  const handleReset = useCallback(() => {
    reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [reset]);

  const handleRemove = useCallback(() => {
    setPosterUrl('');
    setOriginalPosterUrl(''); // Clear original when removing
    setDynamicBackgroundColor(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [setPosterUrl, setDynamicBackgroundColor]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: handleSaveSettings,
    onExport: handleExport,
    onOpenFile: () => fileInputRef.current?.click(),
    onUndo: undo,
    onRedo: redo,
    onReset: handleRemove,
    enabled: mounted,
  });

  return (
    <>
      <Toaster position="top-center" richColors closeButton />

      {/* Lazy-loaded Modals */}
      <Suspense fallback={<LoadingSpinner />}>
        {settingsModalOpen && selectedTemplateForSettings && (
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

        {addTemplateModalOpen && (
          <AddTemplateModal
            isOpen={addTemplateModalOpen}
            onClose={() => setAddTemplateModalOpen(false)}
            onSuccess={() => {
              loadTemplatesFromDB();
              toast.success('Refreshing templates...');
            }}
          />
        )}

        {cropModalOpen && (
          <CropModal
            isOpen={cropModalOpen}
            onClose={() => setCropModalOpen(false)}
            onCropComplete={handleCropComplete}
            imageUrl={imageToCrop}
          />
        )}

        {deleteDialogOpen && (
          <DeleteConfirmDialog
            isOpen={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setTemplateToDelete(null);
            }}
            onConfirm={handleDeleteTemplate}
            isDeleting={isDeleting}
            templateName={templateToDelete?.name || ''}
          />
        )}
      </Suspense>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={batchMode}
        onChange={handleChange}
        className="hidden"
      />

      {/* Main Container */}
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm">
          <div className="w-full px-4 md:px-6 lg:px-8 py-3 md:py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 flex items-center gap-3">
                <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                  Poster Composer
                </h1>
              </div>

              <div className="flex items-center gap-2">
                {/* Undo/Redo Buttons */}
                {posterUrl && (
                  <div className="flex items-center gap-1 mr-2">
                    <button
                      onClick={undo}
                      disabled={!canUndo}
                      className={`p-2 rounded-lg border transition-all ${canUndo
                        ? 'border-border hover:bg-accent text-foreground hover:scale-105'
                        : 'border-border/50 text-muted-foreground/50 cursor-not-allowed'
                        }`}
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={redo}
                      disabled={!canRedo}
                      className={`p-2 rounded-lg border transition-all ${canRedo
                        ? 'border-border hover:bg-accent text-foreground hover:scale-105'
                        : 'border-border/50 text-muted-foreground/50 cursor-not-allowed'
                        }`}
                      title="Redo (Ctrl+Y)"
                    >
                      <Redo2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setBatchMode(!batchMode)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${batchMode
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent text-foreground'
                    }`}
                  title="Toggle Batch Mode"
                >
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline">Batch</span>
                </button>

                <a
                  href="/history"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium text-foreground"
                  title="View History"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </a>

                {mounted && (
                  <button
                    onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
                    aria-label="Toggle theme"
                  >
                    {currentTheme === 'dark' ? (
                      <Sun className="w-5 h-5 text-foreground" />
                    ) : (
                      <Moon className="w-5 h-5 text-foreground" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="w-full px-4 md:px-6 lg:px-8 py-4 md:py-6">
          {/* Template Selection */}
          <TemplateSelector
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={handleSelectTemplate}
            onOpenSettings={handleOpenSettings}
            onOpenDelete={handleOpenDelete}
            onAddTemplate={() => setAddTemplateModalOpen(true)}
          />

          {/* Batch Upload Panel */}
          {batchMode && (
            <BatchUploadPanel
              visible={batchMode}
              files={batchFiles}
              currentIndex={currentBatchIndex}
              isExporting={isBatchExporting}
              progress={batchProgress}
              onSelectFile={async (index) => {
                setCurrentBatchIndex(index);
                if (batchFiles[index]) {
                  setPosterUrl(batchFiles[index].url);
                  setOriginalPosterUrl(batchFiles[index].url); // Set original for cropping

                  // Extract color if needed when switching images
                  if (selectedTemplate?.settings.backgroundColor === '#DYNAMIC') {
                    try {
                      // Show loading state if we want (optional)
                      // const toastId = toast.loading('Extracting colors...');
                      const colors = await extractColorsFromImage(batchFiles[index].url);
                      setDynamicBackgroundColor(colors.dominant);
                      // toast.dismiss(toastId);
                    } catch (error) {
                      console.error('Color extraction error:', error);
                    }
                  }
                }
              }}
              onRemoveFile={(id) => {
                // Find the index of the file being removed
                const removedIndex = batchFiles.findIndex(f => f.id === id);

                // Remove the file first
                removeBatchFile(id);

                // Calculate new state based on what will be left after removal
                const remainingFilesCount = batchFiles.length - 1;

                if (remainingFilesCount <= 0) {
                  // No files left, clear everything
                  setPosterUrl('');
                  setCurrentBatchIndex(0);
                } else if (removedIndex <= currentBatchIndex) {
                  // If we removed file at or before current index, adjust index
                  const newIndex = Math.max(0, currentBatchIndex - 1);
                  // Get the file that will be at this position after removal
                  const filesAfterRemoval = batchFiles.filter(f => f.id !== id);
                  const newFile = filesAfterRemoval[Math.min(newIndex, filesAfterRemoval.length - 1)];
                  if (newFile) {
                    setCurrentBatchIndex(Math.min(newIndex, filesAfterRemoval.length - 1));
                    setPosterUrl(newFile.url);
                  }
                }
              }}
              onClearAll={() => {
                clearBatchFiles();
                setPosterUrl('');
              }}
              onExportAll={exportAllBatch}
              onAddMore={() => fileInputRef.current?.click()}
            />
          )}

          {/* Preview + Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <PreviewCanvas
              selectedTemplate={selectedTemplate}
              posterUrl={posterUrl}
              aspectRatio={aspectRatio}
              settings={renderSettings}
              images={images}
              imagesLoaded={imagesLoaded}
              dynamicBackgroundColor={dynamicBackgroundColor}
              isUploading={isUploading}
              dragActive={dragActive}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onFileSelect={() => fileInputRef.current?.click()}
              onCrop={() => {
                // Use original image for cropping, not the currently displayed (possibly cropped) version
                setImageToCrop(originalPosterUrl || posterUrl);
                setCropModalOpen(true);
              }}
              onRemove={handleRemove}
              onReset={handleReset}
              onAspectRatioChange={setAspectRatio}
              onColorPick={setDynamicBackgroundColor}
              canvasRef={canvasRef}
            />

            <SettingsPanel
              visible={!!posterUrl}
              padding={padding}
              watermarkSize={watermarkSize}
              watermarkOpacity={watermarkOpacity}
              borderRadius={borderRadius}
              blurIntensity={blurIntensity}
              isBlurMode={selectedTemplate?.settings.backgroundColor === '#BLUR'}
              isSaving={isSaving}
              templateName={selectedTemplate?.name || ''}
              onPaddingChange={setPadding}
              onWatermarkSizeChange={setWatermarkSize}
              onWatermarkOpacityChange={setWatermarkOpacity}
              onBorderRadiusChange={setBorderRadius}
              onBlurIntensityChange={setBlurIntensity}
              onSaveSettings={handleSaveSettings}
              onExport={handleExport}
              onSaveToHistory={handleSaveToHistory}
              isExporting={isExporting}
              isSavingToHistory={isSavingToHistory}
              aspectRatio={aspectRatio}
            />
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <KeyboardShortcutsHint />
      </div>
    </>
  );
}
