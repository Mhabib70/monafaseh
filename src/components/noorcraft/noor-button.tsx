"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import * as React from "react";

type Variant = "yellow" | "coral" | "green" | "sky" | "navy" | "ghost";
type Size = "sm" | "md" | "lg" | "xl";

interface NoorButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  yellow: "bg-noor-yellow text-noor-navy shadow-chunky-yellow hover:brightness-105",
  coral: "bg-noor-coral text-white shadow-chunky-coral hover:brightness-105",
  green: "bg-noor-green text-noor-navy shadow-chunky-green hover:brightness-105",
  sky: "bg-noor-sky text-noor-navy shadow-chunky-sky hover:brightness-105",
  navy: "bg-noor-navy text-white shadow-chunky hover:brightness-110",
  ghost:
    "bg-white/60 dark:bg-transparent text-noor-navy dark:text-white border-2 border-noor-navy/30 dark:border-white/30 hover:bg-noor-navy/5 dark:hover:bg-noor-navy/5 dark:hover:bg-white/5",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-2xl",
  xl: "px-8 py-4 text-lg rounded-2xl",
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
      whileHover={{ y: -2 }}
      whileTap={{ y: 2, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 font-rounded font-bold transition-[filter,box-shadow] disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {leftIcon ? <span className="grid place-items-center">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span className="grid place-items-center">{rightIcon}</span> : null}
    </motion.button>
  );
});
