/**
 * Toggle Hook for MatchDay
 * 
 * Simple hook for managing boolean state with toggle functionality,
 * useful for modals, dropdowns, and UI state management
 */

'use client';

import { useState, useCallback } from 'react';

export function useToggle(initialValue: boolean = false): [boolean, () => void, (value?: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setToggle = useCallback((newValue?: boolean) => {
    if (newValue !== undefined) {
      setValue(newValue);
    } else {
      setValue(prev => !prev);
    }
  }, []);

  return [value, toggle, setToggle];
}

export function useBoolean(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);

  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue(prev => !prev), []);

  return {
    value,
    setValue,
    setTrue,
    setFalse,
    toggle
  };
}