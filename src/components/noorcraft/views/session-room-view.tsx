"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Hand,
  Heart,
  Sparkles,
  Moon,
  Send,
  Users,
  Radio,
  Settings,
  X,
  ChevronLeft,
  Volume2,
  Trophy,
  History,
  LogOut,
  Power,
  Loader2,
  UserPlus,
} from "lucide-react";
import { NoorButton } from "../noor-button";
import { NoorBadge } from "../noor-badge";
import { NoorAvatar } from "../noor-avatar";
import { WebRTCVideoChat } from "../webrtc-video-chat";
import { RecitationFlow } from "../recitation-flow";
import { RecitationSetup } from "../recitation-setup";
import { RecitationHistory } from "../recitation-history";
import { QuranDisplay } from "../quran-display";
import { useNoorStore, randomColor } from "@/store/noor-store";
import { useRecitationStore } from "@/store/recitation-store";
import { AVATAR_COLORS, formatJalaliTime, generateJitsiRoomName } from "@/lib/noorcraft/constants";
import type {
  ChatMessage,
  QueueEntry,
  Reaction,
} from "@/lib/noorcraft/types";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

// No fake attendees — the attendees list is built from the actual logged-in user only.
// Real participants will appear as they join via WebRTC / Jitsi.
type RoomAttendee = {
  id: string;
  name: string;
  color: string;
  micOn: boolean;
  camOn: boolean;
};

function buildAttendees(user: { id: string; fullName: string; avatarColor: string } | null): RoomAttendee[] {
  if (!user) return [];
  return [{
    id: user.id,
    name: user.fullName,
    color: user.avatarColor,
    micOn: true,
    camOn: false,
  }];
}

function buildWelcomeChat(user: { fullName: string } | null): ChatMessage[] {
  return [
    {
      id: "c1",
      sender: "سیستم",
      avatarColor: "#191970",
      text: `به محفل خوش آمدید${user ? " " + user.fullName : ""}! آداب تلاوت را رعایت کنید.`,
      timestamp: Date.now(),
      isSystem: true,
    },
  ];
}

