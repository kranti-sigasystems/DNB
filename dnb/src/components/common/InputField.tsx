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
      <label className="block text-sm font-medium text-white mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        {...mergedProps}
        type={type}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none hover:bg-gray-700 transition-all"
      />

      {error && <p className="text-red-400 text-sm mt-1">{error.message}</p>}
    </div>
  );
};