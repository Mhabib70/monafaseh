"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MapPin,
  UserPlus,
  Filter,
  Mic2,
  Loader2,
  Sparkles,
  UserCheck,
  Moon,
  ChevronDown,
} from "lucide-react";
import { NoorBadge } from "./noor-badge";
import { NoorAvatar } from "./noor-avatar";
import { useToast } from "@/hooks/use-toast";
import { useNoorStore, type OnlineUser } from "@/store/noor-store";
import { cn } from "@/lib/utils";

/* ============================================================
   OnlineUsersMarquee
   ───────────────────────────────────────────────────────────
   A vertical, infinite-scroll marquee of online reciters.
   Each reciter is shown on a gradient card with avatar, name,
   city, recitation-type badge, live status dot, and an invite
   button. The marquee pauses on hover (desktop only — touch
   devices keep animating, as the user requested).

   A single instance polls /api/users/online every 5s and writes
   the result into the shared noor-store slice. Other instances
   on other pages read from the store and do NOT re-poll, so we
   avoid multiplying network traffic when the marquee appears on
   three different views.

   Props:
     • variant: "full" | "compact" — full is for sessions-view,
       compact is for create-session-view and challenge-view
       (smaller height, narrower).
     • duration: seconds for one full scroll. Default 15 = medium.
     • maxHeight: tailwind class controlling visible height.
   ============================================================ */

interface Props {
  variant?: "full" | "compact";
  duration?: number; // seconds
  maxHeight?: string; // tailwind class like "h-[420px]"
  showInviteAll?: boolean;
}

const statusConfig: Record<
  string,
  { label: string; color: string; pulse: boolean }
> = {
  reciting: { label: "در حال تلاوت", color: "#FF7F7F", pulse: true },
  listening: { label: "در حال شنیدن", color: "#87CEEB", pulse: false },
  waiting: { label: "در انتظار", color: "#FFD700", pulse: false },
  idle: { label: "آنلاین", color: "#7CFC00", pulse: false },
};

// Card color palette — rotates through these for visual variety.
// Index into this array is `i % length`, so adjacent cards always
// get different colors.
const CARD_THEMES = [
  {
    bg: "from-noor-yellow/25 via-noor-yellow/10 to-transparent",
    ring: "ring-noor-yellow/40",
    glow: "#FFD700",
  },
  {
    bg: "from-noor-coral/25 via-noor-coral/10 to-transparent",
    ring: "ring-noor-coral/40",
    glow: "#FF7F7F",
  },
  {
    bg: "from-noor-sky/25 via-noor-sky/10 to-transparent",
    ring: "ring-noor-sky/40",
    glow: "#87CEEB",
  },
  {
    bg: "from-noor-green/25 via-noor-green/10 to-transparent",
    ring: "ring-noor-green/40",
    glow: "#7CFC00",
  },
];

// Singleton flag — only ONE poller across the entire app, even if
// multiple OnlineUsersMarquee instances mount. The first instance
// to mount takes the polling responsibility; subsequent ones just
// read from the store.
let POLLER_ACTIVE = false;

