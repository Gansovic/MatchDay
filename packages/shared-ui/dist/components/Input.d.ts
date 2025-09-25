import React from 'react';
interface InputProps {
    type?: 'text' | 'email' | 'password' | 'number';
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    className?: string;
    label?: string;
    error?: string;
}
export declare const Input: React.FC<InputProps>;
export {};
