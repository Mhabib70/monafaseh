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
  TrendingUp,
  Flame,
  Video,
  MessageCircle,
  Crown,
  Zap,
  BookOpen,
  Coins,
  Heart,
  UserCheck,
  Wallet,
  BadgeCheck,
  Globe,
} from "lucide-react";
import { NoorButton } from "../noor-button";
import { NoorCard } from "../noor-card";
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

  // Helper: count filled fields by category
  function countFilled(category: "basic" | "contact" | "recitation" | "personal"): number {
    if (!user) return 0;
    return getProfileFields(user).filter((f) => f.category === category && f.filled).length;
  }

  const stats = [
    { label: "جلسات", value: user.stats.sessionsAttended, icon: <Calendar className="h-4 w-4" />, color: "#87CEEB" },
    { label: "امتیاز نور", value: user.stats.noorPoints, icon: <Moon className="h-4 w-4" />, color: "#FFD700" },
    { label: "نشان‌ها", value: user.stats.badges.length, icon: <Award className="h-4 w-4" />, color: "#7CFC00" },
    { label: "مهارت‌ها", value: user.recitationSkills.length, icon: <Trophy className="h-4 w-4" />, color: "#FF7F7F" },
  ];

  // Quick-access tiles — the heart of the new compact dashboard
  const tiles = [
    {
      icon: <Flame className="h-6 w-6" />,
      title: "چالش رقابت",
      desc: "رقیبی آنلاین پیدا کنید",
      color: "#FF7F7F",
      bg: "from-noor-coral/20 to-noor-coral/5",
      onClick: () => setView("challenge"),
      highlight: true,
    },
    {
      icon: <PlusCircle className="h-6 w-6" />,
      title: "تشکیل محفل",
      desc: "محفل تلاوت بسازید",
      color: "#FFD700",
      bg: "from-noor-yellow/20 to-noor-yellow/5",
      onClick: () => setView("create-session"),
    },
    {
      icon: <LogIn className="h-6 w-6" />,
      title: "محافل زنده",
      desc: "به محفلی بپیوندید",
      color: "#7CFC00",
      bg: "from-noor-green/20 to-noor-green/5",
      onClick: () => setView("sessions"),
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "تالار گفتگو",
      desc: "با قاریان گفتگو کنید",
      color: "#87CEEB",
      bg: "from-noor-sky/20 to-noor-sky/5",
      onClick: () => setView("lounge"),
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "بلاگ",
      desc: "یادداشت‌ها و تجربه‌های کاربران",
      color: "#FF7F7F",
      bg: "from-noor-coral/20 to-noor-coral/5",
      onClick: () => setView("blog"),
    },
    {
      icon: <Coins className="h-6 w-6" />,
      title: "خرید امتیاز",
      desc: `موجودی: ${(user.creditBalance ?? 0).toLocaleString("fa-IR")}`,
      color: "#FFD700",
      bg: "from-noor-yellow/20 to-noor-yellow/5",
      onClick: () => setView("buy-credits"),
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "حمایت مالی",
      desc: "کمک به رشد و توسعه منافسه",
      color: "#ef476f",
      bg: "from-[#ef476f]/20 to-[#ef476f]/5",
      onClick: () => setView("donate"),
    },
    {
      icon: <UserCheck className="h-6 w-6" />,
      title: "قاریان آنلاین",
      desc: "جلسه خصوصی با قاریان تأییدشده",
      color: "#87CEEB",
      bg: "from-noor-sky/20 to-noor-sky/5",
      onClick: () => setView("masters"),
    },
    // درآمد و تسویه — فقط برای قاریان تأییدشده (تیک آبی)
    ...(user.verificationStatus === "approved"
      ? [{
          icon: <Wallet className="h-6 w-6" />,
          title: "درآمد و تسویه",
          desc: "درآمد جلسات خصوصی شما",
          color: "#7CFC00",
          bg: "from-noor-green/20 to-noor-green/5",
          onClick: () => setView("bank-info"),
        }]
      : []),
    {
      icon: <BadgeCheck className="h-6 w-6" />,
      title: user.verificationStatus === "approved" ? "تأییدشده ✅" : "دریافت تیک آبی",
      desc:
        user.verificationStatus === "pending"
          ? "درخواست شما در حال بررسی است"
          : user.verificationStatus === "approved"
          ? "پروفایل شما احراز شده است"
          : "احراز به‌عنوان قاری رنک‌دار",
      color: "#1D9BF0",
      bg: "from-sky-400/20 to-sky-400/5",
      onClick: () => setView("verification"),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-noor-hero pb-12">
      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* === COMPACT PROFILE BAR === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 rounded-3xl bg-card p-4 shadow-sm">
            <NoorAvatar
              name={user.fullName}
              color={user.avatarColor}
              avatarUrl={user.avatarUrl}
              size="lg"
              ring="good"
              verified={user.verificationStatus === "approved"} rank={user.qariRank}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <VerifiedName
                  name={user.fullName}
                  verified={user.verificationStatus === "approved"} rank={user.qariRank}
                  size={19}
                  className="truncate text-xl font-extrabold text-noor-navy dark:text-white"
                />
                <button
                  onClick={() => setView("auth")}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition hover:bg-noor-sky/20"
                  title="ویرایش پروفایل"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setProfileUserId(null);
                    setView("profile");
                  }}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition hover:bg-noor-yellow/20"
                  title="صفحه عمومی من"
                >
                  <Globe className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>{user.age} ساله</span>
                <span>•</span>
                <span>{user.city}</span>
                <span>•</span>
                <NoorBadge variant="sky">{user.recitationType}</NoorBadge>
              </div>
            </div>

            {/* Inline stats — no separate card */}
            <div className="hidden items-center gap-3 sm:flex">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="font-display text-lg text-noor-navy dark:text-white">
                    {s.value.toLocaleString("fa-IR")}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                    <span style={{ color: s.color }}>{s.icon}</span>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* === QUICK-ACCESS TILES — fancy & compact === */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((t, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={t.onClick}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.bg} p-4 text-center ring-2 ring-transparent transition hover:ring-noor-navy/10`}
            >
              {t.highlight && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute left-2 top-2 rounded-full bg-noor-coral/30 px-2 py-0.5 text-[9px] font-bold text-noor-coral"
                >
                  🔥 داغ
                </motion.div>
              )}
              <div
                className="clay-3d mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl text-noor-navy"
                style={{ background: t.color }}
              >
                {t.icon}
              </div>
              <div className="text-sm font-bold text-noor-navy dark:text-white">
                {t.title}
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                {t.desc}
              </div>
            </motion.button>
          ))}
        </div>

        {/* === MOBILE STATS (hidden on desktop) === */}
        <div className="mt-3 grid grid-cols-4 gap-2 sm:hidden">
          {stats.map((s, i) => (
            <div key={i} className="rounded-xl bg-card p-2 text-center">
              <div className="font-display text-base text-noor-navy dark:text-white">
                {s.value.toLocaleString("fa-IR")}
              </div>
              <div className="text-[9px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* === PROFILE COMPLETION — slim bar === */}
        {user.stats.profileCompletion < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4"
          >
            <button
              onClick={() => setView("auth")}
              className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-l from-noor-yellow/15 to-noor-coral/10 p-3 text-right transition hover:from-noor-yellow/25 hover:to-noor-coral/20"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-noor-yellow/20">
                <Sparkles className="h-5 w-5 text-noor-yellow" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-noor-navy dark:text-white">
                    تکمیل پروفایل
                  </span>
                  <span className="text-xs font-bold text-noor-navy dark:text-white">
                    {user.stats.profileCompletion}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-l from-noor-coral via-noor-yellow to-noor-green"
                    initial={{ width: 0 }}
                    animate={{ width: `${user.stats.profileCompletion}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {countFilled("basic") + countFilled("contact") + countFilled("recitation") + countFilled("personal")}/۱۸ فیلد
              </span>
            </button>
          </motion.div>
        )}

        {/* === BADGES — compact horizontal strip === */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4"
        >
          <div className="rounded-2xl bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-noor-navy dark:text-white">
                <Crown className="h-4 w-4 text-noor-yellow" />
                نشان‌های شما
              </h2>
              <NoorBadge variant="muted">
                {user.stats.badges.length} از ۱۲
              </NoorBadge>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {user.stats.badges.map((b) => (
                <div
                  key={b.id}
                  className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5"
                  style={{ background: `${b.color}22` }}
                >
                  <div
                    className="grid h-7 w-7 place-items-center rounded-full text-noor-navy"
                    style={{ background: b.color }}
                  >
                    {b.icon === "star" ? (
                      <Star className="h-4 w-4" />
                    ) : b.icon === "moon" ? (
                      <Moon className="h-4 w-4" />
                    ) : b.icon === "mic" ? (
                      <Mic className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-noor-navy dark:text-white">
                    {b.title}
                  </span>
                </div>
              ))}
              {/* Locked badges */}
              {[
                { t: "قاری ماه", c: "#9d4edd" },
                { t: "نور افروز", c: "#118ab2" },
                { t: "قاری تجوید", c: "#ef476f" },
                { t: "محفل‌ساز", c: "#06d6a0" },
              ].map((b, i) => (
                <div
                  key={i}
                  className="flex shrink-0 items-center gap-2 rounded-full bg-muted/30 px-3 py-1.5 opacity-50"
                >
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs">
                    🔒
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">
                    {b.t}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* === ONLINE USERS — compact === */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4"
        >
          <OnlineUsersList limit={5} />
        </motion.div>

        {/* AD: Medium Rectangle — پایین داشبورد، غیرتهاجمی */}
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
