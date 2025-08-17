/**
 * Generic API Hook for MatchDay
 * 
 * Provides a reusable pattern for API calls with loading states,
 * error handling, and caching capabilities
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ApiOptions {
  immediate?: boolean; // Execute immediately on mount
  cacheKey?: string; // Cache key for response caching
  cacheTime?: number; // Cache expiration time in ms
  retries?: number; // Number of retry attempts
  retryDelay?: number; // Delay between retries in ms
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
}

// Simple in-memory cache
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function useApi<T>(
  apiFunction: () => Promise<T>,
  dependencies: React.DependencyList = [],
  options: ApiOptions = {}
) {
  const {
    immediate = true,
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minutes default
    retries = 3,
    retryDelay = 1000
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null
  });

  const abortController = useRef<AbortController | null>(null);
  const retryCount = useRef(0);

  // Check cache first
  const getCachedData = useCallback((): T | null => {
    if (!cacheKey) return null;
    
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    return null;
  }, [cacheKey]);

  // Set cache data
  const setCachedData = useCallback((data: T) => {
    if (!cacheKey) return;
    
    apiCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: cacheTime
    });
  }, [cacheKey, cacheTime]);

  const executeWithRetry = useCallback(async (): Promise<T> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await apiFunction();
        retryCount.current = 0;
        return result;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry
        if (retryDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
    
    throw new Error('Max retries exceeded');
  }, [apiFunction, retries, retryDelay]);

  const execute = useCallback(async (force = false) => {
    // Check cache first if not forcing
    if (!force) {
      const cachedData = getCachedData();
      if (cachedData) {
        setState(prev => ({
          ...prev,
          data: cachedData,
          loading: false,
          error: null,
          lastFetch: new Date()
        }));
        return;
      }
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      const result = await executeWithRetry();
      
      // Cache the result
      setCachedData(result);
      
      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        error: null,
        lastFetch: new Date()
      }));
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        lastFetch: new Date()
      }));
      
      throw error;
    }
  }, [getCachedData, setCachedData, executeWithRetry]);

  // Execute on mount or dependency change
  useEffect(() => {
    if (immediate) {
      execute();
    }
    
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, dependencies);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const refetch = useCallback(() => execute(true), [execute]);
  const clearCache = useCallback(() => {
    if (cacheKey) {
      apiCache.delete(cacheKey);
    }
  }, [cacheKey]);

  return {
    ...state,
    execute,
    refetch,
    clearCache,
    isStale: cacheKey ? !getCachedData() : false
  };
}