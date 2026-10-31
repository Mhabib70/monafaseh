"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Star, Sparkles } from "lucide-react";
import {
  pickAds,
  type AdItem,
  type AdTheme,
} from "@/lib/noorcraft/ad-inventory";
import { cn } from "@/lib/utils";

/* ============================================================
   AdBanner
   ───────────────────────────────────────────────────────────
   بنر تبلیغاتی با اندازه‌های استاندارد IAB.
   نسخه‌ی فعلی:
     ۱. ابتدا از API (/api/ads/serve?slot=...) تبلیغ را می‌گیرد.
     ۲. اگر API در دسترس نبود یا ad=null، از static inventory استفاده می‌کند.

   کلیک روی بنر به /api/ads/track ثبت می‌شود (fire-and-forget) و سپس
   کاربر به URL مقصد هدایت می‌شود.
   ============================================================ */

type AdSize = "leaderboard" | "rectangle" | "halfpage" | "billboard" | "inline";

interface Props {
  slot: string;
  size?: AdSize;
  className?: string;
}

interface ApiAd {
  id: string;
  title: string;
  description: string;
  cta: string;
  url: string;
  imageUrl: string | null;
  theme: string;
  badge: string | null;
}

// Normalize API ad → AdItem shape
function normalizeAd(api: ApiAd): AdItem {
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    cta: api.cta,
    url: api.url,
    imageUrl: api.imageUrl,
    theme: (api.theme as AdTheme) || "yellow",
    badge: api.badge || undefined,
    active: true,
    priority: 5,
  };
}

// Theme → gradient classes (matches NoorCard palette)
const THEME_GRADIENTS: Record<AdTheme, string> = {
  yellow:
    "from-noor-yellow/30 via-noor-yellow/10 to-transparent border-noor-yellow/30",
  coral:
    "from-noor-coral/30 via-noor-coral/10 to-transparent border-noor-coral/30",
  sky: "from-noor-sky/30 via-noor-sky/10 to-transparent border-noor-sky/30",
  green:
    "from-noor-green/30 via-noor-green/10 to-transparent border-noor-green/30",
  rainbow:
    "from-noor-yellow/25 via-noor-coral/15 to-noor-sky/10 border-noor-yellow/40",
  navy: "from-noor-navy/30 via-noor-navy/10 to-transparent border-noor-navy/30",
};

const THEME_ACCENT: Record<AdTheme, string> = {
  yellow: "#FFD700",
  coral: "#FF7F7F",
  sky: "#87CEEB",
  green: "#7CFC00",
  rainbow: "#FFD700",
  navy: "#0d1230",
};

const SIZE_DIMENSIONS: Record<
  AdSize,
  { className: string; containerClassName: string; layout: "horizontal" | "vertical" | "square" | "sidebar" }
> = {
  // Leaderboard — full-width on desktop, mobile banner on phone
  leaderboard: {
    className: "min-h-[90px] sm:min-h-[90px]",
    containerClassName: "max-w-[728px] mx-auto",
    layout: "horizontal",
  },
  // Medium rectangle — 300×250
  rectangle: {
    className: "min-h-[250px] max-w-[300px]",
    containerClassName: "mx-auto",
    layout: "square",
  },
  // Half page — 300×600, sticky sidebar
  halfpage: {
    className: "min-h-[600px] max-w-[300px]",
    containerClassName: "mx-auto",
    layout: "sidebar",
  },
  // Billboard — large top/bottom banner
  billboard: {
    className: "min-h-[250px] sm:min-h-[250px]",
    containerClassName: "max-w-[970px] mx-auto",
    layout: "horizontal",
  },
  // Inline — slim full-width, between sections
  inline: {
    className: "min-h-[100px]",
    containerClassName: "max-w-5xl mx-auto",
    layout: "horizontal",
  },
};

