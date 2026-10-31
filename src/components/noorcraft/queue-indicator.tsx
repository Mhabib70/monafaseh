"use client";

import { motion } from "framer-motion";
import { NoorAvatar } from "./noor-avatar";
import type { QueueEntry } from "@/lib/noorcraft/types";

interface QueueIndicatorProps {
  queue: QueueEntry[];
  className?: string;
}

export function QueueIndicator({ queue, className }: QueueIndicatorProps) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-white">
          صف نوبت تلاوت
        </span>
        <span className="rounded-full bg-noor-yellow/30 px-2 py-0.5 text-xs font-bold text-noor-navy">
          {queue.length} نفر
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {queue.map((entry, idx) => (
          <motion.div
            key={entry.id}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.08 }}
            className="relative"
          >
            <NoorAvatar
              name={entry.name}
              color={entry.avatarColor}
              size="md"
              ring={
                entry.status === "active"
                  ? "active"
                  : entry.status === "done"
                    ? "muted"
                    : "none"
              }
            />
            {entry.status === "active" && (
              <motion.div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-noor-yellow px-2 py-0.5 text-[10px] font-bold text-noor-navy shadow-chunky-yellow"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                در حال تلاوت
              </motion.div>
            )}
            {entry.status === "waiting" && (
              <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-noor-navy text-[10px] font-bold text-noor-yellow">
                {idx + 1}
              </div>
            )}
            {entry.status === "done" && (
              <div className="absolute inset-0 grid place-items-center rounded-full bg-noor-navy/40 text-white">
                <span className="text-xs">✓</span>
              </div>
            )}
          </motion.div>
        ))}
        {queue.length === 0 && (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 text-xs text-muted-foreground">
            صف خالی است. درخواست نوبت تلاوت بدهید!
          </div>
        )}
      </div>
    </div>
  );
}
