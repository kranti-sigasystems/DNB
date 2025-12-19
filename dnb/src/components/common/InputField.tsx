import React from "react";
import { InputFieldProps } from "@/types/auth";

export const InputField: React.FC<InputFieldProps> = ({
  label,
  required,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  field,
}) => {
  const mergedProps = field
    ? field
    : { name, value, onChange };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        {...mergedProps}
        type={type}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none hover:bg-accent transition-all"
      />

      {error && <p className="text-destructive text-sm mt-1">{error.message}</p>}
    </div>
  );
};