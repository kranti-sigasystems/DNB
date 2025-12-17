import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { PasswordFieldProps } from "@/types/auth";

export const PasswordField: React.FC<PasswordFieldProps> = ({
  field,
  label,
  required,
  error,
}) => {
  const [show, setShow] = useState<boolean>(false);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          {...field}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-indigo-400 outline-none 
                     bg-gray-50 hover:bg-white transition-all"
        />

        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-4 text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mt-1">{error.message}</p>}
    </div>
  );
};