export function AdBanner({ slot, size = "leaderboard", className }: Props) {
  const [apiAd, setApiAd] = useState<AdItem | null>(null);
  const [apiResponded, setApiResponded] = useState(false);
  const [apiTried, setApiTried] = useState(false);

  // Fetch ad from API on mount. Slot is used as cache key.
  useEffect(() => {
    let cancelled = false;
    setApiAd(null);
    setApiResponded(false);
    setApiTried(false);
    fetch(`/api/ads/serve?slot=${encodeURIComponent(slot)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setApiResponded(true);
        if (data.ok && data.ad) {
          setApiAd(normalizeAd(data.ad as ApiAd));
        }
      })
      .catch(() => {
        // Network error — will fall back to static inventory below
      })
      .finally(() => {
        if (!cancelled) setApiTried(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  // Static fallback: ONLY used if the API completely fails to respond
  // (e.g., network error). If the API responds with ad:null (slot disabled
  // or no active ads), we respect that and show nothing.
  const staticAd: AdItem | null = useMemo(() => {
    if (apiResponded) return null; // API responded — trust its answer
    const picks = pickAds([{ slotId: slot }]);
    return picks[0]?.ad ?? null;
  }, [slot, apiResponded]);

  const ad = apiAd || staticAd;
  const dims = SIZE_DIMENSIONS[size];

  // If API responded but returned no ad (slot disabled / no ads), show nothing.
  if (apiResponded && !apiAd) return null;
  // While waiting for API and no static fallback yet, show nothing.
  if (!ad) return null;

  return (
    <div className={cn("w-full py-3", className)}>
      <div className={dims.containerClassName}>
        <AdLink ad={ad} size={size} dims={dims} />
      </div>
    </div>
  );
}

function AdLink({
  ad,
  size,
  dims,
}: {
  ad: AdItem;
  size: AdSize;
  dims: (typeof SIZE_DIMENSIONS)[AdSize];
}) {
  const gradient = THEME_GRADIENTS[ad.theme];
  const accent = THEME_ACCENT[ad.theme];

  // Track click — fire-and-forget, then navigate via window.open
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Don't intercept modifier-clicks (open in new tab etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    fetch("/api/ads/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ad.id, type: "click" }),
      keepalive: true, // ensures request fires even if we navigate away
    }).catch(() => {});
    // Open in new tab
    window.open(ad.url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.a
      href={ad.url}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={handleClick}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border-2 bg-gradient-to-br p-4 transition-all",
        gradient,
        dims.className,
        // layout-specific flex direction
        dims.layout === "horizontal" && "flex-row items-center gap-4",
        dims.layout === "square" && "flex-col justify-between gap-3",
        dims.layout === "sidebar" && "flex-col gap-4",
        // size-specific
        size === "inline" && "flex-row items-center gap-3",
      )}
      style={{ ["--ad-accent" as any]: accent }}
    >
      {/* "تبلیغ" label — small, transparent, top-right corner */}
      <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/20 px-2 py-0.5 text-[9px] font-bold text-white/70 backdrop-blur">
        تبلیغ
      </span>

      {/* Badge (optional) — top-left corner */}
      {ad.badge && (
        <span
          className="absolute left-2 top-2 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold text-noor-navy shadow-sm"
          style={{ background: accent }}
        >
          <Star className="h-2.5 w-2.5 fill-current" />
          {ad.badge}
        </span>
      )}

      {/* ─── Horizontal / Inline layout ────────────────────────── */}
      {(dims.layout === "horizontal" || size === "inline") && (
        <>
          <AdIcon ad={ad} accent={accent} />
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-display text-sm font-bold text-noor-navy dark:text-white sm:text-base">
              {ad.title}
            </h4>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
              {ad.description}
            </p>
          </div>
          <AdCta ad={ad} accent={accent} />
        </>
      )}

      {/* ─── Square (medium rectangle) ─────────────────────────── */}
      {dims.layout === "square" && (
        <>
          <div className="flex w-full items-center justify-between pt-4">
            <AdIcon ad={ad} accent={accent} />
            <AdCta ad={ad} accent={accent} />
          </div>
          <div className="flex-1">
            <h4 className="font-display text-base font-bold leading-tight text-noor-navy dark:text-white">
              {ad.title}
            </h4>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {ad.description}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
            <Sparkles className="h-3 w-3" style={{ color: accent }} />
            <span>پیشنهاد ویژه</span>
          </div>
        </>
      )}

      {/* ─── Sidebar (half page) ───────────────────────────────── */}
      {dims.layout === "sidebar" && (
        <div className="flex h-full flex-col gap-5 pt-6">
          <AdIcon ad={ad} accent={accent} size="lg" />
          <div className="flex-1">
            <h4 className="font-display text-lg font-bold leading-tight text-noor-navy dark:text-white">
              {ad.title}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {ad.description}
            </p>
          </div>
          <div className="space-y-3">
            <AdCta ad={ad} accent={accent} size="lg" block />
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-muted-foreground">
              <Sparkles className="h-3 w-3" style={{ color: accent }} />
              <span>پیشنهاد ویژه برای قاریان منافسه</span>
            </div>
          </div>
        </div>
      )}
    </motion.a>
  );
}

function AdIcon({
  ad,
  accent,
  size = "md",
}: {
  ad: AdItem;
  accent: string;
  size?: "md" | "lg";
}) {
  if (ad.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={ad.imageUrl}
        alt={ad.title}
        className={cn(
          "shrink-0 rounded-xl object-cover",
          size === "lg" ? "h-20 w-20" : "h-12 w-12 sm:h-14 sm:w-14",
        )}
      />
    );
  }
  // Fallback: monogram icon with accent gradient
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-xl font-display font-bold text-noor-navy shadow-inner",
        size === "lg" ? "h-20 w-20 text-3xl" : "h-12 w-12 text-lg sm:h-14 sm:w-14 sm:text-xl",
      )}
      style={{
        background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
      }}
    >
      {ad.title.charAt(0)}
    </div>
  );
}

function AdCta({
  ad,
  accent,
  size = "md",
  block = false,
}: {
  ad: AdItem;
  accent: string;
  size?: "md" | "lg";
  block?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full font-bold text-noor-navy shadow-sm transition-all group-hover:shadow-md group-hover:brightness-105",
        size === "lg" ? "px-4 py-2 text-sm" : "px-3 py-1 text-xs",
        block && "w-full justify-center",
      )}
      style={{ background: accent }}
    >
      {ad.cta}
      <ExternalLink className="h-3 w-3" />
    </span>
  );
}
