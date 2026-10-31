import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { gatewayConfig, verifyTransaction } from "@/lib/payment/saman";
import { finalizePayment } from "@/lib/payment/finalize";

function page(title: string, body: string, status: number): Response {
  const escape = (value: string) => value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
  return new Response(`<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<title>${escape(title)}</title><meta http-equiv="refresh" content="5;url=/">
<style>body{font-family:Tahoma;background:#0d1230;color:#fff;display:grid;place-items:center;height:100vh;margin:0;text-align:center}a{color:#FFD700}</style>
</head><body><div><h2>${escape(title)}</h2><p>${escape(body)}</p><a href="/">بازگشت به سایت</a></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" } });
}

type Callback = { resNum: string; refNum: string; state: string; token: string; terminal: string; amount: string };

async function handlePaymentCallback(input: Callback): Promise<Response> {
  const { resNum, refNum, state, token, terminal, amount } = input;
  if (!resNum || resNum.length > 100 || !token || token.length > 512) {
    return page("پرداخت تأیید نشد", "اطلاعات تراکنش ناقص است.", 400);
  }
  const payment = await db.payment.findUnique({ where: { samanResNum: resNum } });
  // Callback fields are untrusted. A bank token must belong to this exact order.
  if (!payment?.samanToken || payment.samanToken !== token) {
    return page("پرداخت تأیید نشد", "اطلاعات تراکنش معتبر نیست.", 400);
  }
  const config = gatewayConfig();
  if ((terminal && Number(terminal) !== config.terminalId) ||
      (amount && (!/^\d+$/.test(amount) || Number(amount) !== payment.amount * 10))) {
    return page("پرداخت تأیید نشد", "مشخصات تراکنش با سفارش مطابقت ندارد.", 400);
  }
  if (payment.status === "paid") {
    return page("پرداخت قبلاً تأیید شده", "امتیاز این سفارش قبلاً به حساب افزوده شده است.", 200);
  }
  if (state.toUpperCase() !== "OK") {
    await db.payment.updateMany({ where: { id: payment.id, status: "pending" }, data: { status: "failed" } });
    return page("پرداخت لغو شد", "پرداخت انجام نشد و امتیازی افزوده نشد.", 400);
  }
  if (!refNum || refNum.length > 100 || refNum.startsWith("DEMO-")) {
    return page("پرداخت تأیید نشد", "رسید بانکی معتبر دریافت نشد.", 400);
  }
  try {
    const bound = await db.payment.updateMany({
      where: { id: payment.id, status: { in: ["pending", "failed"] },
        OR: [{ samanRefNum: null }, { samanRefNum: refNum }] },
      data: { samanRefNum: refNum },
    });
    if (!bound.count) {
      const latest = await db.payment.findUnique({ where: { id: payment.id } });
      return latest?.status === "paid" && latest.samanRefNum === refNum
        ? page("پرداخت قبلاً تأیید شده", "امتیاز این سفارش قبلاً افزوده شده است.", 200)
        : page("پرداخت تأیید نشد", "رسید این سفارش قابل تأیید نیست.", 409);
    }
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return page("پرداخت تأیید نشد", "این رسید برای سفارش دیگری ثبت شده است.", 409);
    }
    throw error;
  }
  const verification = await verifyTransaction(refNum, payment.amount * 10);
  if (!verification.success) {
    // Preserve the receipt and pending/failed state for a safe verification retry.
    return page("پرداخت هنوز تأیید نشده", verification.message, 502);
  }
  const result = await finalizePayment(db, payment.id, refNum, verification.traceNo);
  const successBody = payment.credits > 0
    ? `${payment.credits.toLocaleString("fa-IR")} امتیاز به حساب شما افزوده شد.`
    : "از حمایت شما برای رشد و توسعه منافسه صمیمانه سپاسگزاریم 🌿";
  return page(result.alreadyPaid ? "پرداخت قبلاً تأیید شده" : "پرداخت موفق",
    result.alreadyPaid ? "این سفارش قبلاً نهایی شده است." : successBody, 200);
}

function readCallback(get: (name: string) => unknown): Callback {
  const text = (name: string) => { const value = get(name); return typeof value === "string" ? value.trim() : ""; };
  return { resNum: text("ResNum"), refNum: text("RefNum"), state: text("State"),
    token: text("Token"), terminal: text("TerminalId") || text("MID"), amount: text("Amount") };
}

export async function GET(request: NextRequest) {
  try { return await handlePaymentCallback(readCallback((key) => request.nextUrl.searchParams.get(key))); }
  catch { console.error("[Payment] callback failed"); return page("تأیید پرداخت انجام نشد", "لطفاً برای بررسی پرداخت با پشتیبانی تماس بگیرید.", 503); }
}
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    return await handlePaymentCallback(readCallback((key) => form.get(key)));
  } catch { console.error("[Payment] callback failed"); return page("تأیید پرداخت انجام نشد", "لطفاً برای بررسی پرداخت با پشتیبانی تماس بگیرید.", 503); }
}