export function SessionRoomView() {
  const activeSession = useNoorStore((s) => s.activeSession);
  const setActiveSession = useNoorStore((s) => s.setActiveSession);
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const setLastResult = useNoorStore((s) => s.setLastResult);
  const addNoorPoints = useNoorStore((s) => s.addNoorPoints);
  const incrementSessions = useNoorStore((s) => s.incrementSessions);
  const clearSessionParticipants = useNoorStore((s) => s.clearSessionParticipants);

  const reducedMotion = useNoorStore((s) => s.reducedMotion);
  const toggleReducedMotion = useNoorStore((s) => s.toggleReducedMotion);

  const { toast } = useToast();

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [screenShare, setScreenShare] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // Jitsi session state
  const [jitsiActive, setJitsiActive] = useState(false);
  const [jitsiRoom, setJitsiRoom] = useState<string>("");

  const [messages, setMessages] = useState<ChatMessage[]>(() => buildWelcomeChat(user));
  const [chatInput, setChatInput] = useState("");
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(180);
  const [showSettings, setShowSettings] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Recitation store
  const competitionStatus = useRecitationStore((s) => s.status);
  const competitionSurah = useRecitationStore((s) => s.currentSurah);
  const competitionVerse = useRecitationStore((s) => s.currentVerse);
  const [showSidebar, setShowSidebar] = useState(true);

  // Track whether the current user is the host of the active session.
  // Guests never see the "شروع منافسه" button — they auto-join the rotation
  // when the host broadcasts the competition state via WebRTC data channel.
  const isHost = !!activeSession && !!user && activeSession.hostId === user.id;

  // Ref to the broadcast function exposed by WebRTCVideoChat (host side).
  // We call this whenever the host's recitation-store changes, so guests get
  // the latest participants / current index / verse / status.
  const broadcastCompetitionRef = useRef<(() => void) | null>(null);

  // Watch recitation-store changes on the host side and broadcast them.
  // Guests receive and apply via syncFromHost (handled in WebRTCVideoChat).
  // We use individual selectors (not a single object-returning selector)
  // because Zustand v5 uses Object.is equality by default — a selector that
  // returns `{...}` would create a new reference every render, causing an
  // infinite re-render loop and the "خطایی رخ داد" page-load crash.
  const snapParticipants = useRecitationStore((s) => s.participants);
  const snapCurrentIndex = useRecitationStore((s) => s.currentIndex);
  const snapCurrentRound = useRecitationStore((s) => s.currentRound);
  const snapCurrentMaqam = useRecitationStore((s) => s.currentMaqam);
  const snapCurrentSurah = useRecitationStore((s) => s.currentSurah);
  const snapCurrentVerse = useRecitationStore((s) => s.currentVerse);
  const snapSelectedEndVerse = useRecitationStore((s) => s.selectedEndVerse);
  const snapStartedAt = useRecitationStore((s) => s.startedAt);
  const snapCurrentEntryStartedAt = useRecitationStore((s) => s.currentEntryStartedAt);
  const snapStatus = useRecitationStore((s) => s.status);
  useEffect(() => {
    if (isHost && broadcastCompetitionRef.current) {
      broadcastCompetitionRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isHost,
    snapParticipants,
    snapCurrentIndex,
    snapCurrentRound,
    snapCurrentMaqam,
    snapCurrentSurah,
    snapCurrentVerse,
    snapSelectedEndVerse,
    snapStartedAt,
    snapCurrentEntryStartedAt,
    snapStatus,
  ]);

  const [attendees, setAttendees] = useState<RoomAttendee[]>(() => buildAttendees(user));
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulated incoming reactions — disabled when no other attendees are present.
  useEffect(() => {
    if (reducedMotion || attendees.length === 0) return;
    const t = setInterval(() => {
      const types: Reaction["type"][] = ["salawat", "heart", "noor"];
      // Only emit reactions from the actual logged-in user (no fake senders).
      const s = attendees[Math.floor(Math.random() * attendees.length)];
      const r: Reaction = {
        id: `r_${Date.now()}_${Math.random()}`,
        type: types[Math.floor(Math.random() * types.length)],
        sender: s.name,
        timestamp: Date.now(),
      };
      setReactions((prev) => [...prev, r].slice(-12));
    }, 4500);
    return () => clearInterval(t);
  }, [reducedMotion, attendees.length]);

  const sendMessage = useCallback(() => {
    if (!chatInput.trim() || !user) return;
    const msg: ChatMessage = {
      id: `c_${Date.now()}`,
      sender: user.fullName,
      avatarColor: user.avatarColor,
      text: chatInput.trim(),
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, msg]);
    setChatInput("");
  }, [chatInput, user]);

  const sendReaction = useCallback(
    (type: Reaction["type"]) => {
      if (!user) return;
      const r: Reaction = {
        id: `r_${Date.now()}`,
        type,
        sender: user.fullName,
        timestamp: Date.now(),
      };
      setReactions((prev) => [...prev, r].slice(-12));
    },
    [user],
  );

  const requestTurn = useCallback(() => {
    if (!user) return;
    setHandRaised(true);
    const entry: QueueEntry = {
      id: `q_${Date.now()}`,
      userId: user.id,
      name: user.fullName,
      avatarColor: user.avatarColor,
      status: "waiting",
    };
    setQueue((q) => [...q, entry]);
    toast({
      title: "درخواست نوبت ثبت شد ✋",
      description: "در صف تلاوت قرار گرفتید.",
    });
    setTimeout(() => setHandRaised(false), 4000);
  }, [user, toast]);

  const startRecitation = useCallback(() => {
    setTimerActive(true);
    setTimerDuration(180);
    toast({
      title: "نوبت تلاوت شما شروع شد 🎙️",
      description: "۱۸۰ ثانیه فرصت دارید. با آرامش تلاوت کنید.",
    });
  }, [toast]);

  // Start Jitsi video conference
  const startJitsiSession = useCallback(() => {
    if (!activeSession) return;
    // Use existing room name from session, or generate a new one
    const room = activeSession.jitsiRoom || generateJitsiRoomName("monafaseh");
    setJitsiRoom(room);
    setJitsiActive(true);
    toast({
      title: "شروع محفل تصویری 📹",
      description:
        "بدون نیاز به ثبت‌نام یا ورود با گوگل — فقط اجازه دهید دوربین و میکروفون فعال شوند.",
      duration: 5000,
    });
  }, [activeSession, toast]);

  const endJitsiSession = useCallback(() => {
    setJitsiActive(false);
    setJitsiRoom("");
    toast({
      title: "از محفل تصویری خارج شدید",
      description: "می‌توانید دوباره وارد شوید یا به محفل دیگری بپیوندید.",
    });
  }, [toast]);

  // ─── Auto-start WebRTC video session for challenge matches ──────────────
  // When a user enters session-room-view we automatically start the WebRTC
  // video session for ALL sessions (challenge matches and regular sessions
  // alike) — without requiring them to click the "شروع محفل تصویری" button.
  //
  // Why: Forcing users to find and click a separate button causes confusion —
  // most users think the video "doesn't connect" because they don't realize
  // the other person also needs to click.
  //
  // The effect runs once per activeSession change. The `jitsiActive` check
  // prevents re-triggering if the user manually stops and restarts the video.
  useEffect(() => {
    if (!activeSession || jitsiActive) return;
    const room = activeSession.jitsiRoom || generateJitsiRoomName("monafaseh");
    setJitsiRoom(room);
    setJitsiActive(true);
    console.log("[SessionRoom] Auto-started WebRTC video for session:", room);
  }, [activeSession, jitsiActive]);

  // خروج از محفل — فقط participant رکورد حذف می‌شود؛ محفل باز می‌ماند
  const [leaving, setLeaving] = useState(false);
  const leaveSession = useCallback(async () => {
    if (!activeSession || !user) return;
    setLeaving(true);
    try {
      // First leave the WebRTC room if active — setJitsiActive(false)
      // triggers React to unmount WebRTCVideoChat, which cleans up itself.
      setJitsiActive(false);
      setJitsiRoom("");
      // Tell server to remove participant record
      await fetch(`/api/sessions/${activeSession.id}/leave`, {
        method: "POST",
      });
      toast({
        title: "از محفل خارج شدید",
        description: `محفل «${activeSession.title}» را ترک کردید. می‌توانید بعداً دوباره بپیوندید.`,
      });
      // Clear the in-memory WebRTC participant list so stale entries don't show up in the next session
      clearSessionParticipants();
      setActiveSession(null);
      setView("sessions");
    } catch (err) {
      console.error("Leave session error:", err);
      toast({
        title: "خطا در خروج",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setLeaving(false);
    }
  }, [activeSession, user, toast, setActiveSession, setView, setJitsiActive, setJitsiRoom]);

  // پایان دادن محفل — فقط میزبان، وضعیت ended می‌شود
  const [ending, setEnding] = useState(false);
  const endSession = useCallback(async () => {
    if (!activeSession || !user) return;
    // Confirm before ending
    const confirm = window.confirm(
      `آیا از پایان دادن محفل «${activeSession.title}» مطمئن هستید؟ این کار قابل بازگشت نیست و محفل برای همه شرکت‌کنندگان بسته می‌شود.`,
    );
    if (!confirm) return;
    setEnding(true);
    try {
      // Unmount WebRTCVideoChat by setting jitsiActive=false — it cleans up itself.
      setJitsiActive(false);
      setJitsiRoom("");
      const res = await fetch(`/api/sessions/${activeSession.id}/end`, {
        method: "POST",
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "خطا در پایان دادن محفل");
      }
      toast({
        title: "محفل پایان یافت ✓",
        description: `محفل «${activeSession.title}» با موفقیت بسته شد.`,
      });
      // Clear the in-memory WebRTC participant list so stale entries don't show up in the next session
      clearSessionParticipants();
      setActiveSession(null);
      setView("sessions");
    } catch (err: any) {
      console.error("End session error:", err);
      toast({
        title: "خطا در پایان دادن",
        description: err.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setEnding(false);
    }
  }, [activeSession, user, toast, setActiveSession, setView, setJitsiActive, setJitsiRoom]);

  // کپی لینک دعوت
  const [linkCopied, setLinkCopied] = useState(false);
  const copyInviteLink = useCallback(() => {
    if (!activeSession) return;
    const link = `${window.location.origin}/?session=${activeSession.id}`;
    navigator.clipboard?.writeText(link).then(() => {
      setLinkCopied(true);
      toast({
        title: "لینک دعوت کپی شد ✓",
        description: "این لینک را برای دعوت قاریان دیگر بفرستید.",
      });
      setTimeout(() => setLinkCopied(false), 3000);
    }).catch(() => {
      toast({
        title: "خطا در کپی",
        description: "لطفاً لینک را دستی کپی کنید.",
        variant: "destructive",
      });
    });
  }, [activeSession, toast]);

  const endRecitation = useCallback(() => {
    if (!user || !activeSession) return;
    setTimerActive(false);
    const earned = 30 + Math.floor(Math.random() * 40);
    addNoorPoints(earned);
    incrementSessions();
    setLastResult({
      listeners: activeSession.attendees + Math.floor(Math.random() * 5),
      noorEarned: earned,
      reactionsReceived: reactions.length,
    });
    setView("results");
  }, [user, activeSession, reactions, addNoorPoints, incrementSessions, setLastResult, setView]);

  if (!activeSession || !user) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <p className="text-muted-foreground">محفلی انتخاب نشده است.</p>
          <NoorButton
            variant="yellow"
            className="mt-4"
            onClick={() => setView("sessions")}
          >
            مشاهده محفل‌ها
          </NoorButton>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#0b0a08] via-[#12110d] to-[#080706] text-white">
      {/* Floating reactions */}
      <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
        <AnimatePresence>
          {reactions.map((r) => (
            <FloatingReaction key={r.id} reaction={r} />
          ))}
        </AnimatePresence>
      </div>

      <div className="mx-auto max-w-3xl px-2 py-3 sm:px-4 sm:py-4">
        <div className="space-y-3">
          {/* Main stage */}
          <div className="space-y-3">
            {/* HUD top bar */}
            <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/5 px-3 py-2 backdrop-blur-md sm:px-4">
              <div className="flex items-center gap-2">
                <NoorBadge variant="coral">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-noor-coral" />
                    زنده
                  </span>
                </NoorBadge>
                <div className="hidden sm:block">
                  <div className="text-sm font-bold">{activeSession.title}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {activeSession.recitationType} • {activeSession.surah}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {activeSession.attendees + 1}/{activeSession.capacity}
                </span>
                <button
                  onClick={copyInviteLink}
                  className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold transition hover:bg-white/20"
                  title="کپی لینک دعوت"
                >
                  {linkCopied ? "کپی شد ✓" : "لینک دعوت"}
                </button>
                <button
                  onClick={leaveSession}
                  disabled={leaving || ending}
                  className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold transition hover:bg-white/20 disabled:opacity-50"
                  title="خروج از محفل — محفل باز می‌ماند و بعداً می‌توانید برگردید"
                >
                  {leaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
                  خروج
                </button>
                {activeSession.hostName === user.fullName && (
                  <button
                    onClick={endSession}
                    disabled={leaving || ending}
                    className="flex items-center gap-1 rounded-full bg-noor-coral/20 px-3 py-1 text-xs font-bold text-noor-coral transition hover:bg-noor-coral/30 disabled:opacity-50"
                    title="پایان دادن محفل — فقط میزبان"
                  >
                    {ending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
                    پایان محفل
                  </button>
                )}
              </div>
            </div>

            {/* WebRTC video conference area — taller when active for better experience */}
            <div
              className={`relative w-full overflow-hidden rounded-2xl border-2 border-white/15 bg-black ${
                jitsiActive
                  ? "h-[55vh] min-h-[300px] sm:h-[60vh] sm:min-h-[400px]"
                  : "h-[58vh] min-h-[360px] sm:h-[60vh] sm:min-h-[440px]"
              }`}
            >
              {jitsiActive && jitsiRoom ? (
                <WebRTCVideoChat
                  sessionId={activeSession.id}
                  roomName={jitsiRoom}
                  displayName={user?.fullName ?? "کاربر منافسه"}
                  isHost={isHost}
                  onHangup={endJitsiSession}
                  onBroadcastReady={(broadcast) => {
                    broadcastCompetitionRef.current = broadcast;
                  }}
                />
              ) : (
                <JitsiMock attendees={attendees} activeUser={attendees[0]} />
              )}

              {/* Overlays on top of Jitsi — only when NOT active */}
              {!jitsiActive && (
                <>
                  {/* HUD elements (non-blocking) */}
                  <div className="pointer-events-none absolute inset-0 z-10">
                    {/* Top right: Active reciter indicator */}
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute right-3 top-3"
                    >
                      <div className="flex items-center gap-2 rounded-full bg-noor-yellow/90 px-3 py-1.5 text-noor-navy shadow-chunky-yellow">
                        <Radio className="h-4 w-4 animate-pulse" />
                        <span className="text-xs font-bold">در حال تلاوت: {user?.fullName ?? "قاری"}</span>
                      </div>
                    </motion.div>

                    {/* Bottom left: User noor points */}
                    <div className="absolute bottom-3 left-3">
                      <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-md">
                        <Moon className="h-4 w-4 text-noor-yellow" />
                        <span className="text-xs font-bold">
                          {user.stats.noorPoints} نور
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center overlay - prompt to start (interactive) */}
                  <div className="absolute inset-0 z-20 overflow-y-auto bg-gradient-to-br from-noor-navy/80 to-black/80 backdrop-blur-sm">
                    <div className="flex min-h-full flex-col items-center justify-center gap-3 p-4 text-center text-white sm:gap-4 sm:p-6">
                      <motion.div
                        className="grid h-16 w-16 place-items-center rounded-full bg-noor-yellow shadow-chunky-yellow sm:h-20 sm:w-20"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      >
                        <Video className="h-8 w-8 text-noor-navy sm:h-10 sm:w-10" />
                      </motion.div>
                      <div>
                        <p className="font-display text-xl sm:text-2xl">محفل تصویری آماده است</p>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                          بدون ثبت‌نام و بدون تأخیر — فوری شروع کنید
                        </p>
                        <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[10px] text-muted-foreground sm:text-xs sm:gap-2">
                          <span className="rounded-full bg-white/10 px-2 py-1">✓ بدون نیاز به قرآن چاپی</span>
                          <span className="rounded-full bg-white/10 px-2 py-1">✓ بدون ورود با گوگل</span>
                          <span className="rounded-full bg-white/10 px-2 py-1">✓ بدون تأخیر و معطلی</span>
                        </div>
                      </div>
                      <NoorButton
                        variant="yellow"
                        size="lg"
                        onClick={startJitsiSession}
                        leftIcon={<Video className="h-5 w-5" />}
                        className="animate-pulse-glow"
                      >
                        شروع محفل تصویری
                      </NoorButton>
                    </div>
                  </div>
                </>
              )}

              {/* When Jitsi IS active, show minimal non-blocking HUD */}
              {jitsiActive && (
                <>
                  {/* Top right: Active reciter indicator — small, non-blocking */}
                  <div className="pointer-events-none absolute right-3 top-3 z-10">
                    <div className="flex items-center gap-2 rounded-full bg-noor-yellow/90 px-3 py-1.5 text-noor-navy shadow-chunky-yellow">
                      <Radio className="h-4 w-4 animate-pulse" />
                      <span className="text-xs font-bold">در حال تلاوت</span>
                    </div>
                  </div>

                  {/* Bottom left: User noor points — small, non-blocking */}
                  <div className="pointer-events-none absolute bottom-3 left-3 z-10">
                    <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-md">
                      <Moon className="h-4 w-4 text-noor-yellow" />
                      <span className="text-xs font-bold text-white">
                        {user.stats.noorPoints} نور
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Competition controls */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/5 p-3 backdrop-blur-md">
              {competitionStatus === "setup" ? (
                <NoorButton
                  variant="yellow"
                  size="lg"
                  onClick={() => setShowSetup(true)}
                  leftIcon={<Trophy className="h-5 w-5" />}
                  className="animate-pulse-glow"
                >
                  شروع منافسه
                </NoorButton>
              ) : (
                <NoorButton
                  variant="ghost"
                  size="md"
                  onClick={() => setShowHistory(true)}
                  leftIcon={<History className="h-4 w-4" />}
                  className="border-white/20 text-white hover:bg-noor-sky/20"
                >
                  تاریخچه منافسه
                </NoorButton>
              )}

              {jitsiActive && (
                <NoorButton
                  variant="navy"
                  size="md"
                  onClick={endJitsiSession}
                  leftIcon={<VideoOff className="h-4 w-4" />}
                >
                  خروج از محفل تصویری
                </NoorButton>
              )}
            </div>

            {/* Recitation Flow — replaces old queue + timer */}
            <RecitationFlow currentUserName={user?.fullName ?? ""} />

            {/* Invite panel — host can invite online users */}
            {isHost && <InvitePanel />}

            {/* Live Quran display — shown when competition is active */}
            {competitionStatus !== "setup" && competitionSurah && (
              <QuranDisplay
                surah={competitionSurah || activeSession?.surah || "الرحمن"}
                currentVerse={competitionVerse || 1}
              />
            )}
          </div>
        </div>
      </div>

      {/* Settings modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            reducedMotion={reducedMotion}
            onToggleReducedMotion={toggleReducedMotion}
          />
        )}
      </AnimatePresence>

      {/* Recitation setup modal */}
      <RecitationSetup
        open={showSetup}
        onClose={() => setShowSetup(false)}
        onStart={() => setShowSetup(false)}
      />

      {/* Recitation history modal */}
      <RecitationHistory
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}

function JitsiMock({
  attendees,
  activeUser,
}: {
  attendees: RoomAttendee[];
  activeUser?: RoomAttendee;
}) {
  if (attendees.length === 0 || !activeUser) {
    return (
      <div className="grid h-full w-full place-items-center bg-noor-navy p-4 text-center">
        <div className="flex flex-col items-center gap-3 text-white/70">
          <Users className="h-10 w-10 text-noor-sky" />
          <p className="text-sm font-bold">فعلاً تنها هستید</p>
          <p className="text-xs text-white/50">
            منتظر ورود دیگر قاریان — با کلیک روی «شروع محفل تصویری» می‌توانید لینک دعوت بفرستید.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="grid h-full w-full grid-cols-1 gap-1 bg-noor-navy p-1 sm:grid-cols-2">
      {attendees.map((a, i) => (
        <div
          key={a.id}
          className={`relative grid place-items-center overflow-hidden rounded-lg ${
            a.id === activeUser.id
              ? "ring-2 ring-noor-yellow"
              : "ring-1 ring-white/10"
          }`}
          style={{
            background: `linear-gradient(135deg, ${a.color}33, ${a.color}11)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <div
            className={`grid h-12 w-12 place-items-center rounded-full font-bold text-white shadow-md sm:h-16 sm:w-16 ${
              a.camOn ? "" : "animate-pulse"
            }`}
            style={{
              background: `linear-gradient(135deg, ${a.color}, ${shade(a.color, -20)})`,
            }}
          >
            {a.name.charAt(0)}
          </div>
          <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[9px]">
            {!a.micOn && <MicOff className="h-2.5 w-2.5 text-noor-coral" />}
            <span className="truncate max-w-[60px]">{a.name.split(" ")[0]}</span>
          </div>
          {a.id === activeUser.id && (
            <motion.div
              className="absolute left-1 top-1 rounded-full bg-noor-coral px-1.5 py-0.5 text-[8px] font-bold"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              شما
            </motion.div>
          )}
          {/* Animated audio bars when mic is on */}
          {a.micOn && (
            <div className="absolute left-1 bottom-1 flex items-end gap-0.5">
              {[0, 1, 2].map((b) => (
                <motion.div
                  key={b}
                  className="w-0.5 rounded-full bg-noor-green"
                  animate={{ height: [3, 8, 3] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: b * 0.15,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function shade(hex: string, percent: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const adjust = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + (c * percent) / 100)));
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

function ControlBtn({
  children,
  active,
  onClick,
  label,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-full transition ${
        active
          ? "bg-white text-white"
          : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}

function ReactionBtn({
  icon,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full text-white transition"
      style={{ background: `${color}33`, color }}
    >
      {icon}
    </motion.button>
  );
}

function ChatBubble({
  msg,
  currentUser,
}: {
  msg: ChatMessage;
  currentUser: string;
}) {
  const isMine = msg.sender === currentUser;
  const isSystem = msg.isSystem;
  if (isSystem) {
    return (
      <div className="rounded-lg bg-noor-sky/15 px-2 py-1.5 text-center text-[10px] text-muted-foreground">
        {msg.text}
      </div>
    );
  }
  return (
    <div className={`flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
      <NoorAvatar name={msg.sender} color={msg.avatarColor} size="sm" />
      <div className={`flex-1 ${isMine ? "text-left" : ""}`}>
        <div className="mb-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="font-bold text-white/80">{msg.sender}</span>
          <span>{formatJalaliTime(msg.timestamp)}</span>
        </div>
        <div
          className={`inline-block rounded-xl px-2.5 py-1.5 text-xs ${
            isMine
              ? "bg-noor-yellow/30 text-noor-navy"
              : "bg-white/10 text-white/90"
          }`}
        >
          {msg.text}
        </div>
      </div>
    </div>
  );
}

function FloatingReaction({ reaction }: { reaction: Reaction }) {
  const colors = {
    salawat: "#7CFC00",
    heart: "#FF7F7F",
    noor: "#FFD700",
  };
  const labels = {
    salawat: "صلوات",
    heart: "❤",
    noor: "✨",
  };
  const startX = 20 + Math.random() * 60;
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, x: `${startX}%`, scale: 0.5 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [0, -200, -400],
        scale: [0.5, 1.2, 0.8],
        x: `${startX}%`,
      }}
      transition={{ duration: 4, ease: "easeOut" }}
      className="absolute bottom-20 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-white"
      style={{ background: colors[reaction.type] }}
    >
      <span>{labels[reaction.type]}</span>
      <span className="text-[9px] opacity-80">{reaction.sender.split(" ")[0]}</span>
    </motion.div>
  );
}

function SettingsModal({
  onClose,
  reducedMotion,
  onToggleReducedMotion,
}: {
  onClose: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-card"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            تنظیمات محفل
          </h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <ToggleRow
            icon={<Volume2 className="h-5 w-5" />}
            color="#FF7F7F"
            label="حالت کاهش حرکت"
            desc="غیرفعال کردن انیمیشن‌های اضافی"
            checked={reducedMotion}
            onToggle={onToggleReducedMotion}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function ToggleRow({
  icon,
  color,
  label,
  desc,
  checked,
  onToggle,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  desc: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
      <div
        className="grid h-10 w-10 place-items-center rounded-xl text-white"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-white">
          {label}
        </div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}

// ============================================================
// پنل دعوت کاربران آنلاین به محفل
// ============================================================
function InvitePanel() {
  const { toast } = useToast();
  const activeSession = useNoorStore((s) => s.activeSession);
  const user = useNoorStore((s) => s.user);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [bulkInviting, setBulkInviting] = useState(false);

  // Fetch online users
  useEffect(() => {
    if (!showPanel) return;
    let cancelled = false;

    async function fetchUsers() {
      try {
        const res = await fetch("/api/users/online", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && data.ok) {
          // Exclude self
          setOnlineUsers((data.online || []).filter((u: any) => u.id !== user?.id));
        }
      } catch {}
    }

    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [showPanel, user?.id]);

  async function inviteUser(u: any) {
    if (!activeSession) return;
    setInviting(u.id);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteeId: u.id,
          inviteeName: u.fullName,
          sessionId: activeSession.id,
          sessionTitle: activeSession.title,
          jitsiRoom: activeSession.jitsiRoom,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({
          title: "دعوت ارسال شد 📨",
          description: `${u.fullName} دعوت شد. در انتظار پاسخ...`,
        });
      }
    } catch {
      toast({ title: "خطا در دعوت", variant: "destructive" });
    } finally {
      setInviting(null);
    }
  }

  async function inviteAll(filter?: "تحقیق" | "ترتیل") {
    if (!activeSession) return;
    const targets = filter
      ? onlineUsers.filter((u) => u.recitationType === filter)
      : onlineUsers;

    if (targets.length === 0) {
      toast({
        title: "کاربری برای دعوت نیست",
        description: filter ? `کاربر آنلاینی با سبک ${filter} نیست` : "کاربر آنلاینی نیست",
      });
      return;
    }

    setBulkInviting(true);
    let sent = 0;
    for (const u of targets) {
      try {
        await fetch("/api/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inviteeId: u.id,
            inviteeName: u.fullName,
            sessionId: activeSession.id,
            sessionTitle: activeSession.title,
            jitsiRoom: activeSession.jitsiRoom,
          }),
        });
        sent++;
      } catch {}
    }
    setBulkInviting(false);
    toast({
      title: `دعوت گروهی ارسال شد! 📨`,
      description: `${sent.toLocaleString("fa-IR")} کاربر دعوت شدند.`,
    });
  }

  return (
    <div className="rounded-2xl bg-white/5 p-3 backdrop-blur-md">
      {/* Header */}
      <button
        onClick={() => setShowPanel((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-white">
          <UserPlus className="h-4 w-4 text-noor-yellow" />
          دعوت قاریان به محفل
          {onlineUsers.length > 0 && (
            <span className="rounded-full bg-noor-green/20 px-2 py-0.5 text-[10px] text-noor-green">
              {onlineUsers.length.toLocaleString("fa-IR")} آنلاین
            </span>
          )}
        </span>
        <ChevronLeft
          className={`h-4 w-4 text-white/50 transition ${showPanel ? "-rotate-90" : "rotate-90"}`}
        />
      </button>

      {showPanel && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="mt-3 space-y-3"
        >
          {/* Bulk invite buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => inviteAll()}
              disabled={bulkInviting}
              className="flex items-center gap-1.5 rounded-full bg-noor-yellow/20 px-3 py-1.5 text-xs font-bold text-noor-navy dark:text-yellow-200 transition hover:bg-noor-yellow/30 disabled:opacity-50"
            >
              <UserPlus className="h-3 w-3" />
              دعوت همه ({onlineUsers.length.toLocaleString("fa-IR")})
            </button>
            <button
              onClick={() => inviteAll("تحقیق")}
              disabled={bulkInviting}
              className="rounded-full bg-noor-sky/20 px-3 py-1.5 text-xs font-bold text-noor-navy dark:text-sky-200 transition hover:bg-noor-sky/30 disabled:opacity-50"
            >
              سبک تحقیق
            </button>
            <button
              onClick={() => inviteAll("ترتیل")}
              disabled={bulkInviting}
              className="rounded-full bg-noor-coral/20 px-3 py-1.5 text-xs font-bold text-noor-coral transition hover:bg-noor-coral/30 disabled:opacity-50"
            >
              سبک ترتیل
            </button>
            {bulkInviting && (
              <Loader2 className="h-4 w-4 animate-spin text-noor-yellow" />
            )}
          </div>

          {/* Online users list */}
          <div className="max-h-40 space-y-1.5 overflow-y-auto">
            {onlineUsers.length === 0 ? (
              <div className="rounded-xl bg-white/5 p-3 text-center text-xs text-muted-foreground">
                فعلاً کاربر آنلاینی نیست. می‌توانید لینک دعوت را کپی کنید.
              </div>
            ) : (
              onlineUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 rounded-xl bg-white/5 p-2"
                >
                  <NoorAvatar
                    name={u.fullName}
                    color={u.avatarColor}
                    avatarUrl={u.avatarUrl}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-xs font-bold text-white">
                      {u.fullName}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {u.recitationType || "—"} {u.city ? `• ${u.city}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => inviteUser(u)}
                    disabled={inviting === u.id}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-noor-green/20 px-3 py-1 text-[10px] font-bold text-noor-navy dark:text-lime-300 transition hover:bg-noor-green/30 disabled:opacity-50"
                  >
                    {inviting === u.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserPlus className="h-3 w-3" />
                    )}
                    دعوت
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
