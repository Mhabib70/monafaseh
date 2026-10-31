"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Copy,
  Check,
  Users,
  Wifi,
  Camera,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNoorStore } from "@/store/noor-store";
import { useRecitationStore } from "@/store/recitation-store";

// ============================================================
// WebRTC مستقیم — بدون PeerJS و بدون broker خارجی
// ------------------------------------------------------------
// سیگنالینگ از طریق API خود پروژه انجام می‌شود:
//   GET  /api/sessions/[sessionId]/signal   — خواندن وضعیت
//   POST /api/sessions/[sessionId]/signal   — نوشتن offer/answer/candidates
//
// جریان اتصال:
//   مهمان: createOffer → POST offer(connId) → POLL برای answer و
//          کاندیدهای میزبان → setRemoteDescription → اتصال برقرار
//   میزبان: POLL برای offerهای جدید → createAnswer → POST answer +
//          کاندیدهای خود → اتصال برقرار
//
// همگام‌سازی وضعیت منافسه (آیات/نوبت/...) از طریق data channel
// با نام "competition" بین میزبان و مهمان‌ها انجام می‌شود.
// ============================================================

interface Participant {
  id: string;
  name: string;
  stream: MediaStream | null;
  audioOn: boolean;
  videoOn: boolean;
}

interface WebRTCVideoChatProps {
  /** شناسه جلسه در دیتابیس — برای API سیگنالینگ */
  sessionId: string;
  /** نام اتاق (jitsiRoom) — برای لینک دعوت */
  roomName: string;
  displayName: string;
  /** آیا کاربر فعلی میزبان جلسه است؟ */
  isHost?: boolean;
  onHangup?: () => void;
  /**
   * Called when a competition-state message is received from the host.
   * The session-room-view can use this to sync the local recitation store.
   */
  onCompetitionStateReceived?: () => void;
  /**
   * Returns a stable function the parent can call to broadcast the current
   * competition state (host side only).
   */
  onBroadcastReady?: (broadcast: () => void) => void;
}

// ICE servers — STUN + TURN.
// TURN برای کاربران پشت symmetric NAT (رایج در اپراتورهای ایرانی) حیاتی است.
// OpenRelay TURN رایگان: https://www.metered.ca/tools/openrelay/
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

const POLL_INTERVAL_MS = 1500;

interface SignalState {
  offers: Record<string, any>;
  answers: Record<string, any>;
  hostCandidates: Record<string, any[]>;
  guestCandidates: Record<string, any[]>;
  updatedAt: number;
}

