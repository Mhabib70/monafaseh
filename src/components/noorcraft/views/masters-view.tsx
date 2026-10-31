"use client";

// ============================================================
// استادان آنلاین — لیست قاریان تأییدشده (تیک آبی)
// آنلاین‌ها کادر آبی دارند و قابل رزرو هستند (۱ امتیاز = ۱ جلسه)
// ============================================================

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

  useEffect(() => {
    fetch("/api/masters", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setMasters(d.masters ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function book(master: Master) {
    setBookingId(master.id);
    try {
      const res = await fetch("/api/masters/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterId: master.id }),
      });
      const d = await res.json();
      if (!d.ok) {
        const err: any = new Error(d.error);
        if (d.neededCredits) err.neededCredits = d.neededCredits;
        throw err;
      }

      toast({
        title: "جلسه خصوصی رزرو شد 🎉",
        description: `${(master.privateSessionPrice ?? 1).toLocaleString("fa-IR")} امتیاز کسر شد. در حال انتقال به محفل خصوصی...`,
      });

      // انتقال به محفل خصوصی
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
    } catch (e: any) {
      // اگر مشکل «موجودی ناکافی» باشد، کاربر را با تعداد لازم استاد به
      // صفحه خرید می‌بریم تا دقیقاً همان تعداد امتیاز را بخرد.
      if (e?.neededCredits) {
        try {
          sessionStorage.setItem("monafaseh_buy_credits", String(e.neededCredits));
        } catch {}
        toast({
          title: "امتیاز کافی ندارید",
          description: `${master.fullName} برای هر جلسه ${e.neededCredits.toLocaleString("fa-IR")} امتیاز می‌گیرد — به صفحه خرید می‌روید تا همان تعداد را بخرید.`,
        });
        setView("buy-credits");
      } else {
        toast({
          title: "رزرو ناموفق",
          description: e.message ?? "لطفاً دوباره تلاش کنید",
          variant: "destructive",
        });
      }
    } finally {
      setBookingId(null);
    }
  }

  const [rankFilter, setRankFilter] = useState<string>("all");
  const ranked = masters.filter(
    (m) => rankFilter === "all" || (rankFilter === "none" ? !m.qariRank : m.qariRank === rankFilter),
  );
  const online = ranked.filter((m) => m.online);
  const offline = ranked.filter((m) => !m.online);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <button
        onClick={() => setView("dashboard")}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت به داشبورد
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-noor-sky/20">
          <UserCheck className="h-8 w-8 text-noor-sky" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">قاریان آنلاین</h1>
          <p className="text-sm text-muted-foreground">
            قاریان تأییدشده‌ی منافسه — قیمت هر جلسه را خود استاد تعیین می‌کند
          </p>
        </div>
      </div>

      {/* فیلتر رنک قاریان */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setRankFilter("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            rankFilter === "all" ? "bg-noor-navy text-white" : "bg-white/70 text-noor-navy hover:bg-white dark:bg-white/10 dark:text-white"
          }`}
        >
          همه
        </button>
        {[...QARI_RANKS].reverse().map((r) => (
          <button
            key={r.id}
            onClick={() => setRankFilter(r.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
              rankFilter === r.id ? "text-white" : "bg-white/70 text-noor-navy hover:bg-white dark:bg-white/10 dark:text-white"
            }`}
            style={rankFilter === r.id ? { background: r.color } : { borderColor: r.color, border: `1.5px solid ${r.color}55` }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
            {r.label}
          </button>
        ))}
        <button
          onClick={() => setRankFilter("none")}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            rankFilter === "none" ? "bg-noor-navy text-white" : "bg-white/70 text-noor-navy hover:bg-white dark:bg-white/10 dark:text-white"
          }`}
        >
          تأییدشده
        </button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-noor-yellow" />
        </div>
      ) : masters.length === 0 ? (
        <NoorCard className="p-8 text-center">
          <VerifiedBadge size={40} />
          <p className="mt-3 text-sm text-muted-foreground">
            هنوز استاد تأییدشده‌ای نداریم — شما هم می‌توانید درخواست تیک آبی بدهید!
          </p>
        </NoorCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
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
              <h2 className="mt-6 font-display text-lg font-bold text-muted-foreground sm:col-span-2">
                آفلاین — پس از آنلاین شدن قابل رزرو هستند
              </h2>
              {offline.map((m, i) => (
                <MasterCard key={m.id} master={m} index={i} disabled />
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <NoorCard className={`flex h-full flex-col p-5 ${disabled ? "opacity-60" : ""}`}>
        <div className="flex items-start gap-3">
          <button onClick={onOpen} className="relative shrink-0 transition hover:scale-105" title="مشاهده پروفایل">
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
              className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ring-2 ring-card ${
                master.online ? "bg-noor-green animate-pulse" : "bg-muted-foreground"
              }`}
            />
          </button>
          <div className="flex-1">
            <VerifiedName
              name={master.fullName}
              verified
              rank={master.qariRank}
              size={16}
              onClick={onOpen}
              className="font-display font-bold"
            />
            {master.qariRank && qariRankDef(master.qariRank) && (
              <span
                className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                style={{
                  background: `${qariRankDef(master.qariRank)!.color}1e`,
                  color: qariRankDef(master.qariRank)!.color,
                  border: `1px solid ${qariRankDef(master.qariRank)!.color}66`,
                }}
              >
                {qariBadgeLabel(master.qariRank)}
              </span>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {master.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {master.city}
                </span>
              )}
              {master.recitationType && (
                <span className="flex items-center gap-1">
                  <Mic2 className="h-3 w-3" />
                  {master.recitationType}
                </span>
              )}
              <span
                className={`flex items-center gap-1 font-bold ${
                  master.online ? "text-noor-green" : "text-muted-foreground"
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
            قاری اقتدا: <span className="font-bold text-foreground">{master.favoriteReciter}</span>
          </p>
        )}

        {!disabled && onBook && (
          <NoorButton
            variant="yellow"
            className="mt-4 w-full"
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
            {booking ? "در حال رزرو..." : `جلسه خصوصی — ${(master.privateSessionPrice ?? 1).toLocaleString("fa-IR")} امتیاز`}
          </NoorButton>
        )}
        {disabled && (
          <div className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-muted/50 py-2 text-xs text-muted-foreground">
            <Coins className="h-3.5 w-3.5" />
            {(master.privateSessionPrice ?? 1).toLocaleString("fa-IR")} امتیاز — پس از آنلاین شدن قابل رزرو
          </div>
        )}
      </NoorCard>
    </motion.div>
  );
}
