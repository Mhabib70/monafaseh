"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { JITSI_CONFIG } from "@/lib/noorcraft/constants";
import { cn } from "@/lib/utils";

// Load Jitsi external API script
let jitsiScriptPromise: Promise<void> | null = null;

function loadJitsiScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if ((window as any).JitsiMeetExternalAPI) return Promise.resolve();
  if (jitsiScriptPromise) return jitsiScriptPromise;

  jitsiScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://${JITSI_CONFIG.domain}/external_api.js`;
    script.async = true;
    script.onload = () => {
      console.log("[Jitsi] External API script loaded");
      resolve();
    };
    script.onerror = () => {
      console.error("[Jitsi] Failed to load External API script");
      jitsiScriptPromise = null;
      reject(new Error("Failed to load Jitsi script"));
    };
    document.head.appendChild(script);
  });

  return jitsiScriptPromise;
}

interface JitsiMeetProps {
  roomName: string;
  displayName: string;
  avatarUrl?: string | null;
  className?: string;
  onReady?: () => void;
  onParticipantJoined?: (id: string, name: string) => void;
  onParticipantLeft?: (id: string) => void;
  onAudioMutedChange?: (muted: boolean) => void;
  onVideoMutedChange?: (muted: boolean) => void;
  onEndpointTextMessageReceived?: (senderId: string, message: string) => void;
  onHangup?: () => void;
}

