'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // General
  { keys: ['⌘', 'K'], description: 'Open Command Palette', category: 'General' },
  { keys: ['?'], description: 'Show Keyboard Shortcuts', category: 'General' },
  { keys: ['Esc'], description: 'Close Modal / Clear Canvas', category: 'General' },
  
  // Canvas
  { keys: ['⌘', 'V'], description: 'Paste Image from Clipboard', category: 'Canvas' },
  { keys: ['Space'], description: 'Quick Export', category: 'Canvas' },
  { keys: ['⌘', 'Z'], description: 'Undo', category: 'Canvas' },
  { keys: ['⌘', 'Shift', 'Z'], description: 'Redo', category: 'Canvas' },
  { keys: ['⌘', 'D'], description: 'Duplicate', category: 'Canvas' },
  { keys: ['⌘', 'H'], description: 'Toggle UI (Focus Mode)', category: 'Canvas' },
  { keys: ['⌘', 'G'], description: 'Toggle Grid', category: 'Canvas' },
  
  // Templates
  { keys: ['1'], description: 'Switch to Template 1', category: 'Templates' },
  { keys: ['2'], description: 'Switch to Template 2', category: 'Templates' },
  { keys: ['3'], description: 'Switch to Template 3', category: 'Templates' },
  { keys: ['4'], description: 'Switch to Template 4', category: 'Templates' },
  { keys: ['5'], description: 'Switch to Template 5', category: 'Templates' },
  
  // Export
  { keys: ['⌘', 'E'], description: 'Export Current Format', category: 'Export' },
  { keys: ['⌘', 'Shift', 'E'], description: 'Export All Formats', category: 'Export' },
  { keys: ['⌘', 'S'], description: 'Save as Template', category: 'Export' },
  
  // Navigation
  { keys: ['⌘', 'H'], description: 'Show History', category: 'Navigation' },
  { keys: ['⌘', ','], description: 'Open Settings', category: 'Navigation' },
];

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts when "?" is pressed
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Show shortcuts when holding "?" (for overlay mode)
      if (e.key === 'Shift') {
        setIsHolding(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsHolding(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 p-3 bg-card/95 backdrop-blur-xl rounded-full border border-border shadow-lg hover:shadow-xl transition-all z-40 group"
        title="Keyboard Shortcuts (?)"
      >
        <Keyboard className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      {/* Shortcuts Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-4xl bg-card/95 backdrop-blur-xl rounded-2xl border border-border shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Keyboard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Keyboard Shortcuts</h2>
                      <p className="text-sm text-muted-foreground">
                        Speed up your workflow with these shortcuts
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Shortcuts Grid */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                      <div key={category}>
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                          {category}
                        </h3>
                        <div className="space-y-3">
                          {categoryShortcuts.map((shortcut, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <span className="text-sm text-foreground">
                                {shortcut.description}
                              </span>
                              <div className="flex items-center gap-1">
                                {shortcut.keys.map((key, keyIndex) => (
                                  <kbd
                                    key={keyIndex}
                                    className="px-2 py-1 text-xs font-mono bg-card border border-border rounded shadow-sm"
                                  >
                                    {key}
                                  </kbd>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-muted/30 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    Press <kbd className="px-2 py-0.5 mx-1 bg-card border border-border rounded text-xs">?</kbd> anytime to show this panel
                  </p>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Holding Overlay (Quick Reference) */}
      <AnimatePresence>
        {isHolding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-20 left-4 z-50 p-4 bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 text-white max-w-xs"
          >
            <div className="text-xs space-y-2">
              <div className="font-bold mb-2">Quick Shortcuts:</div>
              <div className="flex justify-between">
                <span>Command Palette</span>
                <kbd className="px-2 py-0.5 bg-white/20 rounded">⌘K</kbd>
              </div>
              <div className="flex justify-between">
                <span>Quick Export</span>
                <kbd className="px-2 py-0.5 bg-white/20 rounded">Space</kbd>
              </div>
              <div className="flex justify-between">
                <span>Paste Image</span>
                <kbd className="px-2 py-0.5 bg-white/20 rounded">⌘V</kbd>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
