"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Trophy,
  Users,
  Loader2,
  X,
  Sparkles,
  Zap,
  Shield,
  Crown,
  Check,
  ArrowLeft,
  Radio,
} from "lucide-react";
import { NoorButton } from "../noor-button";
import { NoorBadge } from "../noor-badge";
import { NoorAvatar } from "../noor-avatar";
import { BackButtons } from "../back-buttons";
import { OnlineUsersMarquee } from "../online-users-marquee";
import { AdBanner } from "../ad-banner";
import { useNoorStore } from "@/store/noor-store";
import { useToast } from "@/hooks/use-toast";
import type { SessionDetail } from "@/lib/noorcraft/types";
import type { RecitationType } from "@/lib/noorcraft/types";

interface ChallengeRequest {
  id: string;
  userId: string;
  fullName: string;
  avatarColor: string;
  avatarUrl: string | null;
  gender: string;
  recitationType: string;
  status: "pending" | "matched";
  sessionId?: string;
  createdAt: number;
  matchedAt?: number;
  matchedByUserId?: string;
  matchedByName?: string;
}

const CARD_COLORS = [
  "noor-card-yellow",
  "noor-card-coral",
  "noor-card-green",
  "noor-card-sky",
  "noor-card-rainbow",
];

export function ChallengeView() {
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const setActiveSession = useNoorStore((s) => s.setActiveSession);
  const { toast } = useToast();

  const [myChallenge, setMyChallenge] = useState<ChallengeRequest | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<ChallengeRequest[]>([]);
  const [announcing, setAnnouncing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(0);

  // Poll for my challenge status (am I matched?)
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function pollMyChallenge() {
      try {
        const res = await fetch("/api/challenge/my", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (data.ok && data.challenge) {
          const ch = data.challenge as ChallengeRequest;
          setMyChallenge(ch);

          // If matched, create session detail and redirect
          if (ch.status === "matched" && ch.sessionId) {
            // Fetch the session details
            const sres = await fetch("/api/sessions", { cache: "no-store" });
            const sdata = await sres.json();
            if (sdata.ok) {
              const session = sdata.sessions.find(
                (s: any) => s.id === ch.sessionId,
              );
              if (session) {
                const detail: SessionDetail = {
                  ...session,
                  hostAvatarColor: session.hostAvatarColor || "#FFD700",
                };
                setActiveSession(detail);
                toast({
                  title: "رقیب پیدا شد! ⚔️",
                  description: `${ch.matchedByName} چالش شما را قبول کرد. وارد محفل شوید!`,
                });
                setView("session-room");
                return;
              }
            }
          }
        } else {
          setMyChallenge(null);
        }
      } catch (err) {
        // Silently ignore — will retry
      }
    }

    pollMyChallenge();
    const interval = setInterval(pollMyChallenge, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, setView, setActiveSession, toast]);

  // Poll for active challenges (who's looking for a rival?)
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function pollActive() {
      try {
        const res = await fetch("/api/challenge", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (data.ok) {
          setActiveChallenges(data.challenges || []);
        }
      } catch (err) {
        // Silently ignore
      }
    }

    pollActive();
    const interval = setInterval(pollActive, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  // Elapsed timer when waiting
  useEffect(() => {
    if (myChallenge?.status === "pending") {
      startTimeRef.current = myChallenge.createdAt;
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [myChallenge?.status, myChallenge?.createdAt]);

  // Announce readiness
  const handleAnnounce = useCallback(async () => {
    if (!user) return;
    setAnnouncing(true);
    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recitationType: user.recitationType || "ترتیل",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMyChallenge(data.challenge);
        toast({
          title: "اعلام آمادگی ثبت شد! ⚔️",
          description: "در انتظار رقیب... اولین نفری که قبول کند، وارد چالش می‌شود.",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({
        title: "خطا",
        description: err.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setAnnouncing(false);
    }
  }, [user, toast]);

  // Cancel my challenge
  const handleCancel = useCallback(async () => {
    if (!myChallenge) return;
    try {
      await fetch(`/api/challenge/${myChallenge.id}/cancel`, {
        method: "POST",
      });
      setMyChallenge(null);
      toast({ title: "اعلام آمادگی لغو شد" });
    } catch (err) {
      // ignore
    }
  }, [myChallenge, toast]);

  // Accept someone's challenge
  const handleAccept = useCallback(
    async (challenge: ChallengeRequest) => {
      if (!user) return;
      setAcceptingId(challenge.id);
      try {
        const res = await fetch(`/api/challenge/${challenge.id}/accept`, {
          method: "POST",
        });
        const data = await res.json();
        if (data.ok) {
          // Fetch the session
          const sres = await fetch("/api/sessions", { cache: "no-store" });
          const sdata = await sres.json();
          if (sdata.ok) {
            const session = sdata.sessions.find(
              (s: any) => s.id === data.sessionId,
            );
            if (session) {
              const detail: SessionDetail = {
                ...session,
                hostAvatarColor: session.hostAvatarColor || "#FFD700",
              };
              setActiveSession(detail);
              toast({
                title: "چالش قبول شد! ⚔️",
                description: `وارد محفل رقابت با ${challenge.fullName} شدید.`,
              });
              setView("session-room");
              return;
            }
          }
          // Fallback: redirect to sessions list
          setView("sessions");
        } else {
          throw new Error(data.error);
        }
      } catch (err: any) {
        toast({
          title: "خطا در قبول چالش",
          description: err.message || "ممکن است چالش قبلاً قبول شده باشد",
          variant: "destructive",
        });
      } finally {
        setAcceptingId(null);
      }
    },
    [user, setView, setActiveSession, toast],
  );

  // === WAITING STATE ===
  if (myChallenge?.status === "pending") {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-noor-hero">
        {/* Floating background particles */}
        <div className="pointer-events-none absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl opacity-10"
              initial={{
                x: Math.random() * 100 + "%",
                y: "100%",
              }}
              animate={{
                y: "-20%",
                x: Math.random() * 100 + "%",
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                delay: i * 0.8,
              }}
            >
              {["⚔️", "🏆", "📖", "✨", "🌙"][i % 5]}
            </motion.div>
          ))}
        </div>

        <div className="relative mx-auto max-w-2xl px-4 py-8 sm:px-6">
          {/* Back button */}
          <div className="mb-4">
            <BackButtons />
          </div>
        </div>

        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-16 sm:px-6">
          {/* Animated sword clash */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="grid h-32 w-32 place-items-center rounded-full bg-noor-yellow/20 ring-4 ring-noor-yellow/40"
            >
              <Flame className="h-16 w-16 text-noor-yellow" />
            </motion.div>
            {/* Pulsing rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-noor-yellow/30"
                animate={{
                  scale: [1, 1.8],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                }}
              />
            ))}
          </motion.div>

          {/* Title */}
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl text-noor-navy dark:text-white sm:text-4xl"
            >
              در جستجوی رقیب...
            </motion.h1>
            <p className="mt-2 text-sm text-muted-foreground">
              منتظر بمانید — اولین نفری که چالش شما را قبول کند، وارد رقابت می‌شود
            </p>
          </div>

          {/* Timer card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="noor-card-yellow w-full max-w-sm rounded-3xl p-6 text-center"
          >
            <div className="mb-2 flex items-center justify-center gap-2 text-noor-navy dark:text-white">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-bold">در حال انتظار</span>
            </div>
            <div className="font-display text-5xl text-noor-navy dark:text-white">
              {Math.floor(elapsed / 60).toLocaleString("fa-IR")}:
              {(elapsed % 60).toLocaleString("fa-IR").padStart(2, "۰")}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">ثانیه گذشته</div>
          </motion.div>

          {/* My info card */}
          <div className="noor-card-sky w-full max-w-sm rounded-2xl p-4">
            <div className="mb-2 text-xs font-bold text-noor-navy dark:text-white">
              مشخصات شما برای رقبا:
            </div>
            <div className="flex items-center gap-3">
              <NoorAvatar
                name={user?.fullName ?? "?"}
                color={user?.avatarColor ?? "#FFD700"}
                avatarUrl={user?.avatarUrl}
                size="md"
              />
              <div>
                <div className="text-sm font-bold text-noor-navy dark:text-white">
                  {user?.fullName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {myChallenge.recitationType} •{" "}
                  {myChallenge.gender === "male" ? "آقا" : "خانم"}
                </div>
              </div>
              <div className="mr-auto">
                <NoorBadge variant="coral" icon={<Flame className="h-3 w-3" />}>
                  آماده رقابت
                </NoorBadge>
              </div>
            </div>
          </div>

          {/* Cancel button */}
          <NoorButton
            variant="coral"
            size="lg"
            onClick={handleCancel}
            leftIcon={<X className="h-5 w-5" />}
          >
            لغو جستجوی رقیب
          </NoorButton>
        </div>
      </div>
    );
  }

  // === DEFAULT (IDLE) STATE ===
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-noor-hero">
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Back button */}
        <div className="mb-4">
          <BackButtons />
        </div>

        {/* AD: Leaderboard — بالای صفحه چالش */}
        <AdBanner slot="challenge-top" size="leaderboard" className="mb-6" />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="mx-auto mb-4 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-noor-coral to-noor-yellow shadow-chunky-coral"
          >
            <Flame className="h-12 w-12 text-noor-navy" />
          </motion.div>
          <NoorBadge variant="coral" icon={<Flame className="h-3 w-3" />}>
            چالش زنده رقابت
          </NoorBadge>
          <h1 className="mt-3 font-display text-4xl text-noor-navy dark:text-white sm:text-5xl">
            رقیب خود را پیدا کنید!
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            اعلام آمادگی کنید و منتظر بمانید تا قاری دیگری چالش شما را بپذیرد؛ یا
            خودتان یکی از چالش‌های فعال را بپذیرید و بی‌درنگ وارد محفل رقابت شوید.
          </p>
        </motion.div>

        {/* Announce button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10 flex justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAnnounce}
            disabled={announcing}
            className="relative grid h-48 w-48 place-items-center rounded-full bg-gradient-to-br from-noor-yellow via-noor-coral to-noor-yellow shadow-chunky-yellow disabled:opacity-50"
          >
            {announcing ? (
              <Loader2 className="h-16 w-16 animate-spin text-noor-navy" />
            ) : (
              <>
                <Flame className="h-16 w-16 text-noor-navy" />
                <span className="mt-2 font-display text-xl text-noor-navy">
                  اعلام آمادگی
                </span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Active challengers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-noor-navy dark:text-white">
              <Users className="h-5 w-5 text-noor-coral" />
              قاریان آماده رقابت
              <NoorBadge variant="coral">{activeChallenges.length} نفر</NoorBadge>
            </h2>
          </div>

          {activeChallenges.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="noor-card-sky rounded-3xl p-10 text-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-noor-sky/20"
              >
                <Radio className="h-10 w-10 text-noor-sky" />
              </motion.div>
              <h3 className="font-display text-xl text-noor-navy dark:text-white">
                فعلاً رقیبی در صف نیست
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                اولین نفر باشید! روی دکمه «اعلام آمادگی» کلیک کنید و منتظر رقیب بمانید.
                <br />
                به‌محض اینکه کسی چالش شما را بپذیرد، بی‌درنگ وارد محفل رقابت می‌شوید.
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {activeChallenges.map((ch, i) => {
                  const cardClass = CARD_COLORS[i % CARD_COLORS.length];
                  const timeAgo = Math.floor(
                    (Date.now() - ch.createdAt) / 1000,
                  );
                  return (
                    <motion.div
                      key={ch.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      whileHover={{ y: -4 }}
                    >
                      <div className={`rounded-3xl p-5 ${cardClass}`}>
                        {/* Header */}
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <NoorAvatar
                              name={ch.fullName}
                              color={ch.avatarColor}
                              avatarUrl={ch.avatarUrl}
                              size="md"
                            />
                            <div>
                              <div className="text-sm font-bold text-noor-navy dark:text-white">
                                {ch.fullName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {ch.gender === "male" ? "آقا" : "خانم"} •{" "}
                                {ch.recitationType}
                              </div>
                            </div>
                          </div>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Flame className="h-5 w-5 text-noor-coral" />
                          </motion.div>
                        </div>

                        {/* Badges */}
                        <div className="mb-4 flex flex-wrap gap-1.5">
                          <NoorBadge
                            variant="yellow"
                            icon={<Zap className="h-3 w-3" />}
                          >
                            آماده رقابت
                          </NoorBadge>
                          <NoorBadge variant="muted">
                            {timeAgo < 60
                              ? `${timeAgo.toLocaleString("fa-IR")} ثانیه پیش`
                              : `${Math.floor(timeAgo / 60).toLocaleString("fa-IR")} دقیقه پیش`}
                          </NoorBadge>
                        </div>

                        {/* Accept button */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAccept(ch)}
                          disabled={acceptingId === ch.id}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-noor-coral to-noor-yellow px-4 py-3 text-sm font-bold text-noor-navy shadow-md transition disabled:opacity-50"
                        >
                          {acceptingId === ch.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Flame className="h-4 w-4" />
                          )}
                          {acceptingId === ch.id
                            ? "در حال قبول..."
                            : "قبول چالش! ⚔️"}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10"
        >
          <h2 className="mb-4 text-center font-display text-2xl text-noor-navy dark:text-white">
            چطور کار می‌کند؟
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                num: "۱",
                title: "اعلام آمادگی",
                desc: "روی دکمه «اعلام آمادگی» کلیک کنید و منتظر رقیب بمانید",
                icon: <Flame className="h-6 w-6" />,
                color: "#FFD700",
                card: "noor-card-yellow",
              },
              {
                num: "۲",
                title: "قبول چالش",
                desc: "یک قاری دیگر چالش شما را قبول می‌کند — یا خودتان چالش او را بپذیرید",
                icon: <Check className="h-6 w-6" />,
                color: "#FF7F7F",
                card: "noor-card-coral",
              },
              {
                num: "۳",
                title: "شروع رقابت",
                desc: "فوراً وارد محفل تصویری شوید و تلاوت کنید",
                icon: <Trophy className="h-6 w-6" />,
                color: "#7CFC00",
                card: "noor-card-green",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <div className={`rounded-3xl p-6 text-center ${step.card}`}>
                  <div
                    className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full text-noor-navy shadow-md"
                    style={{ background: step.color }}
                  >
                    {step.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-noor-navy dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AD: Medium Rectangle — بین «چطور کار می‌کند» و نوار آنلاین‌ها */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-10"
        >
          <AdBanner slot="challenge-mid" size="rectangle" />
        </motion.div>

        {/* Online reciters — invite them to a session first, then challenge them.
            The marquee lets the user see who's online right now. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10"
        >
          <div className="mb-3 text-center">
            <NoorBadge variant="sky" icon={<Users className="h-3 w-3" />}>
              قاریان آماده رقابت
            </NoorBadge>
            <h2 className="mt-2 font-display text-2xl text-noor-navy dark:text-white">
              همین حالا دعوت کنید
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              قاریان آنلاین را به محفل خود دعوت کنید و سپس چالش رقابت را با آن‌ها آغاز کنید
            </p>
          </div>
          <OnlineUsersMarquee
            variant="full"
            duration={15}
            maxHeight="h-[460px]"
            showInviteAll
          />
        </motion.div>
      </div>
    </div>
  );
}
