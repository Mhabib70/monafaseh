"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, MapPin, Mic2, Globe2, UserPlus, X, Radio, UserRound } from "lucide-react";
import { NoorAvatar } from "./noor-avatar";
import { NoorBadge } from "./noor-badge";
import { NoorButton } from "./noor-button";
import { VerifiedName } from "./verified-badge";
import { useToast } from "@/hooks/use-toast";
import { useNoorStore } from "@/store/noor-store";

interface OnlineUsersBarProps {
  maxVisible?: number;
  compact?: boolean;
}

const statusConfig = {
  reciting: {
    label: "در حال تلاوت",
    color: "#FF7F7F",
    pulse: true,
  },
  listening: {
    label: "در حال شنیدن",
    color: "#87CEEB",
    pulse: false,
  },
  waiting: {
    label: "در انتظار",
    color: "#FFD700",
    pulse: false,
  },
  idle: {
    label: "آنلاین",
    color: "#7CFC00",
    pulse: false,
  },
};

export function OnlineUsersBar({ maxVisible = 8, compact = false }: OnlineUsersBarProps) {
  const setView = useNoorStore((s) => s.setView);
  const setProfileUserId = useNoorStore((s) => s.setProfileUserId);
  const [showAll, setShowAll] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const { toast } = useToast();
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/online")
      .then((r) => { if (!r.ok) throw new Error("skip"); return r.json(); })
      .then((d) => { if (d.ok) setOnlineUsers(d.online || []); })
      .catch(() => {});
  }, []);

  const allUsers = onlineUsers;
  const visibleUsers = allUsers.slice(0, maxVisible);
  const remainingCount = allUsers.length - maxVisible;
  const totalCount = allUsers.length;

  function handleInvite(invitedUser: any) {
    const activeSession = useNoorStore.getState().activeSession;
    if (!activeSession) {
      toast({
        title: "محفلی فعال نیست",
        description: "ابتدا یک محفل تشکیل دهید یا به محفلی بپیوندید، سپس کاربران را دعوت کنید.",
        variant: "destructive",
      });
      setSelectedUser(null);
      return;
    }
    // Send a real invitation via API
    fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inviteeId: invitedUser.id,
        inviteeName: invitedUser.fullName,
        sessionId: activeSession.id,
        sessionTitle: activeSession.title,
        jitsiRoom: activeSession.jitsiRoom,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          toast({
            title: "دعوت ارسال شد! 📨",
            description: `${invitedUser.fullName} به محفل «${activeSession.title}» دعوت شد. در انتظار پاسخ...`,
          });
        } else {
          throw new Error(data.error);
        }
      })
      .catch(() => {
        toast({
          title: "خطا در ارسال دعوت",
          description: "لطفاً دوباره تلاش کنید",
          variant: "destructive",
        });
      });
    setSelectedUser(null);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Online count badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-noor-green/15 px-2.5 py-1 text-xs font-bold text-noor-navy dark:text-lime-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-noor-green opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-noor-green" />
          </span>
          {totalCount.toLocaleString("fa-IR")} آنلاین
        </div>

        {/* Avatar stack — hidden on small screens */}
        {!compact && (
          <div className="hidden items-center md:flex">
            <div className="flex -space-x-3 space-x-reverse">
              {visibleUsers.map((user, i) => (
                <motion.button
                  key={user.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
                  whileHover={{ y: -3, zIndex: 10 }}
                  onClick={() => setSelectedUser(user)}
                  className="relative rounded-full ring-2 ring-white dark:ring-background"
                  title={`${user.fullName} — ${user.city}`}
                >
                  <NoorAvatar
                    name={user.fullName}
                    color={user.avatarColor}
                    avatarUrl={user.avatarUrl}
                    size="sm"
                    verified={user.verificationStatus === "approved"} rank={user.qariRank}
                  />
                  {/* Status dot */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-background ${
                      (statusConfig as any)[user.status]?.pulse ? "animate-pulse" : ""
                    }`}
                    style={{ background: (statusConfig as any)[user.status]?.color || "#7CFC00" }}
                  />
                </motion.button>
              ))}
            </div>

            {/* "+N more" button */}
            {remainingCount > 0 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: visibleUsers.length * 0.05 }}
                whileHover={{ y: -2 }}
                onClick={() => setShowAll(true)}
                className="mr-2 grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground ring-2 ring-white transition hover:bg-noor-yellow/30 dark:ring-background"
              >
                +{remainingCount.toLocaleString("fa-IR")}
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Full list modal */}
      <AnimatePresence>
        {showAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAll(false)}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-3xl bg-card p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-2xl font-bold">
                    <Users className="h-6 w-6 text-noor-green" />
                    کاربران آنلاین
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {totalCount.toLocaleString("fa-IR")} نفر در حال حاضر آنلاین هستند
                  </p>
                </div>
                <button
                  onClick={() => setShowAll(false)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid max-h-96 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {allUsers.map((user, i) => (
                  <OnlineUserCard
                    key={user.id}
                    user={user}
                    index={i}
                    onInvite={() => handleInvite(user)}
                    onClick={() => {
                      setSelectedUser(user);
                      setShowAll(false);
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User detail modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedUser(null)}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <NoorAvatar
                      name={selectedUser.fullName}
                      color={selectedUser.avatarColor}
                      avatarUrl={selectedUser.avatarUrl}
                      size="lg"
                      verified={selectedUser.verificationStatus === "approved"}
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full ring-4 ring-card ${
                        (statusConfig as any)[selectedUser.status ?? "idle"]?.pulse ? "animate-pulse" : ""
                      }`}
                      style={{ background: (statusConfig as any)[selectedUser.status ?? "idle"]?.color || "#7CFC00" }}
                    />
                  </div>
                  <div>
                    <VerifiedName
                      name={selectedUser.fullName}
                      verified={selectedUser.verificationStatus === "approved"}
                      size={18}
                      className="text-xl font-bold"
                    />
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: (statusConfig as any)[selectedUser.status ?? "idle"]?.color || "#7CFC00" }}
                      />
                      {(statusConfig as any)[selectedUser.status ?? "idle"]?.label || "آنلاین"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 rounded-2xl bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    موقعیت
                  </span>
                  <span className="font-bold">
                    {selectedUser.province} — {selectedUser.city}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Mic2 className="h-4 w-4" />
                    نوع تلاوت
                  </span>
                  <NoorBadge variant="sky">{selectedUser.recitationType}</NoorBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Globe2 className="h-4 w-4" />
                    ملیت قاری
                  </span>
                  <span className="font-bold">
                    {selectedUser.reciterNationality === "iranian" ? "ایرانی" : "غیرایرانی"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Radio className="h-4 w-4" />
                    قاری اقتدا
                  </span>
                  <span className="text-xs font-bold">{selectedUser.favoriteReciter}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <NoorButton
                  variant="green"
                  size="lg"
                  onClick={() => handleInvite(selectedUser)}
                  leftIcon={<UserPlus className="h-5 w-5" />}
                >
                  دعوت به محفل
                </NoorButton>
                <NoorButton
                  variant="sky"
                  size="lg"
                  onClick={() => {
                    setSelectedUser(null);
                    setProfileUserId(selectedUser.id);
                    setView("profile");
                  }}
                  leftIcon={<UserRound className="h-5 w-5" />}
                >
                  صفحه پروفایل
                </NoorButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function OnlineUserCard({
  user,
  index,
  onInvite,
  onClick,
}: {
  user: any;
  index: number;
  onInvite: () => void;
  onClick: () => void;
}) {
  const status = user.status ?? "idle";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 rounded-2xl border-2 border-muted/30 bg-card p-3 transition hover:border-noor-sky/40"
    >
      <button onClick={onClick} className="flex flex-1 items-center gap-3 text-right">
        <div className="relative">
          <NoorAvatar
            name={user.fullName}
            color={user.avatarColor}
            avatarUrl={user.avatarUrl}
            size="md"
            verified={user.verificationStatus === "approved"} rank={user.qariRank}
          />
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-card ${
              (statusConfig as any)[status]?.pulse ? "animate-pulse" : ""
            }`}
            style={{ background: (statusConfig as any)[status]?.color || "#7CFC00" }}
          />
        </div>
        <div className="flex-1">
          <VerifiedName
            name={user.fullName}
            verified={user.verificationStatus === "approved"} rank={user.qariRank}
            size={14}
            className="text-sm font-bold"
          />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {user.city}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: (statusConfig as any)[status]?.color || "#7CFC00" }}
            />
            <span className="text-[10px] text-muted-foreground">
              {(statusConfig as any)[status]?.label || "آنلاین"}
            </span>
          </div>
        </div>
      </button>
      <button
        onClick={onInvite}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-noor-green/20 text-noor-navy transition hover:bg-noor-green/40 dark:text-lime-300"
        title="دعوت به محفل"
      >
        <UserPlus className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
