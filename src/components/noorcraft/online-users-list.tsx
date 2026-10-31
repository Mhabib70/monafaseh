"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, MapPin, UserPlus, Filter, Mic2 } from "lucide-react";
import { NoorCard } from "./noor-card";
import { NoorBadge } from "./noor-badge";
import { NoorAvatar } from "./noor-avatar";
import { NoorButton } from "./noor-button";
import { useToast } from "@/hooks/use-toast";
import { useNoorStore } from "@/store/noor-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusConfig = {
  reciting: { label: "در حال تلاوت", color: "#FF7F7F", pulse: true },
  listening: { label: "در حال شنیدن", color: "#87CEEB", pulse: false },
  waiting: { label: "در انتظار", color: "#FFD700", pulse: false },
  idle: { label: "آنلاین", color: "#7CFC00", pulse: false },
};

export function OnlineUsersList({ limit }: { limit?: number }) {
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/online")
      .then((r) => {
        if (!r.ok) throw new Error("not admin");
        return r.json();
      })
      .then((d) => {
        if (d.ok) setOnlineUsers(d.online || []);
      })
      .catch(() => {
        // Non-admin: show empty
      })
      .finally(() => setLoading(false));
  }, []);

  const allUsers = onlineUsers;
  const filtered =
    filter === "all"
      ? allUsers
      : allUsers.filter((u: any) => u.recitationType === filter);
  const displayUsers = limit ? filtered.slice(0, limit) : filtered;

  function handleInvite(invitedUser: any) {
    const activeSession = useNoorStore.getState().activeSession;
    if (!activeSession) {
      toast({
        title: "محفلی فعال نیست",
        description: "ابتدا یک محفل تشکیل دهید یا به محفلی بپیوندید، سپس کاربران را دعوت کنید.",
        variant: "destructive",
      });
      return;
    }
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
            description: `${invitedUser.fullName} به محفل دعوت شد. در انتظار پاسخ...`,
          });
        } else {
          throw new Error(data.error);
        }
      })
      .catch(() => {
        toast({
          title: "خطا در ارسال دعوت",
          variant: "destructive",
        });
      });
  }

  return (
    <NoorCard>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-noor-green opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-noor-green" />
            </span>
            کاربران آنلاین
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {filtered.length.toLocaleString("fa-IR")} نفر در حال حاضر آنلاین هستند
          </p>
        </div>

        {/* Filter by recitation type */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه سبک‌ها</SelectItem>
              <SelectItem value="تحقیق">تحقیق</SelectItem>
              <SelectItem value="ترتیل">ترتیل</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {displayUsers.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-2xl border-2 border-muted/30 bg-muted/20 p-3 transition hover:border-noor-sky/40 hover:bg-muted/30"
          >
            <div className="relative shrink-0">
              <NoorAvatar
                name={user.fullName}
                color={user.avatarColor}
                avatarUrl={user.avatarUrl}
                size="md"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-card ${
                  (statusConfig as any)[user.status]?.pulse ? "animate-pulse" : ""
                }`}
                style={{ background: (statusConfig as any)[user.status]?.color || "#7CFC00" }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-bold">{user.fullName}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{user.city}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <NoorBadge variant="sky" icon={<Mic2 className="h-2.5 w-2.5" />}>
                  {user.recitationType}
                </NoorBadge>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: (statusConfig as any)[user.status]?.color || "#7CFC00" }}
                >
                  {(statusConfig as any)[user.status]?.label || "آنلاین"}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleInvite(user)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-noor-green/20 text-noor-navy transition hover:bg-noor-green/40 dark:text-lime-300"
              title={`دعوت ${user.fullName} به محفل`}
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {displayUsers.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          کاربری با این فیلتر پیدا نشد
        </div>
      )}
    </NoorCard>
  );
}
