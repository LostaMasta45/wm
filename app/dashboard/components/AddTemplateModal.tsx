'use client';

import { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTemplateModal({ isOpen, onClose, onSuccess }: AddTemplateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [brandSlug, setBrandSlug] = useState('');
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!templateName || !brandSlug) {
      toast.error('Nama template dan brand wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    toast.loading('Membuat template baru...', { id: 'add-template' });

    try {
      // Upload background image if provided
      let backgroundUrl = '';
      if (backgroundFile) {
        const bgFormData = new FormData();
        bgFormData.append('file', backgroundFile);
        bgFormData.append('type', 'background');
        bgFormData.append('brandSlug', brandSlug);

        const bgResponse = await fetch('/api/upload', {
          method: 'POST',
          body: bgFormData,
        });

        if (!bgResponse.ok) throw new Error('Failed to upload background');
        
        const bgResult = await bgResponse.json();
        backgroundUrl = bgResult.data.url;
      }

      // Upload watermark image if provided
      let watermarkUrl = '';
      if (watermarkFile) {
        const wmFormData = new FormData();
        wmFormData.append('file', watermarkFile);
        wmFormData.append('type', 'watermark');
        wmFormData.append('brandSlug', brandSlug);

        const wmResponse = await fetch('/api/upload', {
          method: 'POST',
          body: wmFormData,
        });

        if (!wmResponse.ok) throw new Error('Failed to upload watermark');
        
        const wmResult = await wmResponse.json();
        watermarkUrl = wmResult.data.url;
      }

      // Create template
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          brandSlug: brandSlug,
          backgroundUrl: backgroundUrl || null,
          watermarkUrl: watermarkUrl || null,
          settings: {
            padding: 16,
            watermarkOpacity: 6,
            watermarkSize: 87,
            backgroundColor: backgroundColor,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create template');
      }

      toast.success('Template berhasil dibuat! 🎉', { id: 'add-template' });
      
      // Reset form
      setTemplateName('');
      setBrandSlug('');
      setBackgroundFile(null);
      setWatermarkFile(null);
      setBackgroundColor('#FFFFFF');
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Add template error:', error);
      toast.error(error.message || 'Gagal membuat template!', { id: 'add-template' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-lg font-bold text-black dark:text-white">
            Add New Template
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-black dark:text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-semibold text-black dark:text-white mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Loker Tuban"
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Brand Slug */}
          <div>
            <label className="block text-sm font-semibold text-black dark:text-white mb-2">
              Brand Slug *
            </label>
            <input
              type="text"
              value={brandSlug}
              onChange={(e) => setBrandSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="e.g. infolokerjombang"
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Lowercase, numbers, and hyphens only
            </p>
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-sm font-semibold text-black dark:text-white mb-2">
              Background Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-16 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                disabled={isSubmitting}
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Background Image */}
          <div>
            <label className="block text-sm font-semibold text-black dark:text-white mb-2">
              Background Image (Optional)
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary transition-colors">
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {backgroundFile ? backgroundFile.name : 'Click to upload'}
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBackgroundFile(e.target.files?.[0] || null)}
                className="hidden"
                disabled={isSubmitting}
              />
            </label>
          </div>

          {/* Watermark Image */}
          <div>
            <label className="block text-sm font-semibold text-black dark:text-white mb-2">
              Watermark Image (Optional)
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary transition-colors">
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {watermarkFile ? watermarkFile.name : 'Click to upload'}
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setWatermarkFile(e.target.files?.[0] || null)}
                className="hidden"
                disabled={isSubmitting}
              />
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-black dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Template</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
