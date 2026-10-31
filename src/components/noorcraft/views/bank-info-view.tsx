"use client";

// ============================================================
// اطلاعات بانکی + درآمد + درخواست تسویه (برای قاریان تأییدشده)
// ============================================================

import { useEffect, useState } from "react";
import {
  Landmark,
  Loader2,
  ArrowRight,
  Wallet,
  TrendingUp,
  Banknote,
  Save,
  Receipt,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNoorStore } from "@/store/noor-store";
import { NoorCard } from "../noor-card";
import { NoorButton } from "../noor-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MIN_SETTLEMENT_AMOUNT, CREDIT_VALUE_TOMAN, PLATFORM_FEE_PERCENT } from "@/lib/payment/credit-plans";

interface BankInfo {
  iban: string;
  cardNumber: string;
  accountNumber: string;
  accountHolder: string;
  bankName: string;
  isOfferingPrivateSessions: boolean;
  privateSessionPrice: number;
}

interface Stats {
  totalEarning: number;
  withdrawn: number;
  available: number;
  isVerified: boolean;
}

interface Settlement {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  createdAt: number;
}

const statusLabels: Record<string, { label: string; cls: string }> = {
  pending: { label: "در انتظار بررسی", cls: "text-noor-yellow" },
  approved: { label: "تأییدشده", cls: "text-noor-sky" },
  paid: { label: "پرداخت‌شده", cls: "text-noor-green" },
  rejected: { label: "ردشده", cls: "text-noor-coral" },
};

