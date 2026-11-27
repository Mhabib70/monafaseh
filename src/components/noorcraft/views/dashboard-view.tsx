"use client";

// ============================================================
// DashboardView — صفحهٔ «فعالیت» اپ منافسه (سبک Darahim)
// مطابق صفحه Activity کیت iOS:
//   عنوان بولد + کنترل سگمنتی (امتیاز/محافل) + خلاصه ماه +
//   نمودار میله‌ای + تفکیک بر اساس نوع + کاشی‌های دسترسی سریع
// ============================================================

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle, LogIn, Trophy, Mic, Calendar, Award, Sparkles,
  TrendingUp, Flame, MessageCircle, Crown, BookOpen, Coins,
  Heart, UserCheck, Wallet, BadgeCheck, ArrowLeft,
} from "lucide-react";
import { NoorBadge } from "../noor-badge";
import { OnlineUsersList } from "../online-users-list";
import { AdBanner } from "../ad-banner";
import { VerifiedName } from "../verified-badge";
import { useNoorStore, getProfileFields } from "@/store/noor-store";
import { DCard, DBadge, DDash } from "@/components/darahim/kit";
import { cn } from "@/lib/utils";

const fa = (n: number) => n.toLocaleString("fa-IR");

/** سری هفتگی قطعی (deterministic) بر پایه seed — صرفاً نمایشی تا API آمار واقعی بنشیند */
function weeklySeries(seed: string, total: number): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const raw = Array.from({ length: 6 }, (_, i) => {
    h = (h * 1103515245 + 12345) | 0;
    return Math.abs(h) % 100 + 20 + (i === 5 ? 40 : 0);
  });
  const sum = raw.reduce((a, b) => a + b, 0);
  const k = total > 0 ? total / sum : 0.6;
  return raw.map((v) => Math.max(1, Math.round(v * k)));
}

