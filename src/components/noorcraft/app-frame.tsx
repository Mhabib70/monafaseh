"use client";

// ============================================================
// AppFrame — حالت اپلیکیشن منافسه (نه سایت!)
// موبایل: تمام‌عرض · دسکتاپ: ستون مرکزی ۴۳۰px روی صحنه تیره
// حس «گوشی واقعی» را در دسکتاپ حفظ می‌کند و در موبایل بومی است
// ============================================================

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { useNoorStore } from "@/store/noor-store";
import type { ViewName } from "@/lib/noorcraft/types";
// پل توکن احراز هویت — با همین import به‌صورت خودکار نصب می‌شود
// تا درخواست‌های /api در حالت iframe پیش‌نمایش هدر x-auth-token بگیرند
import { installAuthTokenBridge } from "@/lib/client-token";
import { ErrorBoundary } from "@/components/noorcraft/error-boundary";
import { LandingView } from "@/components/noorcraft/views/landing-view";
import { AuthView } from "@/components/noorcraft/views/auth-view";
import { DashboardView } from "@/components/noorcraft/views/dashboard-view";
import { SessionsView } from "@/components/noorcraft/views/sessions-view";
import { CreateSessionView } from "@/components/noorcraft/views/create-session-view";
import { SessionRoomView } from "@/components/noorcraft/views/session-room-view";
import { ResultsView } from "@/components/noorcraft/views/results-view";
import { LoungeView } from "@/components/noorcraft/views/lounge-view";
import { LoungeRoomView } from "@/components/noorcraft/views/lounge-room-view";
import { ChallengeView } from "@/components/noorcraft/views/challenge-view";
import { BlogView } from "@/components/noorcraft/views/blog-view";
import { AdminView } from "@/components/noorcraft/views/admin-view";
import { VerificationView } from "@/components/noorcraft/views/verification-view";
import { BuyCreditsView } from "@/components/noorcraft/views/buy-credits-view";
import { MastersView } from "@/components/noorcraft/views/masters-view";
import { BankInfoView } from "@/components/noorcraft/views/bank-info-view";
import { DonateView } from "@/components/noorcraft/views/donate-view";
import { HomeFeedView } from "@/components/noorcraft/views/home-feed-view";
import { ProfileView } from "@/components/noorcraft/views/profile-view";
import { BottomNav } from "@/components/noorcraft/bottom-nav";

/** نوار وضعیت شبه‌iOS — فقط در دسکتاپ نمایش داده می‌شود تا حس گوشی کامل شود */
function FakeStatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-bold text-white/80 select-none">
      <span dir="ltr">9:41</span>
      <span className="flex items-center gap-1.5" aria-hidden>
        <svg width="15" height="10" viewBox="0 0 15 10" fill="currentColor"><rect x="0" y="6" width="2.5" height="4" rx="0.5"/><rect x="4" y="4" width="2.5" height="6" rx="0.5"/><rect x="8" y="2" width="2.5" height="8" rx="0.5"/><rect x="12" y="0" width="2.5" height="10" rx="0.5"/></svg>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><path d="M7 9.5 1.5 4a7.8 7.8 0 0 1 11 0L7 9.5Z"/></svg>
        <svg width="20" height="10" viewBox="0 0 20 10" fill="none" stroke="currentColor"><rect x="0.5" y="0.5" width="16" height="9" rx="2.5"/><rect x="2.5" y="2.5" width="10" height="5" rx="1" fill="currentColor" stroke="none"/><path d="M18.5 3.5v3" strokeWidth="1.4" strokeLinecap="round"/></svg>
      </span>
    </div>
  );
}

