/**
 * Form Management Hook for MatchDay
 * 
 * Provides form state management, validation, and submission handling
 * for complex forms like team creation, user profiles, etc.
 */

'use client';

import { useState, useCallback, useRef } from 'react';

export interface ValidationRule<T = any> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
  min?: number;
  max?: number;
}

export interface FormField<T = any> {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

export interface FormOptions<T> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidationRule>>;
  onSubmit?: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useForm<T extends Record<string, any>>(options: FormOptions<T>) {
  const {
    initialValues,
    validationRules = {},
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true
  } = options;

  // Form state
  const [fields, setFields] = useState<Record<keyof T, FormField>>(() => {
    const initialFields: any = {};
    Object.keys(initialValues).forEach(key => {
      initialFields[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
        dirty: false
      };
    });
    return initialFields;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const initialValuesRef = useRef(initialValues);

  // Validation function
  const validateField = useCallback((name: keyof T, value: any): string | null => {
    const rules = validationRules[name];
    if (!rules) return null;

    // Required validation
    if (rules.required && (value === null || value === undefined || value === '')) {
      return `${String(name)} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return `${String(name)} must be at least ${rules.minLength} characters`;
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        return `${String(name)} must be no more than ${rules.maxLength} characters`;
      }
      
      if (rules.pattern && !rules.pattern.test(value)) {
        return `${String(name)} has invalid format`;
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return `${String(name)} must be at least ${rules.min}`;
      }
      
      if (rules.max !== undefined && value > rules.max) {
        return `${String(name)} must be no more than ${rules.max}`;
      }
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [validationRules]);

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    const newFields = { ...fields };
    let hasErrors = false;

    Object.keys(fields).forEach(key => {
      const fieldKey = key as keyof T;
      const error = validateField(fieldKey, fields[fieldKey].value);
      newFields[fieldKey] = {
        ...newFields[fieldKey],
        error,
        touched: true
      };
      
      if (error) {
        hasErrors = true;
      }
    });

    setFields(newFields);
    return !hasErrors;
  }, [fields, validateField]);

  // Set field value
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setFields(prev => {
      const newFields = {
        ...prev,
        [name]: {
          ...prev[name],
          value,
          dirty: value !== initialValuesRef.current[name],
          error: validateOnChange ? validateField(name, value) : prev[name].error
        }
      };
      
      return newFields;
    });
  }, [validateField, validateOnChange]);

  // Set field touched
  const setFieldTouched = useCallback((name: keyof T, touched = true) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        touched,
        error: touched && validateOnBlur ? validateField(name, prev[name].value) : prev[name].error
      }
    }));
  }, [validateField, validateOnBlur]);

  // Set field error
  const setFieldError = useCallback((name: keyof T, error: string | null) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error
      }
    }));
  }, []);

  // Get field props for easy binding to inputs
  const getFieldProps = useCallback((name: keyof T) => ({
    name: String(name),
    value: fields[name].value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setFieldValue(name, value);
    },
    onBlur: () => setFieldTouched(name, true),
    error: fields[name].error,
    hasError: !!fields[name].error && fields[name].touched
  }), [fields, setFieldValue, setFieldTouched]);

  // Reset form
  const reset = useCallback(() => {
    const resetFields: any = {};
    Object.keys(initialValues).forEach(key => {
      resetFields[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
        dirty: false
      };
    });
    setFields(resetFields);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, [initialValues]);

  // Submit form
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!onSubmit) return;

    // Validate all fields
    const isValid = validateAll();
    if (!isValid) {
      setSubmitError('Please fix the errors above');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Extract values
      const values: any = {};
      Object.keys(fields).forEach(key => {
        values[key] = fields[key as keyof T].value;
      });

      await onSubmit(values);
      setSubmitSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during submission';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, onSubmit, validateAll]);

  // Computed values
  const values = Object.keys(fields).reduce((acc, key) => {
    acc[key as keyof T] = fields[key as keyof T].value;
    return acc;
  }, {} as T);

  const errors = Object.keys(fields).reduce((acc, key) => {
    acc[key as keyof T] = fields[key as keyof T].error;
    return acc;
  }, {} as Record<keyof T, string | null>);

  const touched = Object.keys(fields).reduce((acc, key) => {
    acc[key as keyof T] = fields[key as keyof T].touched;
    return acc;
  }, {} as Record<keyof T, boolean>);

  const isDirty = Object.values(fields).some(field => field.dirty);
  const isValid = Object.values(fields).every(field => !field.error);
  const hasErrors = Object.values(fields).some(field => field.error && field.touched);

  return {
    // Values and state
    values,
    errors,
    touched,
    fields,
    
    // Status flags
    isDirty,
    isValid,
    hasErrors,
    isSubmitting,
    submitError,
    submitSuccess,
    
    // Actions
    setFieldValue,
    setFieldTouched,
    setFieldError,
    getFieldProps,
    validateAll,
    reset,
    handleSubmit
  };
}