export function OnlineUsersMarquee({
  variant = "full",
  duration = 15,
  maxHeight = "h-[460px]",
  showInviteAll = true,
}: Props) {
  const { toast } = useToast();
  const onlineUsers = useNoorStore((s) => s.onlineUsers);
  const setOnlineUsers = useNoorStore((s) => s.setOnlineUsers);
  const activeSession = useNoorStore((s) => s.activeSession);
  const setView = useNoorStore((s) => s.setView);

  const [filter, setFilter] = useState<"all" | "ترتیل" | "تحقیق">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteAllLoading, setInviteAllLoading] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  // Polling — only run if no other instance is polling.
  useEffect(() => {
    if (POLLER_ACTIVE) {
      // Another instance is already polling; we just read from the store.
      setLoading(false);
      return;
    }
    POLLER_ACTIVE = true;

    let cancelled = false;

    async function fetchOnline() {
      try {
        const res = await fetch("/api/users/online", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.ok && Array.isArray(data.online)) {
          // Tag each user with an idle status (the API doesn't currently
          // return real-time status, but the marquee still benefits from
          // having a status field — we'll show "آنلاین" for everyone).
          const users: OnlineUser[] = data.online.map((u: any) => ({
            id: u.id,
            fullName: u.fullName,
            avatarColor: u.avatarColor || "#87CEEB",
            avatarUrl: u.avatarUrl,
            city: u.city,
            province: null,
            gender: u.gender,
            recitationType: u.recitationType,
            status: "idle",
            lastSeen: u.lastVisit || Date.now(),
            qariRank: u.qariRank ?? null,
          }));
          setOnlineUsers(users);
        }
      } catch {
        // Silently fail — will retry on next interval.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOnline();
    const interval = setInterval(fetchOnline, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      POLLER_ACTIVE = false;
    };
  }, [setOnlineUsers]);

  // Apply filter
  const filtered = useMemo(() => {
    if (filter === "all") return onlineUsers;
    return onlineUsers.filter((u) => u.recitationType === filter);
  }, [onlineUsers, filter]);

  // Duplicate the list so we can render two copies back-to-back.
  // The CSS keyframe translates from 0% to -50%, which means the
  // first copy must end exactly where the second copy begins —
  // giving a seamless infinite scroll.
  const doubled = useMemo(() => [...filtered, ...filtered], [filtered]);

  // ─── Invite a single user ────────────────────────────────────────────
  function handleInvite(user: OnlineUser) {
    if (!activeSession) {
      toast({
        title: "محفلی فعال نیست",
        description:
          "ابتدا یک محفل تشکیل دهید یا به محفلی بپیوندید، سپس کاربران را دعوت کنید.",
        variant: "destructive",
      });
      return;
    }
    // Optimistic UI — show "sent" state on the button
    setInvitedIds((prev) => new Set(prev).add(user.id));

    fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inviteeId: user.id,
        inviteeName: user.fullName,
        sessionId: activeSession.id,
        sessionTitle: activeSession.title,
        jitsiRoom: activeSession.jitsiRoom,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          toast({
            title: "دعوت ارسال شد! 📨",
            description: `${user.fullName} به محفل دعوت شد. در انتظار پاسخ...`,
          });
        } else {
          throw new Error(data.error);
        }
      })
      .catch(() => {
        toast({
          title: "خطا در ارسال دعوت",
          variant: "destructive",
        });
        // Revert optimistic state
        setInvitedIds((prev) => {
          const next = new Set(prev);
          next.delete(user.id);
          return next;
        });
      });
  }

  // ─── Invite all filtered users (bulk) ────────────────────────────────
  async function handleInviteAll() {
    if (!activeSession) {
      toast({
        title: "محفلی فعال نیست",
        description:
          "ابتدا یک محفل تشکیل دهید، سپس می‌توانید گروهی دعوت کنید.",
        variant: "destructive",
      });
      return;
    }
    if (filtered.length === 0) return;

    setInviteAllLoading(true);
    let success = 0;
    let fail = 0;

    // Send invites in parallel batches of 5 to avoid hammering the server
    const BATCH = 5;
    for (let i = 0; i < filtered.length; i += BATCH) {
      const batch = filtered.slice(i, i + BATCH);
      await Promise.all(
        batch.map((u) =>
          fetch("/api/invitations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inviteeId: u.id,
              inviteeName: u.fullName,
              sessionId: activeSession.id,
              sessionTitle: activeSession.title,
              jitsiRoom: activeSession.jitsiRoom,
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.ok) {
                success++;
                setInvitedIds((prev) => new Set(prev).add(u.id));
              } else {
                fail++;
              }
            })
            .catch(() => {
              fail++;
            }),
        ),
      );
    }

    setInviteAllLoading(false);
    toast({
      title: `دعوت گروهی ارسال شد ✨`,
      description: `${success.toLocaleString("fa-IR")} دعوت موفق${
        fail > 0
          ? ` • ${fail.toLocaleString("fa-IR")} ناموفق`
          : ""
      } — در انتظار پاسخ قاریان`,
    });
  }

  // ─── Empty state ─────────────────────────────────────────────────────
  if (!loading && onlineUsers.length === 0) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border-2 border-dashed border-white/15 bg-gradient-to-br from-noor-navy/5 to-transparent p-8 text-center",
          variant === "compact" && "p-6",
        )}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-noor-yellow/15 text-3xl"
        >
          <Moon className="h-8 w-8 text-noor-yellow" />
        </motion.div>
        <h3 className="font-display text-lg text-noor-navy dark:text-white">
          فعلاً کسی آنلاین نیست
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          کمی بعد دوباره بررسی کنید — قاریان به‌زودی برمی‌گردند
        </p>
      </div>
    );
  }

  // ─── Loading state ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center rounded-3xl bg-gradient-to-br from-noor-navy/5 to-transparent",
          maxHeight,
        )}
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-noor-yellow" />
          <p className="text-xs">در حال دریافت قاریان آنلاین...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border-2 border-white/10 bg-gradient-to-br from-noor-navy/5 to-white/0",
        variant === "compact" && "border-white/5",
      )}
    >
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-gradient-to-l from-noor-yellow/5 to-transparent px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-noor-green opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-noor-green" />
          </span>
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-noor-navy dark:text-white">
            <Users className="h-4 w-4 text-noor-sky" />
            قاریان آنلاین
          </h3>
          <span className="rounded-full bg-noor-sky/15 px-2 py-0.5 text-[11px] font-bold text-noor-sky">
            {filtered.length.toLocaleString("fa-IR")} نفر
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Invite All button */}
          {showInviteAll && filtered.length > 0 && (
            <button
              onClick={handleInviteAll}
              disabled={inviteAllLoading}
              className="flex items-center gap-1 rounded-full bg-gradient-to-l from-noor-coral to-noor-yellow px-3 py-1 text-[11px] font-bold text-noor-navy shadow-sm transition hover:scale-105 disabled:opacity-50"
              title={`دعوت همه ${filtered.length} نفر به محفع فعلی`}
            >
              {inviteAllLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              دعوت همه
            </button>
          )}

          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-noor-navy transition hover:bg-white/15 dark:text-white"
            >
              <Filter className="h-3 w-3" />
              {filter === "all" ? "همه" : filter}
              <ChevronDown className="h-3 w-3" />
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full z-20 mt-1 min-w-[120px] overflow-hidden rounded-2xl border border-white/15 bg-white/95 shadow-xl backdrop-blur dark:bg-noor-navy/95"
                >
                  {(["all", "ترتیل", "تحقیق"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setFilter(opt);
                        setFilterOpen(false);
                      }}
                      className={cn(
                        "block w-full px-3 py-2 text-right text-xs font-bold transition hover:bg-noor-yellow/15",
                        filter === opt
                          ? "bg-noor-yellow/10 text-noor-navy dark:text-white"
                          : "text-muted-foreground",
                      )}
                    >
                      {opt === "all" ? "همه سبک‌ها" : opt}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ─── Marquee track ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          کاربری با این فیلتر پیدا نشد
        </div>
      ) : (
        <div
          className={cn(
            "noor-marquee-container relative overflow-hidden",
            maxHeight,
          )}
        >
          {/* Top & bottom fade masks for elegant entry/exit */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-white/80 to-transparent dark:from-[#0b0a08]/80" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-white/80 to-transparent dark:from-[#0b0a08]/80" />

          <div
            className="noor-marquee-track flex flex-col"
            style={{ ["--marquee-duration" as any]: `${duration}s` }}
          >
            {doubled.map((user, i) => {
              const theme = CARD_THEMES[i % CARD_THEMES.length];
              const status =
                statusConfig[user.status as string] || statusConfig.idle;
              const isInvited = invitedIds.has(user.id);

              return (
                <div
                  key={`${user.id}-${i}`}
                  className={cn(
                    "group relative m-2 flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br p-3 ring-1 transition",
                    theme.bg,
                    theme.ring,
                    "hover:scale-[1.02] hover:shadow-lg",
                  )}
                >
                  {/* Avatar + status dot */}
                  <div className="relative shrink-0">
                    <NoorAvatar
                      name={user.fullName}
                      color={user.avatarColor}
                      avatarUrl={user.avatarUrl}
                      gender={user.gender}
                      size={variant === "compact" ? "sm" : "md"}
                    />
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-noor-navy",
                        status.pulse && "animate-pulse",
                      )}
                      style={{ background: status.color }}
                    />
                  </div>

                  {/* Name + meta */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-noor-navy dark:text-white">
                      {user.fullName}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {user.city && (
                        <>
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{user.city}</span>
                          <span className="text-muted-foreground/40">•</span>
                        </>
                      )}
                      <span
                        className="font-bold"
                        style={{ color: status.color }}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {user.recitationType && (
                        <NoorBadge
                          variant="sky"
                          icon={<Mic2 className="h-2.5 w-2.5" />}
                        >
                          {user.recitationType}
                        </NoorBadge>
                      )}
                    </div>
                  </div>

                  {/* Invite button */}
                  <button
                    onClick={() => handleInvite(user)}
                    disabled={isInvited}
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all",
                      isInvited
                        ? "bg-noor-green/30 text-noor-green"
                        : "bg-white/15 text-noor-navy hover:scale-110 hover:bg-noor-yellow/40 dark:text-white",
                    )}
                    title={
                      isInvited
                        ? "دعوت ارسال شد"
                        : `دعوت ${user.fullName} به محفل`
                    }
                  >
                    {isInvited ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Footer hint ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-gradient-to-l from-transparent to-noor-yellow/5 px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          برای توقف حرکت، نشانگر ماوس را روی کارت‌ها نگه دارید
        </p>
        {!activeSession && (
          <button
            onClick={() => setView("create-session")}
            className="text-[10px] font-bold text-noor-coral hover:underline"
          >
            ابتدا محفل بساز →
          </button>
        )}
      </div>
    </div>
  );
}
