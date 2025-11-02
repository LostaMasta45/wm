'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Check } from 'lucide-react';

export interface ExportPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  width: number;
  height: number;
  ratio: string;
  platform: string;
}

export const exportPresets: ExportPreset[] = [
  {
    id: 'instagram-feed',
    name: 'Instagram Feed',
    icon: '📱',
    description: 'Square format for feed posts',
    width: 1080,
    height: 1080,
    ratio: '1:1',
    platform: 'Instagram',
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    icon: '📖',
    description: 'Vertical format for stories',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    platform: 'Instagram',
  },
  {
    id: 'instagram-portrait',
    name: 'Instagram Portrait',
    icon: '🖼️',
    description: 'Portrait format for feed',
    width: 1080,
    height: 1350,
    ratio: '4:5',
    platform: 'Instagram',
  },
  {
    id: 'facebook-post',
    name: 'Facebook Post',
    icon: '👍',
    description: 'Standard post format',
    width: 1200,
    height: 630,
    ratio: '1.91:1',
    platform: 'Facebook',
  },
  {
    id: 'twitter-post',
    name: 'Twitter Post',
    icon: '🐦',
    description: 'Landscape format',
    width: 1200,
    height: 675,
    ratio: '16:9',
    platform: 'Twitter',
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    icon: '💼',
    description: 'Professional format',
    width: 1200,
    height: 627,
    ratio: '1.91:1',
    platform: 'LinkedIn',
  },
  {
    id: 'whatsapp-status',
    name: 'WhatsApp Status',
    icon: '💬',
    description: 'Story format',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    platform: 'WhatsApp',
  },
  {
    id: 'a4-print',
    name: 'A4 Print',
    icon: '📄',
    description: 'Print-ready A4 size',
    width: 2480,
    height: 3508,
    ratio: 'A4',
    platform: 'Print',
  },
];

interface ExportPresetsProps {
  selectedPresets: string[];
  onTogglePreset: (presetId: string) => void;
  onExport: (presets: ExportPreset[]) => void;
  isExporting?: boolean;
}

export default function ExportPresets({
  selectedPresets,
  onTogglePreset,
  onExport,
  isExporting = false,
}: ExportPresetsProps) {
  const groupedPresets = exportPresets.reduce((acc, preset) => {
    if (!acc[preset.platform]) acc[preset.platform] = [];
    acc[preset.platform].push(preset);
    return acc;
  }, {} as Record<string, ExportPreset[]>);

  const handleExportSelected = () => {
    const presetsToExport = exportPresets.filter(p => selectedPresets.includes(p.id));
    onExport(presetsToExport);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Export Formats</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Select multiple formats to export at once
          </p>
        </div>
        {selectedPresets.length > 0 && (
          <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {selectedPresets.length} selected
          </div>
        )}
      </div>

      {/* Presets Grid by Platform */}
      <div className="space-y-6">
        {Object.entries(groupedPresets).map(([platform, presets]) => (
          <div key={platform}>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {platform}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presets.map((preset) => {
                const isSelected = selectedPresets.includes(preset.id);
                return (
                  <motion.button
                    key={preset.id}
                    onClick={() => onTogglePreset(preset.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative p-4 rounded-xl border-2 text-left transition-all
                      ${isSelected
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                        : 'border-border hover:border-primary/50 bg-card'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{preset.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-semibold text-foreground">
                            {preset.name}
                          </h5>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {preset.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <span className="px-2 py-0.5 bg-muted rounded font-mono">
                            {preset.width} × {preset.height}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{preset.ratio}</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Export Button */}
      {selectedPresets.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleExportSelected}
          disabled={isExporting}
          className="w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Exporting {selectedPresets.length} format{selectedPresets.length > 1 ? 's' : ''}...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Export {selectedPresets.length} Format{selectedPresets.length > 1 ? 's' : ''}</span>
            </>
          )}
        </motion.button>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => exportPresets.forEach(p => onTogglePreset(p.id))}
          className="text-primary hover:underline"
        >
          Select All
        </button>
        <span className="text-muted-foreground">•</span>
        <button
          onClick={() => selectedPresets.forEach(id => onTogglePreset(id))}
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
}
