"use client";

// ============================================================
// پنل‌های ادمین: تیک آبی (VerificationTab) + مالی (FinanceTab)
//   — بررسی درخواست‌های احراز با مودال جزئیات و approve/reject
//   — مدیریت تسویه‌ها + گزارش پرداخت‌های درگاه سپ
// ============================================================

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  Check,
  Eye,
  Ban,
  Banknote,
  Receipt,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { NoorCard } from "./noor-card";
import { NoorButton } from "./noor-button";
import { NoorAvatar } from "./noor-avatar";
import { useToast } from "@/hooks/use-toast";
import { TRUSTED_COMPETITIONS } from "@/lib/noorcraft/trusted-competitions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ============================================================
// تب تیک آبی
// ============================================================

interface VerifyRequest {
  id: string;
  requestType: string;
  auditionUrl?: string | null;
  competitionId?: string | null;
  competitionYear?: string | null;
  fullName: string;
  bio: string;
  recitationVideoUrl: string | null;
  socialLinks: string | null;
  achievements: string | null;
  status: string;
  adminNote: string | null;
  createdAt: number;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    city: string | null;
    recitationType: string | null;
    noorPoints: number;
    avatarColor: string;
    avatarUrl: string | null;
    verificationStatus: string;
  };
}

// رنک‌های قاری — قرمز=استانی · سبز=کشوری · آبی=بین‌المللی · خاکستری=تأییدشده
const typeLabels: Record<string, string> = {
  pending: "در انتظار داوری",
  bronze: "تیک قرمز (سطح برنزی)",
  silver: "تیک سبز (سطح نقره‌ای)",
  gold: "تیک آبی (سطح طلایی)",
  none: "قاری تأییدشده",
  provincial: "تیک قرمز (سطح برنزی)",
  national: "تیک سبز (سطح نقره‌ای)",
  international: "تیک آبی (سطح طلایی)",
  qari: "قاری تأییدشده",
  master: "قاری تأییدشده",
  scholar: "قاری تأییدشده",
};

const typeColors: Record<string, string> = {
  pending: "#FFD700",
  bronze: "#FF7F7F",
  silver: "#7CFC00",
  gold: "#1D9BF0",
  none: "#9aa0a6",
  provincial: "#FF7F7F",
  national: "#7CFC00",
  international: "#1D9BF0",
};

function rankColor(t: string): string {
  return typeColors[t] ?? "#9aa0a6";
}

