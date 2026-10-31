"use client";

import { ArrowRight, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useNoorStore } from "@/store/noor-store";

interface BackButtonsProps {
  /** Where the "back to dashboard" button goes */
  dashboardLabel?: string;
  /** Show the "back to landing" button */
  showLanding?: boolean;
}

/**
 * Dual back buttons: one to dashboard, one to landing page.
 * Shown at the top of sub-pages so users can navigate easily.
 */
export function BackButtons({
  dashboardLabel = "بازگشت به داشبورد",
  showLanding = true,
}: BackButtonsProps) {
  const setView = useNoorStore((s) => s.setView);

  return (
    <div className="flex items-center gap-2">
      <motion.button
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setView("dashboard")}
        className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-noor-navy shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
      >
        <ArrowRight className="h-4 w-4" />
        {dashboardLabel}
      </motion.button>
      {showLanding && (
        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView("landing")}
          className="flex items-center gap-1.5 rounded-full bg-white/50 px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-sm transition hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <Home className="h-3.5 w-3.5" />
          صفحه نخست
        </motion.button>
      )}
    </div>
  );
}
