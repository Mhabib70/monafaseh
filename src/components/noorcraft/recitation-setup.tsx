"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Users,
  Music,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Shuffle,
  Check,
  X,
  Crown,
  Hash,
} from "lucide-react";
import { NoorButton } from "./noor-button";
import { NoorBadge } from "./noor-badge";
import { NoorAvatar } from "./noor-avatar";
import { useRecitationStore } from "@/store/recitation-store";
import { useNoorStore } from "@/store/noor-store";
import {
  MAQAMAT,
  SURAHS,
  getSurahVerseCount,
  type Maqam,
} from "@/lib/noorcraft/constants";
import type { CompetitionParticipant } from "@/lib/noorcraft/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Participants are built dynamically from:
//   1. The local logged-in user (always included)
//   2. Remote participants connected via WebRTC (synced in noor-store.sessionParticipants)
// No fake/demo participants are seeded.
function buildInitialParticipants(
  user: { id: string; fullName: string; avatarColor: string; avatarUrl: string | null } | null,
  remoteParticipants: CompetitionParticipant[],
): CompetitionParticipant[] {
  if (!user) return [];
  const local: CompetitionParticipant = {
    id: user.id,
    name: user.fullName,
    avatarColor: user.avatarColor,
    avatarUrl: user.avatarUrl,
    order: 0,
  };
  // De-duplicate remote participants by id; skip the local user's id.
  const seenIds = new Set<string>([user.id]);
  const remotes: CompetitionParticipant[] = [];
  for (const p of remoteParticipants) {
    if (p && p.id && !seenIds.has(p.id)) {
      seenIds.add(p.id);
      remotes.push(p);
    }
  }
  const all = [local, ...remotes].map((p, idx) => ({ ...p, order: idx }));
  return all;
}

interface RecitationSetupProps {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
}