export function VerifyTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<VerifyRequest[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [selected, setSelected] = useState<VerifyRequest | null>(null);
  const [acting, setActing] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/admin/verify", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setRequests(d.requests ?? []);
          setStats(d.stats ?? { pending: 0, approved: 0, rejected: 0 });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  async function act(req: VerifyRequest, status: "approved" | "rejected", qariRank?: string) {
    const adminNote = status === "rejected" ? (prompt("دلیل رد آزمون (اختیاری):") ?? "") : "";
    setActing(true);
    try {
      const res = await fetch(`/api/admin/verify/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, qariRank, adminNote: adminNote || undefined }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      toast({
        title:
          status === "approved"
            ? `سطح «${typeLabels[qariRank ?? ""] ?? "قاری"}» اعطا شد ✅`
            : "آزمون رد شد",
      });
      setSelected(null);
      load();
    } catch (e: any) {
      toast({ title: "خطا", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  }

  async function removeTick(req: VerifyRequest) {
    if (!confirm(`تیک آبی «${req.user.fullName}» برداشته شود؟`)) return;
    setActing(true);
    try {
      const res = await fetch(`/api/admin/verify/${req.id}`, { method: "DELETE" });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      toast({ title: "تیک آبی برداشته شد" });
      load();
    } catch (e: any) {
      toast({ title: "خطا", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  }

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* آمار */}
      <div className="grid grid-cols-3 gap-3">
        <NoorCard className="p-4 text-center">
          <Clock className="mx-auto mb-1 h-5 w-5 text-noor-yellow" />
          <div className="font-display text-xl font-black">{stats.pending.toLocaleString("fa-IR")}</div>
          <div className="text-[10px] text-muted-foreground">در انتظار بررسی</div>
        </NoorCard>
        <NoorCard className="p-4 text-center">
          <BadgeCheck className="mx-auto mb-1 h-5 w-5" style={{ color: "#1D9BF0" }} />
          <div className="font-display text-xl font-black">{stats.approved.toLocaleString("fa-IR")}</div>
          <div className="text-[10px] text-muted-foreground">تأییدشده (تیک آبی)</div>
        </NoorCard>
        <NoorCard className="p-4 text-center">
          <XCircle className="mx-auto mb-1 h-5 w-5 text-noor-coral" />
          <div className="font-display text-xl font-black">{stats.rejected.toLocaleString("fa-IR")}</div>
          <div className="text-[10px] text-muted-foreground">ردشده</div>
        </NoorCard>
      </div>

      <div className="flex justify-end">
        <NoorButton variant="sky" size="sm" onClick={load} disabled={loading} leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />}>
          بروزرسانی
        </NoorButton>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-8 w-8 animate-spin text-noor-yellow" /></div>
      ) : (
        <>
          {/* درخواست‌های در انتظار */}
          {pending.length > 0 && (
            <>
              <h3 className="flex items-center gap-2 text-sm font-bold"><Clock className="h-4 w-4 text-noor-yellow" /> در انتظار بررسی ({pending.length.toLocaleString("fa-IR")})</h3>
              <div className="space-y-2">
                {pending.map((r) => (
                  <RequestRow key={r.id} req={r} onView={() => setSelected(r)} />
                ))}
              </div>
            </>
          )}

          {/* بررسی‌شده‌ها */}
          {reviewed.length > 0 && (
            <>
              <h3 className="mt-4 flex items-center gap-2 text-sm font-bold"><Check className="h-4 w-4 text-noor-green" /> بررسی‌شده‌ها</h3>
              <div className="space-y-2">
                {reviewed.map((r) => (
                  <RequestRow key={r.id} req={r} onView={() => setSelected(r)} onRemoveTick={() => removeTick(r)} />
                ))}
              </div>
            </>
          )}

          {requests.length === 0 && (
            <NoorCard className="p-8 text-center text-sm text-muted-foreground">
              هنوز درخواست احرازی ثبت نشده است
            </NoorCard>
          )}
        </>
      )}

      {/* مودال جزئیات */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <NoorAvatar name={selected.user.fullName} color={selected.user.avatarColor} avatarUrl={selected.user.avatarUrl} size="sm" />
                  {selected.fullName} —{" "}
                  <span style={{ color: rankColor(selected.requestType) }}>
                    {typeLabels[selected.requestType] ?? "قاری"}
                  </span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="rounded-xl bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">معرفی و سوابق</div>
                  <p className="mt-1 leading-relaxed">{selected.bio}</p>
                </div>
                {selected.achievements && (
                  <div className="rounded-xl bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground">مدرک رسمی و افتخارات</div>
                    <p className="mt-1">{selected.achievements}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-muted/30 p-3">
                    <span className="text-muted-foreground">ایمیل: </span>
                    <span dir="ltr">{selected.user.email}</span>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3">
                    <span className="text-muted-foreground">تماس: </span>
                    <span dir="ltr">{selected.user.phone ?? "—"}</span>
                  </div>
                </div>
                {selected.competitionId && (
                  <div className="rounded-xl bg-noor-yellow/10 border border-noor-yellow/25 p-3">
                    <div className="text-xs text-muted-foreground">مسابقه اعلام‌شده توسط قاری</div>
                    <div className="mt-0.5 text-sm font-bold">
                      {(() => {
                        const all = [
                          ...TRUSTED_COMPETITIONS.map((c) => ({ id: c.id, name: c.name, tier: c.tier })),
                        ];
                        const c = all.find((x) => x.id === selected.competitionId);
                        return c ? `${c.name}` : selected.competitionId;
                      })()}
                      {selected.competitionYear && ` — سال ${selected.competitionYear}`}
                    </div>
                  </div>
                )}

                {(selected.auditionUrl || selected.recitationVideoUrl) && (
                  <div className="rounded-xl bg-muted/30 p-3">
                    <div className="mb-2 text-xs font-bold text-muted-foreground">
                      🎧 تلاوت آزمونی — بشنوید و سطح را تعیین کنید:
                    </div>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <audio
                      controls
                      preload="metadata"
                      src={selected.auditionUrl ?? selected.recitationVideoUrl ?? undefined}
                      className="w-full"
                    />
                    <a
                      href={(selected.auditionUrl || selected.recitationVideoUrl) ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-noor-sky hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> باز کردن در تب جدید (برای ویدیو)
                    </a>
                  </div>
                )}
                {selected.socialLinks && (
                  <div className="text-xs text-muted-foreground">شبکه‌ها: {selected.socialLinks}</div>
                )}
                {selected.status === "pending" && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-muted-foreground">
                      سطح این قاری را تعیین کنید:
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => act(selected, "approved", "bronze")}
                        disabled={acting}
                        className="rounded-xl border-2 p-3 text-center font-bold transition hover:brightness-105 disabled:opacity-50"
                        style={{ borderColor: "#FF7F7F", background: "#FF7F7F1e", color: "#FF7F7F" }}
                      >
                        🔴 تیک قرمز
<span className="mt-0.5 block text-[10px] text-muted-foreground">(قاری برنزی — سقف ۱۰ امتیاز)</span>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">سقف ۱۰ امتیاز</span>
                      </button>
                      <button
                        onClick={() => act(selected, "approved", "silver")}
                        disabled={acting}
                        className="rounded-xl border-2 p-3 text-center font-bold transition hover:brightness-105 disabled:opacity-50"
                        style={{ borderColor: "#7CFC00", background: "#7CFC001e", color: "#7CFC00" }}
                      >
                        🟢 تیک سبز
<span className="mt-0.5 block text-[10px] text-muted-foreground">(قاری نقره‌ای — سقف ۲۵ امتیاز)</span>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">سقف ۲۵ امتیاز</span>
                      </button>
                      <button
                        onClick={() => act(selected, "approved", "gold")}
                        disabled={acting}
                        className="rounded-xl border-2 p-3 text-center font-bold transition hover:brightness-105 disabled:opacity-50"
                        style={{ borderColor: "#1D9BF0", background: "#1D9BF01e", color: "#1D9BF0" }}
                      >
                        🔵 تیک آبی
<span className="mt-0.5 block text-[10px] text-muted-foreground">(قاری طلایی — سقف ۵۰ امتیاز)</span>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">سقف ۵۰ امتیاز</span>
                      </button>
                    </div>
                    <NoorButton variant="coral" className="w-full" onClick={() => act(selected, "rejected")} disabled={acting} leftIcon={<XCircle className="h-4 w-4" />}>
                      رد آزمون
                    </NoorButton>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function RequestRow({
  req,
  onView,
  onRemoveTick,
}: {
  req: VerifyRequest;
  onView: () => void;
  onRemoveTick?: () => void;
}) {
  const statusMeta: Record<string, { label: string; cls: string }> = {
    pending: { label: "در انتظار", cls: "bg-noor-yellow/20 text-yellow-700" },
    approved: { label: "تأییدشده", cls: "bg-noor-green/20 text-green-700" },
    rejected: { label: "ردشده", cls: "bg-noor-coral/20 text-red-700" },
  };
  const meta = statusMeta[req.status] ?? { label: req.status, cls: "bg-muted" };

  return (
    <NoorCard className="flex items-center gap-3 p-3">
      <NoorAvatar name={req.user.fullName} color={req.user.avatarColor} avatarUrl={req.user.avatarUrl} size="sm" verified={req.user.verificationStatus === "approved"} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold">{req.user.fullName}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}>{meta.label}</span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: `${rankColor(req.requestType)}1e`,
              color: rankColor(req.requestType),
              border: `1px solid ${rankColor(req.requestType)}66`,
            }}
          >
            {typeLabels[req.requestType] ?? "قاری"}
          </span>{" "}
          • {req.user.city ?? "—"} • {req.user.noorPoints.toLocaleString("fa-IR")} نور
        </div>
      </div>
      <button onClick={onView} className="grid h-8 w-8 place-items-center rounded-full bg-noor-sky/20 text-sky-700 transition hover:bg-noor-sky/40" title="جزئیات">
        <Eye className="h-4 w-4" />
      </button>
      {onRemoveTick && req.user.verificationStatus === "approved" && (
        <button onClick={onRemoveTick} className="grid h-8 w-8 place-items-center rounded-full bg-noor-coral/20 text-red-700 transition hover:bg-noor-coral/40" title="برداشتن تیک آبی">
          <Ban className="h-4 w-4" />
        </button>
      )}
    </NoorCard>
  );
}

// ============================================================
// تب مالی — تسویه‌ها + پرداخت‌ها
// ============================================================

interface SettlementRow {
  id: string;
  amount: number;
  status: string;
  iban: string;
  accountHolder: string;
  bankName: string;
  createdAt: number;
  user: { id: string; fullName: string; email: string; phone: string | null };
}

interface PaymentRow {
  id: string;
  amount: number;
  credits: number;
  plan: string;
  status: string;
  samanResNum: string;
  createdAt: number;
  user: { id: string; fullName: string; email: string };
}

export function FinanceTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [payStats, setPayStats] = useState({ totalPaid: 0, totalCredits: 0, count: 0, pending: 0 });
  const [acting, setActing] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/settlements", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/payments", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([s, p]) => {
        if (s.ok) setSettlements(s.settlements ?? []);
        if (p.ok) {
          setPayments(p.payments ?? []);
          setPayStats(p.stats ?? payStats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }

  useEffect(() => load(), []);

  async function updateSettlement(id: string, status: string) {
    setActing(id);
    try {
      const res = await fetch("/api/admin/settlements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      toast({ title: "وضعیت تسویه به‌روزرسانی شد" });
      load();
    } catch (e: any) {
      toast({ title: "خطا", description: e.message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return <div className="grid place-items-center py-16"><Loader2 className="h-8 w-8 animate-spin text-noor-yellow" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* آمار پرداخت‌ها */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <NoorCard className="p-4 text-center">
          <TrendingUp className="mx-auto mb-1 h-5 w-5 text-noor-green" />
          <div className="font-display text-lg font-black">{payStats.totalPaid.toLocaleString("fa-IR")}</div>
          <div className="text-[10px] text-muted-foreground">کل درآمد (تومان)</div>
        </NoorCard>
        <NoorCard className="p-4 text-center">
          <Receipt className="mx-auto mb-1 h-5 w-5 text-noor-sky" />
          <div className="font-display text-lg font-black">{payStats.count.toLocaleString("fa-IR")}</div>
          <div className="text-[10px] text-muted-foreground">پرداخت موفق</div>
        </NoorCard>
        <NoorCard className="p-4 text-center">
          <Banknote className="mx-auto mb-1 h-5 w-5 text-noor-yellow" />
          <div className="font-display text-lg font-black">{payStats.totalCredits.toLocaleString("fa-IR")}</div>
          <div className="text-[10px] text-muted-foreground">امتیاز فروخته‌شده</div>
        </NoorCard>
        <NoorCard className="p-4 text-center">
          <Clock className="mx-auto mb-1 h-5 w-5 text-noor-coral" />
          <div className="font-display text-lg font-black">{payStats.pending.toLocaleString("fa-IR")}</div>
          <div className="text-[10px] text-muted-foreground">در انتظار پرداخت</div>
        </NoorCard>
      </div>

      {/* تسویه‌ها */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Banknote className="h-4 w-4 text-noor-yellow" /> درخواست‌های تسویه</h3>
        {settlements.length === 0 ? (
          <NoorCard className="p-6 text-center text-sm text-muted-foreground">درخواست تسویه‌ای ثبت نشده است</NoorCard>
        ) : (
          <div className="space-y-2">
            {settlements.map((s) => (
              <NoorCard key={s.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold">
                      {s.user.fullName} — <span className="text-noor-green">{s.amount.toLocaleString("fa-IR")} تومان</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground" dir="ltr">
                      {s.bankName} • {s.iban}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      صاحب حساب: {s.accountHolder}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip status={s.status} />
                    {s.status === "pending" && (
                      <>
                        <NoorButton variant="green" size="sm" disabled={acting === s.id} onClick={() => updateSettlement(s.id, "approved")}>
                          تأیید
                        </NoorButton>
                        <NoorButton variant="coral" size="sm" disabled={acting === s.id} onClick={() => updateSettlement(s.id, "rejected")}>
                          رد
                        </NoorButton>
                      </>
                    )}
                    {s.status === "approved" && (
                      <NoorButton variant="yellow" size="sm" disabled={acting === s.id} onClick={() => updateSettlement(s.id, "paid")}>
                        واریز شد
                      </NoorButton>
                    )}
                  </div>
                </div>
              </NoorCard>
            ))}
          </div>
        )}
      </div>

      {/* پرداخت‌ها */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Receipt className="h-4 w-4 text-noor-sky" /> پرداخت‌های درگاه سپ</h3>
        {payments.length === 0 ? (
          <NoorCard className="p-6 text-center text-sm text-muted-foreground">پرداختی ثبت نشده است</NoorCard>
        ) : (
          <NoorCard className="divide-y divide-muted/40 p-0">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3">
                <div>
                  <div className="text-sm font-bold">
                    {p.user.fullName} — {p.credits.toLocaleString("fa-IR")} امتیاز ({p.amount.toLocaleString("fa-IR")} تومان)
                  </div>
                  <div className="text-[10px] text-muted-foreground" dir="ltr">
                    {p.samanResNum} • {new Date(p.createdAt).toLocaleString("fa-IR")}
                  </div>
                </div>
                <StatusChip status={p.status} />
              </div>
            ))}
          </NoorCard>
        )}
      </div>
    </motion.div>
  );
}

function StatusChip({ status }: { status: string }) {
  const meta: Record<string, { label: string; cls: string }> = {
    pending: { label: "در انتظار", cls: "bg-noor-yellow/20 text-yellow-700" },
    approved: { label: "تأییدشده", cls: "bg-noor-sky/20 text-sky-700" },
    paid: { label: "پرداخت‌شده", cls: "bg-noor-green/20 text-green-700" },
    rejected: { label: "ردشده", cls: "bg-noor-coral/20 text-red-700" },
    failed: { label: "ناموفق", cls: "bg-noor-coral/20 text-red-700" },
  };
  const m = meta[status] ?? { label: status, cls: "bg-muted" };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${m.cls}`}>{m.label}</span>;
}
