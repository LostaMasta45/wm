'use client';

import { useState } from 'react';
import { usePosterStore } from '@/lib/store';
import { Star, Check, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
import TemplateSettingsModal from './TemplateSettingsModal';

interface Template {
  id: string;
  name: string;
  brandSlug: string;
  backgroundUrl?: string;
  watermarkUrl?: string;
  isFavorite?: boolean;
  settings: {
    backgroundColor: string;
  };
}

export default function TemplateGallery() {
  const { templates, selectedTemplate, setSelectedTemplate, toggleFavorite } = usePosterStore();
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedTemplateForSettings, setSelectedTemplateForSettings] = useState<Template | null>(null);

  const handleOpenSettings = (e: React.MouseEvent, template: Template) => {
    e.stopPropagation();
    setSelectedTemplateForSettings(template);
    setSettingsModalOpen(true);
  };

  const handleUpdateTemplate = (data: { backgroundUrl?: string; watermarkUrl?: string }) => {
    // Update template in store (you may need to add this functionality to the store)
    console.log('Updating template:', selectedTemplateForSettings?.id, data);
    // TODO: Implement store update method
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Brand Templates
        </h3>
      </div>

      <div className="space-y-2">
        {templates.map((template, index) => {
          const isSelected = selectedTemplate?.id === template.id;
          
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedTemplate(template)}
              className={`
                group relative cursor-pointer rounded-lg overflow-hidden
                transition-all duration-300
                ${isSelected 
                  ? 'ring-2 ring-primary bg-primary/10 shadow-lg' 
                  : 'hover:bg-muted/50'
                }
              `}
            >
              {/* Thumbnail */}
              <div className="flex items-center gap-3 p-3">
                <div className="relative w-12 h-16 rounded bg-gradient-to-br from-primary to-secondary flex-shrink-0 overflow-hidden shadow-md">
                  {/* Placeholder thumbnail */}
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                    3:4
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {template.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {template.brandSlug}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleOpenSettings(e, template)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Template settings"
                  >
                    <Settings2 className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(template.id);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Toggle favorite"
                  >
                    <Star
                      className={`w-4 h-4 transition-colors ${
                        template.isFavorite
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground hover:text-amber-400'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  layoutId="selected-template"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Add new template button */}
      <button className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all duration-300 hover:bg-primary/5">
        + Add Template
      </button>

      {/* Settings Modal */}
      {selectedTemplateForSettings && (
        <TemplateSettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          templateId={selectedTemplateForSettings.id}
          templateName={selectedTemplateForSettings.name}
          currentBackground={selectedTemplateForSettings.backgroundUrl}
          currentWatermark={selectedTemplateForSettings.watermarkUrl}
          onUpdate={handleUpdateTemplate}
        />
      )}
    </div>
  );
}
