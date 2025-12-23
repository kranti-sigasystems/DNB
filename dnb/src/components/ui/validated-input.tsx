'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { validateField, ValidationPatterns, ValidationMessages, getValidationClass } from '@/utils/validation';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  validationType: keyof typeof ValidationPatterns;
  required?: boolean;
  showValidation?: boolean;
  onValidationChange?: (isValid: boolean, message?: string) => void;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  validationType: keyof typeof ValidationPatterns;
  required?: boolean;
  showValidation?: boolean;
  onValidationChange?: (isValid: boolean, message?: string) => void;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export function ValidatedInput({
  label,
  validationType,
  required = true,
  showValidation = true,
  onValidationChange,
  containerClassName,
  labelClassName,
  errorClassName,
  className,
  value,
  onChange,
  ...props
}: ValidatedInputProps) {
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    message?: string;
    touched: boolean;
  }>({
    isValid: true,
    touched: false,
  });

  const validateInput = (inputValue: string) => {
    if (!required && (!inputValue || inputValue.trim() === '')) {
      const state = { isValid: true, touched: true };
      setValidationState(state);
      onValidationChange?.(true);
      return;
    }

    if (required && (!inputValue || inputValue.trim() === '')) {
      const state = { isValid: false, message: ValidationMessages.required, touched: true };
      setValidationState(state);
      onValidationChange?.(false, ValidationMessages.required);
      return;
    }

    const validation = validateField(inputValue, validationType);
    const state = { ...validation, touched: true };
    setValidationState(state);
    onValidationChange?.(validation.isValid, validation.message);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange?.(e);
    
    // Validate on change if the field has been touched
    if (validationState.touched || newValue.length > 0) {
      validateInput(newValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    props.onBlur?.(e);
    validateInput(e.target.value);
  };

  const showError = showValidation && validationState.touched && !validationState.isValid;
  const showSuccess = showValidation && validationState.touched && validationState.isValid && value && String(value).trim() !== '';

  return (
    <div className={cn('space-y-2', containerClassName)}>
      <Label className={cn('text-sm font-medium', labelClassName)}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          {...props}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            getValidationClass(validationState.isValid, showError),
            showSuccess && 'border-green-500 focus:border-green-500 focus:ring-green-500',
            'pr-10',
            className
          )}
        />
        
        {showValidation && validationState.touched && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {validationState.isValid && value && String(value).trim() !== '' ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : showError ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : null}
          </div>
        )}
      </div>
      
      {showError && validationState.message && (
        <div className={cn(
          'flex items-center gap-1 text-red-500 text-sm',
          errorClassName
        )}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationState.message}</span>
        </div>
      )}
    </div>
  );
}

export function ValidatedTextarea({
  label,
  validationType,
  required = true,
  showValidation = true,
  onValidationChange,
  containerClassName,
  labelClassName,
  errorClassName,
  className,
  value,
  onChange,
  ...props
}: ValidatedTextareaProps) {
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    message?: string;
    touched: boolean;
  }>({
    isValid: true,
    touched: false,
  });

  const validateInput = (inputValue: string) => {
    if (!required && (!inputValue || inputValue.trim() === '')) {
      const state = { isValid: true, touched: true };
      setValidationState(state);
      onValidationChange?.(true);
      return;
    }

    if (required && (!inputValue || inputValue.trim() === '')) {
      const state = { isValid: false, message: ValidationMessages.required, touched: true };
      setValidationState(state);
      onValidationChange?.(false, ValidationMessages.required);
      return;
    }

    const validation = validateField(inputValue, validationType);
    const state = { ...validation, touched: true };
    setValidationState(state);
    onValidationChange?.(validation.isValid, validation.message);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange?.(e);
    
    // Validate on change if the field has been touched
    if (validationState.touched || newValue.length > 0) {
      validateInput(newValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    props.onBlur?.(e);
    validateInput(e.target.value);
  };

  const showError = showValidation && validationState.touched && !validationState.isValid;
  const showSuccess = showValidation && validationState.touched && validationState.isValid && value && String(value).trim() !== '';

  return (
    <div className={cn('space-y-2', containerClassName)}>
      <Label className={cn('text-sm font-medium', labelClassName)}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Textarea
          {...props}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            getValidationClass(validationState.isValid, showError),
            showSuccess && 'border-green-500 focus:border-green-500 focus:ring-green-500',
            className
          )}
        />
      </div>
      
      {showError && validationState.message && (
        <div className={cn(
          'flex items-center gap-1 text-red-500 text-sm mt-1',
          errorClassName
        )}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationState.message}</span>
        </div>
      )}
    </div>
  );
}