"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, X } from "lucide-react";
import { NoorButton } from "./noor-button";
import { useRecitationStore } from "@/store/recitation-store";
import { TAHMEED_PHRASES, type TahmeedPhrase } from "@/lib/noorcraft/constants";
import { useNoorStore } from "@/store/noor-store";
import { useToast } from "@/hooks/use-toast";

interface TahmeedButtonsProps {
  className?: string;
}

export function TahmeedButtons({ className }: TahmeedButtonsProps) {
  const [showAll, setShowAll] = useState(false);
  const user = useNoorStore((s) => s.user);
  const sendTahmeed = useRecitationStore((s) => s.sendTahmeed);
  const liveTahmeeds = useRecitationStore((s) => s.liveTahmeeds);
  const competitionStatus = useRecitationStore((s) => s.status);
  const { toast } = useToast();

  // Show top 6 phrases by default
  const topPhrases = TAHMEED_PHRASES.slice(0, 6);

  function handleSend(phrase: TahmeedPhrase) {
    sendTahmeed(
      phrase.id,
      phrase.text,
      user?.fullName ?? "کاربر",
      user?.avatarColor ?? "#87CEEB",
    );
    toast({
      title: `${phrase.text} ✨`,
      description: phrase.meaning,
      duration: 2000,
    });
  }

  if (competitionStatus !== "active") return null;

  return (
    <>
      <div className={`rounded-2xl bg-white/5 p-3 backdrop-blur-md ${className ?? ""}`}>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Volume2 className="h-3.5 w-3.5 text-noor-yellow" />
            تشویق قاری
            {liveTahmeeds.length > 0 && (
              <span className="rounded-full bg-noor-coral/20 px-2 py-0.5 text-[10px] text-noor-coral">
                {liveTahmeeds.length.toLocaleString("fa-IR")} تشویق
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAll(true)}
            className="text-[10px] font-bold text-noor-sky hover:underline"
          >
            همه عبارات
          </button>
        </div>

        {/* Quick phrases */}
        <div className="flex flex-wrap gap-1.5">
          {topPhrases.map((phrase) => (
            <motion.button
              key={phrase.id}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend(phrase)}
              className="group relative rounded-full border-2 px-3 py-1.5 text-xs font-bold transition"
              style={{
                borderColor: `${phrase.color}66`,
                background: `${phrase.color}15`,
                color: phrase.color,
              }}
              title={phrase.meaning}
            >
              {phrase.text}
            </motion.button>
          ))}
        </div>

        {/* Live tahmeed stream */}
        <AnimatePresence>
          {liveTahmeeds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 max-h-24 space-y-1 overflow-y-auto"
            >
              {liveTahmeeds.slice(-5).reverse().map((t) => {
                const phrase = TAHMEED_PHRASES.find((p) => p.id === t.phraseId);
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1 text-xs"
                  >
                    <span
                      className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold text-white"
                      style={{ background: t.senderAvatarColor }}
                    >
                      {t.senderName.charAt(0)}
                    </span>
                    <span className="text-muted-foreground">{t.senderName}</span>
                    <span
                      className="font-bold"
                      style={{ color: phrase?.color ?? "#FFD700" }}
                    >
                      {t.phraseText}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full phrases modal */}
      <AnimatePresence>
        {showAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAll(false)}
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">عبارات تشویق قرآنی</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    برای تشویق قاری، روی عبارت دلخواه کلیک کنید
                  </p>
                </div>
                <button
                  onClick={() => setShowAll(false)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {TAHMEED_PHRASES.map((phrase) => (
                  <motion.button
                    key={phrase.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      handleSend(phrase);
                      setShowAll(false);
                    }}
                    className="flex flex-col items-start gap-1 rounded-2xl border-2 p-3 text-right transition"
                    style={{
                      borderColor: `${phrase.color}44`,
                      background: `${phrase.color}10`,
                    }}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className="font-display text-lg"
                        style={{ color: phrase.color }}
                      >
                        {phrase.text}
                      </span>
                      <span
                        className="font-quran text-sm"
                        style={{ color: phrase.color }}
                      >
                        {phrase.textArabic}
                      </span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      {phrase.meaning}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
