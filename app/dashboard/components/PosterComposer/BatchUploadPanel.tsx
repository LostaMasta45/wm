'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Trash2, Image as ImageIcon, Plus, FileArchive } from 'lucide-react';

interface BatchFile {
  id: string;
  file: File;
  url: string;
  name: string;
  status?: 'pending' | 'processing' | 'done' | 'error';
}

interface BatchUploadPanelProps {
  visible: boolean;
  files: BatchFile[];
  currentIndex: number;
  isExporting: boolean;
  progress: { current: number; total: number };
  onSelectFile: (index: number) => void;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onExportAll: (asZip?: boolean) => void;
  onAddMore: () => void;
}

export default function BatchUploadPanel({
  visible,
  files,
  currentIndex,
  isExporting,
  progress,
  onSelectFile,
  onRemoveFile,
  onClearAll,
  onExportAll,
  onAddMore,
}: BatchUploadPanelProps) {
  if (!visible || files.length === 0) return null;

  const progressPercent = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-card border-2 border-border rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">
            Batch Upload ({files.length} files)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearAll}
            disabled={isExporting}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="p-3 max-h-48 overflow-y-auto">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {files.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group
                ${currentIndex === index 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/50'
                }
                ${file.status === 'done' ? 'opacity-60' : ''}
                ${file.status === 'error' ? 'border-destructive' : ''}
              `}
              onClick={() => onSelectFile(index)}
            >
              <img
                src={file.url}
                alt={file.name}
                className="w-full h-full object-cover"
              />
              
              {/* Status overlay */}
              {file.status === 'processing' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              
              {file.status === 'done' && (
                <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile(file.id);
                }}
                disabled={isExporting}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
              >
                <X className="w-3 h-3 text-white" />
              </button>

              {/* Index badge */}
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white font-mono">
                {index + 1}
              </div>
            </motion.div>
          ))}

          {/* Add More Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onAddMore}
            disabled={isExporting}
            className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add more photos"
          >
            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </motion.button>
        </div>
      </div>

      {/* Progress Bar */}
      <AnimatePresence>
        {isExporting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Exporting {progress.current} of {progress.total}...
                </span>
                <span className="font-mono text-foreground">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Buttons */}
      <div className="p-3 border-t border-border grid grid-cols-2 gap-2">
        <button
          onClick={() => onExportAll(false)}
          disabled={isExporting || files.length === 0}
          className="px-4 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg font-bold text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
           <Download className="w-4 h-4" />
           <span>Export All</span>
        </button>
        
        <button
          onClick={() => onExportAll(true)}
          disabled={isExporting || files.length === 0}
          className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <FileArchive className="w-4 h-4" />
              <span>Download ZIP</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
