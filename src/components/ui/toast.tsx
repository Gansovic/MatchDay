'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    };

    setToasts(prev => [...prev, newToast]);

    if (newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onHideToast={hideToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onHideToast: (id: string) => void;
}

function ToastContainer({ toasts, onHideToast }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onHide={() => onHideToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onHide: () => void;
}

function ToastItem({ toast, onHide }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleHide = () => {
    setIsVisible(false);
    setTimeout(onHide, 200); // Wait for animation
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    switch (toast.type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'error':
        return <XCircle className={`${iconClass} text-red-600`} />;
      case 'warning':
        return <AlertCircle className={`${iconClass} text-yellow-600`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-600`} />;
      default:
        return <Info className={`${iconClass} text-gray-600`} />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div
      className={`
        max-w-md p-4 rounded-lg border shadow-lg transition-all duration-200 transform
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getBackgroundColor()}
      `}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              {toast.title}
            </p>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {toast.message}
          </p>
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleHide}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}