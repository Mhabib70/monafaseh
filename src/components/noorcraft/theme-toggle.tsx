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
  if (!mounted) return <span className="h-10 w-10" aria-hidden="true" />;

  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-card text-ink shadow-[0_2px_0_0_#1D1D1B] transition active:translate-y-[2px] active:shadow-none dark:border-[#3A3A36] dark:bg-[#242421] dark:text-[#CDF138]"
      aria-label={isDark ? "حالت روشن" : "حالت تیره"}
      title={isDark ? "حالت روشن (کاغذ مصحف)" : "حالت تیره (شبِ محفل)"}
    >
      {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </button>
  );
}
