"use client";

// ============================================================
// LandingView — صفحهٔ خوش‌آمد اپ منافسه (سبک Darahim)
// حالت اپلیکیشنی: فشرده، لمسی، با کاشی‌های رنگی و دکمه‌های کپسولی
// ============================================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Mic, Users, Trophy, Heart, ArrowLeft, Flame,
  Video, PlayCircle, BookOpen, MessageCircle, Shield, Zap,
} from "lucide-react";
import { AdBanner } from "../ad-banner";
import { useNoorStore } from "@/store/noor-store";
import { NoorLogo } from "../noor-logo";
import { DButton, DBadge, DTile } from "@/components/darahim/kit";

export function LandingView() {
  const setView = useNoorStore((s) => s.setView);
  const user = useNoorStore((s) => s.user);

  const [realStats, setRealStats] = useState<{
    totalUsers: number;
    activeSessions: number;
    totalRecitations: number;
    totalTahmeeds: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setRealStats(data.stats);
      })
      .catch(() => {});
  }, []);

  const fa = (n: number) => n.toLocaleString("fa-IR");

  const stats = [
    { value: realStats ? `+${fa(realStats.totalUsers)}` : "…", label: "قاری فعال", icon: <Users className="h-5 w-5" />, bg: "#9B7BFF", iconColor: "#fff" },
    { value: realStats ? fa(realStats.activeSessions) : "…", label: "محفل زنده", icon: <PlayCircle className="h-5 w-5" />, bg: "#CDF138", iconColor: "#1D1D1B" },
    { value: realStats ? `+${fa(realStats.totalRecitations)}` : "…", label: "تلاوت ثبت‌شده", icon: <Mic className="h-5 w-5" />, bg: "#FF6B4A", iconColor: "#fff" },
    { value: realStats ? `+${fa(realStats.totalTahmeeds)}` : "…", label: "تشویق دریافتی", icon: <Heart className="h-5 w-5" />, bg: "#4D9EFF", iconColor: "#fff" },
  ];

  const features = [
    {
      icon: <Video className="h-6 w-6" />,
      title: "تشکیل محفل",
      desc: "محفلی بسازید و دوستانتان را دعوت کنید",
      bg: "#9B7BFF",
      action: () => setView(user ? "create-session" : "auth"),
    },
    {
      icon: <Flame className="h-6 w-6" />,
      title: "چالش منافسه",
      desc: "آنلاین رقیب پیدا کنید و تلاوت کنید",
      bg: "#FF6B4A",
      action: () => setView(user ? "challenge" : "auth"),
    },
    {
      icon: <PlayCircle className="h-6 w-6" />,
      title: "محافل زنده",
      desc: "به محفل در حال تلاوت بپیوندید",
      bg: "#CDF138",
      action: () => setView("sessions"),
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "تالار گفتگو",
      desc: "با قاریان هم‌علاقه گفتگو کنید",
      bg: "#4D9EFF",
      action: () => setView(user ? "lounge" : "auth"),
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "بلاگ قرآنی",
      desc: "یادداشت‌ها و تجربه‌های قاریان",
      bg: "#FFE9A3",
      action: () => setView("blog"),
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: "کیف امتیاز",
      desc: "امتیاز نور و نشان‌های شما",
      bg: "#D9F2DC",
      action: () => setView(user ? "dashboard" : "auth"),
    },
  ];

  return (
    <div className="min-h-full bg-noor-hero pb-10">
      {/* ═══ HERO اپ ═══ */}
      <section className="px-4 pt-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex justify-center"
        >
          <span className="d-card-lime grid h-20 w-20 rotate-[-4deg] place-items-center rounded-3xl">
            <Mic className="h-9 w-9 text-ink" strokeWidth={2.2} />
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-center font-display text-[2.6rem] leading-[1.15] text-ink"
        >
          محفلی برای{" "}
          <span className="relative inline-block">
            منافسه قرآن
            <svg
              className="absolute -bottom-1 left-0 w-full"
              viewBox="0 0 200 12"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 8 C 60 2, 140 2, 196 8"
                stroke="#FF6B4A"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mx-auto mt-4 max-w-sm text-center text-sm leading-7 text-muted-foreground"
        >
          قاریان قرآن از سراسر جهان در محافل زنده جمع می‌شوند؛ به‌نوبت تلاوت
          می‌کنند و یکدیگر را تشویق می‌کنند تا با کلام وحی لحظات خوشی را تجربه کنند.
        </motion.p>

        {/* دکمه‌های اصلی */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="mt-6 flex flex-col items-stretch gap-3"
        >
          {!user ? (
            <>
              <DButton
                variant="ink"
                size="lg"
                onClick={() => setView("auth")}
                className="w-full text-base"
              >
                <Sparkles className="h-5 w-5 text-lime" />
                ورود / ثبت‌نام
              </DButton>
              <DButton
                variant="white"
                size="lg"
                onClick={() => setView("sessions")}
                className="w-full"
              >
                مشاهده‌ی محفل‌های زنده
                <ArrowLeft className="h-4 w-4" />
              </DButton>
            </>
          ) : (
            <>
              <DButton
                variant="ink"
                size="lg"
                onClick={() => setView("create-session")}
                className="w-full text-base"
              >
                <Video className="h-5 w-5 text-lime" />
                تشکیل محفل
              </DButton>
              <div className="grid grid-cols-2 gap-3">
                <DButton variant="lime" size="lg" onClick={() => setView("sessions")}>
                  <PlayCircle className="h-5 w-5" />
                  محافل زنده
                </DButton>
                <DButton variant="coral" size="lg" onClick={() => setView("challenge")}>
                  <Flame className="h-5 w-5" />
                  چالش منافسه
                </DButton>
              </div>
            </>
          )}
        </motion.div>

        {/* نشان‌های اعتماد — استیکرهای چرخیده */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.34 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-2.5"
        >
          <span className="d-badge d-badge-mint rotate-[-2deg]">
            <Shield className="h-3.5 w-3.5" />
            کاملاً رایگان
          </span>
          <span className="d-badge d-badge-lime rotate-[1.5deg]">
            <Zap className="h-3.5 w-3.5" />
            ورود در کمتر از یک دقیقه
          </span>
          <span className="d-badge d-badge-lav rotate-[-1deg]">
            <Video className="h-3.5 w-3.5" />
            صدا و تصویر بی‌واسطه
          </span>
        </motion.div>
      </section>

      {/* ═══ آمار زنده — کاشی‌های رنگی ═══ */}
      <section className="mt-9 px-4">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="d-card flex items-center gap-3 p-3.5"
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-ink"
                style={{ background: s.bg, color: s.iconColor }}
              >
                {s.icon}
              </span>
              <span>
                <span className="block font-display text-xl leading-none">{s.value}</span>
                <span className="mt-1 block text-[11px] font-bold text-muted-foreground">
                  {s.label}
                </span>
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ تبلیغ ═══ */}
      <section className="mt-6 px-4">
        <AdBanner slot="landing-top" size="leaderboard" />
      </section>

      {/* ═══ دسترسی سریع — کاشی‌های اپ ═══ */}
      <section className="mt-8 px-4">
        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="d-section-title">از اینجا شروع کنید</h2>
          <DBadge tone="lemon">همه‌چیز یک‌جا</DBadge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={f.action}
              className="d-card p-4 text-right transition hover:shadow-[0_4px_0_0_#1D1D1B]"
            >
              <span
                className="mb-3 grid h-11 w-11 place-items-center rounded-2xl border-2 border-ink"
                style={{ background: f.bg, color: f.bg === "#CDF138" || f.bg === "#FFE9A3" || f.bg === "#D9F2DC" ? "#1D1D1B" : "#fff" }}
              >
                {f.icon}
              </span>
              <h3 className="font-rounded text-sm font-extrabold">{f.title}</h3>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{f.desc}</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ═══ آیه قرآن ═══ */}
      <section className="mt-8 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="d-card-lime p-5 text-center">
            <p className="font-quran text-xl leading-loose text-ink">
              وَقُرْآنًا فَرَقْنَاهُ لِتَقْرَأَهُ عَلَى النَّاسِ عَلَىٰ مُكْثٍ
            </p>
            <p className="mt-3 text-xs font-bold text-ink/70">
              «و قرآنی که بخش‌بندی کردیم تا آن را با آرامش بر مردم بخوانی»
            </p>
            <span className="mt-2 inline-block d-badge d-badge-ink">اسراء — ۱۰۶</span>
          </div>
        </motion.div>
      </section>

      {/* ═══ تبلیغ پایین ═══ */}
      <section className="mt-6 px-4">
        <AdBanner slot="landing-bottom" size="billboard" />
      </section>
    </div>
  );
}
