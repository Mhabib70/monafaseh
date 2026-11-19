"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  ArrowRight,
  MapPin,
  Mic2,
  Radio,
  UserCheck,
  CalendarPlus,
  Coins,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNoorStore } from "@/store/noor-store";
import { NoorCard } from "../noor-card";
import { NoorButton } from "../noor-button";
import { NoorAvatar } from "../noor-avatar";
import { VerifiedName, VerifiedBadge } from "../verified-badge";
import { QARI_RANKS, qariRankDef, qariBadgeLabel } from "@/lib/noorcraft/constants";

interface Master {
  id: string;
  fullName: string;
  avatarColor: string;
  avatarUrl: string | null;
  gender: string | null;
  city: string | null;
  province: string | null;
  recitationType: string | null;
  favoriteReciter: string | null;
  verificationType: string | null;
  qariRank: string | null;
  isOfferingPrivateSessions: boolean;
  privateSessionPrice: number | null;
  noorPoints: number;
  online: boolean;
}

export function MastersView() {
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const setProfileUserId = useNoorStore((s) => s.setProfileUserId);
  const setActiveSession = useNoorStore((s) => s.setActiveSession);
  const { toast } = useToast();

  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [rankFilter, setRankFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/masters", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setMasters(d.masters ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function book(master: Master) {
    if (!user) {
      setView("auth");
      return;
    }
    setBookingId(master.id);
    try {
      const res = await fetch("/api/masters/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterId: master.id }),
      });
      const d = await res.json();
      if (!d.ok) {
        const err = new Error(d.error) as Error & { neededCredits?: number };
        if (d.neededCredits) err.neededCredits = d.neededCredits;
        throw err;
      }

      toast({
        title: "جلسه خصوصی رزرو شد",
        description: `${(master.privateSessionPrice ?? 1).toLocaleString("fa-IR")} امتیاز کسر شد. در حال انتقال به محفل خصوصی...`,
      });

      const detail = await fetch(`/api/sessions/${d.booking.sessionId}`, {
        cache: "no-store",
      });
      const sd = await detail.json();
      if (sd.ok) {
        setActiveSession(sd.session);
        setView("session-room");
      } else {
        setView("sessions");
      }
    } catch (e: unknown) {
      const err = e as Error & { neededCredits?: number };
      if (err?.neededCredits) {
        try {
          sessionStorage.setItem("monafaseh_buy_credits", String(err.neededCredits));
        } catch {}
        toast({
          title: "امتیاز کافی ندارید",
          description: `${master.fullName} برای هر جلسه ${err.neededCredits.toLocaleString("fa-IR")} امتیاز می‌گیرد — به صفحه خرید منتقل می‌شوید.`,
        });
        setView("buy-credits");
      } else {
        toast({
          title: "رزرو ناموفق",
          description: err?.message ?? "لطفاً دوباره تلاش کنید",
          variant: "destructive",
        });
      }
    } finally {
      setBookingId(null);
    }
  }

  const ranked = masters.filter(
    (m) => rankFilter === "all" || (rankFilter === "none" ? !m.qariRank : m.qariRank === rankFilter),
  );
  const online = ranked.filter((m) => m.online);
  const offline = ranked.filter((m) => !m.online);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <button
        onClick={() => setView(user ? "dashboard" : "landing")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        {user ? "بازگشت به داشبورد" : "بازگشت به صفحه اصلی"}
      </button>

      <div className="mb-6 flex items-center gap-3.5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400">
          <UserCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            قاریان و استادان تأییدشده
          </h1>
          <p className="text-sm text-muted-foreground">
            رزرو جلسه خصوصی تلاوت و رفع اشکال با قاریان احراز هویت‌شده منافسه
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setRankFilter("all")}
          className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            rankFilter === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-secondary"
          }`}
        >
          همه
        </button>
        {[...QARI_RANKS].reverse().map((r) => (
          <button
            key={r.id}
            onClick={() => setRankFilter(r.id)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              rankFilter === r.id
                ? "text-white"
                : "border-border bg-card text-foreground hover:bg-secondary"
            }`}
            style={
              rankFilter === r.id
                ? { background: r.color, borderColor: r.color }
                : undefined
            }
          >
            <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
            {r.label}
          </button>
        ))}
        <button
          onClick={() => setRankFilter("none")}
          className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            rankFilter === "none"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-secondary"
          }`}
        >
          تأییدشده
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="h-44 animate-pulse rounded-2xl border border-border bg-card p-5" />
          ))}
        </div>
      ) : masters.length === 0 ? (
        <NoorCard className="p-8 text-center">
          <VerifiedBadge size={40} />
          <p className="mt-3 text-sm text-muted-foreground">
            هنوز استاد تأییدشده‌ای ثبت نشده است — شما هم می‌توانید درخواست تیک آبی بدهید.
          </p>
        </NoorCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {online.map((m, i) => (
            <MasterCard
              key={m.id}
              master={m}
              index={i}
              onBook={() => book(m)}
              booking={bookingId === m.id}
              onOpen={() => {
                setProfileUserId(m.id);
                setView("profile");
              }}
            />
          ))}
          {offline.length > 0 && (
            <>
              <h2 className="mt-6 font-display text-base font-bold text-muted-foreground sm:col-span-2">
                آفلاین — پس از آنلاین شدن قابل رزرو هستند
              </h2>
              {offline.map((m, i) => (
                <MasterCard
                  key={m.id}
                  master={m}
                  index={i}
                  disabled
                  onOpen={() => {
                    setProfileUserId(m.id);
                    setView("profile");
                  }}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MasterCard({
  master,
  index,
  onBook,
  booking,
  onOpen,
  disabled = false,
}: {
  master: Master;
  index: number;
  onBook?: () => void;
  booking?: boolean;
  onOpen?: () => void;
  disabled?: boolean;
}) {
  const rankDef = master.qariRank ? qariRankDef(master.qariRank) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25) }}
    >
      <NoorCard className={`flex h-full flex-col ${disabled ? "opacity-65" : ""}`}>
        <div className="flex items-start gap-3">
          <button
            onClick={onOpen}
            className="relative shrink-0 transition-transform hover:scale-105"
            title="مشاهده پروفایل"
          >
            <NoorAvatar
              name={master.fullName}
              color={master.avatarColor}
              avatarUrl={master.avatarUrl}
              gender={master.gender}
              size="lg"
              verified
              rank={master.qariRank}
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-card ${
                master.online ? "bg-emerald-500" : "bg-muted-foreground"
              }`}
            />
          </button>
          <div className="min-w-0 flex-1">
            <VerifiedName
              name={master.fullName}
              verified
              rank={master.qariRank}
              size={16}
              onClick={onOpen}
              className="font-display font-bold"
            />
            {rankDef && (
              <span
                className="mt-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  background: `${rankDef.color}1a`,
                  color: rankDef.color,
                }}
              >
                {qariBadgeLabel(master.qariRank)}
              </span>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {master.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {master.city}
                </span>
              )}
              {master.recitationType && (
                <span className="inline-flex items-center gap-1">
                  <Mic2 className="h-3 w-3" />
                  {master.recitationType}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  master.online
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                }`}
              >
                <Radio className="h-3 w-3" />
                {master.online ? "آنلاین" : "آفلاین"}
              </span>
            </div>
          </div>
        </div>

        {master.favoriteReciter && (
          <p className="mt-3 text-xs text-muted-foreground">
            قاری اقتدا: <span className="font-semibold text-foreground">{master.favoriteReciter}</span>
          </p>
        )}

        {!disabled && onBook && (
          <NoorButton
            variant="yellow"
            className="mt-4 w-full tabular-nums"
            onClick={onBook}
            disabled={booking}
            leftIcon={
              booking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarPlus className="h-4 w-4" />
              )
            }
          >
            {booking
              ? "در حال رزرو..."
              : `رزرو جلسه خصوصی · ${(master.privateSessionPrice ?? 1).toLocaleString("fa-IR")} امتیاز`}
          </NoorButton>
        )}
        {disabled && (
          <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/40 py-2 text-xs tabular-nums text-muted-foreground">
            <Coins className="h-3.5 w-3.5" />
            {(master.privateSessionPrice ?? 1).toLocaleString("fa-IR")} امتیاز — پس از آنلاین شدن قابل رزرو
          </div>
        )}
      </NoorCard>
    </motion.div>
  );
}
