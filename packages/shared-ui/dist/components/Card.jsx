import React from 'react';
import { clsx } from 'clsx';
export const Card = ({ children, className, padding = 'md' }) => {
    const paddingClasses = {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6'
    };
    return (<div className={clsx('bg-white rounded-lg border border-gray-200 shadow-sm', paddingClasses[padding], className)}>
      {children}
    </div>);
};