export function RecitationSetup({ open, onClose, onStart }: RecitationSetupProps) {
  const { toast } = useToast();
  const startCompetition = useRecitationStore((s) => s.startCompetition);
  const user = useNoorStore((s) => s.user);
  const activeSession = useNoorStore((s) => s.activeSession);
  // Pull remote WebRTC participants from noor-store.
  const remoteParticipants = useNoorStore((s) => s.sessionParticipants);

  const [participants, setParticipants] = useState<CompetitionParticipant[]>(() =>
    buildInitialParticipants(user, remoteParticipants),
  );

  // When the modal opens, fetch participants from the server API (DB-based)
  // so we include everyone who joined the session — even before WebRTC connects.
  // Also merge with WebRTC-based remoteParticipants for real-time updates.
  useEffect(() => {
    if (!open || !activeSession) {
      if (open) {
        setParticipants(buildInitialParticipants(user, remoteParticipants));
      }
      return;
    }

    let cancelled = false;

    async function fetchApiParticipants() {
      try {
        const res = await fetch(
          `/api/sessions/${activeSession!.id}/participants`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (cancelled || !data.ok) return;

        // Merge API participants with WebRTC participants (dedup by id)
        const apiParts: CompetitionParticipant[] = (data.participants || []).map(
          (p: any, idx: number) => ({
            id: p.id,
            name: p.name,
            avatarColor: p.avatarColor,
            avatarUrl: p.avatarUrl,
            order: idx,
          }),
        );

        // Also include WebRTC participants that might not be in DB yet
        const seenIds = new Set(apiParts.map((p) => p.id));
        for (const p of remoteParticipants) {
          if (p.id && !seenIds.has(p.id)) {
            apiParts.push(p);
            seenIds.add(p.id);
          }
        }

        if (!cancelled) {
          setParticipants(
            apiParts.map((p, idx) => ({ ...p, order: idx })),
          );
        }
      } catch {
        // Fallback to WebRTC participants only
        if (!cancelled) {
          setParticipants(buildInitialParticipants(user, remoteParticipants));
        }
      }
    }

    fetchApiParticipants();
    // Poll every 3 seconds while modal is open to catch new joiners
    const interval = setInterval(fetchApiParticipants, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [open, activeSession, user, remoteParticipants]);

  const [selectedMaqam, setSelectedMaqam] = useState<string>("hijaz");
  const [selectedSurah, setSelectedSurah] = useState<string>("الرحمن");
  const [startVerse, setStartVerse] = useState<number>(1);

  const maxVerses = getSurahVerseCount(selectedSurah);

  function shuffleOrder() {
    const shuffled = [...participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const reordered = shuffled.map((p, i) => ({ ...p, order: i }));
    setParticipants(reordered);
    toast({
      title: "ترتیب تغییر کرد! 🎲",
      description: "ترتیب تلاوت‌گران به‌صورت تصادفی تنظیم شد.",
    });
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const newParts = [...participants];
    [newParts[index - 1], newParts[index]] = [newParts[index], newParts[index - 1]];
    setParticipants(newParts.map((p, i) => ({ ...p, order: i })));
  }

  function moveDown(index: number) {
    if (index === participants.length - 1) return;
    const newParts = [...participants];
    [newParts[index + 1], newParts[index]] = [newParts[index], newParts[index + 1]];
    setParticipants(newParts.map((p, i) => ({ ...p, order: i })));
  }

  function handleStart() {
    if (participants.length < 1) {
      toast({
        title: "حداقل یک نفر لازم است",
        description: "برای برگزاری منافسه حداقل به یک تلاوت‌گر نیاز دارید.",
      });
      return;
    }
    startCompetition({
      participants,
      maqam: selectedMaqam,
      surah: selectedSurah,
      startVerse,
    });
    toast({
      title: "منافسه شروع شد! 🎙️",
      description: `${participants.length} تلاوت‌گر، سوره ${selectedSurah} از آیه ${startVerse.toLocaleString("fa-IR")}`,
    });
    onStart();
  }

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
            <div className="mb-6 flex items-center justify-between">
              <div>
                <NoorBadge variant="green" icon={<Sparkles className="h-3 w-3" />}>
                  راه‌اندازی منافسه
                </NoorBadge>
                <h2 className="mt-2 text-2xl font-bold">شروع رقابت تلاوت</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  سوره و آیه شروع را انتخاب کنید
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Participants order */}
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm font-bold">
                  <Users className="h-4 w-4" />
                  ترتیب تلاوت‌گران ({participants.length} نفر)
                </Label>
                <NoorButton
                  variant="ghost"
                  size="sm"
                  onClick={shuffleOrder}
                  leftIcon={<Shuffle className="h-3.5 w-3.5" />}
                >
                  تصادفی
                </NoorButton>
              </div>
              <div className="space-y-2">
                {participants.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    className="flex items-center gap-3 rounded-2xl border-2 border-muted/30 bg-muted/20 p-3"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-noor-navy font-bold text-white">
                      {(i + 1).toLocaleString("fa-IR")}
                    </div>
                    <NoorAvatar
                      name={p.name}
                      color={p.avatarColor}
                      avatarUrl={p.avatarUrl}
                      size="sm"
                    />
                    <span className="flex-1 text-sm font-bold">{p.name}</span>
                    {i === 0 && (
                      <NoorBadge variant="yellow" icon={<Crown className="h-3 w-3" />}>
                        شروع‌کننده
                      </NoorBadge>
                    )}
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveUp(i)}
                        disabled={i === 0}
                        className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-muted-foreground transition hover:bg-noor-sky/20 disabled:opacity-30"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveDown(i)}
                        disabled={i === participants.length - 1}
                        className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-muted-foreground transition hover:bg-noor-sky/20 disabled:opacity-30"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Surah + verse */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5 text-sm font-bold">
                  <BookOpen className="h-4 w-4" />
                  سوره
                </Label>
                <Select value={selectedSurah} onValueChange={(v) => {
                  setSelectedSurah(v);
                  setStartVerse(1);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {SURAHS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5 text-sm font-bold">
                  <Hash className="h-4 w-4" />
                  آیه شروع (۱ تا {maxVerses.toLocaleString("fa-IR")})
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={maxVerses}
                  value={startVerse}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 1;
                    setStartVerse(Math.max(1, Math.min(maxVerses, v)));
                  }}
                />
              </div>
            </div>

            {/* Summary + start */}
            <div className="rounded-2xl bg-gradient-to-br from-noor-sky/10 to-noor-yellow/10 p-4">
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div>👥 {participants.length} تلاوت‌گر</div>
                <div>
                  📖 سوره{" "}
                  <span className="font-bold text-noor-navy dark:text-white">
                    {selectedSurah}
                  </span>{" "}
                  از آیه {startVerse.toLocaleString("fa-IR")}
                </div>
                <div>🔄 هر نفر یک آیه می‌خواند و نفر بعدی ادامه می‌دهد</div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <NoorButton
                variant="ghost"
                size="lg"
                className="flex-1"
                onClick={onClose}
              >
                انصراف
              </NoorButton>
              <NoorButton
                variant="yellow"
                size="lg"
                className="flex-1"
                onClick={handleStart}
                leftIcon={<Sparkles className="h-5 w-5" />}
              >
                شروع منافسه
              </NoorButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MaqamOption({
  maqam,
  selected,
  onClick,
}: {
  maqam: Maqam;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border-2 p-3 text-center transition ${
        selected
          ? "border-noor-green bg-noor-green/15"
          : "border-muted/30 hover:border-noor-sky/40"
      }`}
      style={selected ? { borderColor: maqam.color } : undefined}
    >
      <div
        className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full text-noor-navy"
        style={{ background: maqam.color }}
      >
        <Music className="h-5 w-5" />
      </div>
      <div className="text-sm font-bold">{maqam.name}</div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">{maqam.mood}</div>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-noor-green text-noor-navy"
        >
          <Check className="h-3 w-3" />
        </motion.div>
      )}
    </motion.button>
  );
}
