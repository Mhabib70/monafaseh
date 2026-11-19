"use client";

import { useNoorStore } from "@/store/noor-store";
import { cn } from "@/lib/utils";
import { IconHome, IconMic, IconSwords, IconUser, IconDashboard } from "./app-icons";

function tap() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(8);
    } catch {}
  }
}

export function BottomNav() {
  const user = useNoorStore((s) => s.user);
  const view = useNoorStore((s) => s.view);
  const setView = useNoorStore((s) => s.setView);
  const setProfileUserId = useNoorStore((s) => s.setProfileUserId);

  if (!user) return null;

  const go = (v: Parameters<typeof setView>[0]) => {
    tap();
    if (v === "profile") setProfileUserId(null);
    setView(v);
  };

  const items = [
    { key: "feed", label: "خانه", icon: <IconHome size={20} />, view: "feed" as const },
    { key: "sessions", label: "محافل", icon: <IconMic size={20} />, view: "sessions" as const },
    { key: "challenge", label: "چالش", icon: <IconSwords size={20} />, view: "challenge" as const },
    { key: "panel", label: "پنل", icon: <IconDashboard size={20} />, view: "dashboard" as const },
    { key: "profile", label: "پروفایل", icon: <IconUser size={20} />, view: "profile" as const },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden" aria-label="ناوبری اصلی">
      <div className="border-t border-border bg-background/95 px-2 pt-1 pb-safe backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-around gap-1">
          {items.map((it) => {
            const active = view === it.view;
            return (
              <button
                key={it.key}
                onClick={() => go(it.view)}
                aria-label={it.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[46px] min-w-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "font-bold text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-primary"
                  />
                )}
                {it.icon}
                <span className="text-[11px] leading-none whitespace-nowrap">{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
