"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface OtpInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  length?: number;
  onChange?: (value: string) => void;
}

const OtpInput = React.forwardRef<HTMLInputElement, OtpInputProps>(
  ({ className, length = 6, onChange, value = "", ...props }, ref) => {
    const [otp, setOtp] = React.useState<string[]>(
      Array(length).fill("").map((_, i) => (value as string)[i] || "")
    );
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    React.useEffect(() => {
      if (value !== otp.join("")) {
        setOtp(Array(length).fill("").map((_, i) => (value as string)[i] || ""));
      }
    }, [value, length]);

    const handleChange = (index: number, digit: string) => {
      if (!/^\d*$/.test(digit)) return;

      const newOtp = [...otp];
      newOtp[index] = digit.slice(-1); // Only take the last digit
      setOtp(newOtp);
      onChange?.(newOtp.join(""));

      // Auto-focus next input
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
      const newOtp = Array(length).fill("");
      
      for (let i = 0; i < Math.min(pastedData.length, length); i++) {
        newOtp[i] = pastedData[i];
      }
      
      setOtp(newOtp);
      onChange?.(newOtp.join(""));
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtp.findIndex(digit => !digit);
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
    };

    return (
      <div className="flex gap-2 justify-center">
        {Array(length)
          .fill(0)
          .map((_, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
                if (index === 0 && ref) {
                  if (typeof ref === 'function') {
                    ref(el);
                  } else {
                    ref.current = el;
                  }
                }
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={cn(
                "w-12 h-12 text-center text-lg font-mono border border-input rounded-md bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
              )}
              {...props}
            />
          ))}
      </div>
    );
  }
);
OtpInput.displayName = "OtpInput";

export { OtpInput };