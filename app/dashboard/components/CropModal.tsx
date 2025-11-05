'use client';

import { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, Crop as CropIcon } from 'lucide-react';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageUrl: string) => void;
  imageUrl: string;
}

type AspectRatioPreset = '3:4' | '4:3' | '1:1' | '16:9' | 'free';

export default function CropModal({ isOpen, onClose, onCropComplete, imageUrl }: CropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspectRatioPreset, setAspectRatioPreset] = useState<AspectRatioPreset>('3:4');
  
  // Calculate actual aspect ratio
  const getAspectRatio = (): number | undefined => {
    switch (aspectRatioPreset) {
      case '3:4': return 3 / 4;
      case '4:3': return 4 / 3;
      case '1:1': return 1;
      case '16:9': return 16 / 9;
      case 'free': return undefined; // Free crop
      default: return 3 / 4;
    }
  };

  // Update aspect ratio and reset crop
  const handleAspectRatioChange = (ratio: AspectRatioPreset) => {
    setAspectRatioPreset(ratio);
    // Reset crop with new aspect ratio
    const aspectValue = getAspectRatioForPreset(ratio);
    setCrop({
      unit: '%',
      width: 90,
      height: aspectValue ? 90 / aspectValue : 90,
      x: 5,
      y: 5
    });
  };

  const getAspectRatioForPreset = (preset: AspectRatioPreset): number | undefined => {
    switch (preset) {
      case '3:4': return 3 / 4;
      case '4:3': return 4 / 3;
      case '1:1': return 1;
      case '16:9': return 16 / 9;
      case 'free': return undefined;
      default: return 3 / 4;
    }
  };

  const createCroppedImage = async () => {
    if (!completedCrop || !imgRef.current) return;

    setIsProcessing(true);
    
    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Set canvas size to FULL RESOLUTION cropped area (HD quality)
      const pixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      // Enable high-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw cropped image at FULL RESOLUTION
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Convert to blob with HIGH QUALITY (98% for JPEG, or use PNG for lossless)
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas is empty');
        }
        const croppedImageUrl = URL.createObjectURL(blob);
        onCropComplete(croppedImageUrl);
        setIsProcessing(false);
        onClose();
      }, 'image/jpeg', 0.98);
    } catch (error) {
      console.error('Error creating cropped image:', error);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-0 sm:p-4">
      <div className="bg-background rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] overflow-hidden flex flex-col border-0 sm:border border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-border/50 bg-gradient-to-r from-background via-muted/30 to-background backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/20">
              <CropIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Crop Image</h2>
              <p className="text-xs text-muted-foreground hidden sm:block">Drag corners and edges to adjust</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-destructive/10 transition-all group border border-transparent hover:border-destructive/20"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground group-hover:text-destructive group-hover:rotate-90 transition-all" />
          </button>
        </div>

        {/* Crop Area - Full Screen on Mobile, Contained on Desktop */}
        <div className="relative flex-1 bg-gradient-to-br from-black via-gray-900 to-black" style={{ minHeight: '400px' }}>
          {/* Instruction Badge */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-2">
            <div className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-full border border-primary/30 shadow-2xl">
              <p className="text-white text-xs sm:text-sm font-medium text-center flex items-center gap-2">
                <CropIcon className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span className="hidden sm:inline">Drag the corners and edges to crop</span>
                <span className="sm:hidden">Drag to crop</span>
              </p>
            </div>
          </div>

          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={getAspectRatio()}
            className="max-w-full max-h-full"
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop preview"
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: 'calc(90vh - 300px)' }}
            />
          </ReactCrop>
          
          {/* Custom CSS for crop handles styling */}
          <style jsx global>{`
            /* React Image Crop container */
            .ReactCrop {
              max-width: 100%;
              max-height: 100%;
            }
            
            /* Crop selection overlay */
            .ReactCrop__crop-selection {
              border: 3px solid rgb(147, 51, 234) !important;
              box-shadow: 
                0 0 0 9999px rgba(0, 0, 0, 0.75),
                0 0 30px rgba(147, 51, 234, 0.6),
                inset 0 0 0 1px rgba(255, 255, 255, 0.2) !important;
            }
            
            /* Rule of thirds grid */
            .ReactCrop__rule-of-thirds-vt::before,
            .ReactCrop__rule-of-thirds-vt::after,
            .ReactCrop__rule-of-thirds-hz::before,
            .ReactCrop__rule-of-thirds-hz::after {
              background-color: rgba(255, 255, 255, 0.3) !important;
            }
            
            /* ALL DRAG HANDLES - Base Style */
            .ReactCrop__drag-handle {
              width: 18px !important;
              height: 18px !important;
              background: linear-gradient(135deg, white 0%, #f3f4f6 100%) !important;
              border: 3px solid rgb(147, 51, 234) !important;
              border-radius: 50% !important;
              box-shadow: 
                0 0 0 2px rgba(0, 0, 0, 0.15),
                0 4px 12px rgba(147, 51, 234, 0.5),
                0 0 20px rgba(147, 51, 234, 0.4) !important;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            
            /* CORNER HANDLES (4 points: nw, ne, sw, se) */
            .ReactCrop__drag-handle.ord-nw,
            .ReactCrop__drag-handle.ord-ne,
            .ReactCrop__drag-handle.ord-sw,
            .ReactCrop__drag-handle.ord-se {
              width: 22px !important;
              height: 22px !important;
              background: linear-gradient(135deg, white 0%, rgb(147, 51, 234) 100%) !important;
              border: 4px solid rgb(147, 51, 234) !important;
              box-shadow: 
                0 0 0 2px rgba(255, 255, 255, 0.3),
                0 6px 18px rgba(147, 51, 234, 0.6),
                0 0 35px rgba(147, 51, 234, 0.5),
                inset 0 2px 4px rgba(255, 255, 255, 0.4) !important;
            }
            
            /* EDGE HANDLES (4 points: n, e, s, w) */
            .ReactCrop__drag-handle.ord-n,
            .ReactCrop__drag-handle.ord-e,
            .ReactCrop__drag-handle.ord-s,
            .ReactCrop__drag-handle.ord-w {
              width: 16px !important;
              height: 16px !important;
              background: linear-gradient(135deg, rgb(147, 51, 234) 0%, rgb(126, 34, 206) 100%) !important;
              border: 3px solid white !important;
              box-shadow: 
                0 0 0 1px rgba(147, 51, 234, 0.4),
                0 4px 12px rgba(0, 0, 0, 0.4),
                0 0 18px rgba(147, 51, 234, 0.6) !important;
            }
            
            /* HOVER EFFECTS */
            .ReactCrop__drag-handle:hover {
              transform: scale(1.3) !important;
              box-shadow: 
                0 0 0 4px rgba(147, 51, 234, 0.25),
                0 8px 24px rgba(147, 51, 234, 0.7),
                0 0 45px rgba(147, 51, 234, 0.6) !important;
              z-index: 10 !important;
            }
            
            /* Corner handles hover */
            .ReactCrop__drag-handle.ord-nw:hover,
            .ReactCrop__drag-handle.ord-ne:hover,
            .ReactCrop__drag-handle.ord-sw:hover,
            .ReactCrop__drag-handle.ord-se:hover {
              background: linear-gradient(135deg, rgb(147, 51, 234) 0%, rgb(168, 85, 247) 100%) !important;
              border-color: white !important;
              transform: scale(1.4) rotate(45deg) !important;
            }
            
            /* Edge handles hover */
            .ReactCrop__drag-handle.ord-n:hover,
            .ReactCrop__drag-handle.ord-e:hover,
            .ReactCrop__drag-handle.ord-s:hover,
            .ReactCrop__drag-handle.ord-w:hover {
              background: linear-gradient(135deg, rgb(168, 85, 247) 0%, rgb(147, 51, 234) 100%) !important;
              transform: scale(1.35) !important;
            }
            
            /* ACTIVE/DRAGGING STATE */
            .ReactCrop__drag-handle:active {
              transform: scale(1.15) !important;
              box-shadow: 
                0 0 0 5px rgba(147, 51, 234, 0.35),
                0 6px 20px rgba(147, 51, 234, 0.8),
                0 0 55px rgba(147, 51, 234, 0.7) !important;
            }
            
            /* Shimmer animation for aspect ratio buttons */
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            
            .animate-shimmer {
              animation: shimmer 2s infinite;
            }
          `}</style>
        </div>

        {/* Bottom Controls */}
        <div className="p-4 sm:p-6 border-t border-border/50 bg-gradient-to-r from-background via-muted/20 to-background backdrop-blur-sm space-y-4">
          {/* Aspect Ratio Presets */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <span>Aspect Ratio</span>
              <span className="ml-auto text-xs font-normal px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {aspectRatioPreset === 'free' ? 'Free Form' : aspectRatioPreset}
              </span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['3:4', '4:3', '1:1', '16:9', 'free'] as AspectRatioPreset[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => handleAspectRatioChange(ratio)}
                  className={`relative px-3 py-3 rounded-xl text-sm font-bold transition-all touch-manipulation group overflow-hidden ${
                    aspectRatioPreset === ratio
                      ? 'bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50 hover:border-primary/30 hover:scale-105'
                  }`}
                >
                  {/* Shimmer effect for active button */}
                  {aspectRatioPreset === ratio && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  )}
                  <span className="relative z-10">
                    {ratio === 'free' ? '✨' : ratio}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-6 py-3.5 bg-muted/50 text-foreground rounded-xl font-bold text-sm hover:bg-muted transition-all touch-manipulation border border-border/50 hover:border-border flex items-center justify-center gap-2 group"
            >
              <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>Cancel</span>
            </button>
            <button
              onClick={createCroppedImage}
              disabled={isProcessing}
              className="relative px-6 py-3.5 bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground rounded-xl font-bold text-sm hover:shadow-2xl hover:shadow-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden group"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="relative">Processing...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 relative" />
                  <span className="relative">Apply Crop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