export function DashboardView() {
  const user = useNoorStore((s) => s.user);
  const setProfileUserId = useNoorStore((s) => s.setProfileUserId);
  const setView = useNoorStore((s) => s.setView);

  const [tab, setTab] = useState<"points" | "sessions">("points");

  const noorPoints = user?.stats?.noorPoints ?? 0;
  const sessions = user?.stats?.sessionsAttended ?? 0;
  const series = useMemo(
    () => weeklySeries(user?.id ?? "guest", tab === "points" ? noorPoints : sessions),
    [user?.id, tab, noorPoints, sessions],
  );

  if (!user) return null;

  function countFilled(category: "basic" | "contact" | "recitation" | "personal"): number {
    if (!user) return 0;
    return getProfileFields(user).filter((f) => f.category === category && f.filled).length;
  }

  const noorPointsFinal = noorPoints;
  const sessionsFinal = sessions;
  const monthLabel = new Date().toLocaleDateString("fa-IR", { month: "long" });
  const total = series.reduce((a, b) => a + b, 0);
  const max = Math.max(...series, 1);
  const weeks = ["هفته ۱", "هفته ۲", "هفته ۳", "هفته ۴", "هفته ۵", "این هفته"];

  const stats = [
    { label: "جلسات", value: sessions, icon: <Calendar className="h-4 w-4" />, color: "#4D9EFF" },
    { label: "امتیاز نور", value: noorPoints, icon: <Sparkles className="h-4 w-4" />, color: "#9B7BFF" },
    { label: "نشان‌ها", value: user.stats?.badges?.length ?? 0, icon: <Award className="h-4 w-4" />, color: "#35C76A" },
    { label: "مهارت‌ها", value: user.recitationSkills?.length ?? 0, icon: <Trophy className="h-4 w-4" />, color: "#FF6B4A" },
  ];

  const tiles = [
    {
      icon: <Flame className="h-5 w-5" />,
      title: "چالش رقابت",
      desc: "رقیبی آنلاین پیدا کنید",
      bg: "#FF6B4A",
      iconColor: "#fff",
      onClick: () => setView("challenge"),
    },
    {
      icon: <PlusCircle className="h-5 w-5" />,
      title: "تشکیل محفل",
      desc: "محفل تلاوت بسازید",
      bg: "#9B7BFF",
      iconColor: "#fff",
      onClick: () => setView("create-session"),
    },
    {
      icon: <LogIn className="h-5 w-5" />,
      title: "محافل زنده",
      desc: "به محفلی بپیوندید",
      bg: "#CDF138",
      iconColor: "#1D1D1B",
      onClick: () => setView("sessions"),
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      title: "تالار گفتگو",
      desc: "با قاریان گفتگو کنید",
      bg: "#4D9EFF",
      iconColor: "#fff",
      onClick: () => setView("lounge"),
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "بلاگ",
      desc: "یادداشت‌های قاریان",
      bg: "#FFE9A3",
      iconColor: "#1D1D1B",
      onClick: () => setView("blog"),
    },
    {
      icon: <Coins className="h-5 w-5" />,
      title: "خرید امتیاز",
      desc: `موجودی: ${fa(user.creditBalance ?? 0)}`,
      bg: "#D9F2DC",
      iconColor: "#1D1D1B",
      onClick: () => setView("buy-credits"),
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: "حمایت مالی",
      desc: "کمک به رشد منافسه",
      bg: "#FFD9DE",
      iconColor: "#1D1D1B",
      onClick: () => setView("donate"),
    },
    {
      icon: <UserCheck className="h-5 w-5" />,
      title: "قاریان آنلاین",
      desc: "جلسه خصوصی با قاریان",
      bg: "#E6DDFF",
      iconColor: "#1D1D1B",
      onClick: () => setView("masters"),
    },
    ...(user.verificationStatus === "approved"
      ? [{
          icon: <Wallet className="h-5 w-5" />,
          title: "درآمد و تسویه",
          desc: "درآمد جلسات خصوصی",
          bg: "#1D1D1B",
          iconColor: "#CDF138",
          onClick: () => setView("bank-info"),
        }]
      : []),
    {
      icon: <BadgeCheck className="h-5 w-5" />,
      title: user.verificationStatus === "approved" ? "تأییدشده" : "دریافت تیک آبی",
      desc:
        user.verificationStatus === "pending"
          ? "درخواست شما در حال بررسی است"
          : user.verificationStatus === "approved"
          ? "پروفایل شما احراز شده است"
          : "احراز به‌عنوان قاری رنک‌دار",
      bg: "#D8E7FF",
      iconColor: "#1D1D1B",
      onClick: () => setView("verification"),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-noor-hero pb-28">
      <div className="mx-auto max-w-[430px] px-4 py-5">
        {/* ═══ هدر Activity: عنوان + کنترل سگمنتی ═══ */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl">فعالیت</h1>
          <button
            onClick={() => {
              useNoorStore.getState().setProfileUserId(null);
              setView("profile");
            }}
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground transition hover:text-foreground"
          >
            پروفایل من
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* کنترل سگمنتی — Transactions/Insights */}
        <div className="mt-3 flex rounded-full border-2 border-ink bg-card p-1 shadow-[0_2px_0_0_#1D1D1B]">
          {(
            [
              { key: "points", label: "امتیاز نور" },
              { key: "sessions", label: "محافل" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 rounded-full py-2 text-xs font-extrabold transition",
                tab === t.key ? "bg-ink text-lime" : "text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ کارت خلاصه ماه + نمودار ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-4"
        >
          <DCard tone="white" className="p-4">
            <p className="text-[11px] font-bold text-muted-foreground">
              {tab === "points" ? "نور کسب‌شده در" : "محافل در"} {monthLabel}
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="tabular-display text-3xl">{fa(total)}</span>
              <span className="d-badge d-badge-lime">
                <TrendingUp className="h-3 w-3" />
                فعال
              </span>
            </p>

            {/* نمودار میله‌ای هفتگی */}
            <div className="mt-4 flex h-28 items-end gap-2" dir="ltr">
              {series.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(v / max) * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
                    className={cn(
                      "w-full rounded-t-lg border-2",
                      i === series.length - 1
                        ? "border-ink bg-lime"
                        : "border-ink/25 bg-ink/10",
                    )}
                    style={{ minHeight: 6 }}
                  />
                  <span className="text-[8.5px] font-bold text-muted-foreground" dir="rtl">
                    {weeks[i]}
                  </span>
                </div>
              ))}
            </div>
          </DCard>
        </motion.div>

        {/* ═══ تفکیک بر اساس نوع (By category) ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="mt-4"
        >
          <DCard tone="white" className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="d-section-title">بر اساس نوع تلاوت</h3>
              <DBadge tone="lemon">{user.recitationType}</DBadge>
            </div>
            <div className="mt-3 space-y-3">
              {[
                { label: "تحقیق", tone: "bg-lime border-ink", value: user.recitationType === "تحقیق" ? 78 : 22 },
                { label: "ترتیل", tone: "bg-[#9B7BFF] border-ink", value: user.recitationType === "ترتیل" ? 78 : 22 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{row.label}</span>
                    <span className="text-muted-foreground">٪{fa(row.value)}</span>
                  </div>
                  <div className="mt-1.5 h-3 w-full rounded-full border-2 border-ink bg-card">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${row.value}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className={cn("h-full rounded-full", row.tone)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="my-3.5">
              <DDash soft />
            </div>
            {/* آمار خلاصه */}
            <div className="grid grid-cols-4 gap-2">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div
                    className="mx-auto grid h-8 w-8 place-items-center rounded-xl border-2 border-ink"
                    style={{ background: `${s.color}33`, color: "#1D1D1B" }}
                  >
                    {s.icon}
                  </div>
                  <div className="mt-1.5 text-sm font-extrabold leading-none">{fa(s.value)}</div>
                  <div className="mt-1 text-[9px] font-bold text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </DCard>
        </motion.div>

        {/* ═══ کاشی‌های دسترسی سریع ═══ */}
        <div className="mt-6 mb-3 flex items-center justify-between px-1">
          <h2 className="d-section-title">دسترسی سریع</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={t.onClick}
              className="d-card p-4 text-right"
            >
              <span
                className="mb-2.5 grid h-11 w-11 place-items-center rounded-2xl border-2 border-ink"
                style={{ background: t.bg, color: t.iconColor }}
              >
                {t.icon}
              </span>
              <span className="block font-rounded text-sm font-extrabold">{t.title}</span>
              <span className="mt-0.5 block text-[10.5px] text-muted-foreground">{t.desc}</span>
            </motion.button>
          ))}
        </div>

        {/* ═══ تکمیل پروفایل ═══ */}
        {user.stats?.profileCompletion < 100 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setView("auth")}
            className="d-card-lime mt-4 flex w-full items-center gap-3 p-4 text-right"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-card">
              <Sparkles className="h-5 w-5 text-ink" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="font-rounded text-sm font-extrabold">تکمیل پروفایل</span>
                <span className="text-xs font-black">٪{fa(user.stats.profileCompletion)}</span>
              </span>
              <span className="mt-1.5 block h-2.5 overflow-hidden rounded-full border-2 border-ink bg-card">
                <motion.span
                  className="block h-full rounded-full bg-ink"
                  initial={{ width: 0 }}
                  animate={{ width: `${user.stats.profileCompletion}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </span>
            </span>
          </motion.button>
        )}

        {/* ═══ نشان‌ها ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4"
        >
          <DCard tone="white" className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 font-rounded text-sm font-extrabold">
                <Crown className="h-4 w-4 text-[#D9A900]" />
                نشان‌های شما
              </h2>
              <DBadge tone="mint">{fa(user.stats?.badges?.length ?? 0)} از ۱۲</DBadge>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(user.stats?.badges ?? []).map((b) => (
                <div
                  key={b.id}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink px-2.5 py-1"
                  style={{ background: b.color }}
                >
                  <span className="text-xs">
                    {b.icon === "star" ? "⭐" : b.icon === "moon" ? "🌙" : b.icon === "mic" ? "🎙" : "✨"}
                  </span>
                  <span className="text-[11px] font-extrabold">{b.title}</span>
                </div>
              ))}
              {[
                { t: "قاری ماه", c: "#E6DDFF" },
                { t: "نور افروز", c: "#D8E7FF" },
                { t: "قاری تجوید", c: "#FFD9DE" },
                { t: "محفل‌ساز", c: "#D9F2DC" },
              ].map((b, i) => (
                <div
                  key={i}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-dashed border-ink/35 px-2.5 py-1 opacity-60"
                  style={{ background: b.c }}
                >
                  <span className="text-[10px]">🔒</span>
                  <span className="text-[11px] font-bold text-ink/60">{b.t}</span>
                </div>
              ))}
            </div>
          </DCard>
        </motion.div>

        {/* ═══ قاریان آنلاین ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4"
        >
          <OnlineUsersList limit={5} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <AdBanner slot="dashboard-bottom" size="rectangle" />
        </motion.div>
      </div>
    </div>
  );
}
