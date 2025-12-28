'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Download, History } from 'lucide-react';
import SliderWithInput from '../SliderWithInput';

interface SettingsPanelProps {
  visible: boolean;
  padding: number;
  watermarkSize: number;
  watermarkOpacity: number;
  borderRadius: number;
  blurIntensity: number;
  isBlurMode: boolean;
  isSaving: boolean;
  templateName: string;
  onPaddingChange: (value: number) => void;
  onWatermarkSizeChange: (value: number) => void;
  onWatermarkOpacityChange: (value: number) => void;
  onBorderRadiusChange: (value: number) => void;
  onBlurIntensityChange: (value: number) => void;
  onSaveSettings: () => void;
  onExport: () => void;
  onSaveToHistory: () => void;
  isExporting: boolean;
  isSavingToHistory: boolean;
  aspectRatio: '3:4' | '4:5';
}

export default function SettingsPanel({
  visible,
  padding,
  watermarkSize,
  watermarkOpacity,
  borderRadius,
  blurIntensity,
  isBlurMode,
  isSaving,
  templateName,
  onPaddingChange,
  onWatermarkSizeChange,
  onWatermarkOpacityChange,
  onBorderRadiusChange,
  onBlurIntensityChange,
  onSaveSettings,
  onExport,
  onSaveToHistory,
  isExporting,
  isSavingToHistory,
  aspectRatio,
}: SettingsPanelProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="lg:col-span-1 space-y-3 sm:space-y-4 md:space-y-6"
        >
          {/* Settings */}
          <div>
            <div className="mb-2 sm:mb-3">
              <h2 className="text-sm md:text-base font-semibold text-foreground flex items-center gap-1.5 sm:gap-2">
                <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  3
                </span>
                <span>Settings</span>
              </h2>
            </div>

            <div className="bg-card rounded-lg border-2 border-border p-3 sm:p-4 md:p-5">
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                {isSaving && (
                  <div className="text-[10px] text-muted-foreground animate-pulse text-center">
                    Auto-saving...
                  </div>
                )}

                <SliderWithInput
                  label="Padding"
                  value={padding}
                  onChange={onPaddingChange}
                  min={0}
                  max={30}
                  step={1}
                  unit="%"
                  minLabel="0%"
                  maxLabel="30%"
                />

                <SliderWithInput
                  label="Watermark Size"
                  value={watermarkSize}
                  onChange={onWatermarkSizeChange}
                  min={10}
                  max={100}
                  step={1}
                  unit="%"
                  minLabel="10%"
                  maxLabel="100%"
                />

                <SliderWithInput
                  label="Watermark Opacity"
                  value={watermarkOpacity}
                  onChange={onWatermarkOpacityChange}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  minLabel="0%"
                  maxLabel="100%"
                />

                <SliderWithInput
                  label="Corner Radius"
                  value={borderRadius}
                  onChange={onBorderRadiusChange}
                  min={0}
                  max={100}
                  step={1}
                  unit="px"
                  minLabel="0px"
                  maxLabel="100px"
                />

                {isBlurMode && (
                  <SliderWithInput
                    label="🌫️ Blur Intensity"
                    value={blurIntensity}
                    onChange={onBlurIntensityChange}
                    min={5}
                    max={80}
                    step={1}
                    unit="px"
                    minLabel="5px"
                    maxLabel="80px"
                  />
                )}

                <button
                  onClick={onSaveSettings}
                  className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings for {templateName || 'Template'}</span>
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  Settings will be remembered for this template
                </p>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-card rounded-lg border-2 border-border p-3 sm:p-4 md:p-5 space-y-3">
            <button
              onClick={onExport}
              disabled={isExporting}
              className="w-full px-4 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation shadow-lg"
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Exporting HD...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download HD PNG</span>
                </>
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              2160 x {aspectRatio === '3:4' ? '2880' : '2700'} pixels - High Quality
            </p>

            <div className="border-t border-border pt-3">
              <button
                onClick={onSaveToHistory}
                disabled={isSavingToHistory}
                className="w-full px-4 py-2.5 bg-accent hover:bg-accent/80 text-foreground rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 touch-manipulation"
              >
                {isSavingToHistory ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <History className="w-4 h-4" />
                    <span>Save to History</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
