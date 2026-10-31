import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";
import {
  getPlan, planPriceRial, gatewayConfig, requestPaymentToken,
  creditsPriceRial, MAX_BUY_CREDITS,
  MIN_DONATE_TOMAN, MAX_DONATE_TOMAN,
} from "@/lib/payment/saman";

// ============================================================
// POST /api/payment/create — سه حالت سفارش:
//   { plan }          → پلن‌های آماده (سازگاری قبلی)
//   { credits }       → خرید تعداد دلخواه امتیاز (۱ تا ۱۰۰)
//                       — معطوف به قیمت جلسه استاد
//   { donateAmount }  → حمایت مالی به‌مبلغ دلخواه (تومان)
// مبلغ همیشه سمت سرور محاسبه می‌شود و هرگز به کلاینت اعتماد نمی‌شود.
// ============================================================

function readOrder(body: unknown): { amountRial: number; credits: number; plan: string } | { error: string } {
  const b = body as { plan?: unknown; credits?: unknown; donateAmount?: unknown } | null;
  if (b && typeof b.plan === "string") {
    const plan = getPlan(b.plan);
    if (!plan) return { error: "پلن نامعتبر است" };
    return { amountRial: planPriceRial(plan), credits: plan.credits, plan: plan.id };
  }
  if (b && b.credits !== undefined) {
    const credits = Math.floor(Number(b.credits));
    if (!Number.isSafeInteger(credits) || credits < 1 || credits > MAX_BUY_CREDITS) {
      return { error: `تعداد امتیاز باید عددی بین ۱ تا ${MAX_BUY_CREDITS} باشد` };
    }
    return { amountRial: creditsPriceRial(credits), credits, plan: "custom" };
  }
  if (b && b.donateAmount !== undefined) {
    const toman = Math.floor(Number(b.donateAmount));
    if (!Number.isSafeInteger(toman) || toman < MIN_DONATE_TOMAN || toman > MAX_DONATE_TOMAN) {
      return { error: `مبلغ حمایت باید بین ${MIN_DONATE_TOMAN.toLocaleString("fa-IR")} و ${MAX_DONATE_TOMAN.toLocaleString("fa-IR")} تومان باشد` };
    }
    return { amountRial: toman * 10, credits: 0, plan: "donate" };
  }
  return { error: "درخواست پرداخت نامعتبر است" };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "ورود لازم است" }, { status: 401 });
    const body = await request.json().catch(() => null);
    const order = readOrder(body);
    if ("error" in order) return NextResponse.json({ ok: false, error: order.error }, { status: 400 });
    let callbackUrl: string;
    try {
      callbackUrl = gatewayConfig().callbackUrl;
    } catch {
      return NextResponse.json({ ok: false, error: "درگاه پرداخت در حال آماده‌سازی است؛ لطفاً بعداً تلاش کنید" }, { status: 503 });
    }
    const resNum = `MON-${randomUUID()}`;
    const payment = await db.payment.create({ data: {
      userId: user.id, amount: order.amountRial / 10, credits: order.credits,
      plan: order.plan, status: "pending", samanResNum: resNum,
    } });
    const result = await requestPaymentToken({
      resNum, amountRial: order.amountRial, redirectUrl: callbackUrl,
    });
    if (!result.ok || !result.token) {
      await db.payment.updateMany({ where: { id: payment.id, status: "pending" }, data: { status: "failed" } });
      return NextResponse.json({ ok: false, error: result.message }, { status: 502 });
    }
    // Bind the bank token to this order before exposing it to the purchaser.
    await db.payment.update({ where: { id: payment.id }, data: { samanToken: result.token } });
    return NextResponse.json({ ok: true, paymentId: payment.id, token: result.token },
      { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("[Payment] creation failed");
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}
