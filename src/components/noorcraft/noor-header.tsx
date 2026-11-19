"use client";

import { useEffect, useState } from "react";
import { LogOut, Plus, Shield } from "lucide-react";
import { NoorLogo } from "./noor-logo";
import { NoorButton } from "./noor-button";
import { useNoorStore } from "@/store/noor-store";
import { NoorAvatar } from "./noor-avatar";
import { InvitationBell } from "./invitation-bell";
import { ThemeToggle } from "./theme-toggle";
import type { ViewName } from "@/lib/noorcraft/types";

function AdminReviewLink({ onOpen }: { onOpen: () => void }) {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/admin/verify", { cache: "no-store" });
        if (!res.ok) return;
        const d = await res.json();
        if (!cancelled && d.ok) setPending(d.stats?.pending ?? 0);
      } catch {}
    }
    poll();
    const t = setInterval(poll, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <button
      onClick={onOpen}
      className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-border px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={
        pending > 0
          ? `${pending.toLocaleString("fa-IR")} آزمون احراز در انتظار داوری`
          : "پنل مدیریت"
      }
    >
      <Shield className="h-3.5 w-3.5 text-primary" />
      <span>مدیریت</span>
      {pending > 0 && (
        <span className="tabular-nums text-[11px] font-bold text-destructive">
          ({pending.toLocaleString("fa-IR")})
        </span>
      )}
    </button>
  );
}

export function NoorHeader() {
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const signOut = useNoorStore((s) => s.signOut);
  const view = useNoorStore((s) => s.view);

  const navItems: { label: string; target: ViewName; activeOn: ViewName[] }[] = user
    ? [
        { label: "داشبورد", target: "dashboard", activeOn: ["dashboard"] },
        { label: "محافل زنده", target: "sessions", activeOn: ["sessions", "create-session"] },
        { label: "چالش رقابت", target: "challenge", activeOn: ["challenge"] },
        { label: "قاریان", target: "masters", activeOn: ["masters"] },
        { label: "تالار گفتگو", target: "lounge", activeOn: ["lounge", "lounge-room"] },
      ]
    : [
        { label: "محافل زنده", target: "sessions", activeOn: ["sessions"] },
        { label: "چالش رقابت", target: "challenge", activeOn: ["challenge"] },
        { label: "قاریان", target: "masters", activeOn: ["masters"] },
        { label: "تالار گفتگو", target: "lounge", activeOn: ["lounge"] },
        { label: "بلاگ", target: "blog", activeOn: ["blog", "blog-post"] },
      ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6">
        <button
          onClick={() => setView(user ? "dashboard" : "landing")}
          className="flex items-center whitespace-nowrap shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="صفحه اصلی منافسه"
        >
          <NoorLogo size={36} withText compact />
        </button>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="منوی اصلی">
          {navItems.map((item) => {
            const isActive = item.activeOn.includes(view);
            return (
              <button
                key={item.target}
                onClick={() => setView(item.target)}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <ThemeToggle />

          {user ? (
            <>
              <InvitationBell />
              {user.role === "admin" && (
                <AdminReviewLink onOpen={() => { window.location.href = "/admin"; }} />
              )}

              <button
                onClick={() => setView("dashboard")}
                className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-2 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title={user.fullName}
              >
                <NoorAvatar
                  name={user.fullName}
                  color={user.avatarColor}
                  avatarUrl={user.avatarUrl}
                  gender={user.gender}
                  size="sm"
                  verified={user.verificationStatus === "approved"}
                  rank={user.qariRank}
                />
                <span className="hidden max-w-[110px] truncate text-xs font-semibold text-foreground sm:inline">
                  {user.fullName}
                </span>
              </button>

              <NoorButton
                variant="yellow"
                size="sm"
                onClick={() => setView("create-session")}
                leftIcon={<Plus className="h-4 w-4" />}
                className="hidden sm:inline-flex"
              >
                تشکیل محفل
              </NoorButton>

              <button
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  signOut();
                }}
                aria-label="خروج از حساب"
                title="خروج از حساب"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <NoorButton
              variant="yellow"
              size="sm"
              onClick={() => setView("auth")}
            >
              ورود به محفل
            </NoorButton>
          )}
        </div>
      </div>
    </header>
  );
}
