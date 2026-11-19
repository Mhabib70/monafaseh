"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useNoorStore } from "@/store/noor-store";
import type { ViewName } from "@/lib/noorcraft/types";
import { NoorHeader } from "@/components/noorcraft/noor-header";
import { NoorFooter } from "@/components/noorcraft/noor-footer";
import { ErrorBoundary } from "@/components/noorcraft/error-boundary";
import { LandingView } from "@/components/noorcraft/views/landing-view";
import { EitaaMiniApp } from "@/components/noorcraft/eitaa-mini-app";
import { BottomNav } from "@/components/noorcraft/bottom-nav";

function ViewLoadingFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="mt-4 h-4 w-72 animate-pulse rounded bg-muted" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((k) => (
          <div key={k} className="h-44 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}

const AuthView = dynamic(
  () => import("@/components/noorcraft/views/auth-view").then((m) => m.AuthView),
  { loading: () => <ViewLoadingFallback /> },
);
const DashboardView = dynamic(
  () => import("@/components/noorcraft/views/dashboard-view").then((m) => m.DashboardView),
  { loading: () => <ViewLoadingFallback /> },
);
const SessionsView = dynamic(
  () => import("@/components/noorcraft/views/sessions-view").then((m) => m.SessionsView),
  { loading: () => <ViewLoadingFallback /> },
);
const CreateSessionView = dynamic(
  () =>
    import("@/components/noorcraft/views/create-session-view").then(
      (m) => m.CreateSessionView,
    ),
  { loading: () => <ViewLoadingFallback /> },
);
const SessionRoomView = dynamic(
  () =>
    import("@/components/noorcraft/views/session-room-view").then((m) => m.SessionRoomView),
  { loading: () => <ViewLoadingFallback /> },
);
const ResultsView = dynamic(
  () => import("@/components/noorcraft/views/results-view").then((m) => m.ResultsView),
  { loading: () => <ViewLoadingFallback /> },
);
const LoungeView = dynamic(
  () => import("@/components/noorcraft/views/lounge-view").then((m) => m.LoungeView),
  { loading: () => <ViewLoadingFallback /> },
);
const LoungeRoomView = dynamic(
  () => import("@/components/noorcraft/views/lounge-room-view").then((m) => m.LoungeRoomView),
  { loading: () => <ViewLoadingFallback /> },
);
const ChallengeView = dynamic(
  () => import("@/components/noorcraft/views/challenge-view").then((m) => m.ChallengeView),
  { loading: () => <ViewLoadingFallback /> },
);
const BlogView = dynamic(
  () => import("@/components/noorcraft/views/blog-view").then((m) => m.BlogView),
  { loading: () => <ViewLoadingFallback /> },
);
const AdminView = dynamic(
  () => import("@/components/noorcraft/views/admin-view").then((m) => m.AdminView),
  { loading: () => <ViewLoadingFallback /> },
);
const VerificationView = dynamic(
  () =>
    import("@/components/noorcraft/views/verification-view").then((m) => m.VerificationView),
  { loading: () => <ViewLoadingFallback /> },
);
const BuyCreditsView = dynamic(
  () => import("@/components/noorcraft/views/buy-credits-view").then((m) => m.BuyCreditsView),
  { loading: () => <ViewLoadingFallback /> },
);
const MastersView = dynamic(
  () => import("@/components/noorcraft/views/masters-view").then((m) => m.MastersView),
  { loading: () => <ViewLoadingFallback /> },
);
const BankInfoView = dynamic(
  () => import("@/components/noorcraft/views/bank-info-view").then((m) => m.BankInfoView),
  { loading: () => <ViewLoadingFallback /> },
);
const DonateView = dynamic(
  () => import("@/components/noorcraft/views/donate-view").then((m) => m.DonateView),
  { loading: () => <ViewLoadingFallback /> },
);
const HomeFeedView = dynamic(
  () => import("@/components/noorcraft/views/home-feed-view").then((m) => m.HomeFeedView),
  { loading: () => <ViewLoadingFallback /> },
);
const ProfileView = dynamic(
  () => import("@/components/noorcraft/views/profile-view").then((m) => m.ProfileView),
  { loading: () => <ViewLoadingFallback /> },
);

export default function Home() {
  const view = useNoorStore((s) => s.view);
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const setProfileUserId = useNoorStore((s) => s.setProfileUserId);
  const signIn = useNoorStore((s) => s.signIn);
  const setActiveSession = useNoorStore((s) => s.setActiveSession);

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
    } catch {}
  }, [setView]);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.user) {
          signIn(data.user);
        }
      })
      .catch(() => {});
  }, [signIn]);

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
      view === "bank-info" ||
      view === "donate";
    if (needsAuth && !user) {
      setView("auth");
    }
  }, [view, user, setView]);

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

  const immersive = view === "session-room";

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <EitaaMiniApp />
      <NoorHeader />
      <main className="flex-1">
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
              {view === "masters" && <MastersView />}
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
