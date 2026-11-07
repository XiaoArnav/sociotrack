import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "purple";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-blue-900/60 text-blue-300 border-blue-700/50",
    secondary: "bg-gray-800 text-gray-300 border-gray-700",
    outline: "border-gray-700 text-gray-300 bg-transparent",
    success: "bg-emerald-950/70 text-emerald-300 border-emerald-700/50",
    warning: "bg-amber-950/70 text-amber-300 border-amber-700/50",
    purple: "bg-purple-950/70 text-purple-300 border-purple-700/50",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
