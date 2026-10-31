"use client";

// ============================================================
// نوار ناوبری پایین — قلب حس اپلیکیشن در موبایل
// ۵ تب هم‌اندازه (خانه/محافل/چالش/پنل/پروفایل) · هایلایت طلایی · هپتیک · safe-area
// تشکیل محفل از کارت «محفل من» در فید و کاشی «تشکیل محفل» پنل در دسترس است
// ============================================================

import { useNoorStore } from "@/store/noor-store";
import { cn } from "@/lib/utils";
import { IconHome, IconMic, IconSwords, IconUser, IconDashboard } from "./app-icons";

function tap() {
  // هپتیک خیلی کوتاه — در iOS بی‌اثر، در اندروید لطیف
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
    if (v === "profile") setProfileUserId(null); // پروفایل خود کاربر
    setView(v);
  };

  const items = [
    { key: "feed", label: "خانه", icon: <IconHome size={23} />, view: "feed" as const },
    { key: "sessions", label: "محافل", icon: <IconMic size={23} />, view: "sessions" as const },
    { key: "challenge", label: "چالش", icon: <IconSwords size={23} />, view: "challenge" as const },
    { key: "panel", label: "پنل", icon: <IconDashboard size={23} />, view: "dashboard" as const },
    { key: "profile", label: "پروفایل", icon: <IconUser size={23} />, view: "profile" as const },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden" aria-label="ناوبری اصلی">
      <div className="glass-panel border-t border-noor-navy/10 dark:border-white/10 px-2 pt-1.5 pb-safe">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => go(it.view)}
              aria-label={it.label}
              aria-current={view === it.view ? "page" : undefined}
              className={cn(
                "flex w-16 flex-col items-center gap-1 rounded-xl py-1 transition-colors",
                view === it.view
                  ? "text-noor-navy dark:text-noor-yellow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {it.icon}
              <span className="text-[9.5px] font-bold leading-none">{it.label}</span>
              <span
                className={cn(
                  "h-1 w-1 rounded-full transition-opacity",
                  view === it.view ? "bg-current opacity-100" : "opacity-0",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
