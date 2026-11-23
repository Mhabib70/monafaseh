"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  Users,
  Trophy,
  Heart,
  ArrowLeft,
  Video,
  PlayCircle,
  Flame,
  BookOpen,
  MessageCircle,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { NoorButton } from "../noor-button";
import { AdBanner } from "../ad-banner";
import { useNoorStore } from "@/store/noor-store";

interface LiveStats {
  totalUsers: number;
  activeSessions: number;
  totalRecitations: number;
  totalTahmeeds: number;
}

function EditorialMedia({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950/60 p-6 text-center text-stone-300 ${className}`}
      >
        <Mic className="h-10 w-10 opacity-40" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

export function LandingView() {
  const setView = useNoorStore((s) => s.setView);
  const user = useNoorStore((s) => s.user);
  const [realStats, setRealStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.ok) setRealStats(data.stats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    {
      value: realStats ? `+${realStats.totalUsers.toLocaleString("fa-IR")}` : null,
      label: "قاری عضو",
      icon: <Users className="h-4 w-4 text-primary" />,
    },
    {
      value: realStats ? realStats.activeSessions.toLocaleString("fa-IR") : null,
      label: "محفل زنده",
      icon: <PlayCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      value: realStats ? `+${realStats.totalRecitations.toLocaleString("fa-IR")}` : null,
      label: "تلاوت ثبت‌شده",
      icon: <Mic className="h-4 w-4 text-primary" />,
    },
    {
      value: realStats ? `+${realStats.totalTahmeeds.toLocaleString("fa-IR")}` : null,
      label: "تحمید و تشویق",
      icon: <Heart className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
    },
  ];

  const pillars = [
    {
      title: "محافل تلاوت زنده",
      desc: "برگزاری محافل صوتی و تصویری با نوبت‌دهی خودکار، مدیریت میزبان و تفکیک محافل آقایان و بانوان.",
      cta: "مشاهده محافل",
      image: "/images/editorial/live-gathering.jpg",
      alt: "محفل زنده تلاوت قرآن کریم",
      action: () => setView("sessions"),
    },
    {
      title: "چالش منافسه دو‌نفره",
      desc: "یافتن هم‌تلاوت هم‌سطح بر اساس سبک تحقیق یا ترتیل و رقابت سازنده در فضایی صمیمی.",
      cta: user ? "شروع چالش" : "ورود و شرکت",
      image: "/images/editorial/quran-challenge.jpg",
      alt: "مصحف شریف در حال تلاوت و رقابت قرآنی",
      action: () => setView(user ? "challenge" : "auth"),
    },
    {
      title: "جلسه خصوصی با قاریان ممتاز",
      desc: "رزرو نوبت مستقیم با استادان احراز هویت‌شده برای رفع اشکال تجوید، صوت و لحن.",
      cta: "فهرست قاریان",
      image: "/images/editorial/master-reciters.jpg",
      alt: "قاری و مدرس در حال تلاوت با میکروفون استودیویی",
      action: () => setView("masters"),
    },
  ];

  const utilities = [
    {
      icon: <MessageCircle className="h-5 w-5 text-primary" />,
      title: "تالار گفتگو",
      desc: "ارتباط مستقیم با قاریان هم‌علاقه و ارسال دعوت‌نامه محفل",
      action: () => setView(user ? "lounge" : "auth"),
    },
    {
      icon: <BookOpen className="h-5 w-5 text-primary" />,
      title: "مجله و یادداشت‌ها",
      desc: "تجربه‌ها، نکات آموزشی صوت و لحن و گفت‌وگوهای قرآنی",
      action: () => setView("blog"),
    },
    {
      icon: <Trophy className="h-5 w-5 text-primary" />,
      title: user ? "داشبورد و نشان‌ها" : "عضویت و امتیاز نور",
      desc: user
        ? "مدیریت محافل، پیگیری رتبه‌ها و موجودی امتیاز نور"
        : "ساخت پروفایل قاری و ثبت تلاوت در کمتر از یک دقیقه",
      action: () => setView(user ? "dashboard" : "auth"),
    },
  ];

  return (
    <div className="relative">
      <section className="relative overflow-hidden border-b border-border bg-noor-hero">
        <div className="noor-pattern" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col justify-center lg:col-span-7"
            >
              <p className="text-xs font-semibold tracking-wide text-primary">
                پلتفرم تخصصی محافل تلاوت و منافسه‌های قرآنی
              </p>

              <h1 className="mt-3 font-display text-3xl font-extrabold leading-[1.2] text-foreground sm:text-5xl lg:text-[3.25rem]">
                محفلی زنده برای{" "}
                <span className="text-primary">تلاوت و منافسه</span> قرآن کریم
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                قاریان از سراسر کشور و جهان در محافل صوتی و تصویری گرد هم
                می‌آیند، به‌نوبت تلاوت می‌کنند و با دریافت تحمید و بازخورد
                استادان، مسیر رشد قرآنی خود را می‌سازند.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {!user ? (
                  <>
                    <NoorButton
                      variant="yellow"
                      size="xl"
                      onClick={() => setView("auth")}
                      leftIcon={<Sparkles className="h-5 w-5" />}
                    >
                      شروع عضویت رایگان
                    </NoorButton>
                    <NoorButton
                      variant="outline"
                      size="xl"
                      onClick={() => setView("sessions")}
                      rightIcon={<ArrowLeft className="h-5 w-5" />}
                    >
                      مشاهده محافل زنده
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
                      تشکیل محفل جدید
                    </NoorButton>
                    <NoorButton
                      variant="coral"
                      size="xl"
                      onClick={() => setView("challenge")}
                      leftIcon={<Flame className="h-5 w-5" />}
                    >
                      چالش رقابت
                    </NoorButton>
                    <NoorButton
                      variant="outline"
                      size="xl"
                      onClick={() => setView("sessions")}
                      rightIcon={<ArrowLeft className="h-5 w-5" />}
                    >
                      محافل زنده
                    </NoorButton>
                  </>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
                <span>رایگان برای همه قاریان</span>
                <span aria-hidden="true">·</span>
                <span>پشتیبانی از تحقیق و ترتیل</span>
                <span aria-hidden="true">·</span>
                <span>محافل مجزا ویژه آقایان و بانوان</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <div className="relative h-64 overflow-hidden rounded-2xl border border-border bg-stone-900 sm:h-80 lg:h-full lg:min-h-[360px]">
                <EditorialMedia
                  src="/images/editorial/hero-recitation.jpg"
                  alt="فضای نورانی محفل تلاوت قرآن کریم"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
                />
                <div className="absolute inset-x-5 bottom-4 flex items-center justify-between text-xs text-white/90">
                  <span className="font-medium">پخش زنده محافل تلاوت</span>
                  <span className="tabular-nums font-semibold">
                    {realStats
                      ? `${realStats.activeSessions.toLocaleString("fa-IR")} محفل فعال`
                      : "در حال اتصال..."}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-background py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AdBanner slot="landing-top" size="leaderboard" />
        </div>
      </section>

      <section className="border-b border-border bg-card py-7">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 rounded-xl border border-border bg-background/60 px-4 py-3.5"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10">
                  {s.icon}
                </div>
                <div className="min-w-0">
                  {s.value !== null ? (
                    <div className="font-display text-2xl font-extrabold tabular-nums text-foreground">
                      {s.value}
                    </div>
                  ) : (
                    <div className="my-1 h-7 w-16 animate-pulse rounded bg-muted" />
                  )}
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AdBanner slot="landing-mid-1" size="rectangle" />
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-primary">امکانات اصلی منافسه</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
                مسیر حضور در محافل قرآنی
              </h2>
            </div>
            <button
              onClick={() => setView("masters")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:underline"
            >
              <UserCheck className="h-4 w-4" />
              مشاهده قاریان تأییدشده
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {pillars.map((item) => (
              <button
                key={item.title}
                onClick={item.action}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-right transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
                  <EditorialMedia
                    src={item.image}
                    alt={item.alt}
                    className="transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
                  />
                  <span className="absolute bottom-3 right-4 font-display text-lg font-bold text-white">
                    {item.title}
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                    {item.cta}
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {utilities.map((u) => (
              <button
                key={u.title}
                onClick={u.action}
                className="flex items-start gap-3.5 rounded-2xl border border-border bg-card p-5 text-right transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                  {u.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-bold text-foreground">
                    {u.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {u.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-2">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <AdBanner slot="landing-mid-2" size="inline" />
        </div>
      </section>

      <section className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <blockquote className="rounded-2xl border border-primary/25 bg-background/70 px-6 py-8 sm:px-10">
            <p className="font-quran text-2xl leading-[2.2] text-foreground sm:text-3xl">
              وَقُرْآنًا فَرَقْنَاهُ لِتَقْرَأَهُ عَلَى النَّاسِ عَلَىٰ مُكْثٍ
            </p>
            <p className="mt-4 text-sm text-muted-foreground sm:text-base">
              «و قرآنی که بخش‌بندی کردیم تا آن را با آرامش بر مردم بخوانی»
            </p>
            <footer className="mt-2 text-xs font-medium text-primary">
              سوره‌ی اسراء — آیه‌ی ۱۰۶
            </footer>
          </blockquote>
        </div>
      </section>

      <section className="bg-background pb-10 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AdBanner slot="landing-bottom" size="billboard" />
        </div>
      </section>
    </div>
  );
}
