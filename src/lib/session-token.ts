import type { NextRequest } from "next/server";

// ============================================================
// توکن نشست منافسه — خواندن و تنظیم کوکی به‌صورت سازگار با پیش‌نمایش
// ------------------------------------------------------------
// وقتی اپ داخل iframe پیش‌نمایش (دامنه متفاوت) باز می‌شود، مرورگر
// کوکی‌های SameSite=Lax را ارسال نمی‌کند. راه‌حل دو لایه:
//   ۱) روی HTTPS → SameSite=None; Secure (کوکی در iframe کار می‌کند)
//   ۲) پشتیبان هدر x-auth-token از localStorage سمت کلاینت
// ============================================================

export const AUTH_COOKIE = "monafaseh-token";
export const AUTH_HEADER = "x-auth-token";

/** خواندن توکن نشست از کوکی یا (در نبود آن) از هدر پشتیبان */
export function readSessionToken(request: NextRequest): string | null {
  const fromCookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (fromCookie) return fromCookie;

  const fromHeader = request.headers.get(AUTH_HEADER);
  return fromHeader && fromHeader.trim().length > 0 ? fromHeader : null;
}

/**
 * تنظیمات کوکی نشست — بر اساس پروتکل درخواست:
 * پیش‌نمایش روی HTTPS سرو می‌شود (x-forwarded-proto=https) → SameSite=None
 * تا کوکی درون iframe دامنه متفاوت ذخیره و ارسال شود.
 * دسترسی مستقیم HTTP (localhost) → SameSite=Lax مانند قبل.
 */
export function sessionCookieOptions(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto = forwardedProto
    ? forwardedProto.split(",")[0].trim()
    : request.nextUrl.protocol.replace(":", "");
  const isHttps = proto === "https";

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: (isHttps ? "none" : "lax") as "none" | "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // ۳۰ روز
  };
}
