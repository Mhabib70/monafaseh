// ============================================================
// پل توکن احراز هویت سمت کلاینت — سازگار با پیش‌نمایش iframe
// ------------------------------------------------------------
// درون iframe پیش‌نمایش ممکن است مرورگر کوکی نشست را ذخیره نکند.
// بنابراین توکن بعد از ورود در localStorage نگه داشته می‌شود و
// این ماژول همه درخواست‌های /api را با هدر x-auth-token ارسال
// می‌کند تا نشست حتی بدون کوکی نیز برقرار بماند.
// ============================================================

const TOKEN_KEY = "monafaseh:auth-token";
const BRIDGE_FLAG = "__monafasehAuthBridge";

/** ذخیره توکن نشست در localStorage (بعد از ورود/ثبت‌نام) */
export function saveAuthToken(token: string | null | undefined): void {
  if (!token) return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // حافظه در دسترس نیست (حالت ناشناس و…) — بی‌صدا رد شود
  }
}

/** پاک کردن توکن نشست (خروج از حساب) */
export function clearAuthToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // بی‌صدا
  }
}

/**
 * پچ سراسری fetch: افزودن هدر x-auth-token به همه درخواست‌های
 * هم‌مبدأ /api — بدون کوکی هم احراز هویت کار می‌کند.
 */
export function installAuthTokenBridge(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w[BRIDGE_FLAG]) return;
  w[BRIDGE_FLAG] = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      const isApiCall =
        url.startsWith("/api/") || url.startsWith(`${window.location.origin}/api/`);

      if (isApiCall) {
        const token = window.localStorage.getItem(TOKEN_KEY);
        if (token) {
          const headers = new Headers(
            init?.headers ?? (input instanceof Request ? input.headers : undefined),
          );
          if (!headers.has("x-auth-token")) {
            headers.set("x-auth-token", token);
          }
          init = { ...init, headers };
        }
      }
    } catch {
      // هر مشکلی در ساخت هدر نباید درخواست را قطع کند
    }

    return originalFetch(input, init);
  };
}

// نصب خودکار قبل از رندر هر کامپوننت (فقط سمت کلاینت)
if (typeof window !== "undefined") {
  installAuthTokenBridge();
}
