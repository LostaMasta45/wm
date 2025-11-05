'use client';

import { useState, useRef, useEffect } from 'react';
import { usePosterStore } from '@/lib/store';
import { toast, Toaster } from 'sonner';
import { Download, Upload, Sparkles, Check, X, Sun, Moon, Settings, History, ArrowLeft, Plus, Trash2, Palette, Save, Crop } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import TemplateSettingsModal from './TemplateSettingsModal';
import AddTemplateModal from './AddTemplateModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import CropModal from './CropModal';
import { extractColorsFromImage } from '@/lib/colorExtractor';
import SliderWithInput from './SliderWithInput';

// Helper function to generate unique gradient for each template
const getTemplateGradient = (templateId: string, templateName: string) => {
  // Hash template id to generate consistent gradient
  const hash = templateId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const gradients = [
    'from-blue-500 via-cyan-500 to-teal-500',
    'from-purple-500 via-pink-500 to-red-500',
    'from-green-500 via-emerald-500 to-cyan-500',
    'from-orange-500 via-red-500 to-pink-500',
    'from-indigo-500 via-purple-500 to-pink-500',
    'from-yellow-500 via-orange-500 to-red-500',
    'from-teal-500 via-blue-500 to-indigo-500',
    'from-pink-500 via-purple-500 to-indigo-500',
  ];
  
  return gradients[hash % gradients.length];
};

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
    borderRadius,
    setBorderRadius,
    dynamicBackgroundColor,
    setDynamicBackgroundColor,
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
  const [addTemplateModalOpen, setAddTemplateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<typeof templates[0] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Crop modal states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  
  // Batch upload states
  const [batchMode, setBatchMode] = useState(false);
  const [batchFiles, setBatchFiles] = useState<Array<{id: string, file: File, url: string, name: string}>>([]);
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  
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

  // Handle file upload (single or batch)
  const handleFileSelect = async (file: File | File[]) => {
    if (!selectedTemplate) {
      toast.error('Pilih template dulu ya! 😊');
      return;
    }

    setIsUploading(true);

    try {
      // Check if batch upload
      if (Array.isArray(file)) {
        // Batch mode
        const validFiles = file.filter(f => f.type.startsWith('image/'));
        
        if (validFiles.length === 0) {
          toast.error('Tidak ada gambar yang valid!');
          return;
        }

        if (validFiles.length !== file.length) {
          toast.warning(`${file.length - validFiles.length} file bukan gambar, diabaikan`);
        }

        const batchItems = validFiles.map(f => ({
          id: Math.random().toString(36).substr(2, 9),
          file: f,
          url: URL.createObjectURL(f),
          name: f.name,
        }));

        setBatchFiles(batchItems);
        setBatchMode(true);
        
        const firstImageUrl = batchItems[0].url;
        setPosterUrl(firstImageUrl);
        
        // Extract color if template uses dynamic color
        if (selectedTemplate?.settings.backgroundColor === '#DYNAMIC') {
          toast.loading('Extracting colors...', { id: 'color-extract' });
          const colors = await extractColorsFromImage(firstImageUrl);
          setDynamicBackgroundColor(colors.dominant);
          toast.success('Colors extracted! 🎨', { id: 'color-extract' });
        }
        
        toast.success(`${validFiles.length} gambar berhasil di-upload! 🎉`);
      } else {
        // Single mode
        if (!file.type.startsWith('image/')) {
          toast.error('File harus gambar ya!');
          return;
        }

        const localUrl = URL.createObjectURL(file);
        setPosterUrl(localUrl);
        setBatchMode(false);
        setBatchFiles([]);
        
        // Extract color if template uses dynamic color
        if (selectedTemplate?.settings.backgroundColor === '#DYNAMIC') {
          toast.loading('Extracting colors...', { id: 'color-extract' });
          try {
            const colors = await extractColorsFromImage(localUrl);
            setDynamicBackgroundColor(colors.dominant);
            toast.success('Colors extracted! 🎨', { id: 'color-extract' });
          } catch (error) {
            console.error('Color extraction error:', error);
            toast.error('Failed to extract color', { id: 'color-extract' });
          }
        }
        
        toast.success('Poster berhasil di-upload! 🎉');
      }
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
    if (e.target.files) {
      if (e.target.files.length > 1) {
        // Batch upload
        handleFileSelect(Array.from(e.target.files));
      } else if (e.target.files.length === 1) {
        // Single upload
        handleFileSelect(e.target.files[0]);
      }
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
        // Background color - use dynamic if available
        const bgColor = selectedTemplate.settings.backgroundColor === '#DYNAMIC' && dynamicBackgroundColor
          ? dynamicBackgroundColor
          : selectedTemplate.settings.backgroundColor || '#FFFFFF';
        ctx.fillStyle = bgColor;
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

                // Apply rounded corners if borderRadius > 0
                if (borderRadius > 0) {
                  ctx.save();
                  ctx.beginPath();
                  const radius = Math.min(borderRadius, posterWidth / 2, posterHeight / 2);
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

                if (borderRadius > 0) {
                  ctx.restore();
                }
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
  }, [selectedTemplate, posterUrl, padding, watermarkOpacity, watermarkSize, borderRadius, aspectRatio, dynamicBackgroundColor]);

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

  // Handle template delete
  const handleOpenDeleteDialog = (e: React.MouseEvent, template: typeof templates[0]) => {
    e.stopPropagation();
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  // Handle save settings
  const handleSaveSettings = () => {
    if (!selectedTemplate) return;

    const newSettings = {
      padding,
      watermarkOpacity,
      watermarkSize,
      backgroundColor: selectedTemplate.settings.backgroundColor,
      borderRadius,
    };

    console.log('💾 Saving settings for', selectedTemplate.name, ':', newSettings);

    // Update template with current settings
    updateTemplate(selectedTemplate.id, {
      settings: newSettings,
    });

    // Force verify after save
    setTimeout(() => {
      const store = usePosterStore.getState();
      const updatedTemplate = store.templates.find(t => t.id === selectedTemplate.id);
      console.log('✅ Verified saved settings:', updatedTemplate?.settings);
      
      // Verify localStorage
      try {
        const stored = localStorage.getItem('poster-composer-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          const storedTemplate = parsed.state?.templates?.find((t: any) => t.id === selectedTemplate.id);
          console.log('✅ localStorage verification:', storedTemplate?.settings);
        }
      } catch (e) {
        console.error('❌ Failed to verify localStorage:', e);
      }
    }, 200);

    toast.success(`Settings saved for ${selectedTemplate.name}! 🎉`, {
      description: 'Will persist after refresh',
      duration: 3000,
    });
  };

  // Handle crop complete
  const handleCropComplete = (croppedImageUrl: string) => {
    setPosterUrl(croppedImageUrl);
    toast.success('Poster cropped successfully! ✂️');
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);
    toast.loading('Deleting template...', { id: 'delete-template' });

    try {
      const response = await fetch(`/api/templates/${templateToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      // If deleting selected template, reset selection
      if (selectedTemplate?.id === templateToDelete.id) {
        setSelectedTemplate(null);
        setPosterUrl('');
      }

      // Refresh templates
      await loadTemplatesFromDB();

      toast.success('Template deleted successfully! 🗑️', { id: 'delete-template' });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error('Delete template error:', error);
      toast.error('Failed to delete template!', { id: 'delete-template' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Auto-save settings changes to database (debounced)
  useEffect(() => {
    if (!selectedTemplate || !mounted) return;

    // Skip auto-save for default templates (like Dynamic Color)
    const isDefaultTemplate = ['dynamic-color', 'loker-tuban-primary', 'loker-jombang-primary', 'generic-modern'].includes(selectedTemplate.id);
    
    if (isDefaultTemplate) {
      // Default templates - settings saved locally only via zustand persist
      setIsSaving(false);
      return;
    }

    // Only auto-save for database templates (UUID format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedTemplate.id);
    
    if (!isUUID) {
      setIsSaving(false);
      return;
    }

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

  // Export handler - HD Quality (2x resolution)
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
    toast.loading('Sedang export HD poster...', { id: 'export' });

    try {
      // Create HD canvas (2x resolution)
      const hdCanvas = document.createElement('canvas');
      const hdCtx = hdCanvas.getContext('2d', { alpha: false });
      if (!hdCtx) throw new Error('Failed to create HD canvas context');

      // HD dimensions (2x)
      const hdWidth = 2160;
      const hdHeight = aspectRatio === '3:4' ? 2880 : 2700;
      hdCanvas.width = hdWidth;
      hdCanvas.height = hdHeight;

      // Render in HD
      await (async () => {
        // Background color - use dynamic if available
        const bgColor = selectedTemplate?.settings.backgroundColor === '#DYNAMIC' && dynamicBackgroundColor
          ? dynamicBackgroundColor
          : selectedTemplate?.settings.backgroundColor || '#FFFFFF';
        hdCtx.fillStyle = bgColor;
        hdCtx.fillRect(0, 0, hdWidth, hdHeight);

        // Background image
        if (selectedTemplate?.backgroundUrl) {
          const bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            bgImg.onload = () => {
              hdCtx.drawImage(bgImg, 0, 0, hdWidth, hdHeight);
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
              const paddingPx = (Math.min(hdWidth, hdHeight) * padding) / 100;
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

              // Apply rounded corners if borderRadius > 0
              if (borderRadius > 0) {
                hdCtx.save();
                hdCtx.beginPath();
                // Scale border radius for HD (2x)
                const radius = Math.min(borderRadius * 2, posterWidth / 2, posterHeight / 2);
                hdCtx.moveTo(x + radius, y);
                hdCtx.lineTo(x + posterWidth - radius, y);
                hdCtx.quadraticCurveTo(x + posterWidth, y, x + posterWidth, y + radius);
                hdCtx.lineTo(x + posterWidth, y + posterHeight - radius);
                hdCtx.quadraticCurveTo(x + posterWidth, y + posterHeight, x + posterWidth - radius, y + posterHeight);
                hdCtx.lineTo(x + radius, y + posterHeight);
                hdCtx.quadraticCurveTo(x, y + posterHeight, x, y + posterHeight - radius);
                hdCtx.lineTo(x, y + radius);
                hdCtx.quadraticCurveTo(x, y, x + radius, y);
                hdCtx.closePath();
                hdCtx.clip();
              }

              hdCtx.drawImage(posterImg, x, y, posterWidth, posterHeight);

              if (borderRadius > 0) {
                hdCtx.restore();
              }

              resolve();
            };
            posterImg.onerror = () => resolve();
            posterImg.src = posterUrl;
          });
        }

        // Watermark
        if (selectedTemplate?.watermarkUrl && watermarkOpacity > 0) {
          const wmImg = new Image();
          wmImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            wmImg.onload = () => {
              hdCtx.globalAlpha = watermarkOpacity / 100;
              
              const wmAspectRatio = wmImg.width / wmImg.height;
              const canvasAspectRatio = hdWidth / hdHeight;
              const sizeMultiplier = watermarkSize / 100;
              
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
              
              hdCtx.drawImage(wmImg, wmX, wmY, wmWidth, wmHeight);
              hdCtx.globalAlpha = 1.0;
              resolve();
            };
            wmImg.onerror = () => resolve();
            wmImg.src = selectedTemplate.watermarkUrl + '?t=' + Date.now();
          });
        }
      })();

      // Convert to blob with high quality
      const blob = await new Promise<Blob | null>((resolve) => {
        hdCanvas.toBlob(resolve, 'image/png', 1.0);
      });

      if (!blob) throw new Error('Failed to create HD image blob');

      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `poster-HD-${selectedTemplate?.brandSlug}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addRecentExport({
        url: url,
        thumbnail: url,
        templateName: selectedTemplate?.name || 'Unknown',
        dimensions: `${hdWidth} × ${hdHeight}`,
        size: Math.round(blob.size / 1024) + ' KB',
      });

      toast.success('HD Poster berhasil di-download! 🎉', { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export gagal, coba lagi ya!', { id: 'export' });
    } finally {
      setIsExporting(false);
    }
  };

  // Batch export handler
  const handleBatchExport = async () => {
    if (batchFiles.length === 0) {
      toast.error('Tidak ada gambar untuk diexport!');
      return;
    }

    setIsBatchExporting(true);
    setBatchProgress({ current: 0, total: batchFiles.length });
    toast.loading('Memproses batch export...', { id: 'batch-export' });

    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        toast.error('Canvas belum siap!');
        return;
      }

      const width = 2160;
      const height = aspectRatio === '3:4' ? 2880 : 2700;
      
      // Process each image
      for (let i = 0; i < batchFiles.length; i++) {
        const item = batchFiles[i];
        setBatchProgress({ current: i + 1, total: batchFiles.length });
        
        // Create HD canvas for this image
        const hdCanvas = document.createElement('canvas');
        const hdCtx = hdCanvas.getContext('2d', { alpha: false });
        if (!hdCtx) continue;

        hdCanvas.width = width;
        hdCanvas.height = height;

        // Background color - use dynamic if available
        const bgColor = selectedTemplate?.settings.backgroundColor === '#DYNAMIC' && dynamicBackgroundColor
          ? dynamicBackgroundColor
          : selectedTemplate?.settings.backgroundColor || '#FFFFFF';
        hdCtx.fillStyle = bgColor;
        hdCtx.fillRect(0, 0, width, height);

        // Background image
        if (selectedTemplate?.backgroundUrl) {
          const bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            bgImg.onload = () => {
              hdCtx.drawImage(bgImg, 0, 0, width, height);
              resolve();
            };
            bgImg.onerror = () => resolve();
            bgImg.src = selectedTemplate.backgroundUrl + '?t=' + Date.now();
          });
        }

        // Poster image
        const posterImg = new Image();
        posterImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          posterImg.onload = () => {
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

            if (borderRadius > 0) {
              hdCtx.save();
              hdCtx.beginPath();
              const radius = Math.min(borderRadius * 2, posterWidth / 2, posterHeight / 2);
              hdCtx.moveTo(x + radius, y);
              hdCtx.lineTo(x + posterWidth - radius, y);
              hdCtx.quadraticCurveTo(x + posterWidth, y, x + posterWidth, y + radius);
              hdCtx.lineTo(x + posterWidth, y + posterHeight - radius);
              hdCtx.quadraticCurveTo(x + posterWidth, y + posterHeight, x + posterWidth - radius, y + posterHeight);
              hdCtx.lineTo(x + radius, y + posterHeight);
              hdCtx.quadraticCurveTo(x, y + posterHeight, x, y + posterHeight - radius);
              hdCtx.lineTo(x, y + radius);
              hdCtx.quadraticCurveTo(x, y, x + radius, y);
              hdCtx.closePath();
              hdCtx.clip();
            }

            hdCtx.drawImage(posterImg, x, y, posterWidth, posterHeight);

            if (borderRadius > 0) {
              hdCtx.restore();
            }

            resolve();
          };
          posterImg.onerror = () => resolve();
          posterImg.src = item.url;
        });

        // Watermark
        if (selectedTemplate?.watermarkUrl && watermarkOpacity > 0) {
          const wmImg = new Image();
          wmImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            wmImg.onload = () => {
              hdCtx.globalAlpha = watermarkOpacity / 100;
              const wmAspectRatio = wmImg.width / wmImg.height;
              const canvasAspectRatio = width / height;
              const sizeMultiplier = watermarkSize / 100;
              
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
              
              hdCtx.drawImage(wmImg, wmX, wmY, wmWidth, wmHeight);
              hdCtx.globalAlpha = 1.0;
              resolve();
            };
            wmImg.onerror = () => resolve();
            wmImg.src = selectedTemplate.watermarkUrl + '?t=' + Date.now();
          });
        }

        // Download this image
        const blob = await new Promise<Blob | null>((resolve) => {
          hdCanvas.toBlob(resolve, 'image/png', 1.0);
        });

        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const timestamp = Date.now();
          const fileName = item.name.replace(/\.[^/.]+$/, ''); // Remove extension
          link.download = `poster-HD-${fileName}-${timestamp}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }

      toast.success(`${batchFiles.length} poster berhasil di-export! 🎉`, { id: 'batch-export' });
    } catch (error) {
      console.error('Batch export error:', error);
      toast.error('Batch export gagal!', { id: 'batch-export' });
    } finally {
      setIsBatchExporting(false);
      setBatchProgress({ current: 0, total: 0 });
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
      
      {/* Modals */}
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
      
      <AddTemplateModal
        isOpen={addTemplateModalOpen}
        onClose={() => setAddTemplateModalOpen(false)}
        onSuccess={() => {
          loadTemplatesFromDB();
          toast.success('Refreshing templates...');
        }}
      />

      <CropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
        imageUrl={imageToCrop}
      />

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
      
      {/* Main Container - Theme Colors */}
      <div className="min-h-screen bg-background">
        
        {/* Header - Compact */}
        <header className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm">
          <div className="w-full px-4 md:px-6 lg:px-8 py-3 md:py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 flex items-center gap-3">
                <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                  Poster Composer
                </h1>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Back to History */}
                <a
                  href="/history"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium text-foreground"
                  title="View History"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </a>

                {/* Theme Toggle */}
                {mounted && (
                  <button
                    onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
                    aria-label="Toggle theme"
                    title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
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

        {/* Content - Full Width Layout */}
        <div className="w-full px-4 md:px-6 lg:px-8 py-4 md:py-6">
          
          {/* Step 1: Template Selection */}
          <section className="mb-4 md:mb-6">
            <div className="mb-3">
              <h2 className="text-sm md:text-base font-semibold text-foreground flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </span>
                <span>Choose Template</span>
              </h2>
            </div>

            {/* Template Cards - Horizontal Scroll */}
            <div className="relative -mx-4 md:mx-0">
              {/* Scroll hint for mobile */}
              <div className="md:hidden absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
              
              <div 
                className="flex gap-3 md:gap-3 overflow-x-auto pb-3 snap-x snap-mandatory px-4 md:px-0 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50 transition-colors"
                style={{
                  scrollbarWidth: 'thin',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {/* Add Template Button */}
                <motion.button
                  onClick={() => setAddTemplateModalOpen(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] rounded-lg overflow-hidden snap-start cursor-pointer border-2 border-dashed border-border hover:border-primary transition-all group touch-manipulation"
                >
                  <div className="aspect-[3/4] bg-muted relative flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors">
                      Add Template
                    </p>
                  </div>
                </motion.button>

                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      // Load template settings (with explicit fallbacks)
                      const settings = template.settings;
                      setPadding(settings.padding ?? 8);
                      setWatermarkOpacity(settings.watermarkOpacity ?? 0);
                      setWatermarkSize(settings.watermarkSize ?? 30);
                      setBorderRadius(settings.borderRadius ?? 0);
                      console.log('Template loaded:', template.name, 'Settings:', settings);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] rounded-lg overflow-hidden snap-start cursor-pointer border-2 transition-all touch-manipulation
                      ${selectedTemplate?.id === template.id
                        ? 'border-primary shadow-lg shadow-primary/20'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    {/* Template Preview */}
                    <div className="aspect-[3/4] relative overflow-hidden">
                      {/* Dynamic Color Template - Special Gradient */}
                      {template.settings.backgroundColor === '#DYNAMIC' ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                          <div className="relative">
                            <div className="absolute inset-0 bg-white/10 blur-xl animate-pulse" />
                            <Palette className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10" strokeWidth={2.5} />
                          </div>
                        </div>
                      ) : template.thumbnail ? (
                        <img
                          src={template.thumbnail}
                          alt={template.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${getTemplateGradient(template.id, template.name)} flex items-center justify-center`}>
                          <div className="relative">
                            <div className="absolute inset-0 bg-white/10 blur-xl" />
                            <div className="relative z-10 text-white font-black text-3xl sm:text-4xl drop-shadow-lg">
                              {template.name.charAt(0)}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Selected Badge */}
                      {selectedTemplate?.id === template.id && (
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Template Info */}
                    <div className={`
                      p-2 sm:p-2.5 transition-colors
                      ${selectedTemplate?.id === template.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-card-foreground'
                      }
                    `}>
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-xs sm:text-sm truncate">{template.name}</h3>
                          <p className={`text-[10px] sm:text-xs truncate ${
                            selectedTemplate?.id === template.id
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}>
                            {template.brandSlug}
                          </p>
                        </div>
                        
                        {/* Action Buttons - Touch Friendly */}
                        <div className="flex items-center gap-1">
                          {/* Edit Button */}
                          <button
                            onClick={(e) => handleOpenSettings(e, template)}
                            className={`
                              flex-shrink-0 p-0.5 sm:p-1 rounded transition-colors border
                              ${selectedTemplate?.id === template.id
                                ? 'border-primary-foreground/30 hover:bg-primary-foreground/10'
                                : 'border-border hover:bg-accent'
                              }
                            `}
                            title="Edit template"
                          >
                            <Settings className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => handleOpenDeleteDialog(e, template)}
                            className={`
                              flex-shrink-0 p-0.5 sm:p-1 rounded transition-colors border
                              ${selectedTemplate?.id === template.id
                                ? 'border-primary-foreground/30 hover:bg-destructive/20'
                                : 'border-border hover:bg-destructive/10'
                              }
                            `}
                            title="Delete template"
                          >
                            <Trash2 className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                              selectedTemplate?.id === template.id
                                ? 'text-primary-foreground'
                                : 'text-destructive'
                            }`} />
                          </button>
                        </div>
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
                <h2 className="text-sm md:text-base font-semibold text-foreground flex items-center gap-1.5 sm:gap-2">
                  <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
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
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    3:4
                  </button>
                  <button
                    onClick={() => setAspectRatio('4:5')}
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

              {/* Preview Container */}
              <div className="bg-card rounded-lg border-2 border-border overflow-hidden">
                <div className="p-3 sm:p-4 md:p-6">
                {!posterUrl ? (
                  /* Upload Zone */
                  <div
                    className={`
                      relative border-2 border-dashed rounded-lg transition-all
                      ${dragActive
                        ? 'border-black dark:border-white bg-muted'
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
                      <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-primary flex items-center justify-center mb-3 sm:mb-4">
                        <Upload className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary-foreground" />
                      </div>
                      
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground mb-1.5 sm:mb-2">
                        {dragActive ? 'Drop Here' : 'Upload Poster'}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-xs px-2">
                        Drag & drop or click button
                      </p>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!selectedTemplate || isUploading}
                        className="px-4 py-2 sm:px-6 sm:py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-xs sm:text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        multiple
                        onChange={handleChange}
                        className="hidden"
                      />

                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-3 sm:mt-4">
                        JPG, PNG, WebP • Max 10MB
                      </p>
                    </div>
                  </div>
                  ) : (
                    /* Canvas Preview */
                    <div className="space-y-3">
                      <div className="relative rounded-lg overflow-hidden border border-border" style={{ aspectRatio: aspectRatio === '3:4' ? '3/4' : '4/5' }}>
                        <canvas
                          ref={canvasRef}
                          className="w-full h-full"
                          style={{ display: 'block' }}
                        />
                        
                        {/* Info Badge */}
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-1 sm:px-3 sm:py-1.5 bg-primary backdrop-blur-sm rounded text-primary-foreground text-[10px] sm:text-xs font-semibold truncate max-w-[50%]">
                          {selectedTemplate?.name}
                        </div>
                        
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-1 sm:px-3 sm:py-1.5 bg-primary backdrop-blur-sm rounded text-primary-foreground text-[10px] sm:text-xs font-mono">
                          1080×{aspectRatio === '3:4' ? '1440' : '1350'}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setImageToCrop(posterUrl);
                            setCropModalOpen(true);
                          }}
                          className="flex-1 px-3 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 touch-manipulation"
                        >
                          <Crop className="w-4 h-4" />
                          <span>Crop</span>
                        </button>
                        <button
                          onClick={() => {
                            setPosterUrl('');
                            setDynamicBackgroundColor(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
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
                        onClick={() => {
                          reset();
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
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
                      <h2 className="text-sm md:text-base font-semibold text-foreground flex items-center gap-1.5 sm:gap-2">
                        <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          3
                        </span>
                        <span>Settings</span>
                      </h2>
                    </div>

                    <div className="bg-card rounded-lg border-2 border-border p-3 sm:p-4 md:p-5">
                      <div className="space-y-4 sm:space-y-5 md:space-y-6">
                        {isSaving && (
                          <div className="text-[10px] text-muted-foreground animate-pulse text-center">
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

                        {/* Border Radius Control */}
                        <SliderWithInput
                          label="Corner Radius"
                          value={borderRadius}
                          onChange={setBorderRadius}
                          min={0}
                          max={100}
                          step={1}
                          unit="px"
                          minLabel="0px"
                          maxLabel="100px"
                        />

                        {/* Save Settings Button */}
                        <button
                          onClick={handleSaveSettings}
                          disabled={!selectedTemplate}
                          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save Settings for {selectedTemplate?.name || 'Template'}</span>
                        </button>
                        
                        <p className="text-xs text-muted-foreground text-center">
                          Settings will be remembered for this template
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Export & Save Buttons */}
                  <div className="bg-card rounded-lg border-2 border-border p-3 sm:p-4 md:p-5 space-y-3">
                    {/* Download Button */}
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="w-full px-4 py-2.5 sm:py-3 md:py-4 bg-primary text-primary-foreground rounded-lg font-bold text-xs sm:text-sm md:text-base hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                      className="w-full px-4 py-2.5 sm:py-3 bg-card border-2 border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white text-foreground rounded-lg font-bold text-xs sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                  {/* Batch Upload Section */}
                  {batchMode && batchFiles.length > 0 && (
                    <div className="bg-card rounded-lg border-2 border-border p-3 sm:p-4 md:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm sm:text-base text-foreground">
                          Batch Upload ({batchFiles.length} images)
                        </h3>
                        <button
                          onClick={() => {
                            setBatchMode(false);
                            setBatchFiles([]);
                            setPosterUrl('');
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear All
                        </button>
                      </div>

                      {/* Batch Files Grid */}
                      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                        {batchFiles.map((item, index) => (
                          <div
                            key={item.id}
                            className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer"
                            onClick={() => setPosterUrl(item.url)}
                          >
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <span className="text-white text-xs font-bold">
                                #{index + 1}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newFiles = batchFiles.filter(f => f.id !== item.id);
                                setBatchFiles(newFiles);
                                if (newFiles.length === 0) {
                                  setBatchMode(false);
                                  setPosterUrl('');
                                } else if (posterUrl === item.url) {
                                  setPosterUrl(newFiles[0].url);
                                }
                              }}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Batch Export Button */}
                      <button
                        onClick={handleBatchExport}
                        disabled={isBatchExporting}
                        className="w-full px-4 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold text-xs sm:text-sm md:text-base hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isBatchExporting ? (
                          <>
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Exporting {batchProgress.current}/{batchProgress.total}...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Export All ({batchFiles.length}) in HD</span>
                          </>
                        )}
                      </button>

                      {/* Progress Bar */}
                      {isBatchExporting && batchProgress.total > 0 && (
                        <div className="space-y-1">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                              style={{
                                width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-center text-muted-foreground">
                            Processing {batchProgress.current} of {batchProgress.total} images...
                          </p>
                        </div>
                      )}

                      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 text-center">
                        All images will be exported in HD (2160×{aspectRatio === '3:4' ? '2880' : '2700'}px)
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>

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
