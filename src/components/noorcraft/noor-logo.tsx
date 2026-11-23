"use client";

import { motion } from "framer-motion";

interface NoorLogoProps {
  size?: number;
  withText?: boolean;
  compact?: boolean;
  className?: string;
}

export function NoorLogo({
  size = 44,
  withText = false,
  compact = false,
  className,
}: NoorLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className ?? ""}`}>
      <motion.div
        initial={{ scale: 0.94 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{ width: size, height: size }}
        className="relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-border/70 bg-card"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="منافسه"
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      </motion.div>
      {withText && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-xl font-bold text-foreground sm:text-2xl">
            منافسه
          </span>
          {!compact && (
            <span className="mt-0.5 text-[10px] tracking-[0.18em] text-muted-foreground">
              MONAFASEH
            </span>
          )}
        </div>
      )}
    </div>
  );
}