export function BankInfoView() {
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const updateUser = useNoorStore((s) => s.updateUser);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [bank, setBank] = useState<BankInfo>({
    iban: "",
    cardNumber: "",
    accountNumber: "",
    accountHolder: "",
    bankName: "",
    isOfferingPrivateSessions: false,
    privateSessionPrice: 1,
  });
  const [stats, setStats] = useState<Stats | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settleAmount, setSettleAmount] = useState<string>("");
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceCap, setPriceCap] = useState(5);
  const [rankLabel, setRankLabel] = useState("قاری تأییدشده");

  useEffect(() => {
    load();
  }, []);

  function load() {
    fetch("/api/bank-info", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setBank(d.bankInfo);
          setStats(d.stats);
        }
    fetch("/api/masters/price", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setPriceCap(d.cap ?? 5);
          setRankLabel(d.rankLabel ?? "قاری تأییدشده");
        }
      })
      .catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/settlement/request", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setSettlements(d.settlements ?? []); })
      .catch(() => {});
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/bank-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bank),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      toast({ title: "اطلاعات بانکی ذخیره شد ✅" });
      load();
    } catch (e: any) {
      toast({
        title: "خطا در ذخیره",
        description: e.message ?? "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function requestSettlement() {
    const amount = parseInt(settleAmount.replace(/[^\d]/g, ""), 10);
    if (!amount) {
      toast({ title: "مبلغ را وارد کنید", variant: "destructive" });
      return;
    }
    setRequesting(true);
    try {
      const res = await fetch("/api/settlement/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      toast({
        title: "درخواست تسویه ثبت شد ✅",
        description: "پس از تأیید ادمین، مبلغ به حساب شما واریز می‌شود.",
      });
      setSettleAmount("");
      load();
    } catch (e: any) {
      toast({
        title: "درخواست ناموفق",
        description: e.message ?? "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setRequesting(false);
    }
  }

  async function savePrice() {
    const price = Math.floor(Number(bank.privateSessionPrice));
    if (!Number.isFinite(price) || price < 1 || price > priceCap) {
      toast({
        title: "قیمت نامعتبر است",
        description: `سقف رنک شما (${rankLabel}): حداکثر ${priceCap.toLocaleString("fa-IR")} امتیاز برای هر جلسه.`,
        variant: "destructive",
      });
      return;
    }
    setSavingPrice(true);
    try {
      const res = await fetch("/api/masters/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      toast({
        title: "قیمت جلسه ثبت شد ✅",
        description: `هر جلسه خصوصی شما از این لحظه ${price.toLocaleString("fa-IR")} امتیاز است.`,
      });
    } catch (e: any) {
      toast({
        title: "خطا در ثبت قیمت",
        description: e.message ?? "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setSavingPrice(false);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-noor-yellow" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <button
        onClick={() => setView("dashboard")}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت به داشبورد
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-noor-green/20">
          <Landmark className="h-8 w-8 text-noor-green" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">درآمد و تسویه</h1>
          <p className="text-sm text-muted-foreground">
            اطلاعات بانکی شما برای واریز درآمد جلسات خصوصی استفاده می‌شود
          </p>
        </div>
      </div>

      {/* آمار درآمد */}
      {stats && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <NoorCard className="p-4 text-center">
            <TrendingUp className="mx-auto mb-1 h-5 w-5 text-noor-sky" />
            <div className="text-[10px] text-muted-foreground">کل درآمد</div>
            <div className="font-display text-lg font-black">
              {stats.totalEarning.toLocaleString("fa-IR")} تومان
            </div>
          </NoorCard>
          <NoorCard className="p-4 text-center">
            <Banknote className="mx-auto mb-1 h-5 w-5 text-noor-green" />
            <div className="text-[10px] text-muted-foreground">تسویه‌شده</div>
            <div className="font-display text-lg font-black">
              {stats.withdrawn.toLocaleString("fa-IR")} تومان
            </div>
          </NoorCard>
          <NoorCard className="border-noor-yellow/40 p-4 text-center">
            <Wallet className="mx-auto mb-1 h-5 w-5 text-noor-yellow" />
            <div className="text-[10px] text-muted-foreground">قابل تسویه</div>
            <div className="font-display text-lg font-black text-noor-yellow">
              {stats.available.toLocaleString("fa-IR")} تومان
            </div>
          </NoorCard>
        </div>
      )}

      {/* فرم اطلاعات بانکی */}
      <NoorCard className="mb-6 p-6">
        <h2 className="mb-4 font-display text-lg font-bold">اطلاعات بانکی</h2>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="b-iban">شماره شبا (IR + ۲۴ رقم) *</Label>
            <Input
              id="b-iban"
              value={bank.iban}
              onChange={(e) => setBank((b) => ({ ...b, iban: e.target.value.toUpperCase() }))}
              placeholder="IR.........................."
              className="mt-1 text-left"
              dir="ltr"
              maxLength={26}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="b-card">شماره کارت (۱۶ رقم) *</Label>
              <Input
                id="b-card"
                value={bank.cardNumber}
                onChange={(e) => setBank((b) => ({ ...b, cardNumber: e.target.value.replace(/\D/g, "") }))}
                placeholder="................"
                className="mt-1 text-left"
                dir="ltr"
                maxLength={16}
              />
            </div>
            <div>
              <Label htmlFor="b-acc">شماره حساب (اختیاری)</Label>
              <Input
                id="b-acc"
                value={bank.accountNumber}
                onChange={(e) => setBank((b) => ({ ...b, accountNumber: e.target.value }))}
                className="mt-1 text-left"
                dir="ltr"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="b-holder">نام صاحب حساب *</Label>
              <Input
                id="b-holder"
                value={bank.accountHolder}
                onChange={(e) => setBank((b) => ({ ...b, accountHolder: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="b-bank">نام بانک *</Label>
              <Input
                id="b-bank"
                value={bank.bankName}
                onChange={(e) => setBank((b) => ({ ...b, bankName: e.target.value }))}
                placeholder="سامان، ملت، ملی..."
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-4">
            <div>
              <div className="text-sm font-bold">پذیرش جلسه خصوصی</div>
              <div className="text-xs text-muted-foreground">
                {stats?.isVerified
                  ? "شما در فهرست استادان آنلاین نمایش داده می‌شوید"
                  : "فقط قاریان تأییدشده (تیک آبی) می‌توانند این گزینه را فعال کنند"}
              </div>
            </div>
            <Switch
              checked={bank.isOfferingPrivateSessions}
              disabled={!stats?.isVerified}
              onCheckedChange={(v) => setBank((b) => ({ ...b, isOfferingPrivateSessions: v }))}
            />
          </div>

          {/* قیمت هر جلسه خصوصی — فقط برای قاریان تأییدشده */}
          {stats?.isVerified && (
            <div className="rounded-2xl bg-muted/30 p-4">
              <div className="text-sm font-bold">قیمت هر جلسه خصوصی (امتیاز)</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                هر امتیاز {CREDIT_VALUE_TOMAN.toLocaleString("fa-IR")} تومان ارزش دارد و سهم شما از هر جلسه {PLATFORM_FEE_PERCENT === 15 ? "۸۵٪" : `${100 - PLATFORM_FEE_PERCENT}٪`} است.
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={priceCap}
                  value={bank.privateSessionPrice}
                  onChange={(e) =>
                    setBank((b) => ({
                      ...b,
                      privateSessionPrice: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="max-w-32"
                />
                <NoorButton
                  variant="yellow"
                  onClick={savePrice}
                  disabled={savingPrice}
                  leftIcon={savingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                >
                  {savingPrice ? "در حال ثبت..." : "ثبت قیمت"}
                </NoorButton>
              </div>

              {/* پیش‌نمایش زنده — معادل تومانی قیمت واردشده */}
              {(() => {
                const p = Math.floor(Number(bank.privateSessionPrice));
                const valid = Number.isFinite(p) && p >= 1 && p <= 50;
                const credits = valid ? p : 1;
                const gross = credits * CREDIT_VALUE_TOMAN;
                const net = gross - Math.round((gross * PLATFORM_FEE_PERCENT) / 100);
                return (
                  <div className={`mt-3 rounded-xl px-3 py-2.5 text-xs leading-6 ${valid ? "bg-noor-yellow/10" : "bg-noor-coral/10"}`}>
                    {valid ? (
                      <>
                        شاگرد برای هر جلسه <span className="font-bold">{gross.toLocaleString("fa-IR")} تومان</span> می‌پردازد
                        {" "}({credits.toLocaleString("fa-IR")} امتیاز × {CREDIT_VALUE_TOMAN.toLocaleString("fa-IR")} تومان)
                        <br />
                        سهم شما پس از کسر کارمزد پلتفرم:{" "}
                        <span className="font-bold text-noor-green">{net.toLocaleString("fa-IR")} تومان</span>
                      </>
                    ) : (
                      <span className="font-bold text-noor-coral">
                        عدد بین ۱ تا ۵۰ وارد کنید
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <NoorButton
            variant="green"
            onClick={save}
            disabled={saving}
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          >
            {saving ? "در حال ذخیره..." : "ذخیره اطلاعات"}
          </NoorButton>
        </div>
      </NoorCard>

      {/* درخواست تسویه */}
      <NoorCard className="mb-6 p-6">
        <h2 className="mb-2 font-display text-lg font-bold">درخواست تسویه</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          حداقل مبلغ تسویه {MIN_SETTLEMENT_AMOUNT.toLocaleString("fa-IR")} تومان است.
          کمیسون پلتفرم ۱۵٪ و سهم شما از هر جلسه ۸۵٪ است.
        </p>
        <div className="flex gap-2">
          <Input
            value={settleAmount}
            onChange={(e) => setSettleAmount(e.target.value)}
            placeholder={`مبلغ (تومان) — حداقل ${MIN_SETTLEMENT_AMOUNT.toLocaleString("fa-IR")}`}
            className="text-left"
            dir="ltr"
            inputMode="numeric"
          />
          <NoorButton
            variant="yellow"
            onClick={requestSettlement}
            disabled={requesting}
            className="shrink-0"
            leftIcon={requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
          >
            ثبت درخواست
          </NoorButton>
        </div>
      </NoorCard>

      {/* تاریخچه تسویه‌ها */}
      {settlements.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Receipt className="h-5 w-5 text-noor-sky" />
            تاریخچه تسویه‌ها
          </h2>
          <NoorCard className="divide-y divide-muted/40 p-0">
            {settlements.map((s) => {
              const meta = statusLabels[s.status] ?? { label: s.status, cls: "" };
              return (
                <div key={s.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-bold">{s.amount.toLocaleString("fa-IR")} تومان</div>
                    <div className="text-[11px] text-muted-foreground" dir="ltr">
                      {new Date(s.createdAt).toLocaleString("fa-IR")} — {s.bankName}
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${meta.cls}`}>{meta.label}</span>
                </div>
              );
            })}
          </NoorCard>
        </div>
      )}
    </div>
  );
}
