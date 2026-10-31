"use client";

// ============================================================
// خرید امتیاز — ۵ پلن + موجودی + تاریخچه تراکنش‌ها
// درگاه سپ بانک سامان
// ============================================================

import { useEffect, useState } from "react";
import {
  Coins,
  Loader2,
  ArrowRight,
  ShoppingCart,
  Receipt,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNoorStore } from "@/store/noor-store";
import { NoorCard } from "../noor-card";
import { NoorButton } from "../noor-button";
import {
  CREDIT_VALUE_TOMAN,
  creditsPriceToman,
  creditsDiscountPercent,
  MAX_BUY_CREDITS,
} from "@/lib/payment/credit-plans";

// وقتی کاربر از کارت قاری با موجودی ناکافی می‌آید، تعداد لازم اینجا
// ذخیره می‌شود تا فرم خرید با همان تعداد پیش‌پر شود.
const PREFILL_KEY = "monafaseh_buy_credits";

interface Txn {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: number;
}

const typeLabels: Record<string, { label: string; cls: string }> = {
  purchase: { label: "خرید", cls: "text-noor-green" },
  spend: { label: "مصرف", cls: "text-noor-coral" },
  refund: { label: "بازگشت", cls: "text-noor-sky" },
  bonus: { label: "هدیه", cls: "text-noor-yellow" },
};

