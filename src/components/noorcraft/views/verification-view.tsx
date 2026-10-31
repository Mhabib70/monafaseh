"use client";

// ============================================================
// آزمون احراز قاری — ویزارد سه‌گامی
// گام ۱: شناخت شما (نام + اطلاعات پروفایل)
// گام ۲: تلاوت آزمونی (ضبط همین‌جا / آپلود فایل / لینک)
// گام ۳: مهارت‌ها + تعهد → ارسال برای داوری (حداکثر ۷۲ ساعت)
// سطح (برنزی/نقره‌ای/طلایی) را داور تعیین می‌کند.
// ============================================================

import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck, Clock, XCircle, Mic2, Send, Loader2, ArrowRight,
  Mic, Trash, Play, Pause, Paperclip, Link2, ChevronRight, ChevronLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNoorStore } from "@/store/noor-store";
import { NoorCard } from "../noor-card";
import { NoorButton } from "../noor-button";
import { VerifiedBadge } from "../verified-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RECITATION_SKILLS, QARI_RANKS, qariRankDef, normalizeRank } from "@/lib/noorcraft/constants";
import { TRUSTED_BY_TIER } from "@/lib/noorcraft/trusted-competitions";

type VerifyState = "none" | "pending" | "approved" | "rejected";

export function VerificationView() {
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const updateUser = useNoorStore((s) => s.updateUser);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<VerifyState>("none");
  const [note, setNote] = useState<string | null>(null);
  const [examAt, setExamAt] = useState<number | null>(null);
  const [currentRank, setCurrentRank] = useState<string | null>(null);
  const [retaking, setRetaking] = useState(false);

  // ویزارد
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [submitting, setSubmitting] = useState(false);

  // ── گام ۲: تلاوت آزمونی ──
  type Method = "record" | "upload" | "link";
  const [method, setMethod] = useState<Method>("record");
  const [auditionUrl, setAuditionUrl] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [uploading, setUploading] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [recBlob, setRecBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── گام ۳ ──
  const [skills, setSkills] = useState<string[]>([]);
  const [pledge, setPledge] = useState(false);
  const [selectedComp, setSelectedComp] = useState<string>("");
  const [compYear, setCompYear] = useState<string>(new Date().getFullYear().toLocaleString("fa-IR", { useGrouping: false }));

  useEffect(() => {
    fetch("/api/verify/request", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setState(d.status ?? "none");
          setNote(d.note ?? null);
          setExamAt(d.lastExam?.createdAt ?? null);
          setCurrentRank(normalizeRank(d.rank));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── ضبط ──
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      setRecording(true);
      setRecSeconds(0);
      timerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } catch {
      toast({
        title: "دسترسی به میکروفون داده نشد",
        description: "از تنظیمات مرورگر اجازه میکروفون را فعال کنید یا فایل/لینک بفرستید.",
        variant: "destructive",
      });
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }

  function finishRecording() {
    const seconds = recSeconds;
    stopRecording();
    recorderRef.current!.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      if (blob.size === 0) return;
      setRecBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setRecSeconds(seconds);
    };
  }

  function cancelRecording() {
    stopRecording();
    chunksRef.current = [];
  }

  function clearRecording() {
    setRecBlob(null);
    setPreviewUrl(null);
    setAuditionUrl(null);
    setRecSeconds(0);
  }

  function togglePreview() {
    if (!previewUrl) return;
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.play().catch(() => setPlaying(false));
    setPlaying(true);
  }

  async function uploadAudition(blob: Blob, filename: string) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", blob, filename);
      const res = await fetch("/api/verify/upload", { method: "POST", body: form });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      setAuditionUrl(d.url);
      toast({ title: "تلاوت آزمونی ثبت شد ✓" });
    } catch (e: unknown) {
      toast({
        title: "خطا در ثبت فایل",
        description: e instanceof Error ? e.message : "دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAudition(file, file.name);
  }

  function useLink() {
    const url = linkInput.trim();
    if (!/^https?:\/\/.+/.test(url)) {
      toast({
        title: "لینک نامعتبر است",
        description: "لینک باید با http یا https شروع شود (آپارات، ایتا، تلگرام...)",
        variant: "destructive",
      });
      return;
    }
    setAuditionUrl(url);
    toast({ title: "لینک تلاوت ثبت شد ✓" });
  }

  // ── ارسال آزمون ──
  async function submitExam() {
    if (!fullName.trim()) {
      toast({ title: "نام کامل الزامی است", variant: "destructive" });
      setStep(1);
      return;
    }
    if (!auditionUrl) {
      toast({
        title: "تلاوت آزمونی ثبت نشده",
        description: "در گام ۲ تلاوت خود را ضبط، آپلود یا با لینک ثبت کنید.",
        variant: "destructive",
      });
      setStep(2);
      return;
    }
    if (!pledge) {
      toast({ title: "پذیرش تعهد الزامی است", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/verify/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          auditionUrl,
          skills,
          pledge: true,
          competitionId: selectedComp,
          competitionYear: compYear,
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      setState("pending");
      setRetaking(false);
      setExamAt(Date.now());
      toast({
        title: "آزمون شما برای داوری ارسال شد 🎙",
        description: "نتیجه حداکثر تا ۷۲ ساعت اینجا اعلام می‌شود.",
      });
    } catch (e: unknown) {
      toast({
        title: "خطا در ارسال آزمون",
        description: e instanceof Error ? e.message : "دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-noor-yellow" />
      </div>
    );
  }

  const rankDef = qariRankDef(currentRank);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <button
        onClick={() => setView("dashboard")}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت به داشبورد
      </button>

      {/* راهنمای تیک‌های منافسه */}
      <NoorCard className="mb-5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BadgeCheck className="h-6 w-6 text-noor-yellow" />
          <h2 className="font-display text-lg font-bold">تیک‌های منافسه چگونه کار می‌کنند؟</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl p-3.5" style={{ background: "#1D9BF014", border: "1px solid #1D9BF044" }}>
            <VerifiedBadge size={26} rank="gold" />
            <div>
              <div className="text-sm font-bold" style={{ color: "#1D9BF0" }}>تیک آبی (سطح طلایی)</div>
              <div className="text-xs text-muted-foreground leading-6 mt-0.5">
                برای قاریانی که در مسابقات <b className="text-foreground">بین‌المللی</b> معتبر مقام آورده‌اند — بالاترین سطح، سقف قیمت جلسه ۵۰ امتیاز
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl p-3.5" style={{ background: "#7CFC0014", border: "1px solid #7CFC0044" }}>
            <VerifiedBadge size={26} rank="silver" />
            <div>
              <div className="text-sm font-bold" style={{ color: "#7CFC00" }}>تیک سبز (سطح نقره‌ای)</div>
              <div className="text-xs text-muted-foreground leading-6 mt-0.5">
                برای قاریانی که در مسابقات <b className="text-foreground">کشوری</b> مقام آورده‌اند — سقف قیمت جلسه ۲۵ امتیاز
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl p-3.5" style={{ background: "#FF7F7F14", border: "1px solid #FF7F7F44" }}>
            <VerifiedBadge size={26} rank="bronze" />
            <div>
              <div className="text-sm font-bold" style={{ color: "#FF7F7F" }}>تیک قرمز (سطح برنزی)</div>
              <div className="text-xs text-muted-foreground leading-6 mt-0.5">
                برای قاریانی که در مسابقات <b className="text-foreground">استانی</b> مقام آورده‌اند — سقف قیمت جلسه ۱۰ امتیاز
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 rounded-xl bg-muted/30 p-3 text-[11px] leading-6 text-muted-foreground">
          ℹ️ برای گرفتن هر تیک: از فهرست «مسابقات معتبر» مسابقه‌ای که مقام آورده‌اید را انتخاب،
          تلاوت آزمونی ضبط و تصویر گواهی را آپلود کنید. داوران بررسی می‌کنند و تیک رنگی به پروفایل شما اضافه می‌شود.
          اگر هنوز مسابقه نرفته‌اید، فعلاً «قاری تأییدشده» بمانید و بعداً برای ارتقا آزمون بدهید.
        </p>
      </NoorCard>

      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-noor-yellow/20">
          <Mic2 className="h-8 w-8 text-noor-yellow" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">آزمون احراز قاری</h1>
          <p className="text-sm text-muted-foreground">
            تلاوتت را بفرست؛ داور می‌شنود و سطحت را تعیین می‌کند:{" "}
            {QARI_RANKS.map((r) => (
              <span key={r.id} style={{ color: r.color, fontWeight: 700 }}>
                {r.label}{" "}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* ── وضعیت: در انتظار داوری ── */}
      {state === "pending" && !retaking && (
        <NoorCard className="p-8 text-center">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-noor-yellow/20">
            <Clock className="h-8 w-8 text-noor-yellow" />
          </div>
          <h2 className="font-display text-xl font-bold">در انتظار داوری</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            آزمون شما ثبت شد و داور در حال بررسی آن است.
            {examAt && (
              <span className="mt-1 block text-xs">
                ارسال: {new Date(examAt).toLocaleDateString("fa-IR", { month: "long", day: "numeric" })}
              </span>
            )}
            نتیجه حداکثر تا ۷۲ ساعت همین‌جا اعلام می‌شود.
          </p>
        </NoorCard>
      )}

      {/* ── وضعیت: تأییدشده ── */}
      {state === "approved" && !retaking && (
        <NoorCard className="p-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <VerifiedBadge size={40} rank={currentRank} />
            <h2 className="font-display text-xl font-bold">
              {rankDef ? "قاری با تیک " + (rankDef.id === "gold" ? "آبی" : rankDef.id === "silver" ? "سبز" : "قرمز") + " (سطح " + (rankDef.id === "gold" ? "طلایی" : rankDef.id === "silver" ? "نقره‌ای" : "برنزی") + ")" : "قاری تأییدشده"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            احراز شما کامل شده است. سقف قیمت جلسه خصوصی شما:{" "}
            <b>{(rankDef?.maxPrice ?? 5).toLocaleString("fa-IR")} امتیاز</b>
          </p>
          {note && (
            <p className="mt-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
              بازخورد داور: {note}
            </p>
          )}
          <NoorButton
            variant="yellow"
            className="mt-5"
            onClick={() => {
              setRetaking(true);
              setStep(1);
            }}
            leftIcon={<Mic className="h-4 w-4" />}
          >
            آزمون ارتقای سطح
          </NoorButton>
          <p className="mt-2 text-[11px] text-muted-foreground">
            (رنک فعلی شما تا اعلام نتیجه آزمون جدید حفظ می‌شود)
          </p>
        </NoorCard>
      )}

      {/* ── وضعیت: رد شده ── */}
      {state === "rejected" && (
        <NoorCard className="mb-5 border-noor-coral/40 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-noor-coral" />
            <div>
              <p className="text-sm font-bold">آزمون قبلی پذیرفته نشد</p>
              {note && <p className="mt-1 text-xs text-muted-foreground">دلیل: {note}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                می‌توانید دوباره تلاوت بفرستید — هر تلاوتی که آماده‌اش هستی.
              </p>
            </div>
          </div>
        </NoorCard>
      )}

      {/* ── ویزارد (none / rejected / retaking) ── */}
      {(state === "none" || state === "rejected" || retaking) && (
        <NoorCard className="p-6">
          {/* نوار پیشرفت */}
          <div className="mb-6 flex items-center gap-2">
            {[
              { n: 1, t: "شناخت شما" },
              { n: 2, t: "تلاوت آزمونی" },
              { n: 3, t: "مهارت و تعهد" },
            ].map((s, i) => (
              <div key={s.n} className="flex flex-1 items-center gap-2">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black transition ${
                    step >= s.n
                      ? "bg-noor-yellow text-noor-navy shadow-md"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.n.toLocaleString("fa-IR")}
                </span>
                <span
                  className={`hidden text-xs font-bold sm:block ${
                    step >= s.n ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.t}
                </span>
                {i < 2 && <div className={`h-0.5 flex-1 rounded ${step > s.n ? "bg-noor-yellow" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          {/* ── گام ۱ ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>نام و نام خانوادگی *</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1"
                  placeholder="نام کامل شما"
                />
              </div>
              <div className="grid gap-3 rounded-2xl bg-muted/30 p-4 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-[11px] text-muted-foreground">شهر</div>
                  <div className="mt-0.5 font-bold">{user?.city ?? "—"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">سبک تلاوت</div>
                  <div className="mt-0.5 font-bold">{user?.recitationType ?? "—"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">قاری الگو</div>
                  <div className="mt-0.5 truncate font-bold">{user?.favoriteReciter ?? "—"}</div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                این اطلاعات از پروفایل شما خوانده شده — برای تغییر، پروفایل را ویرایش کنید.
              </p>
              <div className="flex justify-end">
                <NoorButton variant="yellow" size="lg" onClick={() => setStep(2)} rightIcon={<ChevronLeft className="h-5 w-5" />}>
                  گام بعد
                </NoorButton>
              </div>
            </div>
          )}

          {/* ── گام ۲: تلاوت آزمونی ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">
                <b className="text-foreground">۱ تا ۳ دقیقه</b> از هر سوره‌ای که دوست داری تلاوت کن.
                روش ارسال را انتخاب کن:
              </p>

              <div className="grid grid-cols-3 gap-2">
                {([
                  ["record", "🎤 ضبط همین‌جا"],
                  ["upload", "📎 آپلود فایل"],
                  ["link", "🔗 لینک"],
                ] as [Method, string][]).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMethod(m); clearRecording(); setLinkInput(""); }}
                    className={`rounded-xl border-2 p-3 text-xs font-bold transition ${
                      method === m
                        ? "border-noor-yellow bg-noor-yellow/10"
                        : "border-muted/40 hover:border-noor-sky/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* روش: ضبط */}
              {method === "record" && (
                <div className="rounded-2xl bg-muted/30 p-4">
                  {!recBlob ? (
                    recording ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={cancelRecording}
                          className="grid h-10 w-10 place-items-center rounded-full bg-noor-coral/15 text-noor-coral"
                          title="لغو"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                        <span className="flex flex-1 items-center gap-2 font-bold text-noor-coral">
                          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-noor-coral" />
                          در حال ضبط — {Math.floor(recSeconds / 60)}:
                          {(recSeconds % 60).toString().padStart(2, "0")}
                        </span>
                        <NoorButton variant="green" size="md" onClick={finishRecording} disabled={recSeconds < 1}>
                          پایان ضبط
                        </NoorButton>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-3">
                        <NoorButton
                          variant="coral"
                          size="lg"
                          onClick={startRecording}
                          leftIcon={<Mic className="h-5 w-5" />}
                          className="animate-pulse-glow"
                        >
                          شروع ضبط تلاوت
                        </NoorButton>
                        <span className="text-[11px] text-muted-foreground">
                          تا ۳ دقیقه — با آرامش، مثل محفل
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-2">
                      <div className="flex w-full items-center gap-3">
                        <button
                          onClick={togglePreview}
                          className="grid h-11 w-11 place-items-center rounded-full bg-noor-yellow text-noor-navy shadow-md"
                          title={playing ? "توقف" : "پخش"}
                        >
                          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </button>
                        <div className="flex-1">
                          <div className="text-sm font-bold">
                            تلاوت ضبط‌شده ({recSeconds.toLocaleString("fa-IR")} ثانیه)
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            گوش کن؛ اگر راضی نیستی دوباره ضبط کن
                          </div>
                        </div>
                        <button
                          onClick={clearRecording}
                          className="rounded-full px-3 py-1.5 text-xs font-bold text-noor-coral transition hover:bg-noor-coral/10"
                        >
                          ضبط مجدد
                        </button>
                      </div>
                      {!auditionUrl ? (
                        <NoorButton
                          variant="green"
                          onClick={() => uploadAudition(recBlob, "audition.webm")}
                          disabled={uploading}
                          leftIcon={uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                        >
                          {uploading ? "در حال ثبت..." : "ثبت همین تلاوت"}
                        </NoorButton>
                      ) : (
                        <span className="rounded-full bg-noor-green/15 px-4 py-1.5 text-xs font-bold text-noor-green">
                          ✓ تلاوت آزمونی ثبت شد
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* روش: آپلود */}
              {method === "upload" && (
                <div className="rounded-2xl bg-muted/30 p-4 text-center">
                  <label className="mx-auto flex w-full max-w-xs cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-muted-foreground/30 p-6 transition hover:border-noor-yellow/50">
                    <Paperclip className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-bold">انتخاب فایل صوتی/ویدیویی</span>
                    <span className="text-[11px] text-muted-foreground">حداکثر ۲۰ مگابایت (mp3, m4a, wav, mp4...)</span>
                    <input type="file" accept="audio/*,video/*" className="hidden" onChange={onPickFile} />
                  </label>
                  {uploading && <Loader2 className="mx-auto mt-3 h-5 w-5 animate-spin text-noor-yellow" />}
                  {auditionUrl && method === "upload" && (
                    <span className="mt-3 inline-block rounded-full bg-noor-green/15 px-4 py-1.5 text-xs font-bold text-noor-green">
                      ✓ فایل ثبت شد
                    </span>
                  )}
                </div>
              )}

              {/* روش: لینک */}
              {method === "link" && (
                <div className="rounded-2xl bg-muted/30 p-4">
                  <Label>لینک تلاوت (آپارات، ایتا، تلگرام...)</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      dir="ltr"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      placeholder="https://..."
                    />
                    <NoorButton variant="sky" onClick={useLink} leftIcon={<Link2 className="h-4 w-4" />}>
                      ثبت لینک
                    </NoorButton>
                  </div>
                  {auditionUrl && method === "link" && (
                    <span className="mt-3 inline-block rounded-full bg-noor-green/15 px-4 py-1.5 text-xs font-bold text-noor-green">
                      ✓ لینک ثبت شد
                    </span>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                <NoorButton variant="ghost" size="lg" onClick={() => setStep(1)} leftIcon={<ChevronRight className="h-5 w-5" />}>
                  گام قبل
                </NoorButton>
                <NoorButton
                  variant="yellow"
                  size="lg"
                  onClick={() => setStep(3)}
                  disabled={!auditionUrl}
                  rightIcon={<ChevronLeft className="h-5 w-5" />}
                >
                  {auditionUrl ? "گام بعد" : "ابتدا تلاوت را ثبت کنید"}
                </NoorButton>
              </div>
            </div>
          )}

          {/* ── گام ۳: مدرک رسمی ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-noor-yellow/10 p-4 border border-noor-yellow/25">
                <div className="font-bold text-sm mb-1">🏅 مسابقه رسمی شما کدام است؟</div>
                <p className="text-xs text-muted-foreground leading-6">
                  از فهرست مسابقات معتبر جمهوری اسلامی، مسابقه‌ای را که در آن مقام آورده‌اید
                  (رتبه اول تا سوم) انتخاب کنید — تصویر گواهی رسمی آن را هم در گام بعد آپلود کنید.
                </p>
              </div>

              <div>
                <Label>انتخاب مسابقه *</Label>
                <div className="mt-2 space-y-3 max-h-72 overflow-y-auto pr-1">
                  {TRUSTED_BY_TIER.map(({ tier, items }) => (
                    <div key={tier}>
                      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ background: tier === "gold" ? "#1D9BF0" : tier === "silver" ? "#7CFC00" : "#FF7F7F" }}
                        />
                        {tier === "gold" ? "🔵 تیک آبی — مسابقات بین‌المللی" : tier === "silver" ? "🟢 تیک سبز — مسابقات کشوری" : "🔴 تیک قرمز — مسابقات استانی"}
                      </div>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {items.map((c) => {
                          const on = selectedComp === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setSelectedComp(c.id)}
                              className={`text-right rounded-xl border-2 px-3 py-2 transition ${
                                on ? "border-noor-green bg-noor-green/10" : "border-muted/40 hover:border-noor-sky/40"
                              }`}
                            >
                              <div className="text-xs font-bold leading-5">{c.name}</div>
                              <div className="text-[10px] text-muted-foreground">{c.organizer}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>سال کسب مقام</Label>
                <Input
                  dir="ltr"
                  value={compYear}
                  onChange={(e) => setCompYear(e.target.value)}
                  className="mt-1 max-w-40"
                  placeholder="مثال: ۱۴۰۳"
                />
              </div>

              <div>
                <Label>مهارت‌های شما (اختیاری — راهنمای داور)</Label>
                <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                  {RECITATION_SKILLS.slice(0, 12).map((sk) => {
                    const on = skills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() =>
                          setSkills((cur) => (on ? cur.filter((x) => x !== sk) : [...cur, sk]))
                        }
                        className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition ${
                          on
                            ? "border-noor-green bg-noor-green/15 text-green-700 dark:text-lime-300"
                            : "border-muted-foreground/20 hover:border-noor-sky"
                        }`}
                      >
                        {on ? "✓ " : ""}{sk}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPledge(!pledge)}
                className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-right transition ${
                  pledge ? "border-noor-green bg-noor-green/10" : "border-muted/40 hover:border-noor-sky/40"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 font-black ${
                    pledge ? "border-noor-green bg-noor-green text-noor-navy" : "border-muted-foreground/30"
                  }`}
                >
                  {pledge ? "✓" : ""}
                </span>
                <span className="text-sm leading-7">
                  تعهد می‌دهم تلاوت ارسالی اجرای خودم است، مقام اعلام‌شده در مسابقه منتخب واقعی است
                  و تصویر گواهی آن را در گام بعد آپلود خواهم کرد. *
                </span>
              </button>

              <div className="flex justify-between">
                <NoorButton variant="ghost" size="lg" onClick={() => setStep(2)} leftIcon={<ChevronRight className="h-5 w-5" />}>
                  گام قبل
                </NoorButton>
                <NoorButton
                  variant="yellow"
                  size="lg"
                  onClick={() => {
                    if (!selectedComp) {
                      toast({ title: "مسابقه انتخاب نشده", description: "از فهرست مسابقات معتبر، مسابقه خود را انتخاب کنید.", variant: "destructive" });
                      return;
                    }
                    setStep(4);
                  }}
                  disabled={!selectedComp || !pledge}
                  rightIcon={<ChevronLeft className="h-5 w-5" />}
                >
                  گام بعد
                </NoorButton>
              </div>
            </div>
          )}

          {/* ── گام ۴: آپلود گواهی رسمی + ارسال ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-muted/30 p-4 space-y-3">
                <div>
                  <div className="text-[11px] text-muted-foreground">مسابقه معتبر انتخابی</div>
                  <div className="text-sm font-bold">
                    {(() => {
                      const all = TRUSTED_BY_TIER.flatMap((t) => t.items);
                      const c = all.find((x) => x.id === selectedComp);
                      return c ? c.name : selectedComp;
                    })()}
                    {compYear && ` — سال ${compYear}`}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">تلاوت آزمونی</div>
                  <div className="text-xs mt-0.5">✓ ثبت شده</div>
                </div>
              </div>

              {/* آپلود تصویر گواهی */}
              <div className="rounded-2xl bg-muted/30 p-4 text-center">
                <Label className="block mb-2">تصویر گواهی رسمی مقام *</Label>
                <label className="mx-auto flex w-full max-w-xs cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-muted-foreground/30 p-6 transition hover:border-noor-yellow/50">
                  <Paperclip className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-bold">انتخاب تصویر گواهی</span>
                  <span className="text-[11px] text-muted-foreground">jpg, png — حداکثر ۱۰ مگابایت</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadAudition(file, file.name);
                      toast({ title: "تصویر گواهی ثبت شد ✓" });
                    }}
                  />
                </label>
                {uploading && <Loader2 className="mx-auto mt-3 h-5 w-5 animate-spin text-noor-yellow" />}
              </div>

              <div className="flex justify-between">
                <NoorButton variant="ghost" size="lg" onClick={() => setStep(3)} leftIcon={<ChevronRight className="h-5 w-5" />}>
                  گام قبل
                </NoorButton>
                <NoorButton
                  variant="yellow"
                  size="lg"
                  onClick={submitExam}
                  disabled={submitting || !pledge || !auditionUrl}
                  leftIcon={submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  className={pledge ? "animate-pulse-glow" : ""}
                >
                  {submitting ? "در حال ارسال..." : "ارسال برای داوری"}
                </NoorButton>
              </div>
              <p className="text-center text-[11px] text-muted-foreground">
                نتیجه داوری حداکثر تا ۷۲ ساعت در همین صفحه اعلام می‌شود
              </p>
            </div>
          )}
        </NoorCard>
      )}
    </div>
  );
}