export function JitsiMeet({
  roomName,
  displayName,
  avatarUrl,
  className,
  onReady,
  onParticipantJoined,
  onParticipantLeft,
  onAudioMutedChange,
  onVideoMutedChange,
  onEndpointTextMessageReceived,
  onHangup,
}: JitsiMeetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const callbacksRef = useRef({
    onReady,
    onParticipantJoined,
    onParticipantLeft,
    onAudioMutedChange,
    onVideoMutedChange,
    onEndpointTextMessageReceived,
    onHangup,
  });

  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = {
      onReady,
      onParticipantJoined,
      onParticipantLeft,
      onAudioMutedChange,
      onVideoMutedChange,
      onEndpointTextMessageReceived,
      onHangup,
    };
  });

  const initJitsi = useCallback(async () => {
    if (!containerRef.current || !roomName) return;

    let cancelled = false;

    try {
      setStatus("loading");
      console.log("[Jitsi] Loading External API script...");
      await loadJitsiScript();

      if (cancelled || !containerRef.current) return;

      const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
      if (!JitsiMeetExternalAPI) {
        throw new Error("JitsiMeetExternalAPI not available after script load");
      }

      console.log("[Jitsi] Creating meeting with room:", roomName);

      // Clean up any existing iframe in the container
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      const options = {
        roomName,
        width: "100%",
        height: "100%",
        parentNode: containerRef.current,
        configOverwrite: {
          ...JITSI_CONFIG.defaultOptions.configOverwrite,
          // Disable prejoin page so user joins directly
          prejoinPageEnabled: false,
          // Enable start with audio/video
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },
        interfaceConfigOverwrite: {
          ...JITSI_CONFIG.defaultOptions.interfaceConfigOverwrite,
        },
        userInfo: {
          displayName: displayName || "کاربر منافسه",
          avatarUrl: avatarUrl || undefined,
        },
      };

      const api = new JitsiMeetExternalAPI(JITSI_CONFIG.domain, options);
      apiRef.current = api;
      console.log("[Jitsi] API created, iframe should be visible");

      // Event listeners
      api.addEventListener("videoConferenceJoined", (e: any) => {
        console.log("[Jitsi] videoConferenceJoined", e);
        if (!cancelled) {
          setStatus("ready");
          callbacksRef.current.onReady?.();
        }
      });

      api.addEventListener("participantJoined", (e: any) => {
        console.log("[Jitsi] participantJoined", e);
        const id = e?.id || "";
        const name = e?.name || (e?.displayName as string) || "";
        callbacksRef.current.onParticipantJoined?.(id, name);
      });

      api.addEventListener("participantLeft", (e: any) => {
        console.log("[Jitsi] participantLeft", e);
        callbacksRef.current.onParticipantLeft?.(e?.id || "");
      });

      api.addEventListener("audioMuteStatusChanged", (e: any) => {
        console.log("[Jitsi] audioMuteStatusChanged", e);
        callbacksRef.current.onAudioMutedChange?.(e?.muted === true);
      });

      api.addEventListener("videoMuteStatusChanged", (e: any) => {
        console.log("[Jitsi] videoMuteStatusChanged", e);
        callbacksRef.current.onVideoMutedChange?.(e?.muted === true);
      });

      api.addEventListener("endpointTextMessageReceived", (e: any) => {
        const senderId = e?.sender?.id || "";
        const message = e?.data?.eventData?.text || "";
        callbacksRef.current.onEndpointTextMessageReceived?.(senderId, message);
      });

      api.addEventListener("hangup", () => {
        console.log("[Jitsi] hangup");
        callbacksRef.current.onHangup?.();
      });

      api.addEventListener("readyToClose", () => {
        console.log("[Jitsi] readyToClose");
        callbacksRef.current.onHangup?.();
      });

      api.addEventListener("isLoadingChanged", (e: any) => {
        console.log("[Jitsi] isLoadingChanged", e);
      });

      // Set status to ready shortly after iframe is created
      // This allows the pre-join page or meeting to be visible
      setTimeout(() => {
        if (!cancelled) {
          console.log("[Jitsi] Setting status to ready (timeout)");
          setStatus("ready");
          callbacksRef.current.onReady?.();
        }
      }, 1500);
    } catch (err) {
      if (!cancelled) {
        console.error("[Jitsi] Init error:", err);
        setErrorMsg(
          err instanceof Error ? err.message : "خطا در بارگذاری Jitsi",
        );
        setStatus("error");
      }
    }

    return () => {
      cancelled = true;
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch {
          // ignore
        }
        apiRef.current = null;
      }
    };
  }, [roomName, displayName, avatarUrl]);

  useEffect(() => {
    const cleanup = initJitsi();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [initJitsi]);

  // Update display name if it changes
  useEffect(() => {
    if (apiRef.current && displayName) {
      try {
        apiRef.current.executeCommand("displayName", displayName);
      } catch {
        // ignore
      }
    }
  }, [displayName]);

  // Update avatar if it changes
  useEffect(() => {
    if (apiRef.current && avatarUrl) {
      try {
        apiRef.current.executeCommand("avatarUrl", avatarUrl);
      } catch {
        // ignore
      }
    }
  }, [avatarUrl]);

  function handleRetry() {
    setStatus("loading");
    setErrorMsg("");
    initJitsi();
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-black", className)}>
      {/* Container for Jitsi iframe — this must be visible at all times */}
      <div ref={containerRef} className="h-full w-full" style={{ minHeight: "300px" }} />

      {/* Loading overlay — only shown briefly, then removed */}
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-gradient-to-br from-[#0b0a08] to-[#080706]">
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader2 className="h-10 w-10 animate-spin text-noor-yellow" />
            <div className="text-center">
              <p className="font-display text-base">در حال اتصال به محفل...</p>
              <p className="mt-1 text-xs text-muted-foreground">
                لطفاً چند لحظه صبر کنید
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {status === "error" && (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#0b0a08] to-[#080706] p-6">
          <div className="flex max-w-md flex-col items-center gap-3 text-center text-white">
            <AlertCircle className="h-12 w-12 text-noor-coral" />
            <div>
              <p className="font-display text-lg">اتصال برقرار نشد</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {errorMsg || "خطا در بارگذاری محفل تصویری. لطفاً دوباره تلاش کنید."}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 rounded-full bg-noor-yellow px-4 py-2 text-sm font-bold text-noor-navy"
            >
              <RefreshCw className="h-4 w-4" />
              تلاش مجدد
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
