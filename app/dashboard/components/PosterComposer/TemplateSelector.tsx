'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Settings, Trash2, Plus, Palette } from 'lucide-react';
import { Template } from '@/lib/store';

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplate: Template | null;
  onSelectTemplate: (template: Template) => void;
  onOpenSettings: (e: React.MouseEvent, template: Template) => void;
  onOpenDelete: (e: React.MouseEvent, template: Template) => void;
  onAddTemplate: () => void;
}

const getTemplateGradient = (templateId: string) => {
  const hash = templateId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'from-blue-500 via-cyan-500 to-teal-500',
    'from-purple-500 via-pink-500 to-red-500',
    'from-green-500 via-emerald-500 to-cyan-500',
    'from-orange-500 via-red-500 to-pink-500',
    'from-indigo-500 via-purple-500 to-pink-500',
    'from-yellow-500 via-orange-500 to-red-500',
    'from-teal-500 via-blue-500 to-indigo-500',
    'from-pink-500 via-purple-500 to-indigo-500',
  ];
  return gradients[hash % gradients.length];
};

const TemplateCard = React.memo(({ 
  template, 
  isSelected, 
  onSelect, 
  onSettings, 
  onDelete 
}: {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
  onSettings: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) => (
  <motion.div
    onClick={onSelect}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`
      relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] rounded-lg overflow-hidden snap-start cursor-pointer border-2 transition-all touch-manipulation
      ${isSelected
        ? 'border-primary shadow-lg shadow-primary/20'
        : 'border-border hover:border-primary/50'
      }
    `}
  >
    {/* Template Preview */}
    <div className="aspect-[3/4] relative overflow-hidden">
      {template.settings.backgroundColor === '#DYNAMIC' ? (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-white/10 blur-xl animate-pulse" />
            <Palette className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10" strokeWidth={2.5} />
          </div>
        </div>
      ) : template.thumbnail ? (
        <img
          src={template.thumbnail}
          alt={template.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${getTemplateGradient(template.id)} flex items-center justify-center`}>
          <div className="relative">
            <div className="absolute inset-0 bg-white/10 blur-xl" />
            <div className="relative z-10 text-white font-black text-3xl sm:text-4xl drop-shadow-lg">
              {template.name.charAt(0)}
            </div>
          </div>
        </div>
      )}
      
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
        </div>
      )}
    </div>

    {/* Template Info */}
    <div className={`
      p-2 sm:p-2.5 transition-colors
      ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'}
    `}>
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-xs sm:text-sm truncate">{template.name}</h3>
          <p className={`text-[10px] sm:text-xs truncate ${
            isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}>
            {template.brandSlug}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={onSettings}
            className={`flex-shrink-0 p-0.5 sm:p-1 rounded transition-colors border ${
              isSelected
                ? 'border-primary-foreground/30 hover:bg-primary-foreground/10'
                : 'border-border hover:bg-accent'
            }`}
            title="Edit template"
          >
            <Settings className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </button>

          <button
            onClick={onDelete}
            className={`flex-shrink-0 p-0.5 sm:p-1 rounded transition-colors border ${
              isSelected
                ? 'border-primary-foreground/30 hover:bg-destructive/20'
                : 'border-border hover:bg-destructive/10'
            }`}
            title="Delete template"
          >
            <Trash2 className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
              isSelected ? 'text-primary-foreground' : 'text-destructive'
            }`} />
          </button>
        </div>
      </div>
    </div>
  </motion.div>
));

TemplateCard.displayName = 'TemplateCard';

export default function TemplateSelector({
  templates,
  selectedTemplate,
  onSelectTemplate,
  onOpenSettings,
  onOpenDelete,
  onAddTemplate,
}: TemplateSelectorProps) {
  return (
    <section className="mb-4 md:mb-6">
      <div className="mb-3">
        <h2 className="text-sm md:text-base font-semibold text-foreground flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            1
          </span>
          <span>Choose Template</span>
        </h2>
      </div>

      <div className="relative -mx-4 md:mx-0">
        <div className="md:hidden absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
        
        <div 
          className="flex gap-3 md:gap-3 overflow-x-auto pb-3 snap-x snap-mandatory px-4 md:px-0 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50 transition-colors"
          style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
        >
          {/* Add Template Button */}
          <motion.button
            onClick={onAddTemplate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] rounded-lg overflow-hidden snap-start cursor-pointer border-2 border-dashed border-border hover:border-primary transition-all group touch-manipulation"
          >
            <div className="aspect-[3/4] bg-muted relative flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors">
                Add Template
              </p>
            </div>
          </motion.button>

          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <TemplateCard
                template={template}
                isSelected={selectedTemplate?.id === template.id}
                onSelect={() => onSelectTemplate(template)}
                onSettings={(e) => onOpenSettings(e, template)}
                onDelete={(e) => onOpenDelete(e, template)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
