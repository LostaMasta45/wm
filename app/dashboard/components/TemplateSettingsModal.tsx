'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Droplet } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
  currentBackground?: string;
  currentWatermark?: string;
  onUpdate: (data: { backgroundUrl?: string; watermarkUrl?: string }) => void;
}

export default function TemplateSettingsModal({
  isOpen,
  onClose,
  templateId,
  templateName,
  currentBackground,
  currentWatermark,
  onUpdate,
}: TemplateSettingsModalProps) {
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string>(currentBackground || '');
  const [watermarkPreview, setWatermarkPreview] = useState<string>(currentWatermark || '');
  const [isUploading, setIsUploading] = useState(false);

  const handleBackgroundSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundFile(file);
      const reader = new FileReader();
      reader.onload = () => setBackgroundPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleWatermarkSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setWatermarkFile(file);
      const reader = new FileReader();
      reader.onload = () => setWatermarkPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    toast.loading('Uploading template assets...');

    try {
      const uploadPromises: Promise<string | null>[] = [];
      
      // Upload background
      if (backgroundFile) {
        const formData = new FormData();
        formData.append('file', backgroundFile);
        formData.append('type', 'background');
        formData.append('templateId', templateId);

        uploadPromises.push(
          fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })
            .then(res => res.json())
            .then(data => data.status === 'success' ? data.data.url : null)
        );
      } else {
        uploadPromises.push(Promise.resolve(null));
      }

      // Upload watermark
      if (watermarkFile) {
        const formData = new FormData();
        formData.append('file', watermarkFile);
        formData.append('type', 'watermark');
        formData.append('templateId', templateId);

        uploadPromises.push(
          fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })
            .then(res => res.json())
            .then(data => data.status === 'success' ? data.data.url : null)
        );
      } else {
        uploadPromises.push(Promise.resolve(null));
      }

      const [newBackgroundUrl, newWatermarkUrl] = await Promise.all(uploadPromises);

      const updateData: { backgroundUrl?: string; watermarkUrl?: string } = {};
      if (newBackgroundUrl) updateData.backgroundUrl = newBackgroundUrl;
      if (newWatermarkUrl) updateData.watermarkUrl = newWatermarkUrl;

      if (Object.keys(updateData).length > 0) {
        // Update local store
        onUpdate(updateData);
        
        // Save to Supabase database
        try {
          const response = await fetch(`/api/templates/${templateId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          });

          if (response.ok) {
            toast.success('Template saved to database successfully!');
          } else {
            toast.warning('Template updated locally but failed to sync to database');
          }
        } catch (dbError) {
          console.error('Database sync error:', dbError);
          toast.warning('Template updated locally but failed to sync to database');
        }
      }

      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload assets. Please try again.');
    } finally {
      setIsUploading(false);
      toast.dismiss();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-foreground dark:text-slate-100">
                Template Settings
              </h2>
              <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                {templateName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-foreground dark:text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Background Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-slate-200 mb-3">
                <ImageIcon className="w-4 h-4" />
                Background Image
              </label>
              <div className="space-y-3">
                {backgroundPreview && (
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-border dark:border-slate-600">
                    <img
                      src={backgroundPreview}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-border dark:border-slate-600 rounded-xl hover:border-primary dark:hover:border-cyan-500 transition-all cursor-pointer group bg-muted/50 dark:bg-slate-700/30">
                  <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-primary dark:text-cyan-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground dark:text-slate-300">
                      Upload new background
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Watermark Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-slate-200 mb-3">
                <Droplet className="w-4 h-4" />
                Watermark / Logo
              </label>
              <div className="space-y-3">
                {watermarkPreview && (
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-border dark:border-slate-600 bg-slate-200 dark:bg-slate-900">
                    <img
                      src={watermarkPreview}
                      alt="Watermark preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-border dark:border-slate-600 rounded-xl hover:border-secondary dark:hover:border-purple-500 transition-all cursor-pointer group bg-muted/50 dark:bg-slate-700/30">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 dark:bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-secondary dark:text-purple-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground dark:text-slate-300">
                      Upload new watermark
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">
                      PNG with transparency recommended
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleWatermarkSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border dark:border-slate-700 bg-muted/30 dark:bg-slate-900/30">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isUploading || (!backgroundFile && !watermarkFile)}
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-secondary dark:from-cyan-500 dark:to-purple-600 hover:opacity-90 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
