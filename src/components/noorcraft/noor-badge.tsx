"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

type Variant = "yellow" | "coral" | "green" | "sky" | "navy" | "muted";

interface NoorBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  yellow:
    "bg-amber-500/12 text-amber-800 border-amber-500/25 dark:bg-amber-400/15 dark:text-amber-300 dark:border-amber-400/25",
  coral:
    "bg-rose-500/12 text-rose-800 border-rose-500/25 dark:bg-rose-400/15 dark:text-rose-300 dark:border-rose-400/25",
  green:
    "bg-emerald-500/12 text-emerald-800 border-emerald-500/25 dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-400/25",
  sky:
    "bg-sky-500/12 text-sky-800 border-sky-500/25 dark:bg-sky-400/15 dark:text-sky-300 dark:border-sky-400/25",
  navy:
    "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-950 dark:border-slate-100",
  muted:
    "bg-secondary text-muted-foreground border-border",
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
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-0.5 text-xs font-semibold leading-5",
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
