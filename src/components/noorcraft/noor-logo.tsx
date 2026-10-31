"use client";

import { motion } from "framer-motion";

interface NoorLogoProps {
  size?: number;
  withText?: boolean;
  className?: string;
}

export function NoorLogo({ size = 56, withText = false, className }: NoorLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <motion.div
        initial={{ scale: 0.9, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        style={{ width: size, height: size }}
        className="relative grid place-items-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="منافسه"
          width={size}
          height={size}
          className="rounded-xl"
          style={{ width: size, height: size, objectFit: "cover" }}
        />
      </motion.div>
      {withText && (
        <div className="flex flex-col leading-tight">
          <span className="font-display text-2xl text-noor-navy dark:text-white">
            منافسه
          </span>
          <span className="text-[10px] tracking-[0.2em] text-muted-foreground">
            MONAFASEH
          </span>
        </div>
      )}
    </div>
  );
}
