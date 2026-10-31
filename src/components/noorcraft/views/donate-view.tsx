"use client";

// ============================================================
// حمایت مالی — پرداخت مبلغ دلخواه برای رشد و توسعه منافسه
// (بدون دریافت امتیاز؛ صرفاً حمایت)
// ============================================================

import { useState } from "react";
import { Heart, Loader2, ArrowRight, Sprout, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNoorStore } from "@/store/noor-store";
import { NoorCard } from "../noor-card";
import { NoorButton } from "../noor-button";
import { MIN_DONATE_TOMAN, MAX_DONATE_TOMAN } from "@/lib/payment/credit-plans";

export function DonateView() {
  const setView = useNoorStore((s) => s.setView);
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(MIN_DONATE_TOMAN);
  const [donating, setDonating] = useState(false);

  async function donate() {
    const toman = Math.floor(Number(amount));
    if (!Number.isFinite(toman) || toman < MIN_DONATE_TOMAN || toman > MAX_DONATE_TOMAN) {
      toast({
        title: "مبلغ نامعتبر است",
        description: `مبلغ حمایت باید بین ${MIN_DONATE_TOMAN.toLocaleString("fa-IR")} و ${MAX_DONATE_TOMAN.toLocaleString("fa-IR")} تومان باشد.`,
        variant: "destructive",
      });
      return;
    }
    setDonating(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donateAmount: toman }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);

      if (typeof d.token === "string" && d.token) {
        // فرم POST طبق مستندات سپ — در همان تب (سازگار با موبایل/برنامک)
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
        title: "خطا در ایجاد حمایت",
        description: e.message ?? "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setDonating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <button
        onClick={() => setView("dashboard")}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت به داشبورد
      </button>

      <NoorCard className="noor-card-green p-6 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-noor-green/20">
          <Sprout className="h-8 w-8 text-noor-green" />
        </div>
        <h1 className="font-display text-2xl font-bold">حمایت از رشد منافسه</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">
          منافسه بدون نمایش تبلیغ مزاحم و با هدف خدمت به قاریان قرآن اداره می‌شود.
          حمایت مالی شما صرف توسعه امکانات، نگهداری سرورها و رشد محافل قرآنی می‌شود —
          هر مبلغی، کوچک یا بزرگ، دلگرمی ماست. 🌿
        </p>

        {/* مبلغ دلخواه */}
        <div className="mt-6 text-right">
          <label className="mb-1.5 block text-sm font-bold">مبلغ حمایت (تومان)</label>
          <input
            type="number"
            min={MIN_DONATE_TOMAN}
            max={MAX_DONATE_TOMAN}
            step={10000}
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-center text-lg font-black"
            dir="ltr"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {[50000, 100000, 200000, 500000].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAmount(t)}
                className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold transition ${
                  amount === t
                    ? "border-noor-green bg-noor-green/15 text-green-700 dark:text-lime-300"
                    : "border-muted-foreground/20 hover:border-noor-sky"
                }`}
              >
                {t.toLocaleString("fa-IR")}
              </button>
            ))}
          </div>
        </div>

        <NoorButton
          variant="green"
          onClick={donate}
          disabled={donating}
          className="mt-5 w-full"
          leftIcon={donating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
        >
          {donating ? "در حال اتصال به درگاه..." : "حمایت می‌کنم"}
        </NoorButton>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-noor-green" />
          پرداخت امن از طریق درگاه رسمی شاپرک (بانک سامان) — بدون دریافت امتیاز
        </p>
      </NoorCard>
    </div>
  );
}
