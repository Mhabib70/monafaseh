"use client";

// ============================================================
// ProfileView — صفحه پروفایل عمومی هر کاربر (سبک اینستاگرام)
// آواتار رنک‌دار + آمار + مدارج + تحصیلات + مهارت‌ها + گالری +
// شبکه‌های اجتماعی + کارت جلسه خصوصی
// پروفایل خود کاربر: ویرایش گالری و شبکه‌ها فعال است.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight, Loader2, Share2, Trash2, Plus, GraduationCap,
  Award, Sparkles, Camera, Link2, Mic2, MapPin, X, UserRound,
} from "lucide-react";
import { NoorAvatar } from "../noor-avatar";
import { NoorCard } from "../noor-card";
import { NoorButton } from "../noor-button";
import { VerifiedBadge } from "../verified-badge";
import { useNoorStore } from "@/store/noor-store";
import { useToast } from "@/hooks/use-toast";
import { qariRankDef, qariBadgeLabel } from "@/lib/noorcraft/constants";

interface GalleryItem { url: string; thumb: string }

interface ProfileData {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  avatarColor: string;
  gender: string | null;
  bio: string | null;
  city: string | null;
  province: string | null;
  education: string | null;
  honors: string | null;
  recitationType: string | null;
  favoriteReciter: string | null;
  social: Record<string, string>;
  gallery: GalleryItem[];
  skills: string[];
  interests: string[];
  qariRank: string | null;
  verified: boolean;
  verifiedAt: number | null;
  online: boolean;
  stats: { noorPoints: number; sessionsAttended: number; streak: number };
  privateSession: { price: number } | null;
  memberSince: number;
  ranks: { requestType: string; competitionId: string; competitionYear: string; reviewedAt: string }[];
}

async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1440 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.82),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

