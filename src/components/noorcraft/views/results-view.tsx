"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  Users,
  Sparkles,
  Heart,
  Moon,
  Plus,
  LogIn,
  Home,
  PartyPopper,
} from "lucide-react";
import { NoorButton } from "../noor-button";
import { NoorCard } from "../noor-card";
import { NoorBadge } from "../noor-badge";
import { ParticleEffect } from "../particle-effect";
import { useNoorStore } from "@/store/noor-store";

export function ResultsView() {
  const lastResult = useNoorStore((s) => s.lastResult);
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);

  if (!lastResult) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <NoorButton variant="yellow" onClick={() => setView("dashboard")}>
          بازگشت به داشبورد
        </NoorButton>
      </div>
    );
  }

  const cards = [
    {
      label: "تعداد شنوندگان",
      value: lastResult.listeners,
      icon: <Users className="h-6 w-6" />,
      color: "#87CEEB",
      bg: "bg-noor-sky/15",
    },
    {
      label: "امتیاز نور کسب‌شده",
      value: `+${lastResult.noorEarned}`,
      icon: <Moon className="h-6 w-6" />,
      color: "#FFD700",
      bg: "bg-noor-yellow/15",
    },
    {
      label: "واکنش‌های دریافتی",
      value: lastResult.reactionsReceived,
      icon: <Heart className="h-6 w-6" />,
      color: "#FF7F7F",
      bg: "bg-noor-coral/15",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-noor-hero py-8">
      <ParticleEffect density={70} className="opacity-70" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-noor-yellow shadow-chunky-yellow"
        >
          <PartyPopper className="h-12 w-12 text-noor-navy" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <NoorBadge variant="green" icon={<Trophy className="h-3 w-3" />}>
            تلاوت موفق
          </NoorBadge>
          <h1 className="mt-3 text-3xl font-extrabold text-noor-navy dark:text-white sm:text-4xl">
            تلاوت شما به پایان رسید!
          </h1>
          <p className="mt-2 text-muted-foreground">
            {user?.fullName} عزیز، خدا قوت؛ تلاوت شما شنیدنی بود.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {cards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.15, type: "spring" }}
            >
              <NoorCard interactive className={`text-center ${["noor-card-sky", "noor-card-yellow", "noor-card-coral"][i % 3]}`}>
                <div
                  className={`mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl ${c.bg}`}
                  style={{ color: c.color }}
                >
                  {c.icon}
                </div>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.15, type: "spring" }}
                  className="text-3xl font-extrabold text-noor-navy dark:text-white"
                >
                  {c.value}
                </motion.div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {c.label}
                </div>
              </NoorCard>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8"
        >
          <NoorCard className="bg-gradient-to-br from-noor-yellow/15 to-noor-coral/10 noor-card-rainbow">
            <div className="flex flex-col items-center gap-3 text-center">
              <Sparkles className="h-8 w-8 text-noor-yellow" />
              <div>
                <div className="text-lg font-bold text-noor-navy dark:text-white">
                  مجموع امتیاز نور شما
                </div>
                <div className="mt-1 text-4xl font-extrabold text-noor-navy dark:text-white">
                  {(user?.stats.noorPoints ?? 0).toLocaleString("fa-IR")}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  با هر تلاوت به نشان‌های جدید نزدیک‌تر می‌شوید
                </div>
              </div>
            </div>
          </NoorCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center"
        >
          <NoorButton
            variant="yellow"
            size="lg"
            onClick={() => setView("create-session")}
            leftIcon={<Plus className="h-5 w-5" />}
          >
            ایجاد جلسه جدید
          </NoorButton>
          <NoorButton
            variant="green"
            size="lg"
            onClick={() => setView("sessions")}
            leftIcon={<LogIn className="h-5 w-5" />}
          >
            پیوستن به محفل دیگر
          </NoorButton>
          <NoorButton
            variant="navy"
            size="lg"
            onClick={() => setView("dashboard")}
            leftIcon={<Home className="h-5 w-5" />}
          >
            بازگشت به داشبورد
          </NoorButton>
        </motion.div>
      </div>
    </div>
  );
}
