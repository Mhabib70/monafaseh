"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

type Variant = "yellow" | "coral" | "green" | "sky" | "navy" | "muted";

interface NoorBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  yellow: "bg-noor-yellow/20 text-noor-navy border-noor-yellow/40 dark:text-yellow-200",
  coral: "bg-noor-coral/20 text-rose-700 border-noor-coral/40 dark:text-rose-300",
  green: "bg-noor-green/20 text-green-700 border-noor-green/40 dark:text-lime-300",
  sky: "bg-noor-sky/20 text-sky-700 border-noor-sky/40 dark:text-sky-300",
  navy: "bg-noor-navy text-white border-noor-navy",
  muted: "bg-muted text-muted-foreground border-border",
};

export function NoorBadge({
  variant = "muted",
  icon,
  className,
  children,
  ...rest
}: NoorBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold",
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
