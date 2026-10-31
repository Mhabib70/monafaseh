"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Check, Award, Sparkles } from "lucide-react";
import { NoorButton } from "./noor-button";
import { useRecitationStore } from "@/store/recitation-store";
import { RATING_CRITERIA } from "@/lib/noorcraft/constants";
import { useToast } from "@/hooks/use-toast";

interface RecitationRatingProps {
  open: boolean;
  onClose: () => void;
}

export function RecitationRating({ open, onClose }: RecitationRatingProps) {
  const { toast } = useToast();
  const rateLastEntryDetailed = useRecitationStore((s) => s.rateLastEntryDetailed);
  const history = useRecitationStore((s) => s.history);

  const [ratings, setRatings] = useState<Record<string, number>>({});

  const lastEntry = history[history.length - 1];

  function setRating(criterionId: string, score: number) {
    setRatings((prev) => ({ ...prev, [criterionId]: score }));
  }

  function handleSubmit() {
    if (Object.keys(ratings).length === 0) {
      toast({
        title: "حداقل یک معیار را امتیاز دهید",
        description: "برای ثبت امتیاز، حداقل یک مورد را ارزیابی کنید.",
      });
      return;
    }
    rateLastEntryDetailed(ratings);
    toast({
      title: "امتیاز ثبت شد ⭐",
      description: `امتیاز شما برای ${lastEntry?.participantName ?? "قاری"} ثبت شد.`,
    });
    setRatings({});
    onClose();
  }

  function handleClose() {
    setRatings({});
    onClose();
  }

  // Calculate average
  const ratingValues = Object.values(ratings);
  const avgRating =
    ratingValues.length > 0
      ? ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length
      : 0;

  return (
    <AnimatePresence>
      {open && lastEntry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold">
                  <Award className="h-6 w-6 text-noor-yellow" />
                  ارزیابی تلاوت
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  تلاوت{" "}
                  <span className="font-bold">{lastEntry.participantName}</span>
                  {" — "}
                  {lastEntry.startVerse === lastEntry.endVerse
                    ? `آیه ${lastEntry.startVerse.toLocaleString("fa-IR")}`
                    : `آیات ${lastEntry.startVerse.toLocaleString("fa-IR")}-${lastEntry.endVerse.toLocaleString("fa-IR")}`}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Overall score display */}
            {ratingValues.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 rounded-2xl bg-gradient-to-br from-noor-yellow/20 to-noor-coral/10 p-4 text-center"
              >
                <div className="text-xs text-muted-foreground">میانگین امتیاز</div>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="font-display text-4xl text-noor-navy dark:text-white">
                    {avgRating.toFixed(1).toLocaleString("fa-IR")}
                  </span>
                  <span className="text-lg text-muted-foreground">/ ۵</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(avgRating)
                            ? "fill-noor-yellow text-noor-yellow"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Criteria */}
            <div className="space-y-3">
              {RATING_CRITERIA.map((criterion) => (
                <div
                  key={criterion.id}
                  className="rounded-2xl border-2 border-muted/30 bg-muted/20 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="grid h-8 w-8 place-items-center rounded-full text-white"
                        style={{ background: criterion.color }}
                      >
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{criterion.label}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {criterion.description}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const currentRating = ratings[criterion.id] ?? 0;
                      const isFilled = star <= currentRating;
                      return (
                        <motion.button
                          key={star}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setRating(criterion.id, star)}
                          className="grid h-8 w-8 place-items-center rounded-lg transition"
                        >
                          <Star
                            className={`h-5 w-5 transition ${
                              isFilled
                                ? "fill-current"
                                : "text-muted-foreground/30 hover:text-muted-foreground"
                            }`}
                            style={{
                              color: isFilled ? criterion.color : undefined,
                            }}
                          />
                        </motion.button>
                      );
                    })}
                    {ratings[criterion.id] !== undefined && (
                      <span
                        className="ml-2 text-xs font-bold"
                        style={{ color: criterion.color }}
                      >
                        {ratings[criterion.id].toLocaleString("fa-IR")} / ۵
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit */}
            <div className="mt-4 flex gap-2">
              <NoorButton
                variant="ghost"
                size="lg"
                className="flex-1"
                onClick={handleClose}
              >
                انصراف
              </NoorButton>
              <NoorButton
                variant="yellow"
                size="lg"
                className="flex-1"
                onClick={handleSubmit}
                leftIcon={<Check className="h-5 w-5" />}
              >
                ثبت امتیاز
              </NoorButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
