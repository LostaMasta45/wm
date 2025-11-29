'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onSave?: () => void;
  onExport?: () => void;
  onOpenFile?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onReset?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onSave,
  onExport,
  onOpenFile,
  onUndo,
  onRedo,
  onReset,
  enabled = true,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in input fields
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (modifier) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          onSave?.();
          break;
        case 'e':
          e.preventDefault();
          onExport?.();
          break;
        case 'o':
          e.preventDefault();
          onOpenFile?.();
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            onRedo?.();
          } else {
            onUndo?.();
          }
          break;
        case 'y':
          e.preventDefault();
          onRedo?.();
          break;
        case 'r':
          if (e.shiftKey) {
            e.preventDefault();
            onReset?.();
          }
          break;
      }
    }
    
    // Escape key to reset/close
    if (e.key === 'Escape') {
      onReset?.();
    }
  }, [enabled, onSave, onExport, onOpenFile, onUndo, onRedo, onReset]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Keyboard shortcut hints component data
export const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl+S', mac: '⌘S', action: 'Save Settings' },
  { key: 'Ctrl+E', mac: '⌘E', action: 'Export HD' },
  { key: 'Ctrl+O', mac: '⌘O', action: 'Open File' },
  { key: 'Ctrl+Z', mac: '⌘Z', action: 'Undo' },
  { key: 'Ctrl+Y', mac: '⌘⇧Z', action: 'Redo' },
  { key: 'Esc', mac: 'Esc', action: 'Reset' },
];
