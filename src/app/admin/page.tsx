"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminView } from "@/components/noorcraft/views/admin-view";
import { NoorButton } from "@/components/noorcraft/noor-button";
import { Loader2, Shield, Lock } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.ok && data.user?.role === "admin") {
          setIsAdmin(true);
        }
      } catch {
        // Not logged in
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "ورود ناموفق");
        setLoggingIn(false);
        return;
      }

      if (data.user?.role !== "admin") {
        setError("شما ادمین نیستید");
        setLoggingIn(false);
        return;
      }

      // تأیید دومرحله‌ای: کوکی نشست باید واقعاً ذخیره شده باشد.
      // بعضی مرورگرهای داخلی موبایل کوکی‌ها را نگه نمی‌دارند — با این
      // بررسی، پیام خطای دقیق به‌جای پنل نیمه‌باز نمایش داده می‌شود.
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const meData = await meRes.json();

      if (!meData.ok || meData.user?.role !== "admin") {
        setError(
          "ورود انجام شد اما نشست ذخیره نشد. لطفاً کوکی‌های مرورگر را فعال کنید یا صفحه را در Chrome/Safari اصلی باز کنید.",
        );
        setLoggingIn(false);
        return;
      }

      setIsAdmin(true);
      setShowLogin(false);
    } catch {
      setError("خطای شبکه");
      setLoggingIn(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-noor-hero">
        <Loader2 className="h-8 w-8 animate-spin text-noor-yellow" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-noor-hero px-4">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border-2 border-noor-navy/15 bg-white p-8 shadow-2xl dark:bg-card">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-noor-navy">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold">پنل مدیریت منافسه</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                این بخش فقط برای مدیران سایت قابل دسترس است
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold">نام کاربری مدیر</label>
                <input
                  type="text"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="47662244"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-noor-sky focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold">رمز عبور</label>
                <input
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-noor-sky focus:outline-none"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 p-3 text-center text-sm font-medium text-red-500">
                  {error}
                </div>
              )}

              <NoorButton
                type="submit"
                variant="yellow"
                size="lg"
                className="w-full"
                disabled={loggingIn}
                leftIcon={<Lock className="h-5 w-5" />}
              >
                {loggingIn ? "در حال ورود..." : "ورود به پنل مدیریت"}
              </NoorButton>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => router.push("/")}
                className="text-xs text-muted-foreground hover:underline"
              >
                بازگشت به سایت
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is admin — show admin panel
  return (
    <div className="min-h-screen bg-noor-hero">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <NoorBadge variant="coral" icon={<Shield className="h-3 w-3" />}>
              پنل مدیریتی
            </NoorBadge>
            <h1 className="mt-3 text-3xl font-extrabold text-white">
              مدیریت منافسه
            </h1>
          </div>
          <a
            href="/"
            className="rounded-full bg-muted px-4 py-2 text-sm font-bold text-muted-foreground transition hover:bg-muted/80"
          >
            بازگشت به سایت
          </a>
        </div>
        <AdminView />
      </div>
    </div>
  );
}

function NoorBadge({ children, variant }: { children: React.ReactNode; variant: "coral" }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-noor-coral/20 px-3 py-1 text-xs font-bold text-noor-coral">
      {children}
    </span>
  );
}
