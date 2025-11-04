import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Template type
export type Template = {
  id: string;
  name: string;
  brandSlug: string;
  thumbnail: string;
  backgroundUrl: string;
  watermarkUrl: string;
  settings: {
    padding: number;
    watermarkOpacity: number;
    watermarkSize: number;
    backgroundColor: string;
  };
  isFavorite?: boolean;
  usageCount?: number;
};

// Activity type
export type Activity = {
  id: string;
  type: 'export' | 'upload' | 'ai_enhance' | 'template_change';
  title: string;
  description: string;
  timestamp: number;
};

// Achievement type
export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: number;
};

// Store state
interface PosterStore {
  // Template
  templates: Template[];
  selectedTemplate: Template | null;
  setSelectedTemplate: (template: Template | null) => void;
  toggleFavorite: (templateId: string) => void;
  updateTemplate: (templateId: string, updates: Partial<Template>) => void;
  loadTemplatesFromDB: () => Promise<void>;
  seedDefaultTemplates: () => Promise<void>;
  saveTemplateToDb: (template: Template) => Promise<void>;
  
  // Images
  posterUrl: string;
  setPosterUrl: (url: string) => void;
  
  // Settings
  padding: number;
  setPadding: (padding: number) => void;
  watermarkOpacity: number;
  setWatermarkOpacity: (opacity: number) => void;
  watermarkSize: number;
  setWatermarkSize: (size: number) => void;
  borderRadius: number;
  setBorderRadius: (radius: number) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  aspectRatio: '3:4' | '4:5';
  setAspectRatio: (ratio: '3:4' | '4:5') => void;
  
  // Export
  exportedUrl: string;
  setExportedUrl: (url: string) => void;
  recentExports: Array<{
    id: string;
    url: string;
    thumbnail: string;
    timestamp: number;
    templateName: string;
    size?: string;
    dimensions?: string;
  }>;
  addRecentExport: (export_: {
    url: string;
    thumbnail: string;
    templateName: string;
    size?: string;
    dimensions?: string;
  }) => void;
  
  // Activities
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  
  // Achievements & Stats
  achievements: Record<string, Achievement>;
  unlockAchievement: (achievementId: string) => void;
  updateAchievementProgress: (achievementId: string, progress: number) => void;
  stats: {
    postersCreated: number;
    templatesUsedSet: Set<string>;
    aiUsageCount: number;
  };
  incrementStat: (stat: 'postersCreated' | 'aiUsageCount') => void;
  trackTemplateUsage: (templateId: string) => void;
  
  // Actions
  reset: () => void;
}

// Default templates
const defaultTemplates: Template[] = [
  {
    id: 'loker-tuban-primary',
    name: 'Loker Tuban',
    brandSlug: 'loker-tuban',
    thumbnail: '/templates/loker-tuban-thumb.jpg',
    backgroundUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1080&h=1440&fit=crop',
    watermarkUrl: 'https://images.unsplash.com/photo-1614680376739-414d95ff43df?w=400&h=400&fit=crop&sat=-100&opacity=20',
    settings: {
      padding: 5,
      watermarkOpacity: 12,
      watermarkSize: 30,
      backgroundColor: '#FFFFFF',
    },
    isFavorite: true,
    usageCount: 0,
  },
  {
    id: 'loker-jombang-primary',
    name: 'Loker Jombang',
    brandSlug: 'loker-jombang',
    thumbnail: '/templates/loker-jombang-thumb.jpg',
    backgroundUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1080&h=1440&fit=crop',
    watermarkUrl: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=400&fit=crop&sat=-100&opacity=20',
    settings: {
      padding: 8,
      watermarkOpacity: 15,
      watermarkSize: 30,
      backgroundColor: '#FFFFFF',
    },
    isFavorite: false,
    usageCount: 0,
  },
  {
    id: 'generic-modern',
    name: 'Modern Clean',
    brandSlug: 'generic',
    thumbnail: '/templates/generic-thumb.jpg',
    backgroundUrl: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1080&h=1440&fit=crop',
    watermarkUrl: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=400&fit=crop&sat=-100&opacity=20',
    settings: {
      padding: 10,
      watermarkOpacity: 10,
      watermarkSize: 30,
      backgroundColor: '#F8FAFC',
    },
    isFavorite: false,
    usageCount: 0,
  },
];

