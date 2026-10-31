"use client";

// ============================================================
// HomeFeedView — صفحه خانه اپ (فید اجتماعی)
// استوری قاریان آنلاین + محافل زنده «همین حالا» + تازه‌های بلاگ
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, Radio, BookOpen, Users } from "lucide-react";
import { NoorAvatar } from "../noor-avatar";
import { NoorButton } from "../noor-button";
import { VerifiedName } from "../verified-badge";
import { useNoorStore } from "@/store/noor-store";
import { useToast } from "@/hooks/use-toast";

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
  attendees?: number;
  capacity?: number;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  imageUrl?: string | null;
  likes: number;
  views?: number;
}

function timeShort(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fa-IR", { month: "short", day: "numeric" });
}

export function HomeFeedView() {
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const setActiveSession = useNoorStore((s) => s.setActiveSession);
  const { toast } = useToast();

  const [online, setOnline] = useState<OnlineUser[]>([]);
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
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

  async function loadAll(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    try {
      const [u, r, b] = await Promise.all([
        fetch("/api/users/online", { cache: "no-store" }).then((x) => x.json()).catch(() => null),
        fetch("/api/public/live-rooms", { cache: "no-store" }).then((x) => x.json()).catch(() => null),
        fetch("/api/blog", { cache: "no-store" }).then((x) => x.json()).catch(() => null),
      ]);
      if (u?.ok) setOnline(u.online ?? []);
      if (r?.ok) setRooms(r.liveRooms ?? []);
      if (b?.ok) setPosts(b.posts ?? []);
    } catch {}
    finally {
      setLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAll(true);
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-noor-hero pb-24">
        <div className="mx-auto max-w-2xl px-4 pt-8">
          {/* اسکلتون استوری */}
          <div className="flex gap-4 overflow-hidden px-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
                <div className="h-2 w-10 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
          {/* اسکلتون پست‌ها */}
          <div className="mt-8 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-3xl bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
                <div className="mt-4 h-44 animate-pulse rounded-2xl bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const firstName = user?.fullName?.split(" ")[0] ?? "قاری";

  return (
    <div
      className="min-h-[calc(100vh-4rem)] bg-noor-hero pb-24"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* نشانگر پول‌تو‌رفرش */}
      <div
        className="pointer-events-none fixed inset-x-0 top-16 z-30 grid place-items-center transition-[transform,opacity]"
        style={{ transform: `translateY(${Math.min(pull, 70)}px)`, opacity: pull > 8 ? 1 : 0 }}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-md">
          <Loader2
            className={"h-4.5 w-4.5 text-noor-yellow" + (pull > 55 || refreshing ? " animate-spin" : "")}
          />
        </span>
      </div>
      <div className="mx-auto max-w-2xl px-4 pt-6">
        {/* سلام */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("fa-IR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <h1 className="mt-0.5 text-2xl font-black text-noor-navy dark:text-white">
              سلام، {firstName} 👋
            </h1>
          </div>
          <button
            onClick={() => loadAll(true)}
            className="grid h-10 w-10 place-items-center rounded-full bg-card text-muted-foreground shadow-sm transition hover:text-foreground"
            aria-label="به‌روزرسانی"
          >
            <RefreshCw className={"h-4.5 w-4.5" + (refreshing ? " animate-spin" : "")} />
          </button>
        </div>

        {/* ── استوری قاریان آنلاین ── */}
        <div className="mb-7">
          <div className="mb-2.5 flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> قاریان آنلاین
            </span>
            <button onClick={() => setView("sessions")} className="text-[11px] font-bold text-noor-sky hover:underline">
              مشاهده همه
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button onClick={() => setView("create-session")} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
              <span className="relative grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-noor-yellow/60 bg-noor-yellow/10 text-noor-navy dark:text-noor-yellow">
                +<span className="sr-only">محفل جدید</span>
              </span>
              <span className="text-[9.5px] font-bold text-muted-foreground">محفل من</span>
            </button>
            {online.slice(0, 12).map((u) => (
              <button
                key={u.id}
                onClick={() => setView("sessions")}
                className="flex w-14 shrink-0 flex-col items-center gap-1.5"
                title={u.fullName}
              >
                <span
                  className="rounded-full p-[2.5px]"
                  style={{ background: "conic-gradient(from 200deg,#FFC400,#FF7F7F,#1D9BF0,#7CFC00,#FFC400)" }}
                >
                  <NoorAvatar
                    name={u.fullName}
                    color={u.avatarColor}
                    avatarUrl={u.avatarUrl}
                    gender={u.gender}
                    size="lg"
                  />
                </span>
                <span className="w-14 truncate text-center text-[9.5px] font-bold text-muted-foreground">
                  {u.fullName.split(" ")[0]}
                </span>
              </button>
            ))}
            {online.length === 0 && (
              <span className="py-3 text-xs text-muted-foreground">فعلاً کسی آنلاین نیست — اولین نفر باش 🌟</span>
            )}
          </div>
        </div>

        {/* ── محافل زنده همین حالا ── */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-base font-black text-noor-navy dark:text-white">
              <Radio className="h-4.5 w-4.5 text-noor-coral" />
              همین حالا زنده
            </h2>
            <button onClick={() => setView("sessions")} className="text-[11px] font-bold text-noor-sky hover:underline">
              همه محافل
            </button>
          </div>

          {rooms.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-noor-yellow/40 bg-noor-yellow/5 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                فعلاً محفل زنده‌ای نیست — اولین محفل را تو بساز! 🎙
              </p>
              <NoorButton variant="yellow" size="md" className="mt-3" onClick={() => setView("create-session")}>
                تشکیل محفل
              </NoorButton>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {rooms.slice(0, 6).map((r) => (
                <motion.article
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-64 shrink-0 overflow-hidden rounded-3xl shadow-lg"
                  style={{
                    background: "linear-gradient(160deg,#0c0b09,#17150f 55%,#0b0a08)",
                    border: "1px solid rgba(255,215,0,.18)",
                  }}
                >
                  <div className="relative p-5 text-center" style={{ minHeight: 150 }}>
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black text-white">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> زنده
                    </span>
                    <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full text-3xl"
                      style={{
                        background: "linear-gradient(140deg,#FFE58A,#FFC400)",
                        boxShadow: "0 12px 26px rgba(255,196,0,.4), inset 0 3px 4px rgba(255,255,255,.5)",
                      }}
                    >
                      🎙
                    </div>
                    <div className="truncate text-sm font-black" title={r.title ?? r.name}>
                      {r.title ?? r.name ?? "محفل تلاوت"}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      میزبان: {r.hostName ?? "—"}
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3" style={{ background: "rgba(255,255,255,.04)" }}>
                    <span className="text-[10.5px] text-muted-foreground">
                      👥 {r.attendees ?? 1}/{r.capacity ?? 10}
                    </span>
                    <NoorButton variant="yellow" size="sm" onClick={() => joinRoom(r.id)} disabled={joining === r.id}>
                      {joining === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "پیوستن"}
                    </NoorButton>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        {/* ── تازه‌های بلاگ ── */}
        <section className="mb-10">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-base font-black text-noor-navy dark:text-white">
              <BookOpen className="h-4.5 w-4.5 text-noor-sky" />
              تازه‌های بلاگ
            </h2>
            <button onClick={() => setView("blog")} className="text-[11px] font-bold text-noor-sky hover:underline">
              همه پست‌ها
            </button>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-muted-foreground/25 p-6 text-center text-sm text-muted-foreground">
              هنوز پستی منتشر نشده — اولین یادداشت را تو بنویس ✍️
            </div>
          ) : (
            <div className="space-y-4">
              {posts.slice(0, 5).map((p) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setView("blog")}
                  className="flex w-full items-start gap-4 rounded-3xl bg-card p-4 text-right shadow-sm transition hover:shadow-md"
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
                  ) : (
                    <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-noor-sky/10 text-3xl">📖</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-noor-navy dark:text-white">{p.title}</div>
                    <div className="mt-1 line-clamp-2 text-xs leading-6 text-muted-foreground">{p.excerpt}</div>
                    <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>❤️ {p.likes.toLocaleString("fa-IR")}</span>
                      <span>👁 {p.views ?? ""}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
