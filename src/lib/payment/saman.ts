// SEP OnlinePG: token creation and server verification. All bank amounts are IRR.
export * from "./credit-plans";

export const SAMAN_TOKEN_URL = "https://sep.shaparak.ir/onlinepg/onlinepg";
export const SAMAN_VERIFY_URL = "https://sep.shaparak.ir/verifyTxnRandomSessionkey/ipg/VerifyTransaction";

export function gatewayConfig() {
  const terminal = process.env.SAMAN_TERMINAL_ID?.trim() ?? "";
  if (!/^\d+$/.test(terminal) || !Number.isSafeInteger(Number(terminal)) || Number(terminal) <= 0) {
    throw new Error("درگاه پرداخت هنوز پیکربندی نشده است");
  }
  const site = new URL(process.env.SITE_URL ?? "");
  if (site.protocol !== "https:" || site.username || site.password ||
      site.hostname === "localhost" || site.hostname === "127.0.0.1" ||
      site.pathname !== "/" || site.search || site.hash) {
    throw new Error("آدرس عمومی HTTPS سایت برای پرداخت تنظیم نشده است");
  }
  return { terminalId: Number(terminal), callbackUrl: `${site.origin}/api/payment/callback` };
}

export function validateIBAN(iban: string): boolean {
  return /^IR\d{24}$/.test(iban.trim());
}
export function validateCardNumber(card: string): boolean {
  return /^\d{16}$/.test(card.trim());
}

async function postGateway(url: string, body: object): Promise<{ ok: boolean; data: any }> {
  // Retry a dropped connection once, using the same order/reference. An actual
  // bank rejection is returned immediately and never retried as a success.
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(15000),
      });
      return { ok: response.ok, data: await response.json().catch(() => null) };
    } catch (error) {
      if (attempt === 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}

export interface PaymentTokenResult { ok: boolean; token?: string; message: string }
export async function requestPaymentToken(opts: {
  resNum: string; amountRial: number; redirectUrl: string;
}): Promise<PaymentTokenResult> {
  try {
    const config = gatewayConfig();
    if (!Number.isSafeInteger(opts.amountRial) || opts.amountRial <= 0 || opts.redirectUrl !== config.callbackUrl) {
      return { ok: false, message: "اطلاعات درخواست پرداخت نامعتبر است" };
    }
    const { ok, data } = await postGateway(SAMAN_TOKEN_URL, {
      action: "token", TerminalId: config.terminalId, Amount: opts.amountRial,
      ResNum: opts.resNum, RedirectUrl: config.callbackUrl,
    });
    if (ok && String(data?.status) === "1" && typeof data.token === "string" && data.token.length > 0) {
      return { ok: true, token: data.token, message: "توکن پرداخت صادر شد" };
    }
    console.error("[SEP] token rejected", { code: data?.errorCode ?? "invalid-response" });
    return { ok: false, message: "درگاه درخواست پرداخت را نپذیرفت؛ لطفاً بعداً تلاش کنید" };
  } catch {
    return { ok: false, message: "ارتباط با درگاه پرداخت برقرار نشد" };
  }
}

export interface VerifyResult {
  success: boolean; amountRial?: number; traceNo?: string; message: string;
}
export async function verifyTransaction(refNum: string, expectedAmountRial: number): Promise<VerifyResult> {
  try {
    const config = gatewayConfig();
    if (!refNum || refNum.length > 100 || refNum.startsWith("DEMO-") ||
        !Number.isSafeInteger(expectedAmountRial) || expectedAmountRial <= 0) {
      return { success: false, message: "اطلاعات تأیید پرداخت نامعتبر است" };
    }
    const { ok, data } = await postGateway(SAMAN_VERIFY_URL, {
      RefNum: refNum, TerminalNumber: config.terminalId,
    });
    const detail = data?.TransactionDetail;
    // Duplicate verification is usable only with complete matching bank details.
    // Ambiguous, missing or mismatched responses never grant credit.
    const confirmed = (data?.Success === true && data?.ResultCode === 0) || data?.ResultCode === 2;
    const amountRial = Number(detail?.OrginalAmount);
    if (!ok || !confirmed || !Number.isSafeInteger(amountRial) || amountRial !== expectedAmountRial ||
        String(detail?.RefNum ?? "") !== refNum || Number(detail?.TerminalNumber) !== config.terminalId) {
      return { success: false, message: "تأیید مبلغ یا مشخصات تراکنش توسط بانک انجام نشد؛ برای بررسی با پشتیبانی تماس بگیرید" };
    }
    return { success: true, amountRial, traceNo: String(detail.StraceNo ?? ""), message: "تراکنش تأیید شد" };
  } catch {
    return { success: false, message: "ارتباط تأیید پرداخت برقرار نشد؛ دوباره تلاش کنید" };
  }
}