// Default achievements
const defaultAchievements: Record<string, Achievement> = {
  'first-export': {
    id: 'first-export',
    title: 'First Steps',
    description: 'Export your first poster',
    unlocked: false,
  },
  'speed-demon': {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Create 10 posters in one day',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  'template-master': {
    id: 'template-master',
    title: 'Template Master',
    description: 'Use all available templates',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
  },
};

export const usePosterStore = create<PosterStore>()(
  persist(
    (set, get) => ({
      // Initial state
      templates: defaultTemplates,
      selectedTemplate: defaultTemplates[0],
      posterUrl: '',
      padding: defaultTemplates[0].settings.padding,
      watermarkOpacity: defaultTemplates[0].settings.watermarkOpacity,
      watermarkSize: defaultTemplates[0].settings.watermarkSize,
      borderRadius: 0,
      showGrid: false,
      aspectRatio: '3:4',
      exportedUrl: '',
      recentExports: [],
      activities: [],
      achievements: defaultAchievements,
      stats: {
        postersCreated: 0,
        templatesUsedSet: new Set(),
        aiUsageCount: 0,
      },
      
      // Template actions
      setSelectedTemplate: (template) => {
        if (template) {
          set({
            selectedTemplate: template,
            padding: template.settings.padding,
            watermarkOpacity: template.settings.watermarkOpacity,
            watermarkSize: template.settings.watermarkSize,
          });
          
          get().addActivity({
            type: 'template_change',
            title: 'Template Changed',
            description: `Switched to ${template.name}`,
          });
        } else {
          set({ selectedTemplate: null });
        }
      },
      
      toggleFavorite: (templateId) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
          ),
        }));
      },
      
      updateTemplate: async (templateId, updates) => {
        const template = get().templates.find(t => t.id === templateId);
        if (!template) return;

        // Update locally first for instant UI feedback
        set((state) => {
          const templates = state.templates.map((t) =>
            t.id === templateId ? { ...t, ...updates } : t
          );
          const selectedTemplate = state.selectedTemplate?.id === templateId
            ? { ...state.selectedTemplate, ...updates }
            : state.selectedTemplate;
          
          return { templates, selectedTemplate };
        });

        // Check if templateId is a UUID (from database)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateId);
        
        if (isUUID) {
          // Sync with Supabase using UUID
          try {
            const response = await fetch(`/api/templates/${templateId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                backgroundUrl: updates.backgroundUrl,
                watermarkUrl: updates.watermarkUrl,
                settings: updates.settings,
              }),
            });

            if (!response.ok) {
              console.error('Failed to sync template to database');
            }
          } catch (error) {
            console.error('Error syncing template:', error);
          }
        } else {
          // For hardcoded ID templates, create/update in database by name
          try {
            const updatedTemplate = { ...template, ...updates };
            
            // Try to create new template in database
            const response = await fetch('/api/templates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: updatedTemplate.name,
                brandSlug: updatedTemplate.brandSlug,
                backgroundUrl: updatedTemplate.backgroundUrl,
                watermarkUrl: updatedTemplate.watermarkUrl,
                settings: updatedTemplate.settings,
              }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.data) {
                // Replace local template with database version (with UUID)
                set((state) => ({
                  templates: state.templates.map(t => 
                    t.id === templateId ? { ...updatedTemplate, id: result.data.id } : t
                  ),
                  selectedTemplate: state.selectedTemplate?.id === templateId
                    ? { ...updatedTemplate, id: result.data.id }
                    : state.selectedTemplate
                }));
                console.log(`Template "${template.name}" saved to database with UUID: ${result.data.id}`);
              }
            }
          } catch (error) {
            console.error('Failed to save template to database:', error);
          }
        }
      },

      loadTemplatesFromDB: async () => {
        try {
          const response = await fetch('/api/templates');
          if (response.ok) {
            const data = await response.json();
            console.log('Loaded templates from DB:', data.data?.length || 0);
            
            if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
              // Convert database presets to Template format
              const loadedTemplates: Template[] = data.data.map((preset: any) => {
                const settings = preset.settings as any;
                return {
                  id: preset.id,
                  name: preset.name,
                  brandSlug: 'loaded-from-db',
                  thumbnail: '/templates/thumb.jpg',
                  backgroundUrl: settings.backgroundUrl || '',
                  watermarkUrl: settings.watermarkUrl || '',
                  settings: {
                    padding: settings.padding || 5,
                    watermarkOpacity: settings.watermarkOpacity || 12,
                    watermarkSize: settings.watermarkSize || 30,
                    backgroundColor: settings.backgroundColor || '#FFFFFF',
                  },
                  isFavorite: false,
                  usageCount: 0,
                };
              });

              // Use loaded templates from database - DO NOT seed again
              set({ 
                templates: loadedTemplates,
                selectedTemplate: loadedTemplates[0] || null,
                padding: loadedTemplates[0]?.settings.padding || 5,
                watermarkOpacity: loadedTemplates[0]?.settings.watermarkOpacity || 12,
                watermarkSize: loadedTemplates[0]?.settings.watermarkSize || 30,
              });
              return; // IMPORTANT: Exit here, don't seed
            }
            
            // Only seed if truly empty
            console.log('No templates in database, seeding defaults ONCE...');
            await get().seedDefaultTemplates();
          } else {
            console.error('API error loading templates');
            // Use default templates locally without seeding
            set({ 
              templates: defaultTemplates,
              selectedTemplate: defaultTemplates[0] || null,
            });
          }
        } catch (error) {
          console.error('Failed to load templates from database:', error);
          // Use default templates locally without seeding
          set({ 
            templates: defaultTemplates,
            selectedTemplate: defaultTemplates[0] || null,
          });
        }
      },

      seedDefaultTemplates: async () => {
        try {
          // Create default templates in database
          const createdTemplates: Template[] = [];
          for (const template of defaultTemplates) {
            try {
              const response = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: template.name,
                  brandSlug: template.brandSlug,
                  backgroundUrl: template.backgroundUrl,
                  watermarkUrl: template.watermarkUrl,
                  settings: template.settings,
                }),
              });
              
              if (response.ok) {
                const result = await response.json();
                if (result.data) {
                  createdTemplates.push({
                    ...template,
                    id: result.data.id,
                  });
                }
              }
            } catch (err) {
              console.error(`Failed to seed template ${template.name}:`, err);
            }
          }
          
          // Set templates from created ones or fallback to defaults
          if (createdTemplates.length > 0) {
            set({ 
              templates: createdTemplates,
              selectedTemplate: createdTemplates[0],
            });
          } else {
            set({ 
              templates: defaultTemplates,
              selectedTemplate: defaultTemplates[0],
            });
          }
        } catch (error) {
          console.error('Failed to seed templates:', error);
          set({ 
            templates: defaultTemplates,
            selectedTemplate: defaultTemplates[0],
          });
        }
      },

      saveTemplateToDb: async (template) => {
        try {
          const response = await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: template.name,
              brandSlug: template.brandSlug,
              backgroundUrl: template.backgroundUrl,
              watermarkUrl: template.watermarkUrl,
              settings: template.settings,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.data) {
              // Update template with new UUID from database
              set((state) => ({
                templates: state.templates.map(t => 
                  t.id === template.id ? { ...t, id: result.data.id } : t
                ),
                selectedTemplate: state.selectedTemplate?.id === template.id
                  ? { ...state.selectedTemplate, id: result.data.id }
                  : state.selectedTemplate
              }));
            }
          }
        } catch (error) {
          console.error('Failed to save template to database:', error);
        }
      },
      
      // Image actions
      setPosterUrl: (url) => {
        set({ posterUrl: url });
        if (url) {
          get().addActivity({
            type: 'upload',
            title: 'Poster Uploaded',
            description: 'New poster uploaded successfully',
          });
        }
      },
      
      // Settings actions
      setPadding: (padding) => set({ padding }),
      setWatermarkOpacity: (opacity) => set({ watermarkOpacity: opacity }),
      setWatermarkSize: (size) => set({ watermarkSize: size }),
      setBorderRadius: (radius) => set({ borderRadius: radius }),
      setShowGrid: (show) => set({ showGrid: show }),
      setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
      setExportedUrl: (url) => set({ exportedUrl: url }),
      
      // Export actions
      addRecentExport: (export_) => {
        const newExport = {
          id: Date.now().toString(),
          ...export_,
          timestamp: Date.now(),
        };
        
        set((state) => ({
          recentExports: [newExport, ...state.recentExports].slice(0, 20),
        }));
        
        get().incrementStat('postersCreated');
        get().addActivity({
          type: 'export',
          title: 'Poster Exported',
          description: `Exported ${export_.templateName}`,
        });
        
        // Check achievements
        const state = get();
        if (!state.achievements['first-export'].unlocked) {
          get().unlockAchievement('first-export');
        }
        
        // Update speed demon progress
        const todayExports = state.recentExports.filter(
          e => Date.now() - e.timestamp < 24 * 60 * 60 * 1000
        ).length;
        get().updateAchievementProgress('speed-demon', todayExports);
      },
      
      // Activity actions
      addActivity: (activity) => {
        const newActivity: Activity = {
          ...activity,
          id: Date.now().toString(),
          timestamp: Date.now(),
        };
        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 50),
        }));
      },
      
      // Achievement actions
      unlockAchievement: (achievementId) => {
        set((state) => ({
          achievements: {
            ...state.achievements,
            [achievementId]: {
              ...state.achievements[achievementId],
              unlocked: true,
              unlockedAt: Date.now(),
            },
          },
        }));
      },
      
      updateAchievementProgress: (achievementId, progress) => {
        set((state) => {
          const achievement = state.achievements[achievementId];
          if (!achievement || achievement.unlocked) return {};
          
          const newProgress = Math.min(progress, achievement.maxProgress || progress);
          const shouldUnlock = achievement.maxProgress && newProgress >= achievement.maxProgress;
          
          return {
            achievements: {
              ...state.achievements,
              [achievementId]: {
                ...achievement,
                progress: newProgress,
                unlocked: shouldUnlock || achievement.unlocked,
                unlockedAt: shouldUnlock ? Date.now() : achievement.unlockedAt,
              },
            },
          };
        });
      },
      
      // Stats actions
      incrementStat: (stat) => {
        set((state) => ({
          stats: {
            ...state.stats,
            [stat]: state.stats[stat] + 1,
          },
        }));
      },
      
      trackTemplateUsage: (templateId) => {
        set((state) => {
          const newSet = new Set(state.stats.templatesUsedSet);
          newSet.add(templateId);
          
          // Update template master achievement
          const templatesUsed = newSet.size;
          get().updateAchievementProgress('template-master', templatesUsed);
          
          return {
            stats: {
              ...state.stats,
              templatesUsedSet: newSet,
            },
          };
        });
      },
      
      // Reset action
      reset: () => {
        const template = get().selectedTemplate;
        set({
          posterUrl: '',
          exportedUrl: '',
          padding: template?.settings.padding || 5,
          watermarkOpacity: template?.settings.watermarkOpacity || 12,
          watermarkSize: template?.settings.watermarkSize || 30,
          borderRadius: 0,
        });
      },
    }),
    {
      name: 'poster-composer-storage',
      partialize: (state) => ({
        // Don't persist templates - always load from database
        recentExports: state.recentExports,
        activities: state.activities,
        achievements: state.achievements,
        stats: {
          ...state.stats,
          templatesUsedSet: Array.from(state.stats.templatesUsedSet),
        },
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.stats.templatesUsedSet)) {
          state.stats.templatesUsedSet = new Set(state.stats.templatesUsedSet);
        }
      },
    }
  )
);
