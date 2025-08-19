/**
 * Base Service Class
 * 
 * Provides common functionality for all service classes including
 * error handling, retry logic, caching, and monitoring.
 */

import { ErrorRecoveryService } from '../error/error-recovery.service';
import { errorHandler, AppError, ErrorType } from '../error/error-handler';

export interface ServiceOptions {
  retryAttempts?: number;
  retryDelay?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  timeout?: number;
}

export interface OperationContext {
  operationName: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export abstract class BaseService {
  protected errorRecovery: ErrorRecoveryService;
  protected cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  protected options: Required<ServiceOptions>;

  constructor(options: ServiceOptions = {}) {
    this.errorRecovery = ErrorRecoveryService.getInstance();
    this.cache = new Map();
    this.options = {
      retryAttempts: 3,
      retryDelay: 1000,
      cacheEnabled: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      timeout: 10000, // 10 seconds
      ...options
    };

    // Clean up expired cache entries periodically
    setInterval(() => this.cleanupCache(), 60000); // Every minute
  }

  /**
   * Execute an operation with error handling and retry logic
   */
  protected async executeOperation<T>(
    operation: () => Promise<T>,
    context: OperationContext
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      return await this.errorRecovery.retryOperation(operation, {
        maxAttempts: this.options.retryAttempts,
        initialDelay: this.options.retryDelay,
        onRetry: (attempt, error) => {
          console.warn(`Retrying ${context.operationName} (attempt ${attempt}):`, error.message);
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Enhanced error with context
      const enhancedError = errorHandler.handle(error, {
        metadata: {
          ...context.metadata,
          operationName: context.operationName,
          duration,
          service: this.constructor.name
        },
        userId: context.userId
      });

      throw enhancedError;
    }
  }

  /**
   * Execute with caching support
   */
  protected async executeWithCache<T>(
    key: string,
    operation: () => Promise<T>,
    context: OperationContext,
    ttl?: number
  ): Promise<T> {
    if (!this.options.cacheEnabled) {
      return this.executeOperation(operation, context);
    }

    // Check cache first
    const cached = this.getFromCache<T>(key);
    if (cached) {
      return cached;
    }

    // Execute operation and cache result
    const result = await this.executeOperation(operation, context);
    this.setCache(key, result, ttl);
    
    return result;
  }

  /**
   * Execute with timeout
   */
  protected async executeWithTimeout<T>(
    operation: () => Promise<T>,
    context: OperationContext,
    timeout?: number
  ): Promise<T> {
    const timeoutMs = timeout || this.options.timeout;
    
    return this.executeOperation(
      () => Promise.race([
        operation(),
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
        )
      ]),
      context
    );
  }

  /**
   * Handle API responses with standardized error handling
   */
  protected async handleApiResponse<T>(
    response: Response,
    context: OperationContext
  ): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorType = ErrorType.SERVER;

      try {
        const errorBody = await response.text();
        if (errorBody) {
          try {
            const parsed = JSON.parse(errorBody);
            errorMessage = parsed.message || parsed.error || errorMessage;
          } catch {
            errorMessage = errorBody.length > 200 ? errorBody.substring(0, 200) + '...' : errorBody;
          }
        }
      } catch {
        // Ignore error reading body
      }

      // Classify error type based on status code
      if (response.status === 401) {
        errorType = ErrorType.AUTH;
      } else if (response.status === 403) {
        errorType = ErrorType.PERMISSION;
      } else if (response.status === 404) {
        errorType = ErrorType.NOT_FOUND;
      } else if (response.status === 429) {
        errorType = ErrorType.RATE_LIMIT;
      } else if (response.status >= 400 && response.status < 500) {
        errorType = ErrorType.CLIENT;
      }

      throw new AppError(errorMessage, errorType, {
        statusCode: response.status,
        metadata: {
          ...context.metadata,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        }
      });
    }

    try {
      return await response.json();
    } catch (error) {
      throw new AppError('Invalid JSON response', ErrorType.SERVER, {
        cause: error as Error,
        metadata: context.metadata
      });
    }
  }

  /**
   * Handle Supabase responses
   */
  protected handleSupabaseResponse<T>(
    result: { data: T | null; error: any },
    context: OperationContext
  ): T {
    if (result.error) {
      let errorType = ErrorType.DATABASE;
      let message = result.error.message || 'Database operation failed';

      // Classify Supabase errors
      if (result.error.code === 'PGRST116') {
        errorType = ErrorType.NOT_FOUND;
        message = 'Resource not found';
      } else if (result.error.message?.includes('permission')) {
        errorType = ErrorType.PERMISSION;
      } else if (result.error.message?.includes('authentication')) {
        errorType = ErrorType.AUTH;
      }

      throw new AppError(message, errorType, {
        code: result.error.code,
        metadata: {
          ...context.metadata,
          supabaseError: result.error
        }
      });
    }

    if (result.data === null) {
      throw new AppError('No data returned', ErrorType.NOT_FOUND, {
        metadata: context.metadata
      });
    }

    return result.data;
  }

  /**
   * Cache management
   */
  protected getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  protected setCache<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.cacheTTL
    });
  }

  protected invalidateCache(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(keyPattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    details: Record<string, any>;
  }> {
    const details: Record<string, any> = {
      cacheSize: this.cache.size,
      options: this.options,
      timestamp: new Date().toISOString()
    };

    try {
      // Override in subclasses for specific health checks
      await this.performHealthCheck();
      
      return {
        healthy: true,
        details
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          ...details,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Override in subclasses for specific health checks
   */
  protected async performHealthCheck(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Get service metrics
   */
  public getMetrics(): {
    cacheHitRate: number;
    cacheSize: number;
    errors: any[];
  } {
    return {
      cacheHitRate: 0, // Could track hits/misses if needed
      cacheSize: this.cache.size,
      errors: this.errorRecovery.getErrorLogs()
    };
  }

  /**
   * Batch operations with error handling
   */
  protected async batchOperation<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    context: OperationContext,
    options?: {
      batchSize?: number;
      failFast?: boolean;
      retryFailedItems?: boolean;
    }
  ): Promise<{ successes: R[]; failures: { item: T; error: AppError }[] }> {
    const {
      batchSize = 10,
      failFast = false,
      retryFailedItems = true
    } = options || {};

    const successes: R[] = [];
    const failures: { item: T; error: AppError }[] = [];

    // Process in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await this.executeOperation(
            () => operation(item),
            {
              ...context,
              operationName: `${context.operationName}_batch_${i}`,
              metadata: { ...context.metadata, batchIndex: i }
            }
          );
          
          return { success: true, item, result };
        } catch (error) {
          const appError = error instanceof AppError ? error : errorHandler.handle(error);
          
          if (failFast) {
            throw appError;
          }
          
          return { success: false, item, error: appError };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.success) {
          successes.push(result.result);
        } else {
          failures.push({ item: result.item, error: result.error });
        }
      });
    }

    // Retry failed items if requested
    if (retryFailedItems && failures.length > 0) {
      const retryResults = await this.batchOperation(
        failures.map(f => f.item),
        operation,
        { ...context, operationName: `${context.operationName}_retry` },
        { ...options, retryFailedItems: false } // Don't retry again
      );
      
      successes.push(...retryResults.successes);
      // Keep only the failures that failed again
      failures.length = 0;
      failures.push(...retryResults.failures);
    }

    return { successes, failures };
  }
}