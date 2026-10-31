"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

// سوییچ تم «نور و شب» — جابه‌جایی بین تم تیره (شبِ محفل)
// و تم روشن (کاغذ مصحف). در SSR تا تعیین تم، خالی رندر می‌شود.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className="h-9 w-9" aria-hidden="true" />;

  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative grid h-9 w-9 place-items-center rounded-full bg-white/70 text-noor-navy transition hover:bg-white dark:bg-white/10 dark:text-yellow-200 dark:hover:bg-white/20"
      aria-label={isDark ? "حالت روشن" : "حالت تیره"}
      title={isDark ? "حالت روشن (کاغذ مصحف)" : "حالت تیره (شبِ محفل)"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
