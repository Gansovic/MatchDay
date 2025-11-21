// @ts-nocheck
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
const ToastContext = createContext(null);
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const showToast = (toast) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = {
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
    const hideToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };
    return (_jsxs(ToastContext.Provider, { value: { toasts, showToast, hideToast }, children: [children, _jsx(ToastContainer, { toasts: toasts, onHideToast: hideToast })] }));
}
function ToastContainer({ toasts, onHideToast }) {
    if (toasts.length === 0)
        return null;
    return (_jsx("div", { className: "fixed top-4 right-4 z-50 space-y-2", children: toasts.map(toast => (_jsx(ToastItem, { toast: toast, onHide: () => onHideToast(toast.id) }, toast.id))) }));
}
function ToastItem({ toast, onHide }) {
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
                return _jsx(CheckCircle, { className: `${iconClass} text-green-600` });
            case 'error':
                return _jsx(XCircle, { className: `${iconClass} text-red-600` });
            case 'warning':
                return _jsx(AlertCircle, { className: `${iconClass} text-yellow-600` });
            case 'info':
                return _jsx(Info, { className: `${iconClass} text-blue-600` });
            default:
                return _jsx(Info, { className: `${iconClass} text-gray-600` });
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
    return (_jsx("div", { className: `
        max-w-md p-4 rounded-lg border shadow-lg transition-all duration-200 transform
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getBackgroundColor()}
      `, children: _jsxs("div", { className: "flex items-start gap-3", children: [getIcon(), _jsxs("div", { className: "flex-1 min-w-0", children: [toast.title && (_jsx("p", { className: "font-medium text-gray-900 dark:text-gray-100 mb-1", children: toast.title })), _jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300", children: toast.message }), toast.action && (_jsx("button", { onClick: toast.action.onClick, className: "mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300", children: toast.action.label }))] }), _jsx("button", { onClick: handleHide, className: "flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300", children: _jsx(X, { className: "w-4 h-4" }) })] }) }));
}
//# sourceMappingURL=toast.js.map