'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Crop as CropIcon,
  RotateCcw, ZoomIn, RotateCw,
  FlipHorizontal, FlipVertical,
  Maximize, Move
} from 'lucide-react';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageUrl: string) => void;
  imageUrl: string;
}

type AspectRatioPreset = '3:4' | '4:5' | '1:1' | '4:3' | '16:9' | '9:16' | 'free';

const ASPECT_RATIOS: { value: AspectRatioPreset; label: string; ratio: number | undefined }[] = [
  { value: '3:4', label: '3:4', ratio: 3 / 4 },
  { value: '4:5', label: '4:5', ratio: 4 / 5 },
  { value: '1:1', label: '1:1', ratio: 1 },
  { value: '4:3', label: '4:3', ratio: 4 / 3 },
  { value: '16:9', label: '16:9', ratio: 16 / 9 },
  { value: '9:16', label: '9:16', ratio: 9 / 16 },
  { value: 'free', label: '✨', ratio: undefined },
];

// Custom Free Crop Component
interface FreeCropAreaProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onCropChange: (area: { x: number; y: number; width: number; height: number }) => void;
  initialCrop?: { x: number; y: number; width: number; height: number };
}

function FreeCropArea({ containerRef, onCropChange, initialCrop }: FreeCropAreaProps) {
  const [crop, setCrop] = useState(initialCrop || { x: 50, y: 50, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startCrop, setStartCrop] = useState(crop);

  // Get container bounds
  const getContainerBounds = useCallback(() => {
    if (!containerRef.current) return { width: 400, height: 400 };
    const rect = containerRef.current.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, [containerRef]);

  // Constrain crop to container
  const constrainCrop = useCallback((newCrop: typeof crop) => {
    const bounds = getContainerBounds();
    const minSize = 50;

    return {
      x: Math.max(0, Math.min(newCrop.x, bounds.width - newCrop.width)),
      y: Math.max(0, Math.min(newCrop.y, bounds.height - newCrop.height)),
      width: Math.max(minSize, Math.min(newCrop.width, bounds.width - newCrop.x)),
      height: Math.max(minSize, Math.min(newCrop.height, bounds.height - newCrop.y)),
    };
  }, [getContainerBounds]);

  // Handle mouse/touch move
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (isDragging) {
      const dx = x - startPos.x;
      const dy = y - startPos.y;
      const newCrop = constrainCrop({
        ...startCrop,
        x: startCrop.x + dx,
        y: startCrop.y + dy,
      });
      setCrop(newCrop);
      onCropChange(newCrop);
    } else if (isResizing) {
      const dx = x - startPos.x;
      const dy = y - startPos.y;
      let newCrop = { ...startCrop };

      if (isResizing.includes('e')) {
        newCrop.width = Math.max(50, startCrop.width + dx);
      }
      if (isResizing.includes('w')) {
        newCrop.x = Math.min(startCrop.x + startCrop.width - 50, startCrop.x + dx);
        newCrop.width = Math.max(50, startCrop.width - dx);
      }
      if (isResizing.includes('s')) {
        newCrop.height = Math.max(50, startCrop.height + dy);
      }
      if (isResizing.includes('n')) {
        newCrop.y = Math.min(startCrop.y + startCrop.height - 50, startCrop.y + dy);
        newCrop.height = Math.max(50, startCrop.height - dy);
      }

      newCrop = constrainCrop(newCrop);
      setCrop(newCrop);
      onCropChange(newCrop);
    }
  }, [isDragging, isResizing, startPos, startCrop, constrainCrop, onCropChange, containerRef]);

  // Mouse events
  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
  }, []);

  // Touch events
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Initialize crop on mount
  useEffect(() => {
    const bounds = getContainerBounds();
    const initialWidth = Math.min(250, bounds.width * 0.7);
    const initialHeight = Math.min(300, bounds.height * 0.7);
    const initCrop = {
      x: (bounds.width - initialWidth) / 2,
      y: (bounds.height - initialHeight) / 2,
      width: initialWidth,
      height: initialHeight,
    };
    setCrop(initCrop);
    onCropChange(initCrop);
  }, [getContainerBounds, onCropChange]);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setStartPos({ x: clientX - rect.left, y: clientY - rect.top });
    setStartCrop(crop);
    setIsDragging(true);
  };

  const startResize = (corner: string) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setStartPos({ x: clientX - rect.left, y: clientY - rect.top });
    setStartCrop(crop);
    setIsResizing(corner);
  };

  const handleStyle = "absolute w-5 h-5 bg-white rounded-full border-3 border-purple-500 shadow-lg shadow-purple-500/50 z-20 touch-manipulation transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 active:scale-110 transition-transform cursor-pointer";
  const edgeStyle = "absolute bg-purple-500/50 z-10 touch-manipulation";

  return (
    <>
      {/* Dark overlay outside crop area */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to right, rgba(0,0,0,0.7) ${crop.x}px, transparent ${crop.x}px),
            linear-gradient(to left, rgba(0,0,0,0.7) ${getContainerBounds().width - crop.x - crop.width}px, transparent ${getContainerBounds().width - crop.x - crop.width}px),
            linear-gradient(to bottom, rgba(0,0,0,0.7) ${crop.y}px, transparent ${crop.y}px),
            linear-gradient(to top, rgba(0,0,0,0.7) ${getContainerBounds().height - crop.y - crop.height}px, transparent ${getContainerBounds().height - crop.y - crop.height}px)
          `
        }}
      />

      {/* Crop area */}
      <div
        className="absolute cursor-move touch-manipulation select-none"
        style={{
          left: crop.x,
          top: crop.y,
          width: crop.width,
          height: crop.height,
          border: '3px solid rgba(168, 85, 247, 0.9)',
          boxShadow: '0 0 0 2000px rgba(0,0,0,0.6), 0 0 30px rgba(168, 85, 247, 0.5)',
        }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
        </div>

        {/* Move indicator */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="p-2 bg-black/50 rounded-full backdrop-blur-sm">
            <Move className="w-5 h-5 text-white/70" />
          </div>
        </div>

        {/* Corner handles */}
        <div className={handleStyle} style={{ left: 0, top: 0, cursor: 'nwse-resize' }} onMouseDown={startResize('nw')} onTouchStart={startResize('nw')} />
        <div className={handleStyle} style={{ left: '100%', top: 0, cursor: 'nesw-resize' }} onMouseDown={startResize('ne')} onTouchStart={startResize('ne')} />
        <div className={handleStyle} style={{ left: 0, top: '100%', cursor: 'nesw-resize' }} onMouseDown={startResize('sw')} onTouchStart={startResize('sw')} />
        <div className={handleStyle} style={{ left: '100%', top: '100%', cursor: 'nwse-resize' }} onMouseDown={startResize('se')} onTouchStart={startResize('se')} />

        {/* Edge handles */}
        <div className={handleStyle} style={{ left: '50%', top: 0, cursor: 'ns-resize' }} onMouseDown={startResize('n')} onTouchStart={startResize('n')} />
        <div className={handleStyle} style={{ left: '50%', top: '100%', cursor: 'ns-resize' }} onMouseDown={startResize('s')} onTouchStart={startResize('s')} />
        <div className={handleStyle} style={{ left: 0, top: '50%', cursor: 'ew-resize' }} onMouseDown={startResize('w')} onTouchStart={startResize('w')} />
        <div className={handleStyle} style={{ left: '100%', top: '50%', cursor: 'ew-resize' }} onMouseDown={startResize('e')} onTouchStart={startResize('e')} />
      </div>
    </>
  );
}

export default function CropModal({ isOpen, onClose, onCropComplete, imageUrl }: CropModalProps) {
  // Crop state
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Free crop state
  const [freeCropArea, setFreeCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const freeCropContainerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });

  // Flip state
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // UI state
  const [aspectRatioPreset, setAspectRatioPreset] = useState<AspectRatioPreset>('3:4');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if free crop mode
  const isFreeCrop = aspectRatioPreset === 'free';

  // Get current aspect ratio
  const currentAspectRatio = ASPECT_RATIOS.find(r => r.value === aspectRatioPreset)?.ratio;

  // Handle crop complete for react-easy-crop
  const onCropAreaComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle image load for free crop mode
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({
      width: img.width,
      height: img.height,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    });
  }, []);

  // Reset all transformations
  const handleReset = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setFreeCropArea(null);
  }, []);

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback((preset: AspectRatioPreset) => {
    setAspectRatioPreset(preset);
    // Reset crop position when changing aspect ratio
    setCrop({ x: 0, y: 0 });
    setFreeCropArea(null);
  }, []);

  // Create cropped image
  const createCroppedImage = useCallback(async () => {
    setIsProcessing(true);

    try {
      const image = new Image();
      image.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      // Calculate the crop area based on mode
      let cropX: number, cropY: number, cropWidth: number, cropHeight: number;

      if (isFreeCrop && freeCropArea && imageSize.width > 0) {
        // Free crop mode - calculate from displayed coordinates to natural coordinates
        const scaleX = image.naturalWidth / imageSize.width;
        const scaleY = image.naturalHeight / imageSize.height;

        cropX = freeCropArea.x * scaleX;
        cropY = freeCropArea.y * scaleY;
        cropWidth = freeCropArea.width * scaleX;
        cropHeight = freeCropArea.height * scaleY;
      } else if (croppedAreaPixels) {
        // Fixed aspect ratio mode - use react-easy-crop result
        // Apply rotation transform
        const rotRad = (rotation * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rotRad));
        const cos = Math.abs(Math.cos(rotRad));
        const newWidth = image.naturalWidth * cos + image.naturalHeight * sin;
        const newHeight = image.naturalWidth * sin + image.naturalHeight * cos;

        // Create a canvas for the rotated and flipped image
        const rotatedCanvas = document.createElement('canvas');
        rotatedCanvas.width = newWidth;
        rotatedCanvas.height = newHeight;
        const rotatedCtx = rotatedCanvas.getContext('2d');

        if (!rotatedCtx) {
          throw new Error('No 2d context for rotation');
        }

        // Move to the center of the canvas
        rotatedCtx.translate(newWidth / 2, newHeight / 2);

        // Rotate
        rotatedCtx.rotate(rotRad);

        // Apply flips
        rotatedCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

        // Draw the image centered
        rotatedCtx.drawImage(
          image,
          -image.naturalWidth / 2,
          -image.naturalHeight / 2
        );

        // Set the final canvas size to the cropped area
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the cropped area from the rotated canvas
        ctx.drawImage(
          rotatedCanvas,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        // Convert to blob with high quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              throw new Error('Canvas is empty');
            }
            const croppedImageUrl = URL.createObjectURL(blob);
            onCropComplete(croppedImageUrl);
            setIsProcessing(false);
            handleReset();
            onClose();
          },
          'image/png',
          1.0
        );
        return;
      } else {
        throw new Error('No crop area defined');
      }

      // Free crop mode rendering
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Apply flips for free crop
      if (flipH || flipV) {
        ctx.translate(flipH ? canvas.width : 0, flipV ? canvas.height : 0);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      }

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      // Convert to blob with high quality
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error('Canvas is empty');
          }
          const croppedImageUrl = URL.createObjectURL(blob);
          onCropComplete(croppedImageUrl);
          setIsProcessing(false);
          handleReset();
          onClose();
        },
        'image/png',
        1.0
      );
    } catch (error) {
      console.error('Error creating cropped image:', error);
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, imageUrl, rotation, flipH, flipV, onCropComplete, onClose, handleReset, isFreeCrop, freeCropArea, imageSize]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl border border-purple-500/30">
              <CropIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Crop Image</h2>
              <p className="text-xs text-white/50 hidden sm:block">
                {isFreeCrop ? 'Drag corners to resize • Drag center to move' : 'Pinch to zoom • Drag to move'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-all group"
          >
            <X className="w-5 h-5 text-white/70 group-hover:text-white group-hover:rotate-90 transition-all" />
          </button>
        </motion.div>

        {/* Crop Area */}
        <div className="relative flex-1 bg-black overflow-hidden">
          {isFreeCrop ? (
            // Free crop mode with custom resizable crop area
            <div
              ref={freeCropContainerRef}
              className="relative w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)' }}
            >
              <img
                src={imageUrl}
                alt="Crop preview"
                onLoad={handleImageLoad}
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                }}
                draggable={false}
              />
              <FreeCropArea
                containerRef={freeCropContainerRef}
                onCropChange={setFreeCropArea}
              />
            </div>
          ) : (
            // Fixed aspect ratio mode with react-easy-crop
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={currentAspectRatio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropAreaComplete}
              cropShape="rect"
              showGrid={true}
              style={{
                containerStyle: {
                  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
                },
                cropAreaStyle: {
                  border: '3px solid rgba(168, 85, 247, 0.8)',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 40px rgba(168, 85, 247, 0.4)',
                },
              }}
              classes={{
                containerClassName: 'touch-manipulation',
              }}
            />
          )}

          {/* Quick Controls Overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="p-3 bg-black/70 backdrop-blur-xl rounded-full border border-white/20 hover:border-purple-500/50 transition-all group"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5 text-white/70 group-hover:text-purple-400 transition-colors" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFlipH(!flipH)}
              className={`p-3 bg-black/70 backdrop-blur-xl rounded-full border transition-all ${flipH ? 'border-purple-500 bg-purple-500/20' : 'border-white/20 hover:border-purple-500/50'
                }`}
              title="Flip Horizontal"
            >
              <FlipHorizontal className={`w-5 h-5 transition-colors ${flipH ? 'text-purple-400' : 'text-white/70'}`} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFlipV(!flipV)}
              className={`p-3 bg-black/70 backdrop-blur-xl rounded-full border transition-all ${flipV ? 'border-purple-500 bg-purple-500/20' : 'border-white/20 hover:border-purple-500/50'
                }`}
              title="Flip Vertical"
            >
              <FlipVertical className={`w-5 h-5 transition-colors ${flipV ? 'text-purple-400' : 'text-white/70'}`} />
            </motion.button>
          </div>
        </div>

        {/* Bottom Controls */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-4 border-t border-white/10 bg-black/50 backdrop-blur-xl space-y-4"
        >
          {/* Zoom & Rotation Sliders - Only show for fixed aspect ratios */}
          {!isFreeCrop && (
            <div className="grid grid-cols-2 gap-4">
              {/* Zoom */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white/70 flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom</span>
                  </label>
                  <span className="text-xs font-mono text-purple-400">{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500 
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                    [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-pink-500
                    [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/50
                    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/50
                    [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                />
              </div>

              {/* Rotation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white/70 flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotation</span>
                  </label>
                  <span className="text-xs font-mono text-purple-400">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                    [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-pink-500
                    [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/50
                    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/50
                    [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                />
              </div>
            </div>
          )}

          {/* Free crop mode hint */}
          {isFreeCrop && (
            <div className="text-center py-2">
              <p className="text-sm text-white/50">
                <span className="text-purple-400">✨ Free Crop Mode</span> — Drag corners or edges to resize, drag center to move
              </p>
            </div>
          )}

          {/* Aspect Ratio Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/70 flex items-center gap-1.5">
                <Maximize className="w-3.5 h-3.5" />
                <span>Aspect Ratio</span>
              </label>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {aspectRatioPreset === 'free' ? 'Free' : aspectRatioPreset}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {ASPECT_RATIOS.map((ratio) => (
                <motion.button
                  key={ratio.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAspectRatioChange(ratio.value)}
                  className={`relative py-2.5 rounded-lg text-xs font-bold transition-all overflow-hidden ${aspectRatioPreset === ratio.value
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                >
                  {aspectRatioPreset === ratio.value && (
                    <motion.div
                      layoutId="activeRatio"
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={false}
                    />
                  )}
                  <span className="relative">{ratio.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-6 py-3.5 bg-white/5 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-all border border-white/10 hover:border-white/20 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={createCroppedImage}
              disabled={isProcessing}
              className="relative px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden group"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-700" />

              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="relative">Processing...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 relative" />
                  <span className="relative">Apply Crop</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
