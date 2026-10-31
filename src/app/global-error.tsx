"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <div className="grid min-h-screen place-items-center p-6">
          <div className="mx-auto max-w-md text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-noor-coral" />
            <h2 className="font-display text-2xl text-noor-navy">
              خطایی رخ داد
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              صفحه دوباره بارگذاری شود تا خطا پاک شود. اگر خطا ادامه داشت،
              لطفاً با پشتیبانی تماس بگیرید.
            </p>
            <details className="mt-3 rounded-xl bg-muted/30 p-3 text-right text-xs text-muted-foreground">
              <summary className="cursor-pointer font-bold">
                جزئیات خطا (برای پشتیبانی)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">
                {error.name}: {error.message}
                {"\n\n"}
                {error.stack}
              </pre>
            </details>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => reset()}
                className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-noor-navy"
              >
                تلاش مجدد
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 rounded-full bg-noor-yellow px-4 py-2 text-sm font-bold text-noor-navy"
              >
                <RefreshCw className="h-4 w-4" />
                رفرش کامل
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
