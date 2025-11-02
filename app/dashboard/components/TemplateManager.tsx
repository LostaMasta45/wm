'use client';

import { useState } from 'react';
import { usePosterStore } from '@/lib/store';
import { Star, Check, Settings2, Plus, Edit2, Trash2 } from 'lucide-react';
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

export default function TemplateManager() {
  const { templates, selectedTemplate, setSelectedTemplate, toggleFavorite } = usePosterStore();
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedTemplateForSettings, setSelectedTemplateForSettings] = useState<Template | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const handleOpenSettings = (e: React.MouseEvent, template: Template) => {
    e.stopPropagation();
    setSelectedTemplateForSettings(template);
    setSettingsModalOpen(true);
  };

  const handleUpdateTemplate = (data: { backgroundUrl?: string; watermarkUrl?: string }) => {
    console.log('Updating template:', selectedTemplateForSettings?.id, data);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Brand Templates
        </h3>
        <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {templates.map((template, index) => {
          const isSelected = selectedTemplate?.id === template.id;
          
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                group relative cursor-pointer rounded-xl overflow-hidden
                transition-all duration-200 border-2
                ${isSelected 
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' 
                  : 'border-transparent hover:border-border hover:bg-muted/50'
                }
              `}
            >
              <div 
                className="flex items-center gap-3 p-4"
                onClick={() => setSelectedTemplate(template)}
              >
                {/* Thumbnail */}
                <div className={`
                  relative w-14 h-20 rounded-lg flex-shrink-0 overflow-hidden
                  bg-gradient-to-br from-primary to-secondary
                  ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                `}>
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                    3:4
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {template.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {template.brandSlug}
                  </p>
                  {isSelected && (
                    <span className="inline-block mt-1 text-xs font-medium text-primary">
                      Active
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleOpenSettings(e, template)}
                    className={`
                      p-2 rounded-lg transition-all
                      ${isSelected 
                        ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }
                    `}
                    title="Edit template"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(template.id);
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
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

              {/* Selected indicator bar */}
              {isSelected && (
                <motion.div
                  layoutId="selected-indicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Add new template button */}
      <button className="w-full py-4 border-2 border-dashed border-border hover:border-primary rounded-xl text-sm text-muted-foreground hover:text-primary transition-all duration-300 hover:bg-primary/5 flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" />
        <span className="font-medium">Add New Template</span>
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
