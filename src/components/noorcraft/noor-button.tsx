"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import * as React from "react";

type Variant = "yellow" | "coral" | "green" | "sky" | "navy" | "ghost" | "outline";
type Size = "sm" | "md" | "lg" | "xl";

interface NoorButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  yellow:
    "bg-[#b8860b] text-white hover:bg-[#a17408] dark:bg-[#e8c766] dark:text-[#141006] dark:hover:bg-[#f0d37b]",
  coral:
    "bg-[#c93b3b] text-white hover:bg-[#b53232] dark:bg-[#e56969] dark:text-[#160808] dark:hover:bg-[#ec7c7c]",
  green:
    "bg-[#16803d] text-white hover:bg-[#136c33] dark:bg-[#34c76b] dark:text-[#07190d] dark:hover:bg-[#49d47d]",
  sky:
    "bg-[#0284c7] text-white hover:bg-[#0369a1] dark:bg-[#38bdf8] dark:text-[#061824] dark:hover:bg-[#5ecafa]",
  navy:
    "bg-foreground text-background hover:opacity-90",
  ghost:
    "bg-transparent text-foreground border border-border hover:bg-secondary/70",
  outline:
    "bg-card text-foreground border border-border hover:bg-secondary",
};

const sizeClasses: Record<Size, string> = {
  sm: "min-h-[36px] px-3.5 py-1.5 text-xs rounded-lg",
  md: "min-h-[40px] px-4 py-2 text-sm rounded-xl",
  lg: "min-h-[44px] px-5 py-2.5 text-sm rounded-xl",
  xl: "min-h-[48px] px-6 py-3 text-base rounded-xl",
};

export const NoorButton = React.forwardRef<
  HTMLButtonElement,
  NoorButtonProps
>(function NoorButton(
  {
    variant = "yellow",
    size = "md",
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.14 }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 font-rounded font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {leftIcon ? <span className="grid shrink-0 place-items-center">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span className="grid shrink-0 place-items-center">{rightIcon}</span> : null}
    </motion.button>
  );
});
