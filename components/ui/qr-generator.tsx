'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Download, Copy, Check } from 'lucide-react';

interface QRGeneratorProps {
  url: string;
  size?: number;
  includeInCanvas?: boolean;
  onGenerate?: (dataUrl: string) => void;
}

export default function QRGenerator({ url, size = 200, includeInCanvas, onGenerate }: QRGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'qrcode.png';
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  useEffect(() => {
    if (onGenerate && qrRef.current) {
      const svg = qrRef.current.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const dataUrl = 'data:image/svg+xml;base64,' + btoa(svgData);
        onGenerate(dataUrl);
      }
    }
  }, [url, onGenerate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4 p-6 bg-card rounded-xl border border-border"
    >
      <div ref={qrRef} className="p-4 bg-white rounded-lg">
        <QRCodeSVG
          value={url}
          size={size}
          level="H"
          includeMargin={true}
        />
      </div>

      <div className="w-full space-y-2">
        <input
          type="text"
          value={url}
          readOnly
          className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border outline-none"
        />

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy URL
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {includeInCanvas && (
        <div className="text-xs text-muted-foreground text-center">
          QR code will be included in the bottom-right corner of your exported poster
        </div>
      )}
    </motion.div>
  );
}
