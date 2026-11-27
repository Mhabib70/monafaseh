"use client";

// ============================================================
// نوار ناوبری پایین — سبک اپلیکیشن Darahim
// ۵ تب: خانه / محافل / [ضبط - مرکزی] / چالش / پروفایل
// تب فعال: کپسول لیمویی · دکمه مرکزی: دایره مشکی با آیکون لیمویی
// ============================================================

import { useNoorStore } from "@/store/noor-store";
import { cn } from "@/lib/utils";
import { IconHome, IconMic, IconSwords, IconUser } from "./app-icons";

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
    if (v === "profile") setProfileUserId(null); // پروفایل خود کاربر
    setView(v);
  };

  const tabs = [
    { key: "feed", label: "خانه", icon: <IconHome size={21} />, view: "feed" as const },
    { key: "sessions", label: "محافل", icon: <IconMic size={21} />, view: "sessions" as const },
    { key: "challenge", label: "چالش", icon: <IconSwords size={21} />, view: "challenge" as const },
    { key: "profile", label: "پروفایل", icon: <IconUser size={21} />, view: "profile" as const },
  ];

  const isActive = (v: string) =>
    view === v || (v === "feed" && view === "dashboard");

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2"
      aria-label="ناوبری اصلی"
    >
      <div className="border-t-2 border-ink bg-card px-3 pb-safe pt-2 dark:border-[#33332F]">
        <div className="flex items-center justify-between">
          {/* تب‌های راست (RTL: اول لیست = راست) */}
          {tabs.slice(0, 2).map((it) => (
            <TabButton key={it.key} it={it} active={isActive(it.view)} go={go} />
          ))}

          {/* دکمه مرکزی ضبط — دایره مشکی با آیکون لیمویی */}
          <button
            onClick={() => go("create-session")}
            aria-label="ضبط تلاوت جدید"
            className={cn(
              "-mt-7 grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-ink bg-ink text-lime shadow-[0_3px_0_0_#1D1D1B] transition-transform active:translate-y-[3px] active:shadow-none",
              view === "create-session" && "ring-4 ring-lime/50",
            )}
          >
            <IconMic size={24} />
          </button>

          {tabs.slice(2).map((it) => (
            <TabButton key={it.key} it={it} active={isActive(it.view)} go={go} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function TabButton({
  it,
  active,
  go,
}: {
  it: { key: string; label: string; icon: React.ReactNode; view: "feed" | "sessions" | "challenge" | "profile" };
  active: boolean;
  go: (v: "feed" | "sessions" | "challenge" | "profile") => void;
}) {
  return (
    <button
      onClick={() => go(it.view)}
      aria-label={it.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-1.5 rounded-full px-3 transition-colors",
        active ? "bg-lime text-ink shadow-[0_2px_0_0_#1D1D1B]" : "text-muted-foreground",
      )}
    >
      {it.icon}
      <span className={cn("text-[10.5px] font-extrabold leading-none", !active && "hidden sm:inline")}>
        {it.label}
      </span>
    </button>
  );
}
