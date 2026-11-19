"use client";

import { ArrowRight, Home } from "lucide-react";
import { useNoorStore } from "@/store/noor-store";

interface BackButtonsProps {
  dashboardLabel?: string;
  showLanding?: boolean;
}

export function BackButtons({
  dashboardLabel = "بازگشت به داشبورد",
  showLanding = true,
}: BackButtonsProps) {
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {user && (
        <button
          onClick={() => setView("dashboard")}
          className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          {dashboardLabel}
        </button>
      )}
      {showLanding && (
        <button
          onClick={() => setView("landing")}
          className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Home className="h-3.5 w-3.5" />
          صفحه نخست
        </button>
      )}
    </div>
  );
}
