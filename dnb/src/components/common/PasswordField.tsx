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
      <label className="block text-sm font-medium text-foreground mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      <div className="relative">
        <input
          {...field}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none hover:bg-accent transition-all"
        />

        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {error && <p className="text-destructive text-sm mt-1">{error.message}</p>}
    </div>
  );
};