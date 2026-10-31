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
    if (interactive) {
      return (
        <motion.div
          ref={ref}
          whileHover={{ y: -4, rotate: -0.4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "relative rounded-3xl border border-black/10 bg-card p-5 dark:border-white/10",
            glow && "ring-1 ring-black/10 dark:ring-white/15",
            className,
          )}
          {...(rest as React.ComponentProps<typeof motion.div>)}
        >
          {children}
        </motion.div>
      );
    }
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-3xl border border-black/10 bg-card p-5 dark:border-white/10",
          glow && "ring-1 ring-black/10 dark:ring-white/15",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
