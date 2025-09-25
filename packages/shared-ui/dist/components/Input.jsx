import React from 'react';
import { clsx } from 'clsx';
export const Input = ({ type = 'text', placeholder, value, onChange, disabled = false, className, label, error }) => {
    return (<div className={className}>
      {label && (<label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>)}
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange === null || onChange === void 0 ? void 0 : onChange(e.target.value)} disabled={disabled} className={clsx('block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500', {
            'border-red-300 focus:ring-red-500 focus:border-red-500': error,
            'bg-gray-50 cursor-not-allowed': disabled
        })}/>
      {error && (<p className="mt-1 text-sm text-red-600">{error}</p>)}
    </div>);
};
