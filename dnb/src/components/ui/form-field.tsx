/**
 * Form Field Component
 * 
 * Reusable form field component with built-in error handling and validation
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getErrorInputProps } from '@/utils/form-error-focus';

export interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'textarea' | 'select';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  validationErrors?: Record<string, string>;
  options?: { value: string; label: string }[]; // For select fields
  rows?: number; // For textarea
  min?: number; // For number inputs
  max?: number; // For number inputs
  step?: number; // For number inputs
}

export function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  className = '',
  validationErrors = {},
  options = [],
  rows = 3,
  min,
  max,
  step,
}: FormFieldProps) {
  const errorProps = getErrorInputProps(id, validationErrors);
  const hasError = !!validationErrors[id];
  const errorMessage = validationErrors[id];

  const baseInputProps = {
    id,
    value: value?.toString() || '',
    placeholder,
    required,
    disabled,
    readOnly,
    className: `${className} ${errorProps.className}`.trim(),
    ...errorProps,
  };

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...baseInputProps}
            rows={rows}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'select':
        return (
          <Select
            value={value?.toString() || ''}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger
              className={`${className} ${errorProps.className}`.trim()}
              data-error={errorProps['data-error']}
              data-error-field={errorProps['data-error-field']}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            {...baseInputProps}
            type="number"
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      default:
        return (
          <Input
            {...baseInputProps}
            type={type}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderInput()}
      {hasError && (
        <p className="text-xs text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}

// Specialized form field components
export function EmailField(props: Omit<FormFieldProps, 'type'>) {
  return <FormField {...props} type="email" />;
}

export function PasswordField(props: Omit<FormFieldProps, 'type'>) {
  return <FormField {...props} type="password" />;
}

export function NumberField(props: Omit<FormFieldProps, 'type'>) {
  return <FormField {...props} type="number" />;
}

export function DateField(props: Omit<FormFieldProps, 'type'>) {
  return <FormField {...props} type="date" />;
}

export function TextareaField(props: Omit<FormFieldProps, 'type'>) {
  return <FormField {...props} type="textarea" />;
}

export function SelectField(props: Omit<FormFieldProps, 'type'>) {
  return <FormField {...props} type="select" />;
}