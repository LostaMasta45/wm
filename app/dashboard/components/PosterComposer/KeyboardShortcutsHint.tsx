'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard, X, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KEYBOARD_SHORTCUTS } from './hooks/useKeyboardShortcuts';

export default function KeyboardShortcutsHint() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const macCheck = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      if (macCheck !== isMac) {
        setTimeout(() => setIsMac(macCheck), 0);
      }
    }
    
    // Hide pulse after 5 seconds
    const timer = setTimeout(() => setShowPulse(false), 5000);
    return () => clearTimeout(timer);
  }, [isMac]);

  // Listen for "?" key to toggle modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Floating Button with Pulse Animation */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 p-3 bg-card border-2 border-border rounded-full shadow-lg hover:bg-accent hover:border-primary/50 transition-all group"
        title="Keyboard Shortcuts (Press ?)"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Pulse ring */}
        {showPulse && (
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
        )}
        <Keyboard className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors relative z-10" />
        
        {/* Tooltip */}
        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Press ? for shortcuts
        </span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Content - Centered Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md bg-card border-2 border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Command className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Keyboard Shortcuts</h3>
                    <p className="text-xs text-muted-foreground">Speed up your workflow</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Shortcuts List */}
              <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
                {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                  <motion.div
                    key={shortcut.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                  >
                    <span className="text-sm text-foreground group-hover:text-foreground font-medium">
                      {shortcut.action}
                    </span>
                    <kbd className="px-3 py-1.5 text-xs font-mono bg-muted border border-border rounded-lg text-foreground shadow-sm">
                      {isMac ? shortcut.mac : shortcut.key}
                    </kbd>
                  </motion.div>
                ))}
                
                {/* Additional Tips */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Quick Tips</p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span>Ctrl + Scroll on preview to zoom</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span>Drag & drop images anywhere on upload zone</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono">?</kbd> to toggle
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
