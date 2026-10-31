"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Clock,
  Star,
  X,
  BookOpen,
  Hash,
  Music,
  Trophy,
  SkipForward,
} from "lucide-react";
import { NoorBadge } from "./noor-badge";
import { NoorAvatar } from "./noor-avatar";
import { useRecitationStore, formatDuration } from "@/store/recitation-store";
import { getMaqamById } from "@/lib/noorcraft/constants";
import type { RecitationEntry } from "@/lib/noorcraft/types";

interface RecitationHistoryProps {
  open: boolean;
  onClose: () => void;
}

export function RecitationHistory({ open, onClose }: RecitationHistoryProps) {
  const history = useRecitationStore((s) => s.history);
  const currentRound = useRecitationStore((s) => s.currentRound);
  const currentMaqam = useRecitationStore((s) => s.currentMaqam);
  const currentSurah = useRecitationStore((s) => s.currentSurah);

  // Group by round
  const rounds: Record<number, RecitationEntry[]> = {};
  history.forEach((h) => {
    if (!rounds[h.round]) rounds[h.round] = [];
    rounds[h.round].push(h);
  });

  const sortedRounds = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  // Stats
  const totalDuration = history.reduce((sum, h) => sum + h.durationSec, 0);
  const avgRating =
    history.filter((h) => h.rating).reduce((sum, h) => sum + (h.rating ?? 0), 0) /
    Math.max(1, history.filter((h) => h.rating).length);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-2xl font-bold">
                  <History className="h-6 w-6 text-noor-sky" />
                  تاریخچه منافسه
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {history.length.toLocaleString("fa-IR")} تلاوت در{" "}
                  {sortedRounds.length.toLocaleString("fa-IR")} دور
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-noor-sky/15 p-3 text-center">
                <Clock className="mx-auto mb-1 h-5 w-5 text-noor-sky" />
                <div className="font-display text-lg text-noor-navy dark:text-white">
                  {formatDuration(totalDuration)}
                </div>
                <div className="text-[10px] text-muted-foreground">زمان کل</div>
              </div>
              <div className="rounded-2xl bg-noor-yellow/15 p-3 text-center">
                <Star className="mx-auto mb-1 h-5 w-5 text-noor-yellow" />
                <div className="font-display text-lg text-noor-navy dark:text-white">
                  {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                </div>
                <div className="text-[10px] text-muted-foreground">میانگین امتیاز</div>
              </div>
              <div className="rounded-2xl bg-noor-green/15 p-3 text-center">
                <Trophy className="mx-auto mb-1 h-5 w-5 text-noor-green" />
                <div className="font-display text-lg text-noor-navy dark:text-white">
                  {currentRound.toLocaleString("fa-IR")}
                </div>
                <div className="text-[10px] text-muted-foreground">دور فعلی</div>
              </div>
            </div>

            {/* Current maqam + surah */}
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-muted/30 p-3 text-sm">
              <Music className="h-4 w-4 text-noor-sky" />
              <span className="text-muted-foreground">مقام فعلی:</span>
              <span className="font-bold">
                {getMaqamById(currentMaqam)?.name ?? "—"}
              </span>
              <span className="text-muted-foreground">•</span>
              <BookOpen className="h-4 w-4 text-noor-sky" />
              <span className="text-muted-foreground">سوره:</span>
              <span className="font-bold">{currentSurah}</span>
            </div>

            {/* History by round */}
            {sortedRounds.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                هنوز تلاوتی ثبت نشده است
              </div>
            ) : (
              <div className="space-y-4">
                {sortedRounds.map((round) => (
                  <div key={round}>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-noor-navy text-xs font-bold text-white">
                        {round.toLocaleString("fa-IR")}
                      </div>
                      <h4 className="text-sm font-bold">
                        دور {round.toLocaleString("fa-IR")}
                      </h4>
                      {round === currentRound && (
                        <NoorBadge variant="green">جاری</NoorBadge>
                      )}
                    </div>
                    <div className="space-y-2">
                      {rounds[round].map((entry, i) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`flex items-center gap-3 rounded-xl border p-3 ${
                            entry.passed
                              ? "border-muted/20 bg-muted/10 opacity-60"
                              : "border-muted/30 bg-card"
                          }`}
                        >
                          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                            {entry.orderInRound.toLocaleString("fa-IR")}
                          </div>
                          <NoorAvatar
                            name={entry.participantName}
                            color={entry.avatarColor}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold">
                              {entry.participantName}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                <BookOpen className="h-3 w-3" />
                                {entry.surah}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Hash className="h-3 w-3" />
                                {entry.startVerse === entry.endVerse
                                  ? `آیه ${entry.startVerse.toLocaleString("fa-IR")}`
                                  : `آیات ${entry.startVerse.toLocaleString("fa-IR")}-${entry.endVerse.toLocaleString("fa-IR")}`}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Music className="h-3 w-3" />
                                {getMaqamById(entry.maqam)?.name}
                              </span>
                            </div>
                          </div>
                          {entry.passed ? (
                            <NoorBadge variant="muted" icon={<SkipForward className="h-3 w-3" />}>
                              رد شد
                            </NoorBadge>
                          ) : (
                            <div className="flex items-center gap-2 text-xs">
                              {entry.rating && (
                                <span className="flex items-center gap-0.5 text-noor-yellow">
                                  <Star className="h-3 w-3 fill-current" />
                                  {entry.rating.toLocaleString("fa-IR")}
                                </span>
                              )}
                              <span className="flex items-center gap-0.5 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDuration(entry.durationSec)}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
