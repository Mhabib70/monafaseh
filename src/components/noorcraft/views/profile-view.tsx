"use client";

// ============================================================
// ProfileView — صفحه پروفایل عمومی با ساختار اینستاگرام
// هدر نام+بج → خط داشبورد/رنک → ردیف آواتار+۳آمار → نام/دسته/بیو →
// دکمه‌های ویرایش/اشتراک‌گذاری → هایلایت مهارت‌ها → تب‌های
// پست‌ها/درباره/شبکه‌ها → گرید ۳ستونه گالری با لایت‌باکس
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2, MoreVertical, ChevronLeft, LayoutGrid, UserRound, Link2,
  Camera, Plus, X, Trash2, GraduationCap, Award, Mic2, MapPin,
  Flame, CalendarDays, ExternalLink, Share2, LayoutDashboard,
} from "lucide-react";
import { NoorAvatar } from "../noor-avatar";
import { VerifiedBadge } from "../verified-badge";
import { useNoorStore } from "@/store/noor-store";
import { useToast } from "@/hooks/use-toast";
import { qariRankDef, qariBadgeLabel } from "@/lib/noorcraft/constants";
import { TRUSTED_COMPETITIONS } from "@/lib/noorcraft/trusted-competitions";

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

type Tab = "posts" | "about" | "socials";

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

const fa = (n: number) => n.toLocaleString("fa-IR");

