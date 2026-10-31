"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X, Loader2 } from "lucide-react";
import { useNoorStore } from "@/store/noor-store";
import { useToast } from "@/hooks/use-toast";
import { NoorAvatar } from "./noor-avatar";
import type { SessionDetail } from "@/lib/noorcraft/types";

interface Invitation {
  id: string;
  sessionId: string;
  sessionTitle: string;
  jitsiRoom: string;
  inviterId: string;
  inviterName: string;
  inviterAvatarColor: string;
  inviteeId: string;
  inviteeName: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
  respondedAt?: number;
}

export function InvitationBell() {
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const setActiveSession = useNoorStore((s) => s.setActiveSession);
  const { toast } = useToast();

  const [pending, setPending] = useState<Invitation[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);

  // Poll for invitations
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/invitations", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (data.ok) {
          setPending(data.pending || []);

          // Show toast for responded invitations (accepted/declined by invitee)
          if (data.responded && data.responded.length > 0) {
            for (const r of data.responded) {
              if (r.status === "accepted") {
                toast({
                  title: "دعوت قبول شد! ✅",
                  description: `${r.inviteeName} دعوت شما به محفل «${r.sessionTitle}» را قبول کرد.`,
                });
              } else if (r.status === "declined") {
                toast({
                  title: "دعوت رد شد ❌",
                  description: `${r.inviteeName} دعوت شما به محفل «${r.sessionTitle}» را رد کرد.`,
                });
              }
            }
          }
        }
      } catch {}
    }

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, toast]);

  const handleAccept = useCallback(
    async (inv: Invitation) => {
      setResponding(inv.id);
      try {
        const res = await fetch(`/api/invitations/${inv.id}/accept`, {
          method: "POST",
        });
        const data = await res.json();
        if (data.ok) {
          // Also call join API to register as participant in DB
          try {
            await fetch(`/api/sessions/${inv.sessionId}/join`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            });
          } catch {}

          // Add ourselves to sessionParticipants in noor-store
          // so RecitationSetup includes us in the rotation
          const { upsertSessionParticipant } = useNoorStore.getState();
          if (user) {
            upsertSessionParticipant({
              id: user.id,
              name: user.fullName,
              avatarColor: user.avatarColor,
              avatarUrl: user.avatarUrl,
              order: 0,
            });
          }

          // Build session detail and redirect
          const session: SessionDetail = {
            id: inv.sessionId,
            title: inv.sessionTitle,
            hostId: inv.inviterId,
            hostName: inv.inviterName,
            hostGender: null,
            recitationType: "ترتیل" as const,
            reciterNationality: "foreign" as const,
            favoriteReciter: "—",
            surah: "—",
            capacity: 10,
            attendees: 2,
            status: "open",
            passwordProtected: false,
            genderRestriction: "male",
            startedAt: inv.createdAt,
            hostAvatarColor: inv.inviterAvatarColor,
            jitsiRoom: inv.jitsiRoom,
          };
          setActiveSession(session);
          toast({
            title: "وارد محفل شدید! 🎉",
            description: `به محفل «${inv.sessionTitle}» پیوستید.`,
          });
          setView("session-room");
        }
      } catch {
        toast({
          title: "خطا در قبول دعوت",
          variant: "destructive",
        });
      } finally {
        setResponding(null);
      }
    },
    [setActiveSession, setView, toast, user],
  );

  const handleDecline = useCallback(
    async (inv: Invitation) => {
      setResponding(inv.id);
      try {
        await fetch(`/api/invitations/${inv.id}/decline`, { method: "POST" });
        setPending((p) => p.filter((x) => x.id !== inv.id));
        toast({ title: "دعوت رد شد" });
      } catch {
        toast({
          title: "خطا در رد دعوت",
          variant: "destructive",
        });
      } finally {
        setResponding(null);
      }
    },
    [toast],
  );

  if (!user) return null;

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setShowDropdown((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-full bg-white/70 text-noor-navy transition hover:bg-white dark:bg-white/10 dark:text-white"
        aria-label="دعوت‌ها"
        title="دعوت‌ها"
      >
        <Bell className="h-4 w-4" />
        {pending.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-noor-coral px-1 text-[9px] font-bold text-white"
          >
            {pending.length.toLocaleString("fa-IR")}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute left-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border-2 border-noor-navy/15 bg-card shadow-2xl"
            >
              <div className="border-b border-muted/30 p-3">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <Bell className="h-4 w-4 text-noor-coral" />
                  دعوت‌های محفل
                </h3>
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {pending.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <Bell className="mx-auto mb-2 h-8 w-8 opacity-20" />
                    دعوتی در انتظار پاسخ نیست
                  </div>
                ) : (
                  pending.map((inv) => (
                    <div
                      key={inv.id}
                      className="mb-2 rounded-xl border border-muted/30 bg-muted/20 p-3"
                    >
                      {/* Inviter info */}
                      <div className="mb-2 flex items-center gap-2">
                        <NoorAvatar
                          name={inv.inviterName}
                          color={inv.inviterAvatarColor}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-noor-navy dark:text-white">
                            {inv.inviterName}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            شما را به محفل دعوت کرد
                          </div>
                        </div>
                      </div>

                      {/* Session title */}
                      <div className="mb-2 rounded-lg bg-noor-yellow/10 px-2 py-1 text-xs font-bold text-noor-navy dark:text-yellow-200">
                        📖 {inv.sessionTitle}
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(inv)}
                          disabled={responding === inv.id}
                          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-noor-green/20 px-3 py-2 text-xs font-bold text-noor-navy transition hover:bg-noor-green/30 disabled:opacity-50 dark:text-lime-300"
                        >
                          {responding === inv.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          قبول
                        </button>
                        <button
                          onClick={() => handleDecline(inv)}
                          disabled={responding === inv.id}
                          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-noor-coral/20 px-3 py-2 text-xs font-bold text-noor-coral transition hover:bg-noor-coral/30 disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                          رد
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
