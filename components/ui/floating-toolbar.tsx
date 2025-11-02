'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Crop, Palette, Sparkles, AlignCenter, Grid3x3 } from 'lucide-react';

interface ToolbarAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}

interface FloatingToolbarProps {
  show: boolean;
  actions: ToolbarAction[];
  position?: 'top' | 'bottom';
}

export default function FloatingToolbar({ show, actions, position = 'bottom' }: FloatingToolbarProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: position === 'bottom' ? 20 : -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'bottom' ? 20 : -20, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`
            fixed left-1/2 -translate-x-1/2 z-50
            ${position === 'bottom' ? 'bottom-8' : 'top-24'}
          `}
        >
          <div className="flex items-center gap-2 px-3 py-2 bg-card/95 backdrop-blur-xl rounded-2xl border border-border shadow-2xl">
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                onClick={action.onClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all
                  ${action.active
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }
                `}
                title={action.label}
              >
                {action.icon}
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {action.label}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Preset toolbar configurations
export const defaultCanvasActions: ToolbarAction[] = [
  {
    id: 'align-center',
    icon: <AlignCenter className="w-5 h-5" />,
    label: 'Align Center',
    onClick: () => {},
  },
  {
    id: 'fit-canvas',
    icon: <Maximize2 className="w-5 h-5" />,
    label: 'Fit to Canvas',
    onClick: () => {},
  },
  {
    id: 'crop',
    icon: <Crop className="w-5 h-5" />,
    label: 'Crop',
    onClick: () => {},
  },
  {
    id: 'filters',
    icon: <Palette className="w-5 h-5" />,
    label: 'Filters',
    onClick: () => {},
  },
  {
    id: 'ai-enhance',
    icon: <Sparkles className="w-5 h-5" />,
    label: 'AI Enhance',
    onClick: () => {},
  },
  {
    id: 'grid',
    icon: <Grid3x3 className="w-5 h-5" />,
    label: 'Toggle Grid',
    onClick: () => {},
  },
];
