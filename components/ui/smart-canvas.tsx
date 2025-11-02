'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize, Grid3x3 } from 'lucide-react';

interface SmartCanvasProps {
  width: number;
  height: number;
  showGrid?: boolean;
  showGuides?: boolean;
  onRender?: (ctx: CanvasRenderingContext2D) => void;
  children?: React.ReactNode;
}

export default function SmartCanvas({
  width,
  height,
  showGrid = false,
  showGuides = false,
  onRender,
  children
}: SmartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGridOverlay, setShowGridOverlay] = useState(showGrid);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid if enabled
    if (showGridOverlay) {
      drawGrid(ctx, width, height);
    }

    // Draw guides if enabled
    if (showGuides) {
      drawGuides(ctx, width, height);
    }

    // Custom render
    if (onRender) {
      onRender(ctx);
    }
  }, [width, height, showGridOverlay, showGuides, onRender]);

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.1)';
    ctx.lineWidth = 1;

    const gridSize = 50;

    // Vertical lines
    for (let x = 0; x <= w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Center lines (stronger)
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.3)';
    ctx.lineWidth = 2;
    
    // Vertical center
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Horizontal center
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  };

  const drawGuides = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = 'rgba(255, 0, 100, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Rule of thirds
    const thirdW = w / 3;
    const thirdH = h / 3;

    // Vertical thirds
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(thirdW * i, 0);
      ctx.lineTo(thirdW * i, h);
      ctx.stroke();
    }

    // Horizontal thirds
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(0, thirdH * i);
      ctx.lineTo(w, thirdH * i);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative w-full h-full">
      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden rounded-xl bg-muted/30"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'default' }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s',
          }}
          className="flex items-center justify-center w-full h-full"
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full shadow-2xl"
            style={{ display: 'block' }}
          />
        </div>

        {children}
      </div>

      {/* Canvas Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 p-2 bg-card/95 backdrop-blur-xl rounded-xl border border-border shadow-lg">
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        
        <div className="px-3 py-1 text-sm font-mono bg-muted rounded">
          {Math.round(zoom * 100)}%
        </div>
        
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-border" />
        
        <button
          onClick={handleResetView}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Reset View"
        >
          <Maximize className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => setShowGridOverlay(!showGridOverlay)}
          className={`p-2 rounded-lg transition-colors ${
            showGridOverlay ? 'bg-primary text-white' : 'hover:bg-muted'
          }`}
          title="Toggle Grid"
        >
          <Grid3x3 className="w-4 h-4" />
        </button>
      </div>

      {/* Info Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-card/95 backdrop-blur-xl rounded-lg border border-border shadow-lg text-xs">
        <span className="font-mono">{width} × {height}</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground">3:4</span>
        {showGridOverlay && (
          <>
            <span className="text-muted-foreground">•</span>
            <span className="text-primary">Grid</span>
          </>
        )}
      </div>

      {/* Pan Hint */}
      <AnimatePresence>
        {!isDragging && zoom > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-4 px-3 py-2 bg-black/60 backdrop-blur-sm text-white text-xs rounded-lg"
          >
            Hold Alt + Drag to pan • Scroll to zoom
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