export function ProfileView() {
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const profileUserId = useNoorStore((s) => s.profileUserId);
  const setProfileUserId = useNoorStore((s) => s.setProfileUserId);
  const { toast } = useToast();

  const targetId = profileUserId || user?.id || "";
  const isOwn = !!user && targetId === user.id;

  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<ProfileData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${targetId}`, { cache: "no-store" });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
      setP(d.profile);
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addImages(files: FileList | null) {
    if (!files?.length || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 10)) {
        const blob = await compressImage(file);
        const form = new FormData();
        form.append("image", blob, "photo.jpg");
        const res = await fetch("/api/profile/gallery", { method: "POST", body: form });
        const d = await res.json();
        if (!d.ok) throw new Error(d.error);
      }
      toast({ title: "تصاویر اضافه شد ✓" });
      await load();
    } catch (e: unknown) {
      toast({
        title: "خطا در افزودن تصویر",
        description: e instanceof Error ? e.message : "دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeImage(url: string) {
    setP((prev) => (prev ? { ...prev, gallery: prev.gallery.filter((g) => g.url !== url) } : prev));
    try {
      const res = await fetch("/api/profile/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error);
    } catch {
      toast({ title: "حذف ناموفق — دوباره تلاش کنید", variant: "destructive" });
      await load();
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-noor-yellow" />
      </div>
    );
  }

  if (notFound || !p) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4">
        <NoorCard className="max-w-sm p-8 text-center">
          <p className="text-muted-foreground">این صفحه پیدا نشد.</p>
          <NoorButton variant="yellow" className="mt-4" onClick={() => setView("dashboard")}>
            بازگشت
          </NoorButton>
        </NoorCard>
      </div>
    );
  }

  const rankDef = qariRankDef(p.qariRank);
  const rankColor = rankDef?.color ?? "#FFC400";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-noor-hero pb-16">
      {/* کاور */}
      <div
        className="relative h-36 w-full sm:h-44"
        style={{
          background: rankDef
            ? `linear-gradient(160deg, ${rankDef.color}30, transparent 70%), linear-gradient(160deg,#0c0b09,#17150f)`
            : "linear-gradient(160deg,#0c0b09,#17150f)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='44' height='44' viewBox='0 0 44 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23FFC400' stroke-width='1'%3E%3Cpath d='M22 0 L44 22 L22 44 L0 22 Z'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="mx-auto flex h-full max-w-2xl items-center justify-between px-4">
          <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] font-bold text-white/80">
            {p.online ? "🟢 آنلاین" : "آفلاین"}
          </span>
          <button
            onClick={async () => {
              const url = `${window.location.origin}/?user=${p.id}`;
              try {
                await navigator.share({ title: p.fullName, url });
              } catch {
                await navigator.clipboard?.writeText(url).catch(() => {});
                toast({ title: "لینک صفحه کپی شد ✓" });
              }
            }}
            className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-black/50"
          >
            <Share2 className="h-3.5 w-3.5" /> اشتراک‌گذاری
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4">
        {/* هدر */}
        <div className="-mt-12 flex items-end gap-4">
          <div className="rounded-full p-[3px]" style={{ background: `linear-gradient(140deg, ${rankColor}, #FFC400)` }}>
            <NoorAvatar
              name={p.fullName}
              color={p.avatarColor}
              avatarUrl={p.avatarUrl}
              gender={p.gender}
              size="xl"
            />
          </div>
          {isOwn && (
            <div className="mr-auto flex gap-2">
              <button
                onClick={() => setView("dashboard")}
                className="rounded-xl bg-card px-3.5 py-2 text-xs font-bold shadow-sm transition hover:shadow-md"
                title="پنل کاربری، امتیازها و تنظیمات"
              >
                پنل کاربری
              </button>
              <button
                onClick={() => setView("auth")}
                className="rounded-xl bg-card px-3.5 py-2 text-xs font-bold shadow-sm transition hover:shadow-md"
              >
                ویرایش
              </button>
            </div>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-black text-noor-navy dark:text-white">{p.fullName}</h1>
            {p.verified && <VerifiedBadge size={18} rank={p.qariRank} />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {rankDef && (
              <span
                className="rounded-full px-2 py-0.5 font-bold"
                style={{ background: `${rankDef.color}1e`, color: rankDef.color, border: `1px solid ${rankDef.color}55` }}
              >
                🏅 {rankDef.label}
              </span>
            )}
            {p.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.city}</span>}
            {p.recitationType && <span className="flex items-center gap-1"><Mic2 className="h-3 w-3" />{p.recitationType}</span>}
            {p.favoriteReciter && <span className="flex items-center gap-1"><Award className="h-3 w-3" />اقتدا به {p.favoriteReciter}</span>}
          </div>
          {p.bio && <p className="mt-2 text-sm leading-7 text-foreground/90">{p.bio}</p>}
        </div>

        {/* آمار */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <NoorCard className="p-3">
            <div className="text-lg font-black text-noor-navy dark:text-white">{p.stats.noorPoints.toLocaleString("fa-IR")}</div>
            <div className="text-[10px] text-muted-foreground">امتیاز نور</div>
          </NoorCard>
          <NoorCard className="p-3">
            <div className="text-lg font-black text-noor-navy dark:text-white">{p.stats.sessionsAttended.toLocaleString("fa-IR")}</div>
            <div className="text-[10px] text-muted-foreground">محفل</div>
          </NoorCard>
          <NoorCard className="p-3">
            <div className="text-lg font-black text-noor-navy dark:text-white">{p.stats.streak.toLocaleString("fa-IR")}</div>
            <div className="text-[10px] text-muted-foreground">روز پیوسته</div>
          </NoorCard>
        </div>

        {/* جلسه خصوصی */}
        {p.privateSession && !isOwn && (
          <NoorCard className="mt-4 flex items-center gap-3 border-noor-yellow/40 p-4">
            <Sparkles className="h-6 w-6 shrink-0 text-noor-yellow" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">جلسه خصوصی با {p.fullName.split(" ")[0]}</div>
              <div className="text-xs text-muted-foreground">
                {p.privateSession.price.toLocaleString("fa-IR")} امتیاز برای هر جلسه
              </div>
            </div>
            <NoorButton
              variant="yellow"
              size="md"
              onClick={async () => {
                try {
                  const res = await fetch("/api/masters/book", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ masterId: p.id }),
                  });
                  const d = await res.json();
                  if (!d.ok) throw new Error(d.error);
                  toast({ title: "رزرو شد 🎉", description: "در حال انتقال به محفل..." });
                  setView("session-room");
                } catch (e: unknown) {
                  toast({
                    title: "رزرو ناموفق",
                    description: e instanceof Error ? e.message : "دوباره تلاش کنید",
                    variant: "destructive",
                  });
                }
              }}
            >
              رزرو
            </NoorButton>
          </NoorCard>
        )}

        {/* درباره و تخصص‌ها */}
        {(p.education || p.honors || p.skills.length > 0 || p.interests.length > 0) && (
          <NoorCard className="mt-4 p-5">
            <h3 className="flex items-center gap-2 text-sm font-black">
              <GraduationCap className="h-4 w-4 text-noor-sky" /> درباره و تخصص‌ها
            </h3>
            <div className="mt-3 space-y-3 text-sm">
              {p.education && (
                <div className="flex items-start gap-2">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-noor-sky" />
                  <span>تحصیلات: <b>{p.education}</b></span>
                </div>
              )}
              {p.honors && (
                <div className="flex items-start gap-2">
                  <Award className="mt-0.5 h-4 w-4 shrink-0 text-noor-yellow" />
                  <span className="leading-6">مدارج و افتخارات: <b>{p.honors}</b></span>
                </div>
              )}
              {p.skills.length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" /> مهارت‌های قرآنی
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.skills.map((sk) => (
                      <span key={sk} className="rounded-full bg-noor-sky/10 px-2.5 py-1 text-[11px] font-bold text-noor-navy dark:text-sky-200">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {p.interests.length > 0 && (
                <div>
                  <div className="mb-1.5 text-xs font-bold text-muted-foreground">علاقه‌مندی‌ها</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.interests.map((it) => (
                      <span key={it} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold">{it}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </NoorCard>
        )}

        {/* شبکه‌های اجتماعی */}
        {Object.values(p.social).some(Boolean) && (
          <NoorCard className="mt-4 p-5">
            <h3 className="flex items-center gap-2 text-sm font-black">
              <Link2 className="h-4 w-4 text-noor-sky" /> شبکه‌های اجتماعی
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.social.eitaa && <SocialChip icon="💬" label="ایتا" href={`https://eitaa.com/${p.social.eitaa.replace(/^@/, "")}`} />}
              {p.social.telegram && <SocialChip icon="✈️" label="تلگرام" href={`https://t.me/${p.social.telegram.replace(/^@/, "")}`} />}
              {p.social.instagram && <SocialChip icon="📷" label="اینستاگرام" href={`https://instagram.com/${p.social.instagram.replace(/^@/, "")}`} />}
              {p.social.youtube && <SocialChip icon="▶️" label="یوتیوب" href={p.social.youtube.startsWith("http") ? p.social.youtube : `https://youtube.com/@${p.social.youtube.replace(/^@/, "")}`} />}
              {p.social.website && <SocialChip icon="🌐" label="وبسایت" href={p.social.website.startsWith("http") ? p.social.website : `https://${p.social.website}`} />}
            </div>
          </NoorCard>
        )}

        {/* گالری */}
        <NoorCard className="mt-4 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black">
              <Camera className="h-4 w-4 text-noor-yellow" /> گالری تصاویر
              <span className="text-xs font-normal text-muted-foreground">
                ({p.gallery.length.toLocaleString("fa-IR")} از ۱۰)
              </span>
            </h3>
          </div>

          {p.gallery.length === 0 ? (
            <p className="rounded-xl bg-muted/30 p-4 text-center text-xs text-muted-foreground">
              هنوز تصویری ثبت نشده است
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {p.gallery.map((g) => (
                <div key={g.url} className="group relative aspect-square overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.thumb}
                    alt=""
                    className="h-full w-full cursor-pointer object-cover transition hover:scale-105"
                    onClick={() => setLightbox(g.url)}
                  />
                  {isOwn && (
                    <button
                      onClick={async () => {
                        if (window.confirm("این تصویر حذف شود؟")) await removeImage(g.url);
                      }}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                      title="حذف"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {isOwn && (
            <div className="mt-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addImages(e.target.files)}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || p.gallery.length >= 10}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 p-3 text-xs font-bold text-muted-foreground transition hover:border-noor-yellow/50 hover:text-foreground disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                افزودن تصویر از گالری گوشی (فشرده‌سازی خودکار)
              </button>
            </div>
          )}
        </NoorCard>
      </div>

      {/* لایت‌باکس */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-[90vh] max-w-full rounded-2xl object-contain" />
          <button className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function SocialChip({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-bold transition hover:bg-noor-sky/15"
    >
      <span>{icon}</span>
      {label}
    </a>
  );
}
