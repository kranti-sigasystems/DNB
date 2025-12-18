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
      <label className="block text-sm font-medium text-white mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <div className="relative">
        <input
          {...field}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none hover:bg-gray-700 transition-all"
        />

        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-4 text-gray-400 hover:text-white cursor-pointer transition-colors"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mt-1">{error.message}</p>}
    </div>
  );
};