export function WebRTCVideoChat({
  sessionId,
  roomName,
  displayName,
  isHost = false,
  onHangup,
  onCompetitionStateReceived,
  onBroadcastReady,
}: WebRTCVideoChatProps) {
  const [status, setStatus] = useState<
    "loading" | "permission" | "ready" | "error"
  >("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [copied, setCopied] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelsRef = useRef<Map<string, RTCDataChannel>>(new Map());
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const displayNameRef = useRef(displayName);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handledOffersRef = useRef<Set<string>>(new Set());
  const appliedCandidatesRef = useRef<Set<string>>(new Set());
  const answeredRef = useRef<Set<string>>(new Set());
  const disposedRef = useRef(false);
  // شناسه اتصال مهمان — برای میزبان استفاده نمی‌شود
  const myConnIdRef = useRef(
    `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  );

  // Pull store actions once — these will be called when remote
  // participants connect/disconnect so RecitationSetup can pick them up.
  const upsertSessionParticipant = useNoorStore((s) => s.upsertSessionParticipant);
  const removeSessionParticipant = useNoorStore((s) => s.removeSessionParticipant);
  const clearSessionParticipants = useNoorStore((s) => s.clearSessionParticipants);

  // Recitation store — host broadcasts competition state to guests; guests
  // receive and apply it via syncFromHost.
  const syncFromHost = useRecitationStore((s) => s.syncFromHost);
  const getSnapshot = useRecitationStore((s) => s.getSnapshot);

  useEffect(() => {
    displayNameRef.current = displayName;
  }, [displayName]);

  // ── ارسال/دریافت سیگنالینگ ────────────────────────────────

  const fetchSignal = useCallback(async (): Promise<SignalState | null> => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/signal`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.ok) return null;
      return data.signal as SignalState;
    } catch {
      return null;
    }
  }, [sessionId]);

  const postSignal = useCallback(
    async (payload: Record<string, unknown>) => {
      try {
        await fetch(`/api/sessions/${sessionId}/signal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn("[WebRTC] postSignal failed:", err);
      }
    },
    [sessionId],
  );

  // ── مدیریت مشارکت‌کننده‌ها ─────────────────────────────────

  function upsertParticipant(id: string, name: string, stream: MediaStream | null) {
    setParticipants((prev) => {
      const next = new Map(prev);
      const existing = next.get(id);
      next.set(id, {
        id,
        name: name || existing?.name || `کاربر ${id.slice(-4)}`,
        stream: stream ?? existing?.stream ?? null,
        audioOn: existing?.audioOn ?? true,
        videoOn: existing?.videoOn ?? true,
      });
      return next;
    });
    if (stream) {
      streamsRef.current.set(id, stream);
      setTimeout(() => {
        const videoEl = remoteVideoRefs.current.get(id);
        if (videoEl && videoEl.srcObject !== stream) {
          videoEl.srcObject = stream;
          videoEl.play().catch(() => {});
        }
      }, 100);
    }
  }

  function removeParticipant(id: string) {
    setParticipants((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    const pc = pcsRef.current.get(id);
    if (pc) {
      try { pc.close(); } catch {}
      pcsRef.current.delete(id);
    }
    channelsRef.current.delete(id);
    streamsRef.current.delete(id);
    remoteVideoRefs.current.delete(id);
    removeSessionParticipant(id);
  }

  // ── پیام‌های data channel ──────────────────────────────────

  function handleChannelMessage(connId: string, event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      if (data?.type === "name" && data?.name) {
        upsertParticipant(connId, data.name, null);
        upsertSessionParticipant({
          id: connId,
          name: data.name,
          avatarColor: data.avatarColor ?? "#FFD700",
          avatarUrl: data.avatarUrl ?? null,
          order: 0,
        });
        // پاسخ با نام خودمان (اگر مقایل هنوز نام ما را ندارد)
        const ch = channelsRef.current.get(connId);
        if (ch && ch.readyState === "open") {
          ch.send(
            JSON.stringify({
              type: "name",
              name: displayNameRef.current,
              avatarColor: data.reply ? undefined : undefined,
              reply: true,
            }),
          );
        }
      } else if (data?.type === "competition-state" && data?.snapshot) {
        syncFromHost(data.snapshot);
        if (onCompetitionStateReceived) onCompetitionStateReceived();
      }
    } catch {
      // پیام غیر-JSON — نادیده بگیر
    }
  }

  // ── ساخت RTCPeerConnection ────────────────────────────────

  function createPeerConnection(connId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // ارسال کاندیدهای ICE خودمان به سم مقابل
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        postSignal({
          type: isHost ? "host-candidates" : "guest-candidates",
          connId,
          candidates: [event.candidate.toJSON()],
        });
      }
    };

    // دریافت استریم مقابل
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        upsertParticipant(connId, "", remoteStream);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] PC(${connId}) state:`, pc.connectionState);
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "closed" ||
        pc.connectionState === "disconnected"
      ) {
        // disconnected موقت است؛ failed/closed حذف می‌کنند
        if (pc.connectionState !== "disconnected") {
          removeParticipant(connId);
        }
      }
    };

    // استریم محلی را به اتصال اضافه کن
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pcsRef.current.set(connId, pc);
    return pc;
  }

  function setupDataChannel(connId: string, channel: RTCDataChannel) {
    channelsRef.current.set(connId, channel);
    channel.onmessage = (event) => handleChannelMessage(connId, event);
    channel.onopen = () => {
      console.log(`[WebRTC] Data channel open: ${connId}`);
      // معرفی خودمان به مقایل
      try {
        channel.send(JSON.stringify({ type: "name", name: displayNameRef.current }));
      } catch {}
      // اگر میزبان هستیم، وضعیت فعلی منافسه را هم بفرست
      if (isHost) {
        try {
          channel.send(
            JSON.stringify({ type: "competition-state", snapshot: getSnapshot() }),
          );
        } catch {}
      }
    };
  }

  // ── منتظر ماندن برای جمع‌آوری ICE ─────────────────────────

  function waitForIceGathering(pc: RTCPeerConnection, timeoutMs = 2000): Promise<void> {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === "complete") return resolve();
      const check = () => {
        if (pc.iceGatheringState === "complete") {
          cleanup();
          resolve();
        }
      };
      pc.addEventListener("icegatheringstatechange", check);
      const timer = setTimeout(() => {
        cleanup();
        resolve(); // timeout — با آنچه جمع شده ادامه بده
      }, timeoutMs);
      function cleanup() {
        clearTimeout(timer);
        pc.removeEventListener("icegatheringstatechange", check);
      }
    });
  }

  // ── سمت مهمان: ساخت و ارسال offer ─────────────────────────

  const sendOffer = useCallback(async () => {
    const connId = myConnIdRef.current;
    if (pcsRef.current.has(connId)) return; // قبلاً ساخته شده

    const pc = createPeerConnection(connId);

    // مهمان — data channel را از میزبان دریافت می‌کند (ondatachannel)
    pc.ondatachannel = (event) => {
      setupDataChannel(connId, event.channel);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceGathering(pc);
    if (disposedRef.current) return;

    await postSignal({
      type: "offer",
      connId,
      sdp: pc.localDescription,
    });
    console.log("[WebRTC] Guest offer posted:", connId);
  }, [postSignal]);

  // ── سمت میزبان: پاسخ به offerهای جدید ─────────────────────

  const handleOffers = useCallback(
    async (signal: SignalState) => {
      for (const connId of Object.keys(signal.offers)) {
        if (handledOffersRef.current.has(connId)) continue;
        handledOffersRef.current.add(connId);

        console.log("[WebRTC] Host handling new offer:", connId);
        const pc = createPeerConnection(connId);

        // میزبان — data channel را خودش می‌سازد
        setupDataChannel(connId, pc.createDataChannel("competition"));

        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription(signal.offers[connId]),
          );
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await waitForIceGathering(pc);
          if (disposedRef.current) return;

          await postSignal({
            type: "answer",
            connId,
            sdp: pc.localDescription,
          });
          console.log("[WebRTC] Host answer posted:", connId);
        } catch (err) {
          console.error("[WebRTC] Host answer failed:", err);
          handledOffersRef.current.delete(connId);
        }
      }
    },
    [postSignal],
  );

  // ── سمت مهمان: اعمال answer و کاندیدهای میزبان ───────────

  const applyAnswerAndCandidates = useCallback(async (signal: SignalState) => {
    const connId = myConnIdRef.current;
    const pc = pcsRef.current.get(connId);
    if (!pc) return;

    // اعمال answer میزبان
    const answer = signal.answers[connId];
    if (answer && !answeredRef.current.has(connId) && pc.signalingState === "have-local-offer") {
      answeredRef.current.add(connId);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("[WebRTC] Guest applied host answer");
      } catch (err) {
        console.error("[WebRTC] apply answer failed:", err);
      }
    }

    // اعمال کاندیدهای میزبان
    const hostCands = signal.hostCandidates[connId] ?? [];
    for (const cand of hostCands) {
      const key = `${connId}:${cand?.candidate}`;
      if (appliedCandidatesRef.current.has(key)) continue;
      appliedCandidatesRef.current.add(key);
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch {
        // کاندید زودهنگام/تکراری — نادیده
      }
    }
  }, []);

  // ── حلقه polling سیگنالینگ ────────────────────────────────

  const startSignalingPoll = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    const tick = async () => {
      if (disposedRef.current) return;
      const signal = await fetchSignal();
      if (!signal || disposedRef.current) return;

      if (isHost) {
        await handleOffers(signal);
      } else {
        await applyAnswerAndCandidates(signal);
      }
    };

    tick();
    pollTimerRef.current = setInterval(tick, POLL_INTERVAL_MS);
  }, [isHost, fetchSignal, handleOffers, applyAnswerAndCandidates]);

  // Broadcast a competition state snapshot to all connected peers (data
  // channels). Called by session-room-view's host-side competition actions.
  const broadcastCompetitionState = useCallback(() => {
    channelsRef.current.forEach((ch) => {
      try {
        if (ch.readyState === "open") {
          ch.send(
            JSON.stringify({
              type: "competition-state",
              snapshot: getSnapshot(),
            }),
          );
        }
      } catch (err) {
        console.warn("[WebRTC] Failed to broadcast competition state:", err);
      }
    });
  }, [getSnapshot]);

  // Expose the broadcast function to the parent (host side) so it can push
  // competition state to guests whenever it changes.
  useEffect(() => {
    if (onBroadcastReady) {
      onBroadcastReady(broadcastCompetitionState);
    }
  }, [broadcastCompetitionState, onBroadcastReady]);

  const cleanup = useCallback(() => {
    disposedRef.current = true;
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    pcsRef.current.forEach((pc) => {
      try { pc.close(); } catch {}
    });
    pcsRef.current.clear();
    channelsRef.current.clear();
    streamsRef.current.clear();
    handledOffersRef.current.clear();
    appliedCandidatesRef.current.clear();
    answeredRef.current.clear();
  }, []);

  // Detect in-app browsers (WebView) that block camera access
  function detectWebView(): { isWebView: boolean; label: string; hint: string } {
    if (typeof navigator === "undefined") {
      return { isWebView: false, label: "", hint: "" };
    }
    const ua = navigator.userAgent || "";
    const inAppPatterns: Array<{ re: RegExp; label: string; hint: string }> = [
      { re: /Instagram/i, label: "اینستاگرام", hint: "روی سه‌نقطه‌ی بالای صفحه کلیک کنید و گزینه‌ی «باز کردن در مرورگر» را انتخاب کنید" },
      { re: /FBAN|FBAV|Facebook/i, label: "فیسبوک", hint: "روی سه‌نقطه‌ی بالای صفحه کلیک کنید و «Open in browser» را انتخاب کنید" },
      { re: /TikTok/i, label: "تیک‌تاک", hint: "دکمه‌ی Share را بزنید و «Open in browser» را انتخاب کنید" },
      { re: /Telegram|TGBot/i, label: "تلگرام", hint: "روی سه‌نقطه‌ی بالای صفحه کلیک کنید و «Open in external browser» را انتخاب کنید" },
      { re: /WhatsApp/i, label: "واتس‌اپ", hint: "لطفاً لینک را در مرورگر گوشی باز کنید" },
      { re: /Snapchat/i, label: "اسنپ‌چت", hint: "دکمه‌ی Share را بزنید و «Open in browser» را انتخاب کنید" },
      { re: /MicroMessenger/i, label: "وی‌چت", hint: "روی سه‌نقطه کلیک کنید و «Open in browser» را انتخاب کنید" },
    ];
    for (const p of inAppPatterns) {
      if (p.re.test(ua)) {
        return { isWebView: true, label: p.label, hint: p.hint };
      }
    }
    const looksLikeMobile = /Android|iPhone|iPad|iPod/i.test(ua);
    const looksLikeBrowser =
      /Chrome|Safari|Firefox|CriOS|FxiOS|Edge|OPR/i.test(ua);
    if (looksLikeMobile && !looksLikeBrowser) {
      return {
        isWebView: true,
        label: "مرورگر داخلی",
        hint: "لطفاً صفحه را در مرورگر اصلی گوشی (Chrome یا Safari) باز کنید",
      };
    }
    return { isWebView: false, label: "", hint: "" };
  }

  // Detect iOS Safari specifically (it has unique quirks)
  function isIOSSafari(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isWebkit = /WebKit/.test(ua);
    const isNotChrome = !/CriOS/.test(ua);
    return isIOS && isWebkit && isNotChrome;
  }

  function isMobileDevice(): boolean {
    if (typeof navigator === "undefined") return false;
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
      navigator.userAgent,
    ) || (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches);
  }

  // Step 1: Request camera + microphone access (VIDEO PRIORITY)
  // Mobile-friendly: tries multiple constraint levels until one works.
  const requestMediaAccess = useCallback(async (): Promise<MediaStream | null> => {
    console.log("[WebRTC] Requesting camera + microphone access...");

    const webview = detectWebView();
    if (webview.isWebView) {
      throw new Error(
        `شما داخل مرورگر داخلی ${webview.label} باز کرده‌اید که اجازه دسترسی به دوربین را نمی‌دهد. ${webview.hint} و دوباره تلاش کنید. مرورگرهای پیشنهادی: Chrome یا Safari.`,
      );
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const legacyGetUserMedia =
        (navigator as any).getUserMedia ||
        (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia;
      if (!legacyGetUserMedia) {
        throw new Error(
          "مرورگر شما از دوربین پشتیبانی نمی‌کند. لطفاً نسخه جدید Chrome یا Safari را نصب کنید و مطمئن شوید سایت روی https:// باز می‌شود.",
        );
      }
      return new Promise((resolve, reject) => {
        legacyGetUserMedia.call(
          navigator,
          { video: true, audio: true },
          (stream: MediaStream) => resolve(stream),
          (err: any) => reject(err),
        );
      });
    }

    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      throw new Error(
        "برای دسترسی به دوربین روی موبایل، سایت باید روی HTTPS باشد. لطفاً مطمئن شوید آدرس با https:// شروع می‌شود (یک قفل کنار آدرس باید دیده شود).",
      );
    }

    const isMobile = isMobileDevice();
    const isIOS = isIOSSafari();

    const attempts: Array<{ label: string; constraints: MediaStreamConstraints }> = [];
    if (isIOS) {
      attempts.push(
        { label: "iOS simple", constraints: { video: true, audio: true } },
        { label: "iOS audio-priority", constraints: { audio: true, video: false } },
      );
    } else if (isMobile) {
      attempts.push(
        {
          label: "mobile facingMode",
          constraints: {
            video: { facingMode: "user" },
            audio: { echoCancellation: true, noiseSuppression: true },
          },
        },
        {
          label: "mobile simple",
          constraints: { video: true, audio: true },
        },
      );
    } else {
      attempts.push(
        {
          label: "desktop HD",
          constraints: {
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          },
        },
        { label: "desktop simple", constraints: { video: true, audio: true } },
      );
    }

    let lastError: any = null;
    for (const attempt of attempts) {
      try {
        console.log(`[WebRTC] Trying constraints: ${attempt.label}`);
        const stream = await navigator.mediaDevices.getUserMedia(attempt.constraints);
        console.log(
          `[WebRTC] ✓ Got stream with "${attempt.label}" — video:`,
          stream.getVideoTracks().length,
          "audio:",
          stream.getAudioTracks().length,
        );
        return stream;
      } catch (err: any) {
        console.warn(`[WebRTC] Attempt "${attempt.label}" failed:`, err.name, err.message);
        lastError = err;
        if (
          err.name === "NotAllowedError" ||
          err.name === "SecurityError" ||
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError" ||
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
          break;
        }
      }
    }

    const err = lastError;
    console.error("[WebRTC] All attempts failed. Last error:", err?.name, err?.message);

    if (!err) {
      throw new Error("دسترسی به دوربین ناموفق بود. لطفاً دوباره تلاش کنید.");
    }

    if (err.name === "NotAllowedError" || err.name === "SecurityError") {
      if (isIOS) {
        throw new Error(
          "دسترسی به دوربین رد شد. در آیفون به Settings → Privacy → Camera بروید و مطمئن شوید Safari اجازه‌ی دسترسی دارد؛ سپس مرورگر را ببندید و دوباره باز کنید. همچنین می‌توانید در Safari روی آیکون «AA» کنار آدرس بزنید و Website Settings → Camera → Allow را انتخاب کنید.",
        );
      }
      if (isMobile) {
        throw new Error(
          "دسترسی به دوربین رد شد. روی آیکون قفل یا سه‌نقطه‌ی کنار آدرس سایت در مرورگر بزنید، دسترسی دوربین و میکروفون را «Allow» قرار دهید و سپس صفحه را تازه‌سازی کنید. اگر مشکل ادامه داشت، در تنظیمات گوشی به Settings → Apps → مرورگر → Permissions → Camera بروید و دسترسی را فعال کنید.",
        );
      }
      throw new Error(
        "دسترسی به دوربین رد شد. روی آیکون قفل کنار آدرس کلیک کنید و دسترسی دوربین و میکروفون را «اجازه دهید» قرار دهید، سپس دوباره تلاش کنید.",
      );
    } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      throw new Error(
        "هیچ دوربینی روی دستگاه شما پیدا نشد. لطفاً مطمئن شوید دوربین متصل و روشن است. روی گوشی ممکن است دوربین توسط برنامه دیگری در حال استفاده باشد.",
      );
    } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
      throw new Error(
        "دوربین توسط برنامه دیگری در حال استفاده است. لطفاً تمام برنامه‌های دوربین (شامل دوربین خود گوشی، اسکایپ، واتس‌اپ، ...) را ببندید و دوباره تلاش کنید.",
      );
    } else if (err.name === "OverconstrainedError") {
      throw new Error(
        "دوربین با تنظیمات درخواست‌شده کار نمی‌کند. لطفاً تنظیمات دوربین مرورگر را بررسی کنید یا از مرورگر دیگری استفاده کنید.",
      );
    } else if (err.name === "NotSupportedError") {
      throw new Error(
        "مرورگر شما از دوربین پشتیبانی نمی‌کند. لطفاً نسخه جدید Chrome یا Safari را نصب کنید.",
      );
    } else if (err.name === "AbortError") {
      throw new Error(
        "درخواست دوربین قطع شد. لطفاً مطمئن شوید اینترنت وصل است و دوباره تلاش کنید.",
      );
    } else {
      throw new Error(`خطای دوربین: ${err.message || err.name}`);
    }
  }, []);

  const initWebRTC = useCallback(async () => {
    try {
      setStatus("loading");
      setErrorMsg("");
      disposedRef.current = false;

      console.log("[WebRTC] Initializing for session:", sessionId, "room:", roomName);

      // Step 1: Get camera + microphone (PRIORITY — must succeed)
      const stream = await requestMediaAccess();

      if (!stream) {
        setStatus("permission");
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setCamOn(true);
      setMicOn(true);

      // Step 2: شروع حلقه سیگنالینگ
      startSignalingPoll();
      setStatus("ready");

      // Step 3: مهمان — ارسال فوری offer برای اتصال به میزبان
      if (!isHost) {
        await sendOffer();
      }
    } catch (err) {
      console.error("[WebRTC] Init error:", err);
      setErrorMsg(err instanceof Error ? err.message : "خطا در راه‌اندازی");
      setStatus("error");
    }
  }, [sessionId, roomName, isHost, requestMediaAccess, startSignalingPoll, sendOffer]);

  // Initialize on mount
  useEffect(() => {
    initWebRTC();
    return () => {
      // میزبان هنگام خروج، سیگنالینگ جلسه را پاک می‌کند تا جلسه‌های
      // بعدی همین اتاق با وضعیت تمیز شروع شوند.
      if (isHost) {
        fetch(`/api/sessions/${sessionId}/signal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "clear" }),
        }).catch(() => {});
      }
      cleanup();
      clearSessionParticipants();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach local stream to video element when both are ready
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log("[WebRTC] Attaching local stream to video element");
      const videoEl = localVideoRef.current;
      try { videoEl.srcObject = null; } catch {}
      videoEl.srcObject = localStream;
      videoEl.muted = true; // avoid echo
      videoEl.setAttribute("playsinline", "true");
      videoEl.setAttribute("autoplay", "true");
      const tryPlay = (retries: number) => {
        videoEl.play().then(() => {
          console.log("[WebRTC] ✓ Local video playing");
        }).catch((e: any) => {
          console.warn(`[WebRTC] Local video play failed (attempt ${3 - retries}/3):`, e.name);
          if (retries > 0 && (e.name === "AbortError" || e.name === "NotAllowedError")) {
            setTimeout(() => tryPlay(retries - 1), e.name === "AbortError" ? 200 : 500);
          }
        });
      };
      tryPlay(3);
    }
  }, [localStream, status]);

  // Attach remote streams to video elements when participants change
  useEffect(() => {
    participants.forEach((p, id) => {
      const videoEl = remoteVideoRefs.current.get(id);
      if (videoEl && p.stream && videoEl.srcObject !== p.stream) {
        videoEl.srcObject = p.stream;
        videoEl.play().catch(() => {
          setTimeout(() => {
            videoEl.play().catch(() => {});
          }, 300);
        });
      }
    });
  }, [participants]);

  // Toggle microphone
  function toggleMic() {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => (t.enabled = !micOn));
      setMicOn(!micOn);
    }
  }

  // Toggle camera
  function toggleCam() {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => (t.enabled = !camOn));
      setCamOn(!camOn);
    }
  }

  // Copy room link
  function copyRoomLink() {
    const link = `${window.location.origin}/?room=${roomName}`;
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Hangup
  function handleHangup() {
    cleanup();
    onHangup?.();
  }

  const participantList = Array.from(participants.values());
  const totalParticipants = participantList.length + 1; // +1 for self

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-gradient-to-br from-[#0b0a08] to-[#17150f]">
      {/* Loading overlay — only shown BEFORE we get a local stream */}
      {status === "loading" && !localStream && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-gradient-to-br from-[#0b0a08] to-[#17150f]">
          <div className="flex flex-col items-center gap-4 text-white">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="grid h-20 w-20 place-items-center rounded-full bg-noor-yellow/20"
            >
              <Camera className="h-10 w-10 text-noor-yellow" />
            </motion.div>
            <div className="text-center">
              <p className="font-display text-lg">در حال درخواست دوربین...</p>
              <p className="mt-1 text-xs text-muted-foreground">
                اگر مرورگر اجازه خواست، «اجازه دادن» را بزنید
              </p>
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-noor-yellow" />
          </div>
        </div>
      )}

      {/* Permission needed overlay */}
      {status === "permission" && (
        <div className="absolute inset-0 z-20 overflow-y-auto bg-gradient-to-br from-[#0b0a08] to-[#17150f] p-4 sm:p-6">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-6 text-center text-white">
            <ShieldAlert className="h-12 w-12 text-noor-yellow" />
            <div>
              <p className="font-display text-lg">دسترسی به دوربین لازم است</p>
              <p className="mt-1 text-xs text-muted-foreground">
                برای شرکت در محفل تصویری، باید دسترسی دوربین و میکروفون را اجازه دهید.
              </p>
            </div>
            <button
              onClick={() => initWebRTC()}
              className="flex items-center gap-2 rounded-full bg-noor-yellow px-4 py-2 text-sm font-bold text-noor-navy"
            >
              <Camera className="h-4 w-4" />
              درخواست مجدد دسترسی
            </button>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {status === "error" && (
        <div className="absolute inset-0 z-20 overflow-y-auto bg-gradient-to-br from-[#0b0a08] to-[#17150f] p-4 sm:p-6">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-6 text-center text-white">
            <AlertCircle className="h-12 w-12 text-noor-coral" />
            <div>
              <p className="font-display text-lg">خطا در راه‌اندازی دوربین</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {errorMsg}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => {
                  cleanup();
                  setStatus("loading");
                  setErrorMsg("");
                  initWebRTC();
                }}
                className="flex items-center gap-2 rounded-full bg-noor-yellow px-4 py-2 text-sm font-bold text-noor-navy"
              >
                <RefreshCw className="h-4 w-4" />
                تلاش مجدد
              </button>
              <button
                onClick={handleHangup}
                className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/25"
              >
                بازگشت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video grid — only shown when ready */}
      {(status === "ready" || (localStream && status !== "error")) && (
        <div className="flex-1 overflow-auto p-2">
          <div
            className={cn(
              "grid h-full gap-2",
              totalParticipants <= 1 && "grid-cols-1",
              totalParticipants === 2 && "grid-cols-2",
              totalParticipants <= 4 && "grid-cols-2",
              totalParticipants <= 6 && "grid-cols-3",
              totalParticipants > 6 && "grid-cols-4",
            )}
          >
            {/* Local video — ALWAYS show video element */}
            <div className="relative overflow-hidden rounded-xl bg-black/40 ring-2 ring-noor-yellow/50">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                controls={false}
                preload="auto"
                className="h-full w-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              {/* Overlay when camera is off */}
              {!camOn && (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#0b0a08]/80 to-[#080706]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-noor-yellow/20 text-2xl font-bold text-noor-yellow">
                      {displayName.charAt(0)}
                    </div>
                    <span className="text-xs text-muted-foreground">دوربین خاموش</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-noor-green" />
                {displayName} (شما)
              </div>
              {!micOn && (
                <div className="absolute bottom-1 left-1 grid h-6 w-6 place-items-center rounded bg-noor-coral/80">
                  <MicOff className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* Remote videos */}
            {participantList.map((p) => (
              <div
                key={p.id}
                className="relative overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/10"
              >
                <video
                  ref={(el) => {
                    if (el) remoteVideoRefs.current.set(p.id, el);
                  }}
                  autoPlay
                  playsInline
                  controls={false}
                  preload="auto"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-noor-sky" />
                  {p.name}
                </div>
              </div>
            ))}

            {/* "Waiting for rival" placeholder */}
            {participantList.length === 0 && (
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/0 ring-1 ring-dashed ring-white/20">
                <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-3 p-4 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="grid h-14 w-14 place-items-center rounded-full bg-noor-yellow/15"
                  >
                    <Users className="h-7 w-7 text-noor-yellow" />
                  </motion.div>
                  <div>
                    <p className="font-display text-sm text-white sm:text-base">
                      در انتظار اتصال رقیب...
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                      تصویر شما آماده است. رقیب شما به‌محض ورود به این جلسه
                      ویدیوی او هم نمایش داده می‌شود.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-[10px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin text-noor-yellow" />
                    <span>اتصال خودکار انجام می‌شود</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Small "connecting" indicator */}
      {status === "loading" && localStream && (
        <div className="absolute right-2 top-12 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur">
          <Loader2 className="h-3 w-3 animate-spin text-noor-yellow" />
          <span>در حال اتصال به شبکه...</span>
        </div>
      )}

      {/* Top bar: Room info + participant count */}
      {(status === "ready" || localStream) && (
        <>
          <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur">
              <Users className="h-3.5 w-3.5 text-noor-sky" />
              <span>{totalParticipants} نفر</span>
            </div>
            <button
              onClick={copyRoomLink}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur transition hover:bg-black/70"
              title="کپی لینک دعوت"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-noor-green" />
                  کپی شد
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  لینک دعوت
                </>
              )}
            </button>
          </div>

          {/* Bottom control bar */}
          <div className="pointer-events-auto absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full bg-black/60 p-2 backdrop-blur-md">
              <button
                onClick={toggleMic}
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-full transition",
                  micOn
                    ? "bg-white/15 text-white hover:bg-white/25"
                    : "bg-noor-coral text-white hover:bg-noor-coral/80",
                )}
                title={micOn ? "قطع میکروفون" : "وصل میکروفون"}
              >
                {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>

              <button
                onClick={toggleCam}
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-full transition",
                  camOn
                    ? "bg-white/15 text-white hover:bg-white/25"
                    : "bg-noor-coral text-white hover:bg-noor-coral/80",
                )}
                title={camOn ? "قطع دوربین" : "وصل دوربین"}
              >
                {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>

              <button
                onClick={handleHangup}
                className="grid h-10 w-12 place-items-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
                title="خروج از جلسه"
              >
                <Phone className="h-5 w-5 rotate-[135deg]" />
              </button>
            </div>
          </div>

          {/* Connection status indicator */}
          <div className="pointer-events-none absolute right-2 top-2 z-10">
            <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur">
              <Wifi className="h-3.5 w-3.5 text-noor-green" />
              <span>متصل</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
