/**
 * Centralized Error Handler
 * 
 * Provides unified error handling, formatting, and recovery suggestions
 * for the entire application.
 */

import { ErrorRecoveryService } from './error-recovery.service';

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export interface ErrorContext {
  type: ErrorType;
  code?: string;
  statusCode?: number;
  originalError?: Error;
  metadata?: Record<string, any>;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface ErrorSolution {
  description: string;
  action?: () => void | Promise<void>;
  actionLabel?: string;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;
  public readonly statusCode?: number;
  public readonly metadata?: Record<string, any>;
  public readonly solutions: ErrorSolution[];
  public readonly isRecoverable: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    options?: {
      code?: string;
      statusCode?: number;
      metadata?: Record<string, any>;
      solutions?: ErrorSolution[];
      isRecoverable?: boolean;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = options?.code;
    this.statusCode = options?.statusCode;
    this.metadata = options?.metadata;
    this.solutions = options?.solutions || [];
    this.isRecoverable = options?.isRecoverable ?? true;
    this.timestamp = new Date();
    
    if (options?.cause) {
      this.cause = options.cause;
    }

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorRecovery: ErrorRecoveryService;
  private errorHandlers: Map<ErrorType, (error: AppError) => ErrorSolution[]>;

  private constructor() {
    this.errorRecovery = ErrorRecoveryService.getInstance();
    this.errorHandlers = new Map();
    this.initializeErrorHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private initializeErrorHandlers() {
    // Network error handler
    this.errorHandlers.set(ErrorType.NETWORK, (error) => [
      {
        description: 'Check your internet connection',
        action: () => window.location.reload(),
        actionLabel: 'Retry'
      },
      {
        description: 'The server might be temporarily unavailable',
        action: async () => {
          await this.errorRecovery.retryOperation(
            () => fetch('/api/health'),
            { maxAttempts: 3 }
          );
        },
        actionLabel: 'Check Server Status'
      }
    ]);

    // Auth error handler
    this.errorHandlers.set(ErrorType.AUTH, (error) => [
      {
        description: 'Your session may have expired',
        action: () => {
          window.location.href = '/login';
        },
        actionLabel: 'Sign In Again'
      },
      {
        description: 'Try refreshing your credentials',
        action: async () => {
          // Attempt to refresh session
          await fetch('/api/auth/refresh', { method: 'POST' });
          window.location.reload();
        },
        actionLabel: 'Refresh Session'
      }
    ]);

    // Database error handler
    this.errorHandlers.set(ErrorType.DATABASE, () => [
      {
        description: 'Database connection issue',
        action: () => window.location.reload(),
        actionLabel: 'Retry'
      },
      {
        description: 'Contact support if the issue persists',
        action: () => {
          console.log('Opening support...');
        },
        actionLabel: 'Get Help'
      }
    ]);

    // Validation error handler
    this.errorHandlers.set(ErrorType.VALIDATION, () => [
      {
        description: 'Please check your input and try again',
        actionLabel: 'Review Input'
      }
    ]);

    // Permission error handler
    this.errorHandlers.set(ErrorType.PERMISSION, () => [
      {
        description: 'You don\'t have permission to perform this action',
        action: () => {
          window.history.back();
        },
        actionLabel: 'Go Back'
      }
    ]);

    // Rate limit error handler
    this.errorHandlers.set(ErrorType.RATE_LIMIT, () => [
      {
        description: 'Too many requests. Please wait before trying again',
        actionLabel: 'Wait and Retry'
      }
    ]);
  }

  /**
   * Process and enhance an error with context and solutions
   */
  handle(error: unknown, context?: Partial<ErrorContext>): AppError {
    // If already an AppError, enhance it
    if (error instanceof AppError) {
      if (context) {
        error.metadata = { ...error.metadata, ...context.metadata };
      }
      return error;
    }

    // Convert to AppError
    const appError = this.toAppError(error, context);
    
    // Add solutions if not already present
    if (appError.solutions.length === 0) {
      const handler = this.errorHandlers.get(appError.type);
      if (handler) {
        appError.solutions.push(...handler(appError));
      }
    }

    // Log to recovery service
    this.errorRecovery.logError(appError, context);

    return appError;
  }

  /**
   * Convert any error to AppError
   */
  private toAppError(error: unknown, context?: Partial<ErrorContext>): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      const type = this.detectErrorType(error, context);
      const message = this.getHumanReadableMessage(error, type);
      
      return new AppError(message, type, {
        code: context?.code,
        statusCode: context?.statusCode,
        metadata: context?.metadata,
        cause: error,
        isRecoverable: this.isRecoverable(type)
      });
    }

    // Handle non-Error objects
    const message = typeof error === 'string' ? error : 'An unexpected error occurred';
    return new AppError(message, ErrorType.UNKNOWN, {
      metadata: { originalError: error }
    });
  }

  /**
   * Detect error type from error object and context
   */
  private detectErrorType(error: Error, context?: Partial<ErrorContext>): ErrorType {
    if (context?.type) {
      return context.type;
    }

    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Network errors
    if (name.includes('network') || 
        message.includes('fetch') || 
        message.includes('network') ||
        message.includes('failed to fetch')) {
      return ErrorType.NETWORK;
    }

    // Auth errors
    if (message.includes('auth') || 
        message.includes('unauthorized') ||
        message.includes('unauthenticated') ||
        context?.statusCode === 401) {
      return ErrorType.AUTH;
    }

    // Permission errors
    if (message.includes('permission') || 
        message.includes('forbidden') ||
        context?.statusCode === 403) {
      return ErrorType.PERMISSION;
    }

    // Database errors
    if (message.includes('database') || 
        message.includes('postgres') ||
        message.includes('sql') ||
        message.includes('supabase')) {
      return ErrorType.DATABASE;
    }

    // Validation errors
    if (message.includes('validation') || 
        message.includes('invalid') ||
        message.includes('required') ||
        context?.statusCode === 400) {
      return ErrorType.VALIDATION;
    }

    // Not found errors
    if (message.includes('not found') || 
        context?.statusCode === 404) {
      return ErrorType.NOT_FOUND;
    }

    // Rate limit errors
    if (message.includes('rate limit') || 
        message.includes('too many') ||
        context?.statusCode === 429) {
      return ErrorType.RATE_LIMIT;
    }

    // Server errors
    if (context?.statusCode && context.statusCode >= 500) {
      return ErrorType.SERVER;
    }

    // Client errors
    if (context?.statusCode && context.statusCode >= 400) {
      return ErrorType.CLIENT;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Get human-readable error message
   */
  private getHumanReadableMessage(error: Error, type: ErrorType): string {
    const defaultMessages: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: 'Connection error. Please check your internet connection.',
      [ErrorType.AUTH]: 'Authentication failed. Please sign in again.',
      [ErrorType.VALIDATION]: 'Invalid input. Please check your data and try again.',
      [ErrorType.DATABASE]: 'Database error. Please try again later.',
      [ErrorType.PERMISSION]: 'You don\'t have permission to perform this action.',
      [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
      [ErrorType.RATE_LIMIT]: 'Too many requests. Please slow down.',
      [ErrorType.SERVER]: 'Server error. Our team has been notified.',
      [ErrorType.CLIENT]: 'Request error. Please check your input.',
      [ErrorType.UNKNOWN]: 'An unexpected error occurred.'
    };

    // Use original message if it's already user-friendly
    if (this.isUserFriendlyMessage(error.message)) {
      return error.message;
    }

    return defaultMessages[type] || error.message;
  }

  /**
   * Check if message is user-friendly
   */
  private isUserFriendlyMessage(message: string): boolean {
    // Check if message contains technical jargon
    const technicalTerms = [
      'undefined', 'null', 'stack', 'trace', 
      'exception', 'throw', 'catch', 'async',
      'promise', 'reject', 'resolve'
    ];
    
    const lowerMessage = message.toLowerCase();
    return !technicalTerms.some(term => lowerMessage.includes(term));
  }

  /**
   * Check if error type is recoverable
   */
  private isRecoverable(type: ErrorType): boolean {
    const recoverableTypes = [
      ErrorType.NETWORK,
      ErrorType.AUTH,
      ErrorType.RATE_LIMIT,
      ErrorType.DATABASE
    ];
    
    return recoverableTypes.includes(type);
  }

  /**
   * Format error for display
   */
  format(error: AppError): {
    title: string;
    message: string;
    solutions: ErrorSolution[];
    showDetails: boolean;
  } {
    const titles: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: 'Connection Problem',
      [ErrorType.AUTH]: 'Authentication Required',
      [ErrorType.VALIDATION]: 'Invalid Input',
      [ErrorType.DATABASE]: 'Database Error',
      [ErrorType.PERMISSION]: 'Access Denied',
      [ErrorType.NOT_FOUND]: 'Not Found',
      [ErrorType.RATE_LIMIT]: 'Too Many Requests',
      [ErrorType.SERVER]: 'Server Error',
      [ErrorType.CLIENT]: 'Request Error',
      [ErrorType.UNKNOWN]: 'Unexpected Error'
    };

    return {
      title: titles[error.type] || 'Error',
      message: error.message,
      solutions: error.solutions,
      showDetails: process.env.NODE_ENV === 'development'
    };
  }

  /**
   * Handle async errors in a standardized way
   */
  async handleAsync<T>(
    operation: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw this.handle(error, context);
    }
  }

  /**
   * Wrap a function with error handling
   */
  wrap<T extends (...args: any[]) => any>(
    fn: T,
    context?: Partial<ErrorContext>
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        
        if (result instanceof Promise) {
          return result.catch(error => {
            throw this.handle(error, context);
          });
        }
        
        return result;
      } catch (error) {
        throw this.handle(error, context);
      }
    }) as T;
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export function handleError(error: unknown, context?: Partial<ErrorContext>): AppError {
  return errorHandler.handle(error, context);
}

export function wrapAsync<T>(
  operation: () => Promise<T>,
  context?: Partial<ErrorContext>
): Promise<T> {
  return errorHandler.handleAsync(operation, context);
}