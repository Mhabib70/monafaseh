"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNoorStore } from "@/store/noor-store";
import type { ViewName } from "@/lib/noorcraft/types";
import { NoorHeader } from "@/components/noorcraft/noor-header";
import { NoorFooter } from "@/components/noorcraft/noor-footer";
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
import { EitaaMiniApp } from "@/components/noorcraft/eitaa-mini-app";
import { BottomNav } from "@/components/noorcraft/bottom-nav";
import { HomeFeedView } from "@/components/noorcraft/views/home-feed-view";
import { ProfileView } from "@/components/noorcraft/views/profile-view";

export default function Home() {
  const view = useNoorStore((s) => s.view);
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const setProfileUserId = useNoorStore((s) => s.setProfileUserId);
  const signIn = useNoorStore((s) => s.signIn);
  const setActiveSession = useNoorStore((s) => s.setActiveSession);

  // ============================================================
  // لینک‌های مستقیم (deep links) — برای پیام‌های کانال ایتا
  //   /?view=sessions          → فهرست محافل
  //   /?view=challenge         → صفحه چالش
  //   /?view=masters           → فهرست استادان
  //   /?session=<id>           → پیوستن مستقیم به یک محفل مشخص
  // ============================================================
  const deepLinkDone = useRef(false);
  const userLinkDone = useRef(false);

  // لینک مستقیم پروفایل عمومی: /?user=ID — بدون نیاز به لاگین
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
        "sessions",
        "challenge",
        "masters",
        "blog",
        "buy-credits",
        "donate",
        "lounge",
        "auth",
        "dashboard",
      ];

      if (requestedView && allowed.includes(requestedView)) {
        sessionStorage.setItem("monafaseh:pendingView", requestedView);
        setView(requestedView as ViewName);
      }

      if (requestedSession) {
        sessionStorage.setItem("monafaseh:pendingSession", requestedSession);
        setView("sessions");
      }
    } catch {
      // بدون دسترسی به URL — بی‌صدا رد شو
    }
  }, [setView]);

  // Auto-restore user from cookie on mount — so users stay logged in across reloads.
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.user) {
          signIn(data.user);
          // کاربران لاگین‌شده روی لندینگ می‌مانند — خودشان انتخاب می‌کنند کجا بروند
        }
      })
      .catch(() => {
        // Not logged in — silently ignore; user can still use landing page.
      });
  }, [signIn, view, setView]);

  // Guard: protected views require a user
  useEffect(() => {
    const needsAuth =
      view === "feed" ||
      view === "dashboard" ||
      view === "create-session" ||
      view === "session-room" ||
      view === "results" ||
      view === "lounge" ||
      view === "lounge-room" ||
      view === "challenge" ||
      view === "verification" ||
      view === "buy-credits" ||
      view === "masters" ||
      view === "bank-info" ||
      view === "donate";
    if (needsAuth && !user) {
      setView("auth");
    }
  }, [view, user, setView]);

  // بعد از ورود کاربر: لینک مستقیم را اجرا کن (view درخواستی یا پیوستن به محفل)
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

  // Hide footer for immersive views
  const immersive = view === "session-room";

  return (
    <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
      <EitaaMiniApp />
      <NoorHeader />
      <main className="flex-1">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {view === "landing" && <LandingView />}
              {view === "feed" && user && <HomeFeedView />}
              {view === "profile" && <ProfileView />}
              {view === "auth" && <AuthView />}
              {view === "dashboard" && user && <DashboardView />}
              {view === "sessions" && <SessionsView />}
              {view === "create-session" && user && <CreateSessionView />}
              {view === "session-room" && user && <SessionRoomView />}
              {view === "results" && user && <ResultsView />}
              {view === "lounge" && user && <LoungeView />}
              {view === "lounge-room" && user && <LoungeRoomView />}
              {view === "challenge" && user && <ChallengeView />}
              {view === "blog" && <BlogView />}
              {view === "blog-post" && <BlogView />}
              {view === "admin" && user && <AdminView />}
              {view === "verification" && user && <VerificationView />}
              {view === "buy-credits" && user && <BuyCreditsView />}
              {view === "masters" && user && <MastersView />}
              {view === "bank-info" && user && <BankInfoView />}
              {view === "donate" && user && <DonateView />}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>
      {!immersive && (
        <div className="hidden md:block">
          <NoorFooter />
        </div>
      )}
      {user && !immersive && view !== "admin" && <BottomNav />}
    </div>
  );
}
