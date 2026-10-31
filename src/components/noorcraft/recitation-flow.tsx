"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Mic2,
  Check,
  SkipForward,
  Pause,
  Play,
  Square,
  Clock,
  ArrowLeft,
  Crown,
  Star,
  BookOpen,
  Music,
  Hash,
  Trophy,
  Users,
  Sparkles,
} from "lucide-react";
import { NoorButton } from "./noor-button";
import { NoorBadge } from "./noor-badge";
import { NoorAvatar } from "./noor-avatar";
import { TahmeedButtons } from "./tahmeed-buttons";
import { RecitationRating } from "./recitation-rating";
import {
  useRecitationStore,
  getCurrentParticipant,
  getNextParticipants,
  formatDuration,
  formatVerseRange,
} from "@/store/recitation-store";
import { MAQAMAT, getMaqamById } from "@/lib/noorcraft/constants";
import { useToast } from "@/hooks/use-toast";

interface RecitationFlowProps {
  currentUserName: string;
}

export function RecitationFlow({ currentUserName }: RecitationFlowProps) {
  const { toast } = useToast();
  const [showRating, setShowRating] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const status = useRecitationStore((s) => s.status);
  const participants = useRecitationStore((s) => s.participants);
  const currentIndex = useRecitationStore((s) => s.currentIndex);
  const currentRound = useRecitationStore((s) => s.currentRound);
  const currentMaqam = useRecitationStore((s) => s.currentMaqam);
  const currentSurah = useRecitationStore((s) => s.currentSurah);
  const currentVerse = useRecitationStore((s) => s.currentVerse);
  const currentEntryStartedAt = useRecitationStore((s) => s.currentEntryStartedAt);
  const history = useRecitationStore((s) => s.history);
  const markRecited = useRecitationStore((s) => s.markRecited);
  const passTurn = useRecitationStore((s) => s.passTurn);
  const pauseCompetition = useRecitationStore((s) => s.pauseCompetition);
  const resumeCompetition = useRecitationStore((s) => s.resumeCompetition);
  const endCompetition = useRecitationStore((s) => s.endCompetition);
  const rateLastEntry = useRecitationStore((s) => s.rateLastEntry);

  const state = useRecitationStore();
  const current = getCurrentParticipant(state);
  const nextOnes = getNextParticipants(state, 3);
  const maqam = getMaqamById(currentMaqam);
  const selectedEndVerse = useRecitationStore((s) => s.selectedEndVerse);

  // Check if current user is the active reciter
  const isMyTurn = current?.name === currentUserName;

  // Elapsed time
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!currentEntryStartedAt || status !== "active") return;
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - currentEntryStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentEntryStartedAt, status, currentIndex]);

  function handleRecited() {
    // Anyone can press this to confirm the current reciter finished
    const reciterName = current?.name ?? "قاری";
    const endV = selectedEndVerse ?? currentVerse;
    const verseRange = formatVerseRange(currentVerse, endV);
    markRecited();
    setShowRating(true);
    setTimeout(() => setShowRating(false), 8000);
    toast({
      title: "تلاوت ثبت شد ✅",
      description: `${reciterName} ${verseRange} را تلاوت کرد. نوبت ${nextOnes[0]?.name ?? "بعدی"}.`,
    });
  }

  function handlePass() {
    passTurn();
    toast({
      title: "نوبت رد شد",
      description: `نوبت به ${nextOnes[0]?.name ?? "بعدی"} رسید.`,
    });
  }

  function handleEnd() {
    endCompetition();
    toast({
      title: "منافسه پایان یافت 🏆",
      description: `${history.length} تلاوت در ${currentRound} دور ثبت شد.`,
    });
  }

  // If competition hasn't started or ended
  if (status === "setup" || status === "ended") {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[#0b0a08] to-[#17150f] p-6 text-center text-white">
        <Trophy className="mx-auto mb-3 h-12 w-12 text-noor-yellow" />
        <h3 className="font-display text-xl">
          {status === "ended" ? "منافسه پایان یافت" : "منافسه آماده است"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {status === "ended"
            ? `${history.length} تلاوت در ${currentRound} دور ثبت شد`
            : "برای شروع رقابت، روی «شروع منافسه» بزنید"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Round + status bar */}
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/5 p-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <NoorBadge variant="yellow" icon={<Trophy className="h-3 w-3" />}>
            دور {currentRound.toLocaleString("fa-IR")}
          </NoorBadge>
          <span className="text-xs text-muted-foreground">
            {history.length.toLocaleString("fa-IR")} تلاوت ثبت شده
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {status === "active" ? (
            <button
              onClick={pauseCompetition}
              className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              title="توقف موقت"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={resumeCompetition}
              className="grid h-7 w-7 place-items-center rounded-full bg-noor-green/30 text-white transition hover:bg-noor-green/50"
              title="ادامه"
            >
              <Play className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={handleEnd}
            className="grid h-7 w-7 place-items-center rounded-full bg-noor-coral/30 text-white transition hover:bg-noor-coral/50"
            title="پایان منافسه"
          >
            <Square className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Current reciter card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentIndex}-${currentRound}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b0a08] to-[#17150f] p-5"
        >
          {/* Glow background */}
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-3xl"
            style={{ background: maqam?.color ?? "#FFD700" }}
          />

          <div className="relative">
            {/* Status indicator */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 rounded-full bg-noor-coral/20 px-3 py-1 text-xs font-bold text-noor-coral">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-noor-coral opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-noor-coral" />
                </span>
                در حال تلاوت
              </div>
              {isMyTurn && (
                <NoorBadge variant="green" icon={<Sparkles className="h-3 w-3" />}>
                  نوبت شماست!
                </NoorBadge>
              )}
            </div>

            {/* Reciter info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <NoorAvatar
                    name={current?.name ?? "؟"}
                    color={current?.avatarColor ?? "#87CEEB"}
                    avatarUrl={current?.avatarUrl}
                    size="xl"
                    ring="active"
                  />
                </motion.div>
                {/* Mic indicator */}
                <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-noor-yellow shadow-md">
                  <Mic className="h-3.5 w-3.5 text-white" />
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-display text-2xl text-white">
                  {current?.name ?? "—"}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {currentSurah}
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {selectedEndVerse !== null
                      ? `آیات ${currentVerse.toLocaleString("fa-IR")}-${selectedEndVerse.toLocaleString("fa-IR")}`
                      : `آیه ${currentVerse.toLocaleString("fa-IR")}`}
                  </span>
                </div>
                <div
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{
                    background: `${maqam?.color ?? "#FFD700"}33`,
                    color: maqam?.color ?? "#FFD700",
                  }}
                >
                  <Music className="h-3 w-3" />
                  مقام {maqam?.name ?? "—"}
                </div>
              </div>

              {/* Timer */}
              <div className="text-center">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  زمان
                </div>
                <div className="font-mono text-2xl font-bold text-noor-yellow">
                  {formatDuration(elapsed)}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <NoorButton
                variant="green"
                size="lg"
                onClick={handleRecited}
                disabled={status !== "active"}
                leftIcon={<Check className="h-5 w-5" />}
                className="animate-pulse-glow"
              >
                {selectedEndVerse !== null
                  ? `اجرا کردم (تا آیه ${selectedEndVerse.toLocaleString("fa-IR")})`
                  : "اجرا کردم"}
              </NoorButton>
              <NoorButton
                variant="ghost"
                size="lg"
                onClick={handlePass}
                disabled={status !== "active"}
                leftIcon={<SkipForward className="h-4 w-4" />}
                className="border-white/20 text-white hover:bg-noor-sky/20"
              >
                رد کردن نوبت
              </NoorButton>
            </div>

            <p className="mt-2 text-center text-xs text-muted-foreground">
              نوبت تلاوت <span className="font-bold text-white">{current?.name}</span> است —
              {selectedEndVerse !== null
                ? " آخرین آیه انتخاب شد. «اجرا کردم» را بزنید تا نفر بعدی ادامه دهد."
                : " روی آخرین آیه‌ای که خواندید کلیک کنید، سپس «اجرا کردم» را بزنید."}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Next up */}
      <div className="rounded-2xl bg-white/5 p-3 backdrop-blur-md">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          نفرات بعدی
        </div>
        <div className="flex items-center gap-2">
          {nextOnes.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2"
            >
              <NoorAvatar
                name={p.name}
                color={p.avatarColor}
                avatarUrl={p.avatarUrl}
                size="sm"
              />
              <div>
                <div className="text-xs font-bold text-white">{p.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {i === 0 ? "بعدی" : `${(i + 2).toLocaleString("fa-IR")}م`}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Rating prompt (shown after reciting) — opens modal */}
      <AnimatePresence>
        {showRating && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl bg-noor-yellow/15 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Star className="h-4 w-4 text-noor-yellow" />
                به تلاوت اخیر امتیاز بدهید
              </div>
              <button
                onClick={() => setShowRating(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                بستن
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => {
                    rateLastEntry(star);
                    setShowRating(false);
                    toast({
                      title: "امتیاز ثبت شد ⭐",
                      description: `${star.toLocaleString("fa-IR")} ستاره به تلاوت داده شد.`,
                    });
                  }}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white/50 text-noor-yellow transition hover:scale-110 hover:bg-white"
                >
                  <Star className="h-5 w-5 fill-current" />
                </button>
              ))}
              <button
                onClick={() => {
                  setShowRatingModal(true);
                  setShowRating(false);
                }}
                className="ml-auto rounded-full bg-noor-yellow px-3 py-2 text-xs font-bold text-noor-navy transition hover:brightness-105"
              >
                ارزیابی تخصصی
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed rating modal */}
      <RecitationRating
        open={showRatingModal}
        onClose={() => setShowRatingModal(false)}
      />

      {/* Quick history (last 3) */}
      {history.length > 0 && (
        <div className="rounded-2xl bg-white/5 p-3 backdrop-blur-md">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            آخرین تلاوت‌ها
          </div>
          <div className="space-y-1.5">
            {history.slice(-3).reverse().map((h) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-xs"
              >
                <NoorAvatar
                  name={h.participantName}
                  color={h.avatarColor}
                  size="sm"
                />
                <span className="flex-1 font-bold text-white">
                  {h.participantName}
                </span>
                <span className="text-muted-foreground">
                  {h.surah} • {formatVerseRange(h.startVerse, h.endVerse)}
                </span>
                {h.passed ? (
                  <NoorBadge variant="muted">رد شد</NoorBadge>
                ) : (
                  <>
                    {h.tahmeedCount && h.tahmeedCount > 0 && (
                      <span className="flex items-center gap-0.5 text-noor-coral">
                        <Sparkles className="h-3 w-3" />
                        {h.tahmeedCount.toLocaleString("fa-IR")}
                      </span>
                    )}
                    {h.rating && (
                      <span className="flex items-center gap-0.5 text-noor-yellow">
                        <Star className="h-3 w-3 fill-current" />
                        {h.rating.toLocaleString("fa-IR")}
                      </span>
                    )}
                    <span className="text-muted-foreground">{formatDuration(h.durationSec)}</span>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