export function AppFrame() {
  const view = useNoorStore((s) => s.view);
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const setProfileUserId = useNoorStore((s) => s.setProfileUserId);
  const signIn = useNoorStore((s) => s.signIn);
  const setActiveSession = useNoorStore((s) => s.setActiveSession);

  const [showStatusBar, setShowStatusBar] = useState(false);

  // نمایش نوار وضعیت فقط در دسکتاپ (عرض بزرگ) — در موبایل نوار واقعی گوشی هست
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setShowStatusBar(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // ============================================================
  // لینک‌های مستقیم (deep links) — برای پیام‌های کانال ایتا
  // ============================================================
  const deepLinkDone = useRef(false);
  const userLinkDone = useRef(false);

  useEffect(() => {
    if (userLinkDone.current) return;
    userLinkDone.current = true;
    try {
      const uid = new URLSearchParams(window.location.search).get("user");
      if (uid) {
        setProfileUserId(uid);
        setView("profile");
      }
    } catch {}
  }, [setProfileUserId, setView]);

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const requestedView = sp.get("view");
      const requestedSession = sp.get("session");
      const allowed: string[] = [
        "sessions", "challenge", "masters", "blog", "buy-credits",
        "donate", "lounge", "auth", "dashboard", "create-session",
        "verification", "bank-info", "feed", "profile",
      ];

      if (requestedView && allowed.includes(requestedView)) {
        sessionStorage.setItem("monafaseh:pendingView", requestedView);
        setView(requestedView as ViewName);
      }

      if (requestedSession) {
        sessionStorage.setItem("monafaseh:pendingSession", requestedSession);
        setView("sessions");
      }
    } catch {}
  }, [setView]);

  // Auto-restore user from cookie on mount
  useEffect(() => {
    // پل توکن — قبل از بازیابی نشست نصب شود (حالت iframe پیش‌نمایش)
    installAuthTokenBridge();
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.user) {
          signIn(data.user);
          // حالت اپ: کاربر واردشده مستقیم به خانه می‌رود (مگر در صفحه ورود یا لینک مستقیم)
          if (useNoorStore.getState().view === "landing") {
            setView("feed");
          }
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signIn]);

  // Guard: protected views require a user
  useEffect(() => {
    const needsAuth =
      view === "feed" || view === "dashboard" || view === "create-session" ||
      view === "session-room" || view === "results" || view === "lounge" ||
      view === "lounge-room" || view === "challenge" || view === "verification" ||
      view === "buy-credits" || view === "masters" || view === "bank-info" || view === "donate";
    if (needsAuth && !user) {
      setView("auth");
    }
  }, [view, user, setView]);

  // بعد از ورود کاربر: لینک مستقیم را اجرا کن
  useEffect(() => {
    if (!user || deepLinkDone.current) return;
    deepLinkDone.current = true;

    let pendingView: string | null = null;
    let pendingSession: string | null = null;
    try {
      pendingView = sessionStorage.getItem("monafaseh:pendingView");
      pendingSession = sessionStorage.getItem("monafaseh:pendingSession");
      sessionStorage.removeItem("monafaseh:pendingView");
      sessionStorage.removeItem("monafaseh:pendingSession");
    } catch {
      return;
    }

    if (pendingSession) {
      const sessionId = pendingSession;
      (async () => {
        try {
          const joinRes = await fetch(`/api/sessions/${sessionId}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          });
          const joinData = await joinRes.json();
          if (!joinData?.ok) {
            setView("sessions");
            return;
          }
          const list = await fetch("/api/sessions", { cache: "no-store" }).then((r) => r.json());
          const found = (list?.sessions ?? []).find((s: { id: string }) => s.id === sessionId);
          if (!found) {
            setView("sessions");
            return;
          }
          setActiveSession({
            ...found,
            jitsiRoom: joinData.jitsiRoom ?? found.jitsiRoom,
          } as never);
          setView("session-room");
        } catch {
          setView("sessions");
        }
      })();
      return;
    }

    if (pendingView) {
      setView(pendingView as ViewName);
    }
  }, [user, setView, setActiveSession]);

  // صفحات تمام‌صفحه (بدون فریم گوشی)
  const fullscreen = view === "session-room" || view === "lounge-room" || view === "admin";

  if (fullscreen) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              {view === "session-room" && user && <SessionRoomView />}
              {view === "lounge-room" && user && <LoungeRoomView />}
              {view === "admin" && user && <AdminView />}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="app-stage min-h-screen">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background lg:my-6 lg:min-h-[calc(100vh-3rem)] lg:rounded-[2.2rem] lg:border-2 lg:border-[#2E2E2A] lg:shadow-[0_20px_60px_rgba(0,0,0,0.6)] lg:overflow-hidden">
        {/* نوار وضعیت شبه iOS در دسکتاپ */}
        {showStatusBar && (
          <div className="bg-background">
            <FakeStatusBar />
          </div>
        )}

        <main className="flex-1 pb-24 lg:pb-28">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {view === "landing" && <LandingView />}
                {view === "feed" && user && <HomeFeedView />}
                {view === "profile" && <ProfileView />}
                {view === "auth" && <AuthView />}
                {view === "dashboard" && user && <DashboardView />}
                {view === "sessions" && <SessionsView />}
                {view === "create-session" && user && <CreateSessionView />}
                {view === "results" && user && <ResultsView />}
                {view === "lounge" && user && <LoungeView />}
                {view === "challenge" && user && <ChallengeView />}
                {view === "blog" && <BlogView />}
                {view === "blog-post" && <BlogView />}
                {view === "verification" && user && <VerificationView />}
                {view === "buy-credits" && user && <BuyCreditsView />}
                {view === "masters" && user && <MastersView />}
                {view === "bank-info" && user && <BankInfoView />}
                {view === "donate" && user && <DonateView />}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>

        {user && view !== "admin" && <BottomNav />}
      </div>
    </div>
  );
}