export function ProfileView() {
  const user = useNoorStore((s) => s.user);
  const setView = useNoorStore((s) => s.setView);
  const profileUserId = useNoorStore((s) => s.profileUserId);
  const { toast } = useToast();

  const targetId = profileUserId || user?.id || "";
  const isOwn = !!user && targetId === user.id;

  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<ProfileData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("posts");
  const [menuOpen, setMenuOpen] = useState(false);
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
      toast({ title: "پست اضافه شد ✓" });
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
    setLightbox(null);
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

  async function shareProfile() {
    if (!p) return;
    const url = `${window.location.origin}/?user=${p.id}`;
    try {
      await navigator.share({ title: p.fullName, url });
    } catch {
      await navigator.clipboard?.writeText(url).catch(() => {});
      toast({ title: "لینک پروفایل کپی شد ✓" });
    }
  }

  async function bookSession() {
    if (!p) return;
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
        <div className="text-center">
          <p className="text-muted-foreground">این صفحه پیدا نشد.</p>
          <button
            onClick={() => setView("dashboard")}
            className="mt-4 rounded-lg bg-noor-sky px-4 py-2 text-sm font-bold text-white"
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  const rankDef = qariRankDef(p.qariRank);
  const rankColor = rankDef?.color ?? "#FFC400";
  const metaLine = [p.recitationType, p.city].filter(Boolean).join(" · ");

  const socials: { key: string; label: string; icon: string; href: string }[] = [];
  if (p.social.eitaa) socials.push({ key: "eitaa", label: "ایتا", icon: "💬", href: `https://eitaa.com/${p.social.eitaa.replace(/^@/, "")}` });
  if (p.social.telegram) socials.push({ key: "telegram", label: "تلگرام", icon: "✈️", href: `https://t.me/${p.social.telegram.replace(/^@/, "")}` });
  if (p.social.instagram) socials.push({ key: "instagram", label: "اینستاگرام", icon: "📷", href: `https://instagram.com/${p.social.instagram.replace(/^@/, "")}` });
  if (p.social.youtube) socials.push({ key: "youtube", label: "یوتیوب", icon: "▶️", href: p.social.youtube.startsWith("http") ? p.social.youtube : `https://youtube.com/@${p.social.youtube.replace(/^@/, "")}` });
  if (p.social.website) socials.push({ key: "website", label: "وبسایت", icon: "🌐", href: p.social.website.startsWith("http") ? p.social.website : `https://${p.social.website}` });

  const hasAbout = !!(p.education || p.honors || p.favoriteReciter || p.ranks.length > 0 || p.interests.length > 0 || p.skills.length > 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-24" onClick={() => menuOpen && setMenuOpen(false)}>
      <div className="mx-auto max-w-xl">
        {/* ── ردیف نام و منو (هدر اینستاگرامی) ── */}
        <div className="flex items-center gap-1.5 px-4 pt-4">
          <h1 className="text-xl font-bold leading-none text-noor-navy dark:text-white">{p.fullName}</h1>
          {p.verified && <VerifiedBadge size={17} rank={p.qariRank} />}
          <div className="relative ms-auto">
            <button
              aria-label="منو"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div
                className="absolute end-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {isOwn && (
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-bold transition hover:bg-muted"
                    onClick={() => { setMenuOpen(false); setView("dashboard"); }}
                  >
                    <LayoutDashboard className="h-4 w-4" /> پنل کاربری
                  </button>
                )}
                {isOwn && (
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-bold transition hover:bg-muted"
                    onClick={() => { setMenuOpen(false); setView("auth"); }}
                  >
                    <UserRound className="h-4 w-4" /> ویرایش پروفایل
                  </button>
                )}
                <button
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-bold transition hover:bg-muted"
                  onClick={() => { setMenuOpen(false); shareProfile(); }}
                >
                  <Share2 className="h-4 w-4" /> اشتراک‌گذاری پروفایل
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── خط داشبورد (خودی) یا نشان رنک (دیگران) ── */}
        <div className="px-4 pt-1">
          {isOwn ? (
            <button
              onClick={() => setView("dashboard")}
              className="flex items-center gap-1 text-[13px] font-bold text-noor-sky transition hover:opacity-80"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              پنل کاربری
              <ChevronLeft className="h-3 w-3" />
            </button>
          ) : rankDef ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: `${rankDef.color}1a`, color: rankDef.color, border: `1px solid ${rankDef.color}55` }}
            >
              🏅 {rankDef.label}
            </span>
          ) : p.verified ? (
            <span className="text-[11px] font-bold text-muted-foreground">قاری تأییدشده</span>
          ) : null}
        </div>

        {/* ── ردیف آواتار و آمار ── */}
        <div className="flex items-center gap-5 px-4 pt-3">
          <div className="relative shrink-0">
            <div className="rounded-full p-[3px]" style={{ background: `linear-gradient(140deg, ${rankColor}, #FFC400)` }}>
              <NoorAvatar
                name={p.fullName}
                color={p.avatarColor}
                avatarUrl={p.avatarUrl}
                gender={p.gender}
                size="xl"
              />
            </div>
            {p.online && (
              <span className="absolute bottom-1 end-1 h-4 w-4 rounded-full border-2 border-background bg-noor-green" />
            )}
          </div>
          <div className="flex flex-1 items-center justify-around text-center">
            <Stat value={fa(p.gallery.length)} label="پست" />
            <Stat value={fa(p.stats.noorPoints)} label="امتیاز نور" />
            <Stat value={fa(p.stats.sessionsAttended)} label="محفل" />
          </div>
        </div>

        {/* ── نام، دسته و بیو ── */}
        <div className="px-4 pt-3">
          <div className="text-sm font-bold text-noor-navy dark:text-white">{p.fullName}</div>
          {metaLine && (
            <div className="mt-0.5 flex items-center gap-1 text-[13px] text-muted-foreground">
              <Mic2 className="h-3.5 w-3.5" />
              {metaLine}
            </div>
          )}
          {p.bio && <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-foreground/90">{p.bio}</p>}
        </div>

        {/* ── دکمه‌های اکشن ── */}
        <div className="flex flex-col gap-1.5 px-4 pt-3">
          {isOwn ? (
            <button
              onClick={() => setView("auth")}
              className="w-full rounded-lg border border-noor-sky/60 py-1.5 text-sm font-bold text-noor-sky transition hover:bg-noor-sky/10"
            >
              ویرایش پروفایل
            </button>
          ) : p.privateSession ? (
            <button
              onClick={bookSession}
              className="w-full rounded-lg py-2 text-sm font-black text-noor-navy shadow-sm transition hover:brightness-105"
              style={{ background: "linear-gradient(140deg,#FFE58A,#FFC400 55%,#e09e00)" }}
            >
              رزرو جلسه خصوصی — {fa(p.privateSession.price)} امتیاز
            </button>
          ) : null}
          <button
            onClick={shareProfile}
            className="w-full rounded-lg bg-muted py-1.5 text-sm font-bold text-foreground transition hover:bg-muted/70"
          >
            اشتراک‌گذاری پروفایل
          </button>
        </div>

        {/* ── هایلایت‌ها: مهارت‌ها به‌شکل دایره ── */}
        {p.skills.length > 0 && (
          <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {p.skills.slice(0, 12).map((s) => (
              <div key={s} className="flex w-[68px] shrink-0 flex-col items-center gap-1">
                <div className="h-16 w-16 rounded-full border-2 p-[3px]" style={{ borderColor: `${rankColor}88` }}>
                  <div className="grid h-full w-full place-items-center rounded-full bg-muted text-lg font-black text-noor-navy dark:text-white">
                    {s.trim().charAt(0)}
                  </div>
                </div>
                <span className="w-full truncate text-center text-[10px] text-muted-foreground" title={s}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── تب‌ها ── */}
        <div className="mt-4 border-t border-border">
          <div className="grid grid-cols-3">
            <TabButton icon={<LayoutGrid className="h-5 w-5" />} label="پست‌ها" active={tab === "posts"} onClick={() => setTab("posts")} />
            <TabButton icon={<UserRound className="h-5 w-5" />} label="درباره" active={tab === "about"} onClick={() => setTab("about")} disabled={!hasAbout} />
            <TabButton icon={<Link2 className="h-5 w-5" />} label="شبکه‌ها" active={tab === "socials"} onClick={() => setTab("socials")} disabled={socials.length === 0} />
          </div>
        </div>

        {/* ── محتوای تب‌ها ── */}
        {tab === "posts" && (
          <div className="px-1 pt-1">
            {p.gallery.length === 0 ? (
              <div className="grid place-items-center py-14 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-border">
                  <Camera className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-bold">هنوز پستی نیست</p>
                {isOwn && (
                  <>
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
                      disabled={uploading}
                      className="mt-3 rounded-lg bg-noor-sky px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "افزودن اولین پست"}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-[3px]">
                {p.gallery.map((g) => (
                  <div key={g.url} className="group relative aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.thumb}
                      alt=""
                      className="h-full w-full cursor-pointer object-cover"
                      onClick={() => setLightbox(g.url)}
                    />
                    {isOwn && (
                      <button
                        aria-label="حذف"
                        onClick={(e) => { e.stopPropagation(); if (window.confirm("این پست حذف شود؟")) removeImage(g.url); }}
                        className="absolute end-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                {isOwn && p.gallery.length < 10 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="grid aspect-square place-items-center border border-dashed border-border text-muted-foreground transition hover:border-noor-sky/60 hover:text-foreground disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-7 w-7" />}
                  </button>
                )}
                {isOwn && <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />}
              </div>
            )}
          </div>
        )}

        {tab === "about" && (
          <div className="space-y-1 px-4 pt-3 text-sm">
            {p.education && (
              <Row icon={<GraduationCap className="h-4 w-4 text-noor-sky" />} label="تحصیلات" value={p.education} />
            )}
            {p.favoriteReciter && (
              <Row icon={<Mic2 className="h-4 w-4 text-noor-sky" />} label="قاری اقتدا" value={p.favoriteReciter} />
            )}
            {p.honors && (
              <div className="flex items-start gap-2 py-2">
                <Award className="mt-0.5 h-4 w-4 shrink-0 text-noor-yellow" />
                <div>
                  <div className="text-xs text-muted-foreground">مدارج و افتخارات</div>
                  <div className="whitespace-pre-line font-bold leading-6">{p.honors}</div>
                </div>
              </div>
            )}
            {p.ranks.length > 0 && (
              <div className="flex items-start gap-2 py-2">
                <Award className="mt-0.5 h-4 w-4 shrink-0 text-noor-yellow" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">مقام‌های رسمی تأییدشده</div>
                  <ul className="mt-1 space-y-1">
                    {p.ranks.map((r, i) => {
                      const comp = TRUSTED_COMPETITIONS.find((c) => c.id === r.competitionId);
                      const tier = qariRankDef(r.requestType);
                      return (
                        <li key={i} className="text-[13px] leading-6">
                          🏅 {comp?.name ?? r.competitionId}
                          {r.competitionYear ? ` — سال ${r.competitionYear}` : ""}
                          {tier ? ` (${tier.label})` : ""}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
            <Row icon={<Flame className="h-4 w-4 text-noor-coral" />} label="روز پیوسته" value={`${fa(p.stats.streak)} روز`} />
            <Row
              icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
              label="عضویت از"
              value={new Date(p.memberSince).toLocaleDateString("fa-IR", { year: "numeric", month: "long" })}
            />
            {p.city && <Row icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="موقعیت" value={`${p.province ?? ""}${p.province && p.city ? " — " : ""}${p.city}`} />}
            {p.skills.length > 0 && (
              <div className="py-2">
                <div className="text-xs text-muted-foreground">مهارت‌های قرآنی</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {p.skills.map((s) => (
                    <span key={s} className="rounded-full bg-noor-sky/10 px-2.5 py-1 text-[11px] font-bold text-noor-navy dark:text-sky-200">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {p.interests.length > 0 && (
              <div className="py-2">
                <div className="text-xs text-muted-foreground">علاقه‌مندی‌ها</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {p.interests.map((it) => (
                    <span key={it} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold">{it}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "socials" && (
          <div className="px-4 pt-3">
            {socials.map((s) => (
              <a
                key={s.key}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 border-b border-border py-3 last:border-0"
              >
                <span className="text-lg">{s.icon}</span>
                <span className="text-sm font-bold">{s.label}</span>
                <ExternalLink className="ms-auto h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── لایت‌باکس ── */}
      {lightbox && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-[85vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button aria-label="بستن" className="absolute end-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white">
            <X className="h-5 w-5" />
          </button>
          {isOwn && (
            <button
              aria-label="حذف"
              onClick={(e) => { e.stopPropagation(); if (window.confirm("این پست حذف شود؟")) removeImage(lightbox); }}
              className="absolute start-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-red-500/80 text-white"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-base font-black leading-tight text-noor-navy dark:text-white">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function TabButton({
  icon, label, active, onClick, disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-0.5 border-t-2 py-2 text-[10px] font-bold transition ${
        active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
      } ${disabled ? "opacity-30" : "hover:text-foreground"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border/60 py-2.5 last:border-0">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="ms-auto truncate text-end font-bold">{value}</span>
    </div>
  );
}
