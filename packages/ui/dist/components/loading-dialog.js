'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
const LoadingDialogComponent = ({ title, message, estimatedDuration, progress, onCancel }) => {
    const [currentProgress, setCurrentProgress] = useState(progress || 0);
    React.useEffect(() => {
        if (estimatedDuration && !progress) {
            const interval = setInterval(() => {
                setCurrentProgress(prev => {
                    if (prev >= 90)
                        return prev;
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
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsxs("div", { className: "w-16 h-16 mx-auto mb-4 relative", children: [_jsx("div", { className: "w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse" }), _jsx("div", { className: "absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" })] }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-2", children: title }), _jsx("p", { className: "text-gray-600 dark:text-gray-300", children: message })] }), _jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300 ease-out", style: { width: `${currentProgress}%` } }) }), _jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 text-center mt-2", children: [Math.round(currentProgress), "% complete"] })] }), onCancel && (_jsx("div", { className: "text-center", children: _jsx("button", { onClick: onCancel, className: "px-6 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors", children: "Cancel" }) }))] }) }));
};
class LoadingDialogService {
    constructor() {
        this.currentDialog = null;
        this.currentRoot = null;
    }
    static getInstance() {
        if (!LoadingDialogService.instance) {
            LoadingDialogService.instance = new LoadingDialogService();
        }
        return LoadingDialogService.instance;
    }
    async show({ title, message, estimatedDuration = 3000, operation, onProgress }) {
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
            const updateProgress = (newProgress) => {
                progress = newProgress;
                if (onProgress)
                    onProgress(newProgress);
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
    render(props) {
        if (this.currentRoot) {
            this.currentRoot.render(_jsx(LoadingDialogComponent, { ...props }));
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
//# sourceMappingURL=loading-dialog.js.map