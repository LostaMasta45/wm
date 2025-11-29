'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface AutoSaveSettings {
  padding: number;
  watermarkOpacity: number;
  watermarkSize: number;
  borderRadius: number;
  backgroundColor: string;
}

interface UseAutoSaveOptions {
  templateId: string | undefined;
  settings: AutoSaveSettings;
  enabled: boolean;
  debounceMs?: number;
  onSaveStart?: () => void;
  onSaveEnd?: () => void;
  onSaveError?: (error: Error) => void;
}

const DEFAULT_TEMPLATES = [
  'dynamic-color',
  'loker-tuban-primary', 
  'loker-jombang-primary',
  'generic-modern'
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useAutoSave({
  templateId,
  settings,
  enabled,
  debounceMs = 1500,
  onSaveStart,
  onSaveEnd,
  onSaveError,
}: UseAutoSaveOptions) {
  const isSavingRef = useRef(false);
  const lastSavedRef = useRef<string>('');

  const shouldAutoSave = useCallback(() => {
    if (!templateId || !enabled) return false;
    if (DEFAULT_TEMPLATES.includes(templateId)) return false;
    if (!UUID_REGEX.test(templateId)) return false;
    return true;
  }, [templateId, enabled]);

  const saveToDatabase = useCallback(async () => {
    if (!shouldAutoSave() || !templateId) return;

    const settingsHash = JSON.stringify(settings);
    if (settingsHash === lastSavedRef.current) return;

    isSavingRef.current = true;
    onSaveStart?.();

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      lastSavedRef.current = settingsHash;
    } catch (error) {
      onSaveError?.(error as Error);
    } finally {
      isSavingRef.current = false;
      onSaveEnd?.();
    }
  }, [templateId, settings, shouldAutoSave, onSaveStart, onSaveEnd, onSaveError]);

  const debouncedSave = useDebouncedCallback(saveToDatabase, debounceMs);

  useEffect(() => {
    if (shouldAutoSave()) {
      debouncedSave();
    }
  }, [settings, shouldAutoSave, debouncedSave]);

  return {
    isSaving: isSavingRef.current,
    saveNow: saveToDatabase,
  };
}
