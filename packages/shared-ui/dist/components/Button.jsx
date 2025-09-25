import React from 'react';
import { clsx } from 'clsx';
export const Button = ({ children, variant = 'primary', size = 'md', disabled = false, onClick, className }) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500'
    };
    const sizeClasses = {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 py-3 text-lg'
    };
    return (<button className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)} disabled={disabled} onClick={onClick}>
      {children}
    </button>);
};
