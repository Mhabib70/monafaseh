"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Mic,
  Users,
  Trophy,
  Heart,
  Moon,
  ArrowLeft,
  Zap,
  Shield,
  Video,
  PlayCircle,
  Star,
  Crown,
  Flame,
  BookOpen,
  Music,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { NoorButton } from "../noor-button";
import { AdBanner } from "../ad-banner";
import { useNoorStore } from "@/store/noor-store";

export function LandingView() {
  const setView = useNoorStore((s) => s.setView);
  const user = useNoorStore((s) => s.user);

  // Fetch real stats from API
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
        if (data.ok) {
          setRealStats(data.stats);
        }
      })
      .catch(() => {});
  }, []);

  function formatNum(n: number): string {
    if (n === 0) return "۰";
    return n.toLocaleString("fa-IR");
  }

  const stats = realStats
    ? [
        { value: `+${formatNum(realStats.totalUsers)}`, label: "قاری فعال", icon: <Users className="h-5 w-5" /> },
        { value: formatNum(realStats.activeSessions), label: "محفل زنده", icon: <PlayCircle className="h-5 w-5" /> },
        { value: `+${formatNum(realStats.totalRecitations)}`, label: "تلاوت ثبت‌شده", icon: <Mic className="h-5 w-5" /> },
        { value: `+${formatNum(realStats.totalTahmeeds)}`, label: "تشویق دریافتی", icon: <Heart className="h-5 w-5" /> },
      ]
    : [
        { value: "...", label: "قاری فعال", icon: <Users className="h-5 w-5" /> },
        { value: "...", label: "محفل زنده", icon: <PlayCircle className="h-5 w-5" /> },
        { value: "...", label: "تلاوت ثبت‌شده", icon: <Mic className="h-5 w-5" /> },
        { value: "...", label: "تشویق دریافتی", icon: <Heart className="h-5 w-5" /> },
      ];

  return (
    <div className="relative">
      {/* === HERO — compact, fast-loading === */}
      <section className="relative overflow-hidden bg-noor-hero">
        <div className="noor-pattern" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="mx-auto mb-4 flex justify-center"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-noor-coral/20 px-4 py-1.5 text-sm font-bold text-noor-coral">
                <Flame className="h-4 w-4" />
                فصل تازه‌ای از منافسه‌های قرآنی آغاز شد
              </span>            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-4xl leading-tight text-noor-navy dark:text-white sm:text-5xl lg:text-6xl"
            >
              محفلی برای{" "}
              <span className="bg-gradient-to-l from-noor-coral via-noor-yellow to-noor-green bg-clip-text text-transparent">
                منافسه قرآن کریم
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg"
            >
              قاریان قرآن از سراسر جهان در محافل زنده جمع می‌شوند؛ به‌نوبت تلاوت
              می‌کنند و یکدیگر را تشویق می‌کنند تا با کلام وحی لحظات خوشی را
              تجربه کنند.
            </motion.p>

            {/* === MAIN ACTION BUTTONS — direct access === */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-3"
            >
              {!user ? (
                <>
                  <NoorButton
                    variant="yellow"
                    size="xl"
                    onClick={() => setView("auth")}
                    leftIcon={<Sparkles className="h-5 w-5" />}
                    className="animate-pulse-glow"
                  >
                    ورود / ثبت‌نام
                  </NoorButton>
                  <NoorButton
                    variant="ghost"
                    size="xl"
                    onClick={() => setView("sessions")}
                    rightIcon={<ArrowLeft className="h-5 w-5" />}
                  >
                    مشاهده‌ی محفل‌های زنده
                  </NoorButton>
                </>
              ) : (
                <>
                  <NoorButton
                    variant="yellow"
                    size="xl"
                    onClick={() => setView("create-session")}
                    leftIcon={<Video className="h-5 w-5" />}
                  >
                    تشکیل محفل
                  </NoorButton>
                  <NoorButton
                    variant="coral"
                    size="xl"
                    onClick={() => setView("challenge")}
                    leftIcon={<Flame className="h-5 w-5" />}
                    className="animate-pulse-glow"
                  >
                    چالش منافسه
                  </NoorButton>
                  <NoorButton
                    variant="green"
                    size="xl"
                    onClick={() => setView("sessions")}
                    leftIcon={<PlayCircle className="h-5 w-5" />}
                  >
                    محافل زنده
                  </NoorButton>
                </>
              )}
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs"
            >
              <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 noor-pill-green">
                <Shield className="h-4 w-4 text-noor-green" />
                <span className="text-noor-navy dark:text-white">کاملاً رایگان</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 noor-pill-yellow">
                <Zap className="h-4 w-4 text-noor-yellow" />
                <span className="text-noor-navy dark:text-white">ورود در کمتر از یک دقیقه</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 noor-pill-sky">
                <Video className="h-4 w-4 text-noor-sky" />
                <span className="text-noor-navy dark:text-white">صدا و تصویر بی‌واسطه</span>
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === AD: Leaderboard — بین hero و آمار === */}
      <section className="bg-noor-hero pb-2 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AdBanner slot="landing-top" size="leaderboard" />
        </div>
      </section>

      {/* === STATS BAR — compact === */}
      <section className="bg-card py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 rounded-2xl p-3 ${["noor-card-sky", "noor-card-yellow", "noor-card-coral", "noor-card-green"][i % 4]}`}
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-noor-yellow/30 text-noor-navy dark:text-yellow-200">
                  {s.icon}
                </div>
                <div>
                  <div className="font-display text-2xl text-noor-navy dark:text-white">
                    {s.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === AD: Medium Rectangle — بین آمار و دسترسی سریع === */}
      <section className="bg-card py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AdBanner slot="landing-mid-1" size="rectangle" />
        </div>
      </section>

      {/* === QUICK ACCESS — all features in one place === */}
      <section className="bg-noor-hero py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 text-center"
          >
            <h2 className="font-display text-2xl text-noor-navy dark:text-white sm:text-3xl">
              از اینجا شروع کنید
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              همه امکانات مورد نیاز شما در یک‌جا جمع شده است
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Video className="h-6 w-6" />,
                title: "تشکیل محفل",
                desc: "محفلی بسازید و دوستانتان را به تلاوت دعوت کنید",
                color: "#FFD700",
                card: "noor-card-yellow",
                action: () => setView(user ? "create-session" : "auth"),
                cta: user ? "شروع" : "ورود",
              },
              {
                icon: <Flame className="h-6 w-6" />,
                title: "چالش منافسه",
                desc: "به‌صورت آنلاین رقیب پیدا کنید و در فضایی دوستانه تلاوت کنید",
                color: "#FF7F7F",
                card: "noor-card-coral",
                action: () => setView(user ? "challenge" : "auth"),
                cta: user ? "شروع چالش" : "ورود",
                highlight: true,
              },
              {
                icon: <PlayCircle className="h-6 w-6" />,
                title: "محافل زنده",
                desc: "به محفلی که در حال تلاوت است بپیوندید",
                color: "#7CFC00",
                card: "noor-card-green",
                action: () => setView("sessions"),
                cta: "مشاهده",
              },
              {
                icon: <MessageCircle className="h-6 w-6" />,
                title: "تالار گفتگو",
                desc: "با قاریان هم‌علاقه گفتگو کنید و آن‌ها را دعوت کنید",
                color: "#87CEEB",
                card: "noor-card-sky",
                action: () => setView(user ? "lounge" : "auth"),
                cta: user ? "ورود" : "ورود",
              },
              {
                icon: <BookOpen className="h-6 w-6" />,
                title: "بلاگ",
                desc: "یادداشت‌ها و تجربه‌های کاربران منافسه",
                color: "#FF7F7F",
                card: "noor-card-coral",
                action: () => setView("blog"),
                cta: "مشاهده",
              },
              {
                icon: <Trophy className="h-6 w-6" />,
                title: "داشبورد",
                desc: "امتیاز نور و نشان‌های خود را مشاهده کنید",
                color: "#FFD700",
                card: "noor-card-yellow",
                action: () => setView(user ? "dashboard" : "auth"),
                cta: user ? "مشاهده" : "ورود",
              },
              {
                icon: <Sparkles className="h-6 w-6" />,
                title: "ورود / ثبت‌نام",
                desc: "در کمتر از یک دقیقه به جمع قاریان بپیوندید",
                color: "#9d4edd",
                card: "noor-card-rainbow",
                action: () => setView("auth"),
                cta: "شروع",
                hideIfLoggedIn: true,
              },
            ]
              .filter((f) => !f.hideIfLoggedIn || !user)
              .map((f, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={f.action}
                  className={`relative overflow-hidden rounded-3xl p-5 text-right transition ${f.card}`}
                >
                  {f.highlight && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute left-3 top-3 rounded-full bg-noor-coral/30 px-2 py-0.5 text-[10px] font-bold text-noor-coral"
                    >
                      🔥 داغ
                    </motion.div>
                  )}
                  <div
                    className="clay-3d mb-3 grid h-12 w-12 place-items-center rounded-2xl text-noor-navy"
                    style={{ background: f.color }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-noor-navy dark:text-white">
                    {f.title}
                  </h3>
                  <p className="mb-3 text-xs text-muted-foreground">{f.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-noor-navy dark:text-white">
                    {f.cta}
                    <ArrowLeft className="h-3 w-3" />
                  </span>
                </motion.button>
              ))}
          </div>
        </div>
      </section>

      {/* === AD: Inline — بین دسترسی سریع و آیه قرآن === */}
      <section className="bg-noor-hero py-3">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <AdBanner slot="landing-mid-2" size="inline" />
        </div>
      </section>

      {/* === QURANIC QUOTE — minimal === */}
      <section className="bg-card py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl p-6 text-center noor-card-rainbow sm:p-8"
          >
            <p className="font-quran text-2xl leading-loose text-noor-navy dark:text-white sm:text-3xl">
              وَقُرْآنًا فَرَقْنَاهُ لِتَقْرَأَهُ عَلَى النَّاسِ عَلَىٰ مُكْثٍ
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              «و قرآنی که بخش‌بندی کردیم تا آن را با آرامش بر مردم بخوانی»
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              سوره‌ی اسراء — آیه‌ی ۱۰۶
            </p>
          </motion.div>
        </div>
      </section>

      {/* === AD: Billboard — پایین صفحه، بزرگ === */}
      <section className="bg-noor-hero pb-10 pt-2">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AdBanner slot="landing-bottom" size="billboard" />
        </div>
      </section>
    </div>
  );
}
