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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        {...mergedProps}
        type={type}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-300 focus:border-[#16a34a] outline-none hover:bg-white transition-all"
      />

      {error && <p className="text-red-600 text-sm mt-1">{error.message}</p>}
    </div>
  );
};