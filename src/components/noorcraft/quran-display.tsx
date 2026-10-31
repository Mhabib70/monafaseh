"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Mic,
  Check,
  MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecitationStore } from "@/store/recitation-store";

interface Verse {
  verse_key: string;
  text_uthmani: string;
  verse_number: number;
}

interface QuranDisplayProps {
  surah: string;
  currentVerse: number;
  className?: string;
}

// Map Persian surah names to chapter numbers
const SURAH_NAME_TO_NUMBER: Record<string, number> = {
  "الفاتحة": 1, "البقرة": 2, "آل عمران": 3, "النساء": 4, "المائدة": 5,
  "الأنعام": 6, "الأعراف": 7, "الأنفال": 8, "التوبة": 9, "يونس": 10,
  "هود": 11, "يوسف": 12, "الرعد": 13, "إبراهيم": 14, "الحجر": 15,
  "النحل": 16, "الإسراء": 17, "الكهف": 18, "مريم": 19, "طه": 20,
  "الأنبياء": 21, "الحج": 22, "المؤمنون": 23, "النور": 24, "الفرقان": 25,
  "الشعراء": 26, "النمل": 27, "القصص": 28, "العنكبوت": 29, "الروم": 30,
  "لقمان": 31, "السجدة": 32, "الأحزاب": 33, "سبأ": 34, "فاطر": 35,
  "يس": 36, "الصافات": 37, "ص": 38, "الزمر": 39, "غافر": 40,
  "فصلت": 41, "الشورى": 42, "الزخرف": 43, "الدخان": 44, "الجاثية": 45,
  "الأحقاف": 46, "محمد": 47, "الفتح": 48, "الحجرات": 49, "ق": 50,
  "الذاريات": 51, "الطور": 52, "النجم": 53, "القمر": 54, "الرحمن": 55,
  "الواقعة": 56, "الحديد": 57, "المجادلة": 58, "الحشر": 59, "الممتحنة": 60,
  "الصف": 61, "الجمعة": 62, "المنافقون": 63, "التغابن": 64, "الطلاق": 65,
  "التحريم": 66, "الملك": 67, "القلم": 68, "الحاقة": 69, "المعارج": 70,
  "نوح": 71, "الجن": 72, "المزمل": 73, "المدثر": 74, "القيامة": 75,
  "الإنسان": 76, "المرسلات": 77, "النبأ": 78, "النازعات": 79, "عبس": 80,
  "التكوير": 81, "الانفطار": 82, "المطففين": 83, "الانشقاق": 84, "البروج": 85,
  "الطارق": 86, "الأعلى": 87, "الغاشية": 88, "الفجر": 89, "البلد": 90,
  "الشمس": 91, "الليل": 92, "الضحى": 93, "الشرح": 94, "التين": 95,
  "العلق": 96, "القدر": 97, "البينة": 98, "الزلزلة": 99, "العاديات": 100,
  "القارعة": 101, "التكاثر": 102, "العصر": 103, "الهمزة": 104, "الفيل": 105,
  "قريش": 106, "الماعون": 107, "الكوثر": 108, "الكافرون": 109, "النصر": 110,
  "المسد": 111, "الإخلاص": 112, "الفلق": 113, "الناس": 114,
};

function getSurahNumber(surahName: string): number | null {
  if (SURAH_NAME_TO_NUMBER[surahName]) return SURAH_NAME_TO_NUMBER[surahName];
  const withoutAl = surahName.replace(/^ال/, "");
  if (SURAH_NAME_TO_NUMBER[withoutAl]) return SURAH_NAME_TO_NUMBER[withoutAl];
  const withAl = `ال${surahName}`;
  if (SURAH_NAME_TO_NUMBER[withAl]) return SURAH_NAME_TO_NUMBER[withAl];
  return null;
}

export function QuranDisplay({
  surah,
  currentVerse,
  className,
}: QuranDisplayProps) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const currentVerseRef = useRef<HTMLDivElement>(null);

  // Recitation store for verse selection
  const competitionStatus = useRecitationStore((s) => s.status);
  const selectedEndVerse = useRecitationStore((s) => s.selectedEndVerse);
  const selectEndVerse = useRecitationStore((s) => s.selectEndVerse);

  const surahNumber = getSurahNumber(surah);
  const canSelect = competitionStatus === "active";

  const fetchVerses = useCallback(async () => {
    if (!surahNumber) {
      setError(`سوره «${surah}» پیدا نشد`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surahNumber}`,
      );
      if (!res.ok) throw new Error("خطا در دریافت داده‌های قرآن");
      const data = await res.json();
      const fetchedVerses: Verse[] = (data.verses || []).map((v: any) => ({
        verse_key: v.verse_key,
        text_uthmani: v.text_uthmani,
        verse_number: parseInt(v.verse_key.split(":")[1]),
      }));
      setVerses(fetchedVerses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری قرآن");
    } finally {
      setLoading(false);
    }
  }, [surahNumber]);

  useEffect(() => {
    fetchVerses();
  }, [fetchVerses]);

  // Auto-scroll to current verse when it changes
  useEffect(() => {
    if (currentVerseRef.current) {
      currentVerseRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentVerse, verses]);

  // Determine verse state
  function getVerseState(verseNum: number): "active" | "selected" | "inRange" | "past" | "future" {
    if (verseNum < currentVerse) return "past";
    if (verseNum === currentVerse) return "active";
    if (selectedEndVerse !== null) {
      if (verseNum === selectedEndVerse) return "selected";
      if (verseNum > currentVerse && verseNum < selectedEndVerse) return "inRange";
    }
    return "future";
  }

  function handleVerseClick(verseNum: number) {
    if (!canSelect) return;
    if (verseNum < currentVerse) return; // Can't select past verses
    selectEndVerse(verseNum);
  }

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border-2 border-noor-yellow/30 bg-gradient-to-br from-[#08080a] to-[#131317] text-white",
        expanded ? "h-[80vh]" : "h-[50vh]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-noor-navy/15 bg-black/30 p-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-noor-yellow/20 text-noor-yellow">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg leading-tight">
              سوره {surah}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {verses.length > 0
                ? `${verses.length.toLocaleString("fa-IR")} آیه • شروع از آیه ${currentVerse.toLocaleString("fa-IR")}`
                : "در حال بارگذاری..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canSelect && (
            <div className="hidden items-center gap-1 rounded-full bg-noor-yellow/15 px-2.5 py-1 text-[10px] font-bold text-noor-yellow sm:flex">
              <MousePointerClick className="h-3 w-3" />
              برای انتخاب آخرین آیه، روی آیه کلیک کنید
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            title={expanded ? "کوچک‌نمایی" : "بزرگ‌نمایی"}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-noor-yellow" />
            <p className="text-sm">در حال بارگذاری قرآن...</p>
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 text-noor-coral" />
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchVerses}
              className="rounded-full bg-noor-yellow px-3 py-1 text-xs font-bold text-noor-navy"
            >
              تلاش مجدد
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Bismillah */}
            <div className="mb-4 text-center font-quran text-2xl text-muted-foreground">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </div>

            {/* Verses */}
            {verses.map((verse) => {
              const state = getVerseState(verse.verse_number);
              const isActive = state === "active";
              const isSelected = state === "selected";
              const inRange = state === "inRange";
              const isPast = state === "past";
              const isClickable = canSelect && verse.verse_number >= currentVerse;

              return (
                <motion.div
                  key={verse.verse_key}
                  ref={isActive ? currentVerseRef : undefined}
                  initial={false}
                  animate={{
                    backgroundColor:
                      isActive
                        ? "rgba(255, 215, 0, 0.18)"
                        : isSelected
                          ? "rgba(124, 252, 0, 0.20)"
                          : inRange
                            ? "rgba(255, 215, 0, 0.08)"
                            : "rgba(255, 255, 255, 0)",
                    scale: isActive || isSelected ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  onClick={() => isClickable && handleVerseClick(verse.verse_number)}
                  className={cn(
                    "relative flex items-start gap-2 rounded-xl p-3 transition-all",
                    (isActive || isSelected) && "ring-2",
                    isActive && "ring-noor-yellow/50",
                    isSelected && "ring-noor-green/60",
                    inRange && "ring-1 ring-noor-yellow/20",
                    isClickable && "cursor-pointer hover:bg-noor-navy/5 dark:hover:bg-white/5",
                  )}
                >
                  {/* Verse number badge */}
                  <div
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition",
                      isActive
                        ? "bg-noor-yellow text-noor-navy"
                        : isSelected
                          ? "bg-noor-green text-noor-navy"
                          : inRange
                            ? "bg-noor-yellow/30 text-noor-navy"
                            : "bg-white/15 text-white",
                    )}
                  >
                    {verse.verse_number.toLocaleString("fa-IR")}
                  </div>

                  {/* Verse text */}
                  <div
                    className={cn(
                      "flex-1 text-right leading-loose font-quran",
                      isActive
                        ? "text-2xl text-white"
                        : isSelected
                          ? "text-2xl text-white"
                          : "text-xl text-white",
                    )}
                    style={{ direction: "rtl" }}
                  >
                    {verse.text_uthmani}
                  </div>

                  {/* Active indicator (current reciter's start) */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -left-1 top-1/2 -translate-y-1/2"
                    >
                      <div className="flex items-center gap-0.5 rounded-full bg-noor-coral px-1.5 py-0.5">
                        <Mic className="h-3 w-3 text-white" />
                        <span className="text-[8px] font-bold text-white">شروع</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Selected end indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -left-1 top-1/2 -translate-y-1/2"
                    >
                      <div className="flex items-center gap-0.5 rounded-full bg-noor-green px-1.5 py-0.5">
                        <Check className="h-3 w-3 text-white" />
                        <span className="text-[8px] font-bold text-white">آخرین</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: verse range indicator */}
      {!loading && !error && verses.length > 0 && (
        <div className="border-t border-noor-navy/15 bg-black/30 p-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {selectedEndVerse !== null
                ? `آیات ${currentVerse.toLocaleString("fa-IR")} تا ${selectedEndVerse.toLocaleString("fa-IR")}`
                : `آیه ${currentVerse.toLocaleString("fa-IR")} از ${verses.length.toLocaleString("fa-IR")}`}
            </span>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-noor-yellow transition-all"
                  style={{
                    width: `${(currentVerse / verses.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
