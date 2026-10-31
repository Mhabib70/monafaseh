"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNoorStore } from "@/store/noor-store";

interface BackButtonProps {
  /** Optional override: where to go back to. If not set, navigates based on current view. */
  to?: "dashboard" | "sessions" | "lounge" | "landing";
  label?: string;
}

/**
 * Compact back button shown at the top of every sub-page.
 * Defaults to going back to the dashboard (the main hub after login).
 */
export function BackButton({ to = "dashboard", label = "بازگشت" }: BackButtonProps) {
  const setView = useNoorStore((s) => s.setView);

  return (
    <motion.button
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: -3 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setView(to)}
      className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-noor-navy shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
    >
      <ArrowRight className="h-4 w-4" />
      {label}
    </motion.button>
  );
}