export function BuyCreditsView() {
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const updateUser = useNoorStore((s) => s.updateUser);
  const { toast } = useToast();

  const [balance, setBalance] = useState<number>(user?.creditBalance ?? 0);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(1);

  // پیش‌پر تعداد لازم از فرایند رزرو جلسه (اگر موجود باشد)
  useEffect(() => {
    try {
      const pref = parseInt(sessionStorage.getItem(PREFILL_KEY) ?? "", 10);
      if (Number.isFinite(pref) && pref >= 1 && pref <= MAX_BUY_CREDITS) {
        setAmount(pref);
        sessionStorage.removeItem(PREFILL_KEY);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/credits/balance", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setBalance(d.balance); })
      .catch(() => {});
    fetch("/api/credits/transactions", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setTxns(d.transactions ?? []); })
      .catch(() => {});
  }, []);

  async function buyCredits() {
    const credits = Math.floor(Number(amount));
    if (!Number.isFinite(credits) || credits < 1 || credits > MAX_BUY_CREDITS) {
      toast({
        title: "تعداد نامعتبر است",
        description: `بین ۱ تا ${MAX_BUY_CREDITS} امتیاز انتخاب کنید.`,
        variant: "destructive",
      });
      return;
    }
    setBuying("custom");
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);

      if (typeof d.token === "string" && d.token) {
        // درگاه واقعی — طبق مستندات سپ: فرم POST با فیلد Token به OnlinePG
        // (ریدایرکت GET با ?token= کار نمی‌کند)؛ در همان تب ارسال می‌شود
        // تا در مرورگر موبایل و برنامک ایتا به‌درستی باز شود.
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "https://sep.shaparak.ir/OnlinePG/OnlinePG";
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "Token";
        input.value = d.token;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
      } else {
        throw new Error("پاسخ درگاه پرداخت نامعتبر است");
      }
    } catch (e: any) {
      toast({
        title: "خطا در ایجاد تراکنش",
        description: e.message ?? "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setBuying(null);
    }
  }

  // بعد از بازگشت از درگاه، موجودی را رفرش کن
  useEffect(() => {
    const onFocus = () => {
      fetch("/api/credits/balance", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) {
            setBalance(d.balance);
            updateUser({ creditBalance: d.balance } as any);
          }
        })
        .catch(() => {});
      fetch("/api/credits/transactions", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => { if (d.ok) setTxns(d.transactions ?? []); })
        .catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-noor-yellow/20">
          <Coins className="h-8 w-8 text-noor-yellow" />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">خرید امتیاز</h1>
          <p className="text-sm text-muted-foreground">
            هر امتیاز {CREDIT_VALUE_TOMAN.toLocaleString("fa-IR")} تومان — قیمت هر جلسه خصوصی را خودِ قاری تعیین می‌کند
          </p>
        </div>
        <div className="rounded-2xl bg-noor-green/15 px-4 py-2 text-center">
          <div className="text-[10px] text-muted-foreground">موجودی شما</div>
          <div className="font-display text-xl font-bold text-noor-green">
            {balance.toLocaleString("fa-IR")}
          </div>
        </div>
      </div>

      {/* خرید تعداد دلخواه — معطوف به قیمت جلسه قاری */}
      <NoorCard className="p-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">چند امتیاز می‌خواهید؟</h2>
          <Coins className="h-5 w-5 text-noor-yellow" />
        </div>
        <p className="text-xs text-muted-foreground">
          هر قاری قیمت جلسه خودش را تعیین می‌کند؛ فقط همان تعدادی را بخرید که لازم دارید —
          هر امتیاز {CREDIT_VALUE_TOMAN.toLocaleString("fa-IR")} تومان
        </p>

        {/* چیپ‌های سریع */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[1, 2, 3, 5, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAmount(n)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${
                amount === n
                  ? "border-noor-green bg-noor-green/15 text-green-700 dark:text-lime-300"
                  : "border-muted-foreground/20 hover:border-noor-sky"
              }`}
            >
              {n.toLocaleString("fa-IR")}
            </button>
          ))}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={MAX_BUY_CREDITS}
              value={amount}
              onChange={(e) => {
                const v = parseInt(e.target.value) || 1;
                setAmount(Math.max(1, Math.min(MAX_BUY_CREDITS, v)));
              }}
              className="w-24 rounded-xl border border-input bg-background px-3 py-1.5 text-center text-sm font-bold"
              aria-label="تعداد امتیاز"
            />
            <span className="text-xs text-muted-foreground">امتیاز</span>
          </div>
        </div>

        {/* پیش‌نمایش قیمت زنده */}
        {(() => {
          const credits = Math.max(1, Math.min(MAX_BUY_CREDITS, Math.floor(Number(amount) || 1)));
          const price = creditsPriceToman(credits);
          const discount = creditsDiscountPercent(credits);
          const base = credits * CREDIT_VALUE_TOMAN;
          return (
            <div className="mt-4 rounded-2xl bg-noor-yellow/10 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {credits.toLocaleString("fa-IR")} امتیاز
                  {discount > 0 && (
                    <span className="mr-2 rounded-full bg-noor-green/20 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-lime-300">
                      {discount.toLocaleString("fa-IR")}٪ تخفیف
                    </span>
                  )}
                </span>
                <span className="text-lg font-black">
                  {price.toLocaleString("fa-IR")}{" "}
                  <span className="text-xs font-bold">تومان</span>
                </span>
              </div>
              {discount > 0 && (
                <div className="mt-1 text-left text-xs text-muted-foreground line-through">
                  {base.toLocaleString("fa-IR")} تومان
                </div>
              )}
            </div>
          );
        })()}

        <NoorButton
          variant="yellow"
          onClick={buyCredits}
          disabled={buying !== null}
          className="mt-4 w-full"
          leftIcon={
            buying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />
          }
        >
          {buying ? "در حال اتصال به درگاه..." : "پرداخت از درگاه سپ"}
        </NoorButton>
      </NoorCard>

      {/* حمایت مالی */}
      <NoorCard className="mt-4 border-noor-sky/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold">دوستدار رشد منافسه هستید؟ 🌿</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              با هر مبلغ دلخواه از توسعه و نگهداری سایت حمایت کنید
            </p>
          </div>
          <NoorButton variant="sky" size="md" onClick={() => setView("donate")}>
            حمایت مالی
          </NoorButton>
        </div>
      </NoorCard>

      {/* تاریخچه */}
      <div className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <Receipt className="h-5 w-5 text-noor-sky" />
          تاریخچه تراکنش‌ها
        </h2>
        {txns.length === 0 ? (
          <NoorCard className="p-6 text-center text-sm text-muted-foreground">
            <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
            هنوز تراکنشی ثبت نشده است
          </NoorCard>
        ) : (
          <NoorCard className="divide-y divide-muted/40 p-0">
            {txns.map((t) => {
              const meta = typeLabels[t.type] ?? { label: t.type, cls: "" };
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="text-sm font-bold">{t.description}</div>
                    <div className="text-[11px] text-muted-foreground" dir="ltr">
                      {new Date(t.createdAt).toLocaleString("fa-IR")}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className={`font-display font-black ${meta.cls}`} dir="ltr">
                      {t.type === "spend" ? "-" : "+"}
                      {t.amount.toLocaleString("fa-IR")}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      موجودی: {t.balanceAfter.toLocaleString("fa-IR")}
                    </div>
                  </div>
                </div>
              );
            })}
          </NoorCard>
        )}
      </div>
    </div>
  );
}
