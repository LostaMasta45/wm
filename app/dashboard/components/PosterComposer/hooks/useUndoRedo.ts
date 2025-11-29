'use client';

import { useState, useCallback, useRef } from 'react';

interface SettingsState {
  padding: number;
  watermarkOpacity: number;
  watermarkSize: number;
  borderRadius: number;
}

interface UseUndoRedoOptions {
  maxHistory?: number;
  onUndo?: (state: SettingsState) => void;
  onRedo?: (state: SettingsState) => void;
}

export function useUndoRedo(
  initialState: SettingsState,
  options: UseUndoRedoOptions = {}
) {
  const { maxHistory = 50, onUndo, onRedo } = options;
  
  // Use refs to avoid re-renders on every history change
  const historyRef = useRef<SettingsState[]>([initialState]);
  const currentIndexRef = useRef(0);
  
  // Force re-render when undo/redo state changes
  const [, forceUpdate] = useState({});
  
  const canUndo = currentIndexRef.current > 0;
  const canRedo = currentIndexRef.current < historyRef.current.length - 1;

  // Push new state to history
  const pushState = useCallback((newState: SettingsState) => {
    const history = historyRef.current;
    const currentIndex = currentIndexRef.current;
    
    // Check if state actually changed
    const currentState = history[currentIndex];
    if (
      currentState.padding === newState.padding &&
      currentState.watermarkOpacity === newState.watermarkOpacity &&
      currentState.watermarkSize === newState.watermarkSize &&
      currentState.borderRadius === newState.borderRadius
    ) {
      return; // No change, don't push
    }
    
    // Remove any future states (if we're not at the end)
    const newHistory = history.slice(0, currentIndex + 1);
    
    // Add new state
    newHistory.push({ ...newState });
    
    // Limit history size
    if (newHistory.length > maxHistory) {
      newHistory.shift();
    } else {
      currentIndexRef.current = newHistory.length - 1;
    }
    
    historyRef.current = newHistory;
    forceUpdate({});
  }, [maxHistory]);

  // Undo to previous state
  const undo = useCallback((): SettingsState | null => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      const state = historyRef.current[currentIndexRef.current];
      onUndo?.(state);
      forceUpdate({});
      return state;
    }
    return null;
  }, [onUndo]);

  // Redo to next state
  const redo = useCallback((): SettingsState | null => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++;
      const state = historyRef.current[currentIndexRef.current];
      onRedo?.(state);
      forceUpdate({});
      return state;
    }
    return null;
  }, [onRedo]);

  // Reset history
  const resetHistory = useCallback((state: SettingsState) => {
    historyRef.current = [{ ...state }];
    currentIndexRef.current = 0;
    forceUpdate({});
  }, []);

  // Get current state
  const getCurrentState = useCallback((): SettingsState => {
    return historyRef.current[currentIndexRef.current];
  }, []);

  return {
    pushState,
    undo,
    redo,
    resetHistory,
    getCurrentState,
    canUndo,
    canRedo,
    historyLength: historyRef.current.length,
    currentIndex: currentIndexRef.current,
  };
}

export type { SettingsState };
