"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface NoorTimerProps {
  /** Total duration in seconds */
  duration: number;
  /** Auto start */
  autoStart?: boolean;
  size?: number;
  onComplete?: () => void;
  className?: string;
}

export function NoorTimer({
  duration,
  autoStart = true,
  size = 120,
  onComplete,
  className,
}: NoorTimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(autoStart);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // schedule state updates outside of the setState updater
          queueMicrotask(() => {
            setRunning(false);
            onCompleteRef.current?.();
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const progress = Math.max(0, remaining / duration);
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const color =
    progress > 0.5 ? "#7CFC00" : progress > 0.2 ? "#FFD700" : "#FF7F7F";

  return (
    <div
      className={`relative grid place-items-center ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(135, 206, 235, 0.25)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center">
          <span
            className="font-mono font-extrabold tabular-nums"
            style={{ color, fontSize: size * 0.18 }}
          >
            {display}
          </span>
          <span className="text-[10px] text-muted-foreground">نوبت تلاوت</span>
        </div>
      </div>
    </div>
  );
}
