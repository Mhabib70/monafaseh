"use client";

import { motion } from "framer-motion";
import {
  PlusCircle,
  LogIn,
  Trophy,
  Mic,
  Calendar,
  Award,
  Sparkles,
  Moon,
  Star,
  Edit3,
  Flame,
  MessageCircle,
  Crown,
  BookOpen,
  Coins,
  Heart,
  UserCheck,
  Wallet,
  BadgeCheck,
  Globe,
  Lock,
} from "lucide-react";
import { NoorBadge } from "../noor-badge";
import { NoorAvatar } from "../noor-avatar";
import { OnlineUsersList } from "../online-users-list";
import { AdBanner } from "../ad-banner";
import { VerifiedName } from "../verified-badge";
import { useNoorStore, getProfileFields } from "@/store/noor-store";

export function DashboardView() {
  const user = useNoorStore((s) => s.user);
  const setProfileUserId = useNoorStore((s) => s.setProfileUserId);
  const setView = useNoorStore((s) => s.setView);

  if (!user) return null;

  function countFilled(category: "basic" | "contact" | "recitation" | "personal"): number {
    if (!user) return 0;
    return getProfileFields(user).filter((f) => f.category === category && f.filled).length;
  }

  const stats = [
    {
      label: "جلسات",
      value: user.stats.sessionsAttended,
      icon: <Calendar className="h-4 w-4 text-sky-600 dark:text-sky-400" />,
    },
    {
      label: "امتیاز نور",
      value: user.stats.noorPoints,
      icon: <Moon className="h-4 w-4 text-primary" />,
    },
    {
      label: "نشان‌ها",
      value: user.stats.badges.length,
      icon: <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      label: "مهارت‌ها",
      value: user.recitationSkills.length,
      icon: <Trophy className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
    },
  ];

  const tiles = [
    {
      icon: <Flame className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
      title: "چالش رقابت",
      desc: "یافتن هم‌تلاوت آنلاین",
      accentClass: "bg-rose-500/12",
      onClick: () => setView("challenge"),
    },
    {
      icon: <PlusCircle className="h-5 w-5 text-primary" />,
      title: "تشکیل محفل",
      desc: "ساخت محفل صوتی و تصویری",
      accentClass: "bg-primary/12",
      onClick: () => setView("create-session"),
    },
    {
      icon: <LogIn className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      title: "محافل زنده",
      desc: "پیوستن به تلاوت‌های در حال اجرا",
      accentClass: "bg-emerald-500/12",
      onClick: () => setView("sessions"),
    },
    {
      icon: <MessageCircle className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
      title: "تالار گفتگو",
      desc: "گفتگو و دعوت از قاریان",
      accentClass: "bg-sky-500/12",
      onClick: () => setView("lounge"),
    },
    {
      icon: <BookOpen className="h-5 w-5 text-amber-700 dark:text-amber-300" />,
      title: "بلاگ و یادداشت‌ها",
      desc: "تجربه‌ها و آموزش‌های تلاوت",
      accentClass: "bg-amber-500/12",
      onClick: () => setView("blog"),
    },
    {
      icon: <Coins className="h-5 w-5 text-primary" />,
      title: "خرید امتیاز",
      desc: `موجودی: ${(user.creditBalance ?? 0).toLocaleString("fa-IR")}`,
      accentClass: "bg-primary/12",
      onClick: () => setView("buy-credits"),
    },
    {
      icon: <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
      title: "حمایت مالی",
      desc: "کمک به توسعه پلتفرم منافسه",
      accentClass: "bg-rose-500/12",
      onClick: () => setView("donate"),
    },
    {
      icon: <UserCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
      title: "قاریان آنلاین",
      desc: "رزرو جلسه خصوصی با استادان",
      accentClass: "bg-sky-500/12",
      onClick: () => setView("masters"),
    },
    ...(user.verificationStatus === "approved"
      ? [
          {
            icon: <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
            title: "درآمد و تسویه",
            desc: "گزارش درآمد جلسات خصوصی",
            accentClass: "bg-emerald-500/12",
            onClick: () => setView("bank-info"),
          },
        ]
      : []),
    {
      icon: <BadgeCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
      title: user.verificationStatus === "approved" ? "قاری تأییدشده" : "دریافت تیک آبی",
      desc:
        user.verificationStatus === "pending"
          ? "درخواست در حال بررسی است"
          : user.verificationStatus === "approved"
            ? "پروفایل شما احراز هویت شده است"
            : "احراز هویت و ثبت رتبه قاری",
      accentClass: "bg-sky-500/12",
      onClick: () => setView("verification"),
    },
  ];

  const lockedBadges = [
    { t: "قاری ماه" },
    { t: "نور افروز" },
    { t: "قاری تجوید" },
    { t: "محفل‌ساز" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-noor-hero pb-12">
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-4">
            <NoorAvatar
              name={user.fullName}
              color={user.avatarColor}
              avatarUrl={user.avatarUrl}
              gender={user.gender}
              size="lg"
              ring="good"
              verified={user.verificationStatus === "approved"}
              rank={user.qariRank}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <VerifiedName
                  name={user.fullName}
                  verified={user.verificationStatus === "approved"}
                  rank={user.qariRank}
                  size={18}
                  className="truncate font-display text-lg font-extrabold text-foreground sm:text-xl"
                />
                <button
                  onClick={() => setView("auth")}
                  aria-label="ویرایش پروفایل"
                  title="ویرایش پروفایل"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setProfileUserId(null);
                    setView("profile");
                  }}
                  aria-label="صفحه عمومی من"
                  title="صفحه عمومی من"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Globe className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>{user.age.toLocaleString("fa-IR")} ساله</span>
                <span aria-hidden="true">·</span>
                <span>{user.city}</span>
                <span aria-hidden="true">·</span>
                <NoorBadge variant="sky">{user.recitationType}</NoorBadge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
            {stats.map((s, i) => (
              <div
                key={i}
                className="flex flex-col items-center rounded-xl bg-background/60 px-3 py-2 text-center"
              >
                <div className="font-display text-lg font-bold tabular-nums text-foreground">
                  {s.value.toLocaleString("fa-IR")}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
                  {s.icon}
                  <span>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((t, i) => (
            <button
              key={i}
              onClick={t.onClick}
              className="group flex flex-col items-start rounded-2xl border border-border bg-card p-4 text-right transition-colors hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${t.accentClass}`}>
                {t.icon}
              </div>
              <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {t.title}
              </div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t.desc}
              </div>
            </button>
          ))}
        </div>

        {user.stats.profileCompletion < 100 && (
          <div className="mt-5">
            <button
              onClick={() => setView("auth")}
              className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-right transition-colors hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-foreground">
                    تکمیل اطلاعات پروفایل
                  </span>
                  <span className="tabular-nums text-xs font-bold text-primary">
                    {user.stats.profileCompletion.toLocaleString("fa-IR")}٪
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${user.stats.profileCompletion}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                </div>
              </div>
              <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline">
                {(
                  countFilled("basic") +
                  countFilled("contact") +
                  countFilled("recitation") +
                  countFilled("personal")
                ).toLocaleString("fa-IR")}
                /۱۸ تکمیل‌شده
              </span>
            </button>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Crown className="h-4 w-4 text-primary" />
              نشان‌های افتخار
            </h2>
            <NoorBadge variant="muted" className="tabular-nums">
              {user.stats.badges.length.toLocaleString("fa-IR")} از ۱۲
            </NoorBadge>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {user.stats.badges.map((b) => (
              <div
                key={b.id}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
              >
                <div
                  className="grid h-7 w-7 place-items-center rounded-lg text-slate-900"
                  style={{ background: b.color }}
                >
                  {b.icon === "star" ? (
                    <Star className="h-3.5 w-3.5" />
                  ) : b.icon === "moon" ? (
                    <Moon className="h-3.5 w-3.5" />
                  ) : b.icon === "mic" ? (
                    <Mic className="h-3.5 w-3.5" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                  {b.title}
                </span>
              </div>
            ))}
            {lockedBadges.map((b, i) => (
              <div
                key={i}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 px-3 py-2 opacity-65"
              >
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {b.t}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <OnlineUsersList limit={5} />
        </div>

        <div className="mt-6">
          <AdBanner slot="dashboard-bottom" size="rectangle" />
        </div>
      </div>
    </div>
  );
}
