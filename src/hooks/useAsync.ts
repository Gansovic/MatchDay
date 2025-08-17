/**
 * Async Hook for MatchDay
 * 
 * Manages async operations with loading states, error handling,
 * and automatic cleanup to prevent memory leaks
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface AsyncOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  dependencies: React.DependencyList = [],
  options: AsyncOptions = {}
) {
  const { immediate = false, onSuccess, onError } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const isMountedRef = useRef(true);
  const cancelRef = useRef<(() => void) | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      // Cancel any pending request
      if (cancelRef.current) {
        cancelRef.current();
      }

      let cancelled = false;
      cancelRef.current = () => {
        cancelled = true;
      };

      setState({
        data: null,
        loading: true,
        error: null
      });

      try {
        const result = await asyncFunction(...args);
        
        if (!cancelled && isMountedRef.current) {
          setState({
            data: result,
            loading: false,
            error: null
          });
          
          if (onSuccess) {
            onSuccess(result);
          }
        }
        
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        if (!cancelled && isMountedRef.current) {
          setState({
            data: null,
            loading: false,
            error: err
          });
          
          if (onError) {
            onError(err);
          }
        }
        
        throw err;
      }
    },
    [asyncFunction, onSuccess, onError]
  );

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (cancelRef.current) {
        cancelRef.current();
      }
    };
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}