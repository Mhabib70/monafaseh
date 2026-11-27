"use client";

// ============================================================
// HomeFeedView — صفحهٔ خانهٔ اپ منافسه (سبک Darahim)
// ساختار دقیق مطابق کیت iOS کیف پول:
//   ۱. هدر سلام + زنگ دعوت‌ها
//   ۲. کارت موجودی نور (لیمویی) با جداکننده نقطه‌چین و زیرکارت‌ها
//   ۳. ردیف چهار کاشی اکشن رنگی
//   ۴. کارت «محفل بعدی» با استیکر شمارش معکوس و دکمه پیوستن
//   ۵. ردیف قاریان آنلاین (Quick send)
//   ۶. محافل زندهٔ همین حالا (کارت‌های پاستلی)
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell, Plus, Mic, Swords, Wallet, ArrowDownLeft, ArrowUpRight,
  CalendarDays, Users, Radio, BookOpen, ChevronLeft, TrendingUp,
} from "lucide-react";
import { useNoorStore } from "@/store/noor-store";
import { useToast } from "@/hooks/use-toast";
import { InvitationBell } from "../invitation-bell";
import { VerifiedName } from "../verified-badge";
import {
  DCard, DButton, DBadge, DTile, DSectionHeader, DDash, DQuickRow, DAvatar,
} from "@/components/darahim/kit";

interface OnlineUser {
  id: string;
  fullName: string;
  avatarColor: string;
  avatarUrl: string | null;
  gender?: string | null;
  qariRank?: string | null;
  recitationType?: string | null;
}

interface LiveRoom {
  id: string;
  title?: string;
  name?: string;
  hostName?: string;
  hostAvatarColor?: string;
  attendees?: number;
  capacity?: number;
}

interface UpcomingSession {
  id: string;
  title: string;
  hostName: string;
  startedAt: number;
  attendees: number;
  capacity: number;
  status: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  imageUrl?: string | null;
  likes: number;
  views?: number;
}

const fa = (n: number) => n.toLocaleString("fa-IR");

function greeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "صبح بخیر";
  if (h >= 12 && h < 14) return "ظهر بخیر";
  if (h >= 14 && h < 19) return "عصر بخیر";
  return "شب بخیر";
}

/** چند روز مانده تا timestamp — به فارسی */
function daysLeft(ts: number): string | null {
  const diff = ts - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days >= 1) return `${fa(days)} روز مانده`;
  if (hours >= 1) return `${fa(hours)} ساعت مانده`;
  return "همین حالا";
}

function dateTile(ts: number) {
  const d = new Date(ts);
  const month = d.toLocaleDateString("fa-IR", { month: "short" });
  const day = fa(d.getDate());
  return { month, day };
}

export function HomeFeedView() {
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const setProfileUserId = useNoorStore((s) => s.setProfileUserId);
  const setActiveSession = useNoorStore((s) => s.setActiveSession);
  const { toast } = useToast();

  const [online, setOnline] = useState<OnlineUser[]>([]);
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingSession | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  // ── پول‌تو‌رفرش (لمسی) ──
  const [pull, setPull] = useState(0);
  const touchY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0) touchY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchY.current === null || refreshing) return;
    const dy = e.touches[0].clientY - touchY.current;
    if (dy > 0 && window.scrollY <= 0) setPull(Math.min(90, dy * 0.45));
  };
  const onTouchEnd = () => {
    touchY.current = null;
    if (pull > 55 && !refreshing) {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate(12); } catch {}
      }
      loadAll(true);
    }
    setPull(0);
  };

  const loadAll = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const [u, r, s, b] = await Promise.all([
        fetch("/api/users/online", { cache: "no-store" }).then((x) => x.json()).catch(() => null),
        fetch("/api/public/live-rooms", { cache: "no-store" }).then((x) => x.json()).catch(() => null),
        fetch("/api/sessions", { cache: "no-store" }).then((x) => x.json()).catch(() => null),
        fetch("/api/blog", { cache: "no-store" }).then((x) => x.json()).catch(() => null),
      ]);
      if (u?.ok) setOnline(u.online ?? []);
      if (r?.ok) setRooms(r.liveRooms ?? []);
      if (s?.ok) {
        const list: UpcomingSession[] = s.sessions ?? [];
        const next = list
          .filter((x) => x.status === "open" || x.status === "live")
          .sort((a, b2) => (a.startedAt || 0) - (b2.startedAt || 0))[0];
        setUpcoming(next ?? null);
      }
      if (b?.ok) setPosts((b.posts ?? []).slice(0, 3));
    } catch {}
    finally {
      setLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll(true);
  }, [loadAll]);

  async function joinRoom(id: string) {
    setJoining(id);
    try {
      const res = await fetch(`/api/sessions/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "خطا در پیوستن");
      const detail = await fetch(`/api/sessions/${id}`, { cache: "no-store" }).then((x) => x.json());
      if (detail.ok) {
        setActiveSession(detail.session);
        setView("session-room");
      } else {
        setView("sessions");
      }
    } catch (e: unknown) {
      toast({
        title: "خطا در پیوستن",
        description: e instanceof Error ? e.message : "دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setJoining(null);
    }
  }

  const openProfile = (id: string) => {
    setProfileUserId(id);
    setView("profile");
  };

  // ── اسکلتون بارگذاری ──
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-noor-hero px-4 pt-6 pb-28">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-2xl bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="h-11 w-11 animate-pulse rounded-full border-2 border-ink/20 bg-muted" />
        </div>
        <div className="mt-6 h-52 animate-pulse rounded-3xl border-2 border-ink/10 bg-muted" />
        <div className="mt-5 grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="mt-5 h-24 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  const firstName = user?.fullName?.split(" ")[0] ?? "قاری";
  const credit = user?.creditBalance ?? 0;
  const noorPoints = user?.stats?.noorPoints ?? 0;
  const attended = user?.stats?.sessionsAttended ?? 0;

  return (
    <div
      className="min-h-[calc(100vh-4rem)] bg-noor-hero pb-28"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* نوار پول‌تو‌رفرش */}
      {pull > 0 && (
        <div className="flex items-center justify-center pt-3 text-xs font-bold text-muted-foreground">
          <span
            className="inline-block transition-transform"
            style={{ transform: `rotate(${pull * 3}deg)` }}
          >
            ↻
          </span>{" "}
          {pull > 55 ? "رها کنید تا به‌روزرسانی شود" : "برای به‌روزرسانی بکشید"}
        </div>
      )}

      {/* ═══ ۱. هدر اپ: سلام + آواتار + زنگ ═══ */}
      <header className="d-appbar px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setProfileUserId(null);
              setView("profile");
            }}
            className="flex items-center gap-3 text-right"
            aria-label="پروفایل من"
          >
            <DAvatar
              name={user?.fullName ?? ""}
              avatarUrl={user?.avatarUrl}
              avatarColor={user?.avatarColor}
              gender={user?.gender}
              size={48}
            />
            <span>
              <span className="block text-[11px] font-medium text-muted-foreground leading-none">
                {greeting()}
              </span>
              <VerifiedName
                name={user?.fullName ?? "قاری"}
                verified={user?.verificationStatus === "approved"}
                className="mt-1 block font-rounded text-lg font-extrabold leading-none"
              />
            </span>
          </button>
          <div className="scale-110">
            <InvitationBell />
          </div>
        </div>
      </header>

      <div className="space-y-5 px-4">
        {/* ═══ ۲. کارت موجودی نور (لیمویی) ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            onClick={() => setView("dashboard")}
            className="d-card-lime block w-full p-4 text-right"
            aria-label="کیف امتیاز"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-extrabold tracking-wide text-ink/70">
                  موجودی نور
                </p>
                <p className="mt-1 flex items-baseline gap-1" dir="ltr">
                  <span className="tabular-display text-[38px] leading-none text-ink">
                    {fa(credit)}
                  </span>
                  <span className="text-sm font-extrabold text-ink/70">نور</span>
                </p>
              </div>
              <span className="d-badge d-badge-coral -rotate-2">
                <TrendingUp className="h-3 w-3" />
                قاری فعال
              </span>
            </div>

            <div className="my-3.5">
              <DDash />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="d-subcard flex items-center gap-2.5 p-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#35C76A]/15 text-[#23A050]">
                  <ArrowDownLeft className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-[10px] font-bold text-muted-foreground leading-none">
                    امتیاز نور
                  </span>
                  <span className="mt-1 block text-sm font-extrabold leading-none">
                    {fa(noorPoints)}
                  </span>
                </span>
              </div>
              <div className="d-subcard flex items-center gap-2.5 p-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-coral/15 text-coral">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-[10px] font-bold text-muted-foreground leading-none">
                    محافل حضور یافته
                  </span>
                  <span className="mt-1 block text-sm font-extrabold leading-none">
                    {fa(attended)}
                  </span>
                </span>
              </div>
            </div>
          </button>
        </motion.section>

        {/* ═══ ۳. ردیف کاشی‌های اکشن ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="grid grid-cols-4 gap-3 px-1"
        >
          <DTile
            label="تشکیل محفل"
            bg="#9B7BFF"
            iconColor="#fff"
            icon={<Plus className="h-5 w-5" strokeWidth={2.6} />}
            onClick={() => setView("create-session")}
          />
          <DTile
            label="محفل‌های من"
            bg="#1D1D1B"
            iconColor="#CDF138"
            icon={<Mic className="h-5 w-5" />}
            onClick={() => setView("sessions")}
          />
          <DTile
            label="چالش قرآنی"
            bg="#FF6B4A"
            iconColor="#fff"
            icon={<Swords className="h-5 w-5" />}
            onClick={() => setView("challenge")}
          />
          <DTile
            label="کیف امتیاز"
            bg="#4D9EFF"
            iconColor="#fff"
            icon={<Wallet className="h-5 w-5" />}
            onClick={() => setView("dashboard")}
          />
        </motion.section>

        {/* ═══ ۴. کارت «محفل بعدی» ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <DSectionHeader title="محفل بعدی" actionLabel="همه محفل‌ها" onAction={() => setView("sessions")} />
          {upcoming ? (
            <DCard tone="white" className="mt-2.5 flex items-center gap-3 p-3.5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-lime shadow-[0_2px_0_0_#1D1D1B]">
                <span className="text-center leading-none">
                  <span className="block text-[9px] font-extrabold text-ink/60">
                    {dateTile(upcoming.startedAt).month}
                  </span>
                  <span className="mt-0.5 block text-lg font-black text-ink">
                    {dateTile(upcoming.startedAt).day}
                  </span>
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <DBadge tone="lemon">
                    <CalendarDays className="h-3 w-3" />
                    {daysLeft(upcoming.startedAt) ?? "در حال اجرا"}
                  </DBadge>
                  {upcoming.status === "live" && (
                    <DBadge tone="coral">
                      <Radio className="h-3 w-3" /> زنده
                    </DBadge>
                  )}
                </div>
                <p className="mt-1.5 truncate font-rounded text-sm font-extrabold">
                  {upcoming.title}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {fa(upcoming.attendees)}/{fa(upcoming.capacity)} · {upcoming.hostName}
                </p>
              </div>
              <DButton
                variant="ink"
                size="sm"
                loading={joining === upcoming.id}
                onClick={() => joinRoom(upcoming.id)}
                className="shrink-0"
              >
                پیوستن
              </DButton>
            </DCard>
          ) : (
            <button
              onClick={() => setView("create-session")}
              className="mt-2.5 flex w-full items-center gap-3 rounded-3xl border-2 border-dashed border-ink/30 bg-card/50 p-4 text-right transition hover:border-ink/60"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-ink/40 text-ink/50">
                <Plus className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-rounded text-sm font-extrabold">
                  هنوز محفلی در راه نیست
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">
                  اولین محفل را شما تشکیل دهید
                </span>
              </span>
              <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          )}
        </motion.section>

        {/* ═══ ۵. قاریان آنلاین ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
        >
          <DSectionHeader
            title="قاریان آنلاین"
            actionLabel="همه"
            onAction={() => setView("sessions")}
          />
          <div className="mt-2.5">
            <DQuickRow
              addLabel="دعوت"
              onAdd={() => setView("sessions")}
              items={online.slice(0, 8).map((u) => ({
                id: u.id,
                fullName: u.fullName,
                avatarUrl: u.avatarUrl,
                avatarColor: u.avatarColor,
                onClick: () => openProfile(u.id),
              }))}
            />
          </div>
        </motion.section>

        {/* ═══ ۶. محافل زندهٔ همین حالا ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
        >
          <DSectionHeader title="همین حالا زنده است" actionLabel="همه" onAction={() => setView("sessions")} />
          {rooms.length > 0 ? (
            <div className="mt-2.5 space-y-3">
              {rooms.slice(0, 3).map((room, i) => {
                const tones = ["mint", "pink", "lav"] as const;
                return (
                  <DCard key={room.id} tone={tones[i % 3]} className="flex items-center gap-3 p-3.5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-card">
                      <Mic className="h-5 w-5 text-ink" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-rounded text-sm font-extrabold">
                        {room.title || room.name || "محفل تلاوت"}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold text-ink/60">
                        {room.hostName} · {fa(room.attendees ?? 0)} شنونده
                      </p>
                    </div>
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF3B30] opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FF3B30]" />
                    </span>
                    <DButton
                      variant="white"
                      size="sm"
                      loading={joining === room.id}
                      onClick={() => joinRoom(room.id)}
                      className="shrink-0"
                    >
                      پیوستن
                    </DButton>
                  </DCard>
                );
              })}
            </div>
          ) : (
            <DCard tone="white" className="mt-2.5 flex flex-col items-center gap-2 p-6 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-ink/20 text-ink/40">
                <Radio className="h-5 w-5" />
              </span>
              <p className="font-rounded text-sm font-extrabold">الان محفل زنده‌ای نیست</p>
              <p className="text-[11px] font-medium text-muted-foreground">
                وقتی محفلی شروع شود همین‌جا می‌بینید
              </p>
            </DCard>
          )}
        </motion.section>

        {/* ═══ ۷. تازه‌های بلاگ ═══ */}
        {posts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.25 }}
          >
            <DSectionHeader title="تازه‌های قرآنی" actionLabel="بلاگ" onAction={() => setView("blog")} />
            <div className="mt-2.5 space-y-3">
              {posts.map((post, i) => {
                const tones = ["lemon", "sky", "white"] as const;
                return (
                  <button
                    key={post.id}
                    onClick={() => setView("blog")}
                    className="block w-full text-right"
                  >
                    <DCard tone={tones[i % 3]} className="flex items-center gap-3 p-3.5">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-card text-ink">
                        <BookOpen className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-rounded text-sm font-extrabold">
                          {post.title}
                        </span>
                        <span className="mt-0.5 line-clamp-1 text-[11px] font-medium text-ink/60">
                          {post.excerpt}
                        </span>
                      </span>
                      <ChevronLeft className="h-4 w-4 shrink-0 text-ink/50" />
                    </DCard>
                  </button>
                );
              })}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
