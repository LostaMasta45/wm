'use client';

import { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DragDropZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  accept?: string;
  children?: React.ReactNode;
}

export default function DragDropZone({
  onFileSelect,
  isUploading = false,
  accept = 'image/*',
  children,
}: DragDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith('image/'));

      if (imageFile) {
        onFileSelect(imageFile);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative"
    >
      {children}

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm rounded-lg border-2 border-blue-500 border-dashed flex items-center justify-center z-50"
          >
            <div className="text-center">
              <Upload className="w-12 h-12 text-blue-400 mx-auto mb-2" />
              <p className="text-lg font-medium text-blue-100">
                Drop your poster here
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload overlay when no children */}
      {!children && (
        <label
          className={`
            flex flex-col items-center justify-center
            min-h-[400px] rounded-lg border-2 border-dashed
            cursor-pointer transition-all duration-300
            ${
              isDragOver
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            disabled={isUploading}
            className="hidden"
          />
          
          <ImageIcon className="w-16 h-16 text-slate-400 mb-4" />
          <p className="text-lg font-medium text-slate-300 mb-2">
            {isUploading ? 'Uploading...' : 'Drop poster here or click to browse'}
          </p>
          <p className="text-sm text-slate-500">
            JPG, PNG or WEBP up to 5MB
          </p>
        </label>
      )}
    </div>
  );
}
