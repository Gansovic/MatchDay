/**
 * Loading Dialog Component for MatchDay
 * 
 * Adapted from TravelBuddies LEVER principles for professional loading states.
 * Provides consistent loading experience across the application.
 * 
 * @example
 * ```typescript
 * await LoadingDialog.show({
 *   title: 'Creating League',
 *   message: 'Setting up your league...',
 *   operation: () => EdgeFunctionsService.getInstance().createLeague(data),
 * });
 * ```
 * 
 * This component should be used for ALL loading states.
 */

import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

interface LoadingDialogProps {
  title: string;
  message: string;
  estimatedDuration?: number;
  progress?: number;
  onCancel?: () => void;
}

interface ShowOptions<T> {
  title: string;
  message: string;
  estimatedDuration?: number;
  operation: () => Promise<T>;
  onProgress?: (progress: number) => void;
}

const LoadingDialogComponent: React.FC<LoadingDialogProps> = ({
  title,
  message,
  estimatedDuration,
  progress,
  onCancel
}) => {
  const [currentProgress, setCurrentProgress] = useState(progress || 0);

  React.useEffect(() => {
    if (estimatedDuration && !progress) {
      const interval = setInterval(() => {
        setCurrentProgress(prev => {
          if (prev >= 90) return prev;
          return prev + (100 - prev) * 0.1;
        });
      }, estimatedDuration / 100);

      return () => clearInterval(interval);
    }
  }, [estimatedDuration, progress]);

  React.useEffect(() => {
    if (progress !== undefined) {
      setCurrentProgress(progress);
    }
  }, [progress]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {message}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${currentProgress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            {Math.round(currentProgress)}% complete
          </div>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <div className="text-center">
            <button
              onClick={onCancel}
              className="px-6 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

class LoadingDialogService {
  private static instance: LoadingDialogService;
  private currentDialog: HTMLDivElement | null = null;
  private currentRoot: any = null;

  static getInstance(): LoadingDialogService {
    if (!LoadingDialogService.instance) {
      LoadingDialogService.instance = new LoadingDialogService();
    }
    return LoadingDialogService.instance;
  }

  async show<T>({
    title,
    message,
    estimatedDuration = 3000,
    operation,
    onProgress
  }: ShowOptions<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // Create dialog container
      this.currentDialog = document.createElement('div');
      document.body.appendChild(this.currentDialog);
      
      this.currentRoot = createRoot(this.currentDialog);

      let cancelled = false;
      let progress = 0;

      const handleCancel = () => {
        cancelled = true;
        this.hide();
        reject(new Error('Operation cancelled'));
      };

      const updateProgress = (newProgress: number) => {
        progress = newProgress;
        if (onProgress) onProgress(newProgress);
        this.render({ title, message, estimatedDuration, progress, onCancel: handleCancel });
      };

      // Initial render
      this.render({ title, message, estimatedDuration, progress, onCancel: handleCancel });

      // Execute operation
      operation()
        .then((result) => {
          if (!cancelled) {
            updateProgress(100);
            setTimeout(() => {
              this.hide();
              resolve(result);
            }, 300);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            this.hide();
            reject(error);
          }
        });
    });
  }

  private render(props: LoadingDialogProps) {
    if (this.currentRoot) {
      this.currentRoot.render(<LoadingDialogComponent {...props} />);
    }
  }

  hide() {
    if (this.currentRoot) {
      this.currentRoot.unmount();
      this.currentRoot = null;
    }
    if (this.currentDialog) {
      document.body.removeChild(this.currentDialog);
      this.currentDialog = null;
    }
  }
}

export const LoadingDialog = LoadingDialogService.getInstance();