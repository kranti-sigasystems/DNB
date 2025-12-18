/**
 * Responsive Container Component
 * Provides consistent responsive spacing and layout patterns
 */

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
  center?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md", 
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-full",
};

const paddingClasses = {
  none: "",
  sm: "px-2 sm:px-4",
  md: "px-4 sm:px-6 lg:px-8", 
  lg: "px-4 sm:px-6 lg:px-8 xl:px-12",
};

export function ResponsiveContainer({
  children,
  className,
  size = "xl",
  padding = "md",
  center = true,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        "w-full",
        sizeClasses[size],
        paddingClasses[padding],
        center && "mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

export default ResponsiveContainer;