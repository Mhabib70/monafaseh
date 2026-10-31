"use client";

// ============================================================
// LoungeRoomView — اتاق تالار گفتگو (سبک تلگرام)
// حباب‌های دوطرفه، جداکننده تاریخ، پیام سنجاق‌شده، پیام صوتی،
// ابزار مدیریت (سنجاق/حذف/سکوت) و گیت جداسازی جنسیتی
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  UserPlus,
  Users,
  Wifi,
  X,
  Play,
  Pause,
  MessageCircle,
  Loader2,
  Power,
  Pin,
  Trash2,
  MicOff,
  Mic,
  Trash,
  ChevronDown,
} from "lucide-react";
import { NoorButton } from "../noor-button";
import { NoorCard } from "../noor-card";
import { NoorAvatar } from "../noor-avatar";
import { BackButton } from "../back-button";
import { useNoorStore } from "@/store/noor-store";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarColor: string;
  senderAvatarUrl: string | null;
  text: string;
  timestamp: number;
  type: string;
  voiceDuration?: number | null;
  imageUrl?: string | null;
  inviteSessionId?: string | null;
  inviteSessionTitle?: string | null;
}

interface LoungeInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  memberCount: number;
  onlineCount: number;
  isPrivate: boolean;
  genderRestriction?: string;
  creatorId?: string | null;
  isActive?: boolean;
}

interface PinnedMessage {
  id: string;
  text: string;
  senderName: string;
}

const MAX_VOICE_SEC = 180;

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "امروز";
  if (same(d, yesterday)) return "دیروز";
  return d.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
}

function timeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
}

// ارتفاع نموداری میله‌های ویس — پایدار برای هر پیام
function barHeight(id: string, i: number): number {
  let h = 0;
  const key = id + ":" + i;
  for (let j = 0; j < key.length; j++) h = (h * 31 + key.charCodeAt(j)) >>> 0;
  return 30 + (h % 70);
}

