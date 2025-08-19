'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorRecoveryService } from './error-recovery.service';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  attemptingRecovery: boolean;
  recoveryAttempts: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private errorRecovery: ErrorRecoveryService;
  private readonly MAX_RECOVERY_ATTEMPTS = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      attemptingRecovery: false,
      recoveryAttempts: 0
    };
    this.errorRecovery = ErrorRecoveryService.getInstance();
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to error recovery service
    this.errorRecovery.logError(error, {
      componentStack: errorInfo.componentStack,
      digest: errorInfo.digest
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with error details
    this.setState({ errorInfo });

    // Attempt automatic recovery for known errors
    this.attemptRecovery(error);
  }

  private async attemptRecovery(error: Error) {
    if (this.state.recoveryAttempts >= this.MAX_RECOVERY_ATTEMPTS) {
      console.error('Max recovery attempts reached');
      return;
    }

    this.setState({ attemptingRecovery: true, recoveryAttempts: this.state.recoveryAttempts + 1 });

    try {
      const recovered = await this.errorRecovery.attemptRecovery(error);
      
      if (recovered) {
        // Reset error state after successful recovery
        setTimeout(() => {
          this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            attemptingRecovery: false
          });
        }, 1000);
      } else {
        this.setState({ attemptingRecovery: false });
      }
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      this.setState({ attemptingRecovery: false });
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      attemptingRecovery: false,
      recoveryAttempts: 0
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {this.state.attemptingRecovery ? 'Attempting Recovery...' : 'Something went wrong'}
              </h2>
              
              <p className="text-gray-600 mb-6">
                {this.state.attemptingRecovery 
                  ? `Recovery attempt ${this.state.recoveryAttempts} of ${this.MAX_RECOVERY_ATTEMPTS}...`
                  : 'We encountered an unexpected error. The issue has been logged and we\'re working on a fix.'}
              </p>

              {!this.state.attemptingRecovery && (
                <div className="space-y-3">
                  <button
                    onClick={this.handleReset}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                  
                  <button
                    onClick={this.handleReload}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Reload Page
                  </button>
                </div>
              )}

              {this.state.attemptingRecovery && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              )}

              {/* Show error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto">
                    <p className="text-red-600 mb-2">{this.state.error.message}</p>
                    <pre className="text-gray-700 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}