"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const emptySubscribe = () => () => {};

// سوییچ تم «نور و شب» — جابه‌جایی بین تم تیره (شبِ محفل)
// و تم روشن (کاغذ مصحف). در SSR تا تعیین تم، خالی رندر می‌شود.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) return <span className="h-9 w-9 shrink-0" aria-hidden="true" />;

  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={isDark ? "حالت روشن" : "حالت تیره"}
      title={isDark ? "حالت روشن (کاغذ مصحف)" : "حالت تیره (شبِ محفل)"}
    >
      {isDark ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
    </button>
  );
}
