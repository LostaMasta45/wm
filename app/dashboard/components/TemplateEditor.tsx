'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { usePosterStore } from '@/lib/store';

interface TemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplateEditor({ isOpen, onClose }: TemplateEditorProps) {
  const { selectedTemplate, updateTemplate } = usePosterStore();
  const [isUploading, setIsUploading] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState(selectedTemplate?.backgroundUrl || '');
  const [watermarkUrl, setWatermarkUrl] = useState(selectedTemplate?.watermarkUrl || '');

  const handleUpload = async (file: File, type: 'bg' | 'wm') => {
    if (!selectedTemplate) return;

    setIsUploading(true);
    toast.loading(`Uploading ${type === 'bg' ? 'background' : 'watermark'}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('brandSlug', selectedTemplate.brandSlug);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.status === 'success') {
        const url = result.data.url;
        
        if (type === 'bg') {
          setBackgroundUrl(url);
          updateTemplate(selectedTemplate.id, { backgroundUrl: url });
        } else {
          setWatermarkUrl(url);
          updateTemplate(selectedTemplate.id, { watermarkUrl: url });
        }

        toast.success('Upload successful!');
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

  if (!selectedTemplate) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-purple-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Template Settings
                      </h2>
                      <p className="text-sm text-white/80">
                        {selectedTemplate.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Background Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Background Image
                  </label>
                  <div className="relative">
                    {backgroundUrl ? (
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                        <img
                          src={backgroundUrl}
                          alt="Background"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                          <label className="cursor-pointer px-4 py-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Change Background
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(file, 'bg');
                              }}
                              disabled={isUploading}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-[3/4] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-cyan-500 dark:hover:border-cyan-500 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-900/50">
                        <ImageIcon className="w-12 h-12 text-slate-400 mb-2" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Upload Background
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          1080×1440 recommended
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(file, 'bg');
                          }}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Watermark Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Watermark Logo
                  </label>
                  <div className="relative">
                    {watermarkUrl ? (
                      <div className="relative w-full aspect-square max-w-xs rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                        <img
                          src={watermarkUrl}
                          alt="Watermark"
                          className="w-full h-full object-contain p-4"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                          <label className="cursor-pointer px-4 py-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Change Watermark
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(file, 'wm');
                              }}
                              disabled={isUploading}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full aspect-square max-w-xs rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-purple-500 dark:hover:border-purple-500 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-900/50">
                        <ImageIcon className="w-12 h-12 text-slate-400 mb-2" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Upload Watermark
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          PNG with transparency
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(file, 'wm');
                          }}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-cyan-900 dark:text-cyan-400 mb-2">
                    💡 Tips:
                  </h4>
                  <ul className="text-xs text-cyan-800 dark:text-cyan-400/80 space-y-1">
                    <li>• Background akan di-cover ke 1080×1440 (3:4 ratio)</li>
                    <li>• Watermark akan overlay di seluruh canvas</li>
                    <li>• Gunakan PNG transparent untuk watermark terbaik</li>
                    <li>• Upload sekali, gunakan untuk semua poster</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-b-2xl border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={onClose}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/25"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
