"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import * as React from "react";

interface NoorCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glow?: boolean;
}

export const NoorCard = React.forwardRef<HTMLDivElement, NoorCardProps>(
  function NoorCard(
    { className, interactive = false, glow = false, children, ...rest },
    ref,
  ) {
    const baseClasses = cn(
      "relative rounded-2xl border border-border bg-card p-5 transition-colors",
      glow && "ring-1 ring-primary/20",
      interactive && "hover:border-primary/45",
      className,
    );

    if (interactive) {
      return (
        <motion.div
          ref={ref}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className={baseClasses}
          {...(rest as React.ComponentProps<typeof motion.div>)}
        >
          {children}
        </motion.div>
      );
    }
    return (
      <div ref={ref} className={baseClasses} {...rest}>
        {children}
      </div>
    );
  },
);