export function LoungeRoomView() {
  const setView = useNoorStore((s) => s.setView);
  const user = useNoorStore((s) => s.user);
  const { toast } = useToast();

  const loungeId =
    typeof window !== "undefined"
      ? localStorage.getItem("currentLoungeId") || ""
      : "";

  const [lounge, setLounge] = useState<LoungeInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinned, setPinned] = useState<PinnedMessage | null>(null);
  const [genderRestriction, setGenderRestriction] = useState<string>("all");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [mutedList, setMutedList] = useState<{ userId: string; fullName: string }[] | null>(null);
  const [endingLounge, setEndingLounge] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── پیام صوتی ──
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isModerator =
    !!user && !!lounge && (lounge.creatorId === user.id || user.role === "admin");

  async function endLounge() {
    if (!loungeId || !lounge) return;
    const confirm = window.confirm(
      `آیا از پایان دادن تالار «${lounge.name}» مطمئن هستید؟ این تالار بسته شده و از لیست تالارها خارج می‌شود.`,
    );
    if (!confirm) return;
    setEndingLounge(true);
    try {
      const res = await fetch(`/api/lounges/${loungeId}/end`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast({ title: "تالار پایان یافت ✓" });
        setView("lounge");
      } else {
        throw new Error(data.error);
      }
    } catch (err: unknown) {
      toast({
        title: "خطا در پایان دادن",
        description: err instanceof Error ? err.message : "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setEndingLounge(false);
    }
  }

  const fetchLoungeData = useCallback(async () => {
    if (!loungeId) return;
    try {
      const res = await fetch(`/api/lounges/${loungeId}/messages`, { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages || []);
        setPinned(data.pinned || null);
        setGenderRestriction(data.genderRestriction || "all");
        if (data.loungeInfo) setLounge(data.loungeInfo);
        setBlocked(null);
      } else if (res.status === 403) {
        setBlocked(data.error || "دسترسی به این تالار ندارید");
      }
    } catch (err) {
      console.error("Lounge data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [loungeId]);

  useEffect(() => {
    fetchLoungeData();
    const interval = setInterval(fetchLoungeData, 5000);
    return () => clearInterval(interval);
  }, [fetchLoungeData]);

  // علامت‌گذاری «دیده‌شده» برای شمارنده ناخوانده کارت‌ها
  useEffect(() => {
    if (!loungeId) return;
    try {
      const map = JSON.parse(localStorage.getItem("lounge-lastSeen") ?? "{}");
      map[loungeId] = Date.now();
      localStorage.setItem("lounge-lastSeen", JSON.stringify(map));
    } catch {}
  }, [loungeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── ارسال پیام متنی ──
  async function sendMessage() {
    if (!input.trim() || !user || !loungeId) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`/api/lounges/${loungeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type: "text" }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchLoungeData();
      } else {
        throw new Error(data.error);
      }
    } catch (err: unknown) {
      toast({
        title: "خطا در ارسال پیام",
        description: err instanceof Error ? err.message : "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  // ── ضبط پیام صوتی ──
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
        description: "از تنظیمات مرورگر اجازه دسترسی به میکروفون را فعال کنید.",
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

  async function sendVoice() {
    const seconds = recSeconds;
    stopRecording();
    if (seconds < 1) return;

    recorderRef.current!.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      if (blob.size === 0) return;
      setUploadingVoice(true);
      try {
        const form = new FormData();
        form.append("audio", blob, "voice.webm");
        const up = await fetch(`/api/lounges/${loungeId}/voice`, {
          method: "POST",
          body: form,
        });
        const ud = await up.json();
        if (!ud.ok) throw new Error(ud.error);
        const res = await fetch(`/api/lounges/${loungeId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `${seconds} ثانیه`,
            type: "voice",
            voiceDuration: seconds,
            imageUrl: ud.url,
          }),
        });
        const md = await res.json();
        if (!md.ok) throw new Error(md.error);
        await fetchLoungeData();
      } catch (err: unknown) {
        toast({
          title: "خطا در ارسال پیام صوتی",
          description: err instanceof Error ? err.message : "لطفاً دوباره تلاش کنید",
          variant: "destructive",
        });
      } finally {
        setUploadingVoice(false);
      }
    };
    // اگر recorder هنوز در حال توقف است، onstop بالا اجرا می‌شود
    if (recorderRef.current?.state === "inactive") {
      recorderRef.current?.dispatchEvent(new Event("stop"));
    }
  }

  function cancelRecording() {
    stopRecording();
    chunksRef.current = [];
  }

  // ── پخش پیام صوتی ──
  function togglePlay(msg: ChatMessage) {
    if (!msg.imageUrl) return;
    if (playingId === msg.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(msg.imageUrl!);
    audioRef.current = audio;
    setPlayingId(msg.id);
    setPlayProgress(0);
    audio.ontimeupdate = () => {
      if (audio.duration) setPlayProgress(audio.currentTime / audio.duration);
    };
    audio.onended = () => {
      setPlayingId(null);
      setPlayProgress(0);
    };
    audio.play().catch(() => setPlayingId(null));
  }

  // ── مدیریت ──
  async function moderate(action: string, payload: Record<string, unknown> = {}) {
    try {
      const res = await fetch(`/api/lounges/${loungeId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      await fetchLoungeData();
      return true;
    } catch (err: unknown) {
      toast({
        title: "خطا در عملیات مدیریت",
        description: err instanceof Error ? err.message : "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
      return false;
    }
  }

  async function openMutedList() {
    try {
      const res = await fetch(`/api/lounges/${loungeId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listMuted" }),
      });
      const d = await res.json();
      setMutedList(d.muted ?? []);
      setShowMembers(true);
    } catch {
      setMutedList([]);
      setShowMembers(true);
    }
  }

  async function sendInvite() {
    if (!user || !loungeId) return;
    const activeSession = useNoorStore.getState().activeSession;
    if (!activeSession) {
      toast({
        title: "محفلی فعال نیست",
        description: "ابتدا یک محفل تشکیل دهید یا به محفلی بپیوندید، سپس دعوت بفرستید.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch(`/api/lounges/${loungeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `دعوت به محفل: ${activeSession.title}`,
          type: "invite",
          inviteSessionId: activeSession.id,
          inviteSessionTitle: activeSession.title,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchLoungeData();
        toast({
          title: "دعوتنامه ارسال شد 📨",
          description: `دعوت به محفل «${activeSession.title}» در تالار ثبت شد.`,
        });
      }
    } catch {
      toast({ title: "خطا در ارسال دعوت", variant: "destructive" });
    }
  }

  // ── حالت‌های ویژه ──
  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-noor-yellow" />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-noor-hero px-4">
        <NoorCard className="max-w-md p-8 text-center noor-card-coral">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-noor-coral/15 text-3xl">
            🔒
          </div>
          <h2 className="text-xl font-bold">دسترسی به این تالار ندارید</h2>
          <p className="mt-2 text-sm text-muted-foreground">{blocked}</p>
          <NoorButton variant="yellow" className="mt-5" onClick={() => setView("lounge")}>
            بازگشت به تالارها
          </NoorButton>
        </NoorCard>
      </div>
    );
  }

  if (!lounge) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <p className="text-muted-foreground">تالاری پیدا نشد.</p>
          <NoorButton variant="yellow" className="mt-4" onClick={() => setView("lounge")}>
            بازگشت به تالارها
          </NoorButton>
        </div>
      </div>
    );
  }

  // ── بدنه اصلی ──
  return (
    <div className="flex h-[calc(100vh-4rem-64px)] flex-col bg-noor-hero">
      <div className="mx-auto flex w-full max-w-4xl min-h-0 flex-1 flex-col px-2 sm:px-4">
        <div className="mt-2">
          <BackButton to="lounge" label="بازگشت به تالارها" />
        </div>

        {/* هدر — سبک تلگرام */}
        <div className="glass-panel mb-2 flex items-center justify-between gap-2 rounded-2xl px-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-noor-navy shadow-md"
              style={{ background: lounge.color }}
            >
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-noor-navy dark:text-white">
                {lounge.name}
              </h1>
              <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {lounge.memberCount.toLocaleString("fa-IR")}
                </span>
                <span className="flex items-center gap-1 text-noor-green">
                  <Wifi className="h-3 w-3" />
                  {lounge.onlineCount.toLocaleString("fa-IR")} آنلاین
                </span>
                {genderRestriction !== "all" && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold">
                    {genderRestriction === "male" ? "ویژه آقایان" : "ویژه بانوان"}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isModerator && (
              <button
                onClick={openMutedList}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
                title="کاربران سکوت‌شده"
              >
                <MicOff className="h-4 w-4" />
              </button>
            )}
            {lounge.creatorId && user && lounge.creatorId === user.id && (
              <button
                onClick={endLounge}
                disabled={endingLounge}
                className="grid h-8 w-8 place-items-center rounded-full text-noor-coral transition hover:bg-noor-coral/15 disabled:opacity-50"
                title="پایان دادن تالار — فقط ایجادکننده"
              >
                {endingLounge ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* نوار پیام سنجاق‌شده */}
        <AnimatePresence>
          {pinned && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-panel mb-2 flex items-center gap-2 rounded-xl px-3 py-1.5">
                <Pin className="h-3.5 w-3.5 shrink-0 text-noor-yellow" />
                <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                  <span className="font-bold text-foreground">{pinned.senderName}: </span>
                  {pinned.text}
                </p>
                {isModerator && (
                  <button
                    onClick={() => moderate("unpin")}
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-noor-coral/15 hover:text-noor-coral"
                    title="برداشتن سنجاق"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ناحیه پیام‌ها */}
        <div
          ref={listRef}
          className="glass-panel min-h-0 flex-1 space-y-1.5 overflow-y-auto rounded-2xl p-3"
        >
          {messages.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              <div>
                <div className="mb-2 text-4xl">💬</div>
                <p>هنوز پیامی ارسال نشده است</p>
                <p className="mt-1 text-xs">اولین پیام را شما ارسال کنید!</p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const prev = idx > 0 ? messages[idx - 1] : null;
              const showDate =
                !prev || dayLabel(prev.timestamp) !== dayLabel(msg.timestamp);
              const isMine = msg.senderId === user?.id;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="my-3 flex justify-center">
                      <span className="rounded-full bg-muted/70 px-3 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {dayLabel(msg.timestamp)}
                      </span>
                    </div>
                  )}

                  {msg.type === "system" ? (
                    <div className="flex justify-center py-1">
                      <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
                        {msg.text}
                      </span>
                    </div>
                  ) : msg.type === "invite" ? (
                    <InviteRow
                      msg={msg}
                      isMine={isMine}
                      onJoin={() => {
                        toast({
                          title: "در حال اتصال به محفل... 📹",
                          description: msg.inviteSessionTitle,
                        });
                        setView("sessions");
                      }}
                    />
                  ) : (
                    <MessageRow
                      msg={msg}
                      isMine={isMine}
                      isModerator={isModerator}
                      menuOpen={menuFor === msg.id}
                      onToggleMenu={() => setMenuFor(menuFor === msg.id ? null : msg.id)}
                      onCloseMenu={() => setMenuFor(null)}
                      playing={playingId === msg.id}
                      playProgress={playProgress}
                      onTogglePlay={() => togglePlay(msg)}
                      onModerate={async (action) => {
                        setMenuFor(null);
                        if (action === "mute" && msg.senderId) {
                          await moderate("mute", { userId: msg.senderId });
                        } else {
                          await moderate(action, { messageId: msg.id });
                        }
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* نوار ورودی — سبک تلگرام */}
        <div className="glass-panel my-2 rounded-2xl p-2">
          {recording ? (
            <div className="flex items-center gap-3 px-2 py-1">
              <button
                onClick={cancelRecording}
                className="grid h-9 w-9 place-items-center rounded-full bg-noor-coral/15 text-noor-coral transition hover:bg-noor-coral/25"
                title="لغو"
              >
                <Trash className="h-4 w-4" />
              </button>
              <span className="flex flex-1 items-center gap-2 text-sm font-bold text-noor-coral">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-noor-coral" />
                {Math.floor(recSeconds / 60)}:
                {(recSeconds % 60).toString().padStart(2, "0")}
              </span>
              <NoorButton
                variant="green"
                size="md"
                onClick={sendVoice}
                disabled={uploadingVoice}
                leftIcon={
                  uploadingVoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />
                }
              >
                {uploadingVoice ? "..." : "ارسال"}
              </NoorButton>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={startRecording}
                disabled={uploadingVoice || sending}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition hover:bg-noor-green/20 hover:text-noor-green disabled:opacity-50"
                title="ضبط پیام صوتی"
              >
                <Mic className="h-5 w-5" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !sending) sendMessage();
                }}
                placeholder="پیام خود را بنویسید..."
                disabled={sending}
                className="h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm focus:border-noor-sky focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-noor-yellow text-noor-navy shadow-md transition hover:brightness-105 disabled:opacity-40"
                title="ارسال"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* کشوی اعضا / سکوت‌شدگان */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowMembers(false);
              setMutedList(null);
            }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel fixed inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-bold">
                  {mutedList ? (
                    <>
                      <MicOff className="h-4 w-4 text-noor-coral" />
                      کاربران سکوت‌شده
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 text-noor-sky" />
                      اطلاعات تالار
                    </>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setShowMembers(false);
                    setMutedList(null);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-full bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {mutedList ? (
                <div className="space-y-2">
                  {mutedList.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground">
                      هیچ کاربری سکوت نشده است
                    </p>
                  ) : (
                    mutedList.map((m) => (
                      <div
                        key={m.userId}
                        className="flex items-center justify-between rounded-xl bg-muted/40 p-2.5"
                      >
                        <span className="text-sm font-bold">{m.fullName}</span>
                        <NoorButton
                          variant="green"
                          size="sm"
                          onClick={async () => {
                            await moderate("unmute", { userId: m.userId });
                            setMutedList((list) =>
                              (list ?? []).filter((x) => x.userId !== m.userId),
                            );
                          }}
                        >
                          رفع سکوت
                        </NoorButton>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <p className="rounded-xl bg-muted/40 p-3 text-xs leading-6 text-muted-foreground">
                    {lounge.description}
                  </p>
                  <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                    <span className="flex items-center gap-2 text-xs">
                      <Users className="h-3.5 w-3.5" /> اعضا
                    </span>
                    <span className="font-bold">{lounge.memberCount.toLocaleString("fa-IR")}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                    <span className="flex items-center gap-2 text-xs">
                      <Wifi className="h-3.5 w-3.5" /> آنلاین
                    </span>
                    <span className="font-bold text-noor-green">
                      {lounge.onlineCount.toLocaleString("fa-IR")}
                    </span>
                  </div>
                  {isModerator && (
                    <NoorButton
                      variant="coral"
                      className="w-full"
                      leftIcon={<MicOff className="h-4 w-4" />}
                      onClick={openMutedList}
                    >
                      مشاهده سکوت‌شدگان
                    </NoorButton>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ردیف پیام عادی (حباب تلگرامی) ──
function MessageRow({
  msg,
  isMine,
  isModerator,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  playing,
  playProgress,
  onTogglePlay,
  onModerate,
}: {
  msg: ChatMessage;
  isMine: boolean;
  isModerator: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  playing: boolean;
  playProgress: number;
  onTogglePlay: () => void;
  onModerate: (action: string) => void;
}) {
  const nameColor = msg.senderAvatarColor || "#87CEEB";
  const bars = Array.from({ length: 24 }, (_, i) => barHeight(msg.id, i));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}
    >
      {/* آواتار فقط برای پیام دیگران */}
      {!isMine ? (
        <NoorAvatar
          name={msg.senderName}
          color={msg.senderAvatarColor}
          avatarUrl={msg.senderAvatarUrl}
          size="sm"
          className="mt-1 shrink-0"
        />
      ) : (
        <div className="w-9 shrink-0" />
      )}

      <div className={`min-w-0 max-w-[78%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
        {/* نام فرستنده (گروهی) */}
        {!isMine && (
          <span
            className="mb-0.5 pr-1 text-[11px] font-bold"
            style={{ color: nameColor }}
          >
            {msg.senderName}
          </span>
        )}

        <div className="relative">
          {/* منوی مدیریت */}
          {isModerator && menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={onCloseMenu} />
              <div className="absolute top-0 z-50 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
                <button
                  onClick={() => onModerate("pin")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold transition hover:bg-muted"
                >
                  <Pin className="h-3.5 w-3.5 text-noor-yellow" /> سنجاق پیام
                </button>
                <button
                  onClick={() => onModerate("deleteMessage")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-noor-coral transition hover:bg-noor-coral/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> حذف پیام
                </button>
                {!isMine && msg.senderId && (
                  <button
                    onClick={() => onModerate("mute")}
                    className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-xs font-bold text-noor-coral transition hover:bg-noor-coral/10"
                  >
                    <MicOff className="h-3.5 w-3.5" /> سکوت {msg.senderName.split(" ")[0]}
                  </button>
                )}
              </div>
            </>
          )}

          <div
            className={`relative px-3 py-2 text-sm leading-6 shadow-sm ${
              isMine
                ? "rounded-2xl rounded-bl-md bg-noor-yellow/25 text-foreground dark:bg-noor-yellow/20"
                : "rounded-2xl rounded-br-md bg-card text-foreground"
            }`}
          >
            {/* پیام صوتی */}
            {msg.type === "voice" ? (
              <div className="flex min-w-[180px] items-center gap-2.5 py-0.5">
                <button
                  onClick={onTogglePlay}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-noor-yellow text-noor-navy shadow-md transition hover:brightness-105"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <div className="flex flex-1 items-end gap-[2px]" style={{ height: 26 }}>
                  {bars.map((h, i) => (
                    <span
                      key={i}
                      className="w-[3px] rounded-full transition-colors"
                      style={{
                        height: `${h}%`,
                        background:
                          playing && i / bars.length <= playProgress
                            ? "var(--color-noor-yellow)"
                            : "currentColor",
                        opacity: playing && i / bars.length <= playProgress ? 1 : 0.35,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold opacity-70">
                  {(msg.voiceDuration ?? 0).toLocaleString("fa-IR")}″
                </span>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
            )}

            {/* زمان داخل حباب */}
            <span
              className={`mt-0.5 block text-left text-[9px] opacity-55 ${msg.type === "voice" ? "text-left" : ""}`}
            >
              {timeLabel(msg.timestamp)}
            </span>
          </div>

          {/* دکمه منوی مدیریت */}
          {isModerator && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu();
              }}
              className={`absolute top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full bg-muted/80 text-muted-foreground opacity-0 transition group-hover:opacity-100 ${
                isMine ? "-right-7" : "-left-7"
              }`}
              title="مدیریت پیام"
            >
              ⋮
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── ردیف پیام دعوت به محفل ──
function InviteRow({
  msg,
  isMine,
  onJoin,
}: {
  msg: ChatMessage;
  isMine: boolean;
  onJoin: () => void;
}) {
  return (
    <div className={`flex ${isMine ? "justify-start" : "justify-end"} px-6`}>
      <div className="w-full max-w-sm rounded-2xl border border-noor-green/30 bg-noor-green/10 p-3">
        <div className="flex items-center gap-2">
          <div>
            <div className="text-xs font-bold text-noor-green">📨 دعوت به محفل</div>
            <div className="mt-0.5 text-sm font-bold">{msg.inviteSessionTitle}</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              {msg.senderName} · {timeLabel(msg.timestamp)}
            </div>
          </div>
          <NoorButton variant="green" size="sm" className="mr-auto" onClick={onJoin}>
            پیوستن
          </NoorButton>
        </div>
      </div>
    </div>
  );
}
