"use client";

import { useEffect, useRef } from "react";
import { useNoorStore } from "@/store/noor-store";
import { useToast } from "@/hooks/use-toast";

// ============================================================
// EitaaMiniApp — فعال‌سازی سایت به‌عنوان برنامک ایتا
// ------------------------------------------------------------
// • اسکریپت SDK ایتا را بارگذاری می‌کند (طبق مستندات باید از
//   سرور ایتا لود شود و لوکال ذخیره نشود)
// • ready() را صدا می‌زند تا لودر ایتا پنهان شود
// • اگر کاربر قبلاً حسابش را به ایتا متصل کرده، خودکار وارد می‌شود
// • دکمه «بازگشت» ایتا را به navigate داخلی سایت وصل می‌کند
// • خارج از ایتا کاملاً بی‌اثر است (سایت عادی همچنان کار می‌کند)
// ============================================================

const SDK_URL = "https://developer.eitaa.com/eitaa-web-app.js";

interface EitaaWebApp {
  ready: () => void;
  expand: () => void;
  initData?: string;
  initDataUnsafe?: { user?: { id: number; first_name: string; last_name: string } };
  platform?: string;
  version?: string;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  onEvent?: (event: string, cb: () => void) => void;
}

declare global {
  interface Window {
    Eitaa?: { WebApp?: EitaaWebApp };
  }
}

let sdkLoadPromise: Promise<boolean> | null = null;

function loadEitaaSdk(): Promise<boolean> {
  if (sdkLoadPromise) return sdkLoadPromise;
  sdkLoadPromise = new Promise((resolve) => {
    if (window.Eitaa?.WebApp) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve(!!window.Eitaa?.WebApp);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
    // اگر بعد از ۵ ثانیه لود نشد (مثلاً آفلاین)، رها کن
    setTimeout(() => resolve(!!window.Eitaa?.WebApp), 5000);
  });
  return sdkLoadPromise;
}

export function EitaaMiniApp() {
  const setEitaaAvailable = useNoorStore((s) => s.setEitaaAvailable);
  const setEitaaUser = useNoorStore((s) => s.setEitaaUser);
  const signIn = useNoorStore((s) => s.signIn);
  const user = useNoorStore((s) => s.user);
  const view = useNoorStore((s) => s.view);
  const setView = useNoorStore((s) => s.setView);
  const { toast } = useToast();

  const backHandlerRef = useRef<(() => void) | null>(null);

  // ── ۱. بارگذاری SDK + ready + ورود خودکار ──────────────────
  useEffect(() => {
    let cancelled = false;

    loadEitaaSdk().then((loaded) => {
      if (cancelled) return;
      const wa = window.Eitaa?.WebApp;
      if (!loaded || !wa) return; // خارج از ایتا — هیچ کاری نکن

      setEitaaAvailable(true);
      try {
        wa.ready();
        wa.expand();
      } catch {}

      const initData = wa.initData;
      const unsafeUser = wa.initDataUnsafe?.user;
      if (!initData || !unsafeUser) return;

      setEitaaUser({
        id: String(unsafeUser.id),
        firstName: unsafeUser.first_name ?? "",
        lastName: unsafeUser.last_name ?? "",
      });

      // تلاش برای ورود یکپارچه
      fetch("/api/eitaa/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          if (d.ok && d.linked && d.user) {
            signIn(d.user);
          }
          // linked=false یعنی حساب ایتا هنوز متصل نیست؛ کاربر از
          // صفحه ورود خودش اتصال را انجام می‌دهد. بی‌صدا رد می‌شویم.
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [setEitaaAvailable, setEitaaUser, signIn]);

  // ── ۲. دکمه بازگشت ایتا ← navigation سایت ──────────────────
  useEffect(() => {
    const wa = window.Eitaa?.WebApp;
    const bb = wa?.BackButton;
    if (!bb) return;

    // در ویوهای پایین، دکمه بازگشت ایتا را نشان بده
    const rootViews = ["landing", "dashboard"];
    if (rootViews.includes(view) || !user) {
      bb.hide();
      return;
    }

    const handler = () => {
      // مثل دکمه «بازگشت» داخلی سایت: اگر ویو فعلی زیرمجموعه است
      // به داشبورد برگرد؛ در غیر این صورت دکمه ایتا برنامه را می‌بندد
      setView("dashboard");
    };

    // حذف handler قبلی و ثبت جدید
    if (backHandlerRef.current) {
      try {
        bb.offClick(backHandlerRef.current);
      } catch {}
    }
    backHandlerRef.current = handler;
    bb.show();
    bb.onClick(handler);

    return () => {
      try {
        bb.offClick(handler);
      } catch {}
    };
  }, [view, user, setView]);

  return null;
}
