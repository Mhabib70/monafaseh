"use client";

import { useMemo, useState, useEffect } from "react";
import { ExternalLink, Star, Sparkles } from "lucide-react";
import {
  pickAds,
  type AdItem,
  type AdTheme,
} from "@/lib/noorcraft/ad-inventory";
import { cn } from "@/lib/utils";

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

const THEME_ACCENT: Record<AdTheme, string> = {
  yellow: "#b8860b",
  coral: "#c2593f",
  sky: "#0284c7",
  green: "#15803d",
  rainbow: "#b8860b",
  navy: "#1e293b",
};

const SIZE_DIMENSIONS: Record<
  AdSize,
  {
    className: string;
    containerClassName: string;
    layout: "horizontal" | "vertical" | "square" | "sidebar";
  }
> = {
  leaderboard: {
    className: "min-h-[84px]",
    containerClassName: "max-w-[728px] mx-auto",
    layout: "horizontal",
  },
  rectangle: {
    className: "min-h-[220px] max-w-[320px]",
    containerClassName: "mx-auto",
    layout: "square",
  },
  halfpage: {
    className: "min-h-[540px] max-w-[300px]",
    containerClassName: "mx-auto",
    layout: "sidebar",
  },
  billboard: {
    className: "min-h-[160px]",
    containerClassName: "max-w-[970px] mx-auto",
    layout: "horizontal",
  },
  inline: {
    className: "min-h-[88px]",
    containerClassName: "max-w-5xl mx-auto",
    layout: "horizontal",
  },
};

export function AdBanner({ slot, size = "leaderboard", className }: Props) {
  const [apiState, setApiState] = useState<{
    slot: string;
    ad: AdItem | null;
    responded: boolean;
  }>({ slot, ad: null, responded: false });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ads/serve?slot=${encodeURIComponent(slot)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setApiState({
          slot,
          responded: true,
          ad: data.ok && data.ad ? normalizeAd(data.ad as ApiAd) : null,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slot]);

  const apiResponded = apiState.slot === slot && apiState.responded;
  const apiAd = apiState.slot === slot ? apiState.ad : null;

  const staticAd: AdItem | null = useMemo(() => {
    if (apiResponded) return null;
    const picks = pickAds([{ slotId: slot }]);
    return picks[0]?.ad ?? null;
  }, [slot, apiResponded]);

  const ad = apiAd || staticAd;
  const dims = SIZE_DIMENSIONS[size];

  if (apiResponded && !apiAd) return null;
  if (!ad) return null;

  return (
    <div className={cn("w-full py-2", className)}>
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
  const accent = THEME_ACCENT[ad.theme] || "#b8860b";

  const handleClick = () => {
    try {
      const payload = JSON.stringify({ id: ad.id, type: "click" });
      if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/ads/track", blob);
      } else {
        fetch("/api/ads/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  };

  return (
    <a
      href={ad.url}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={handleClick}
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        dims.className,
        dims.layout === "horizontal" && "flex-row items-center gap-4",
        dims.layout === "square" && "flex-col justify-between gap-3",
        dims.layout === "sidebar" && "flex-col gap-4",
        size === "inline" && "flex-row items-center gap-3",
      )}
    >
      <span className="pointer-events-none absolute right-2.5 top-2 text-[10px] font-medium text-muted-foreground">
        حمایت تبلیغاتی
      </span>

      {ad.badge && (
        <span
          className="absolute left-2.5 top-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold text-white"
          style={{ background: accent }}
        >
          <Star className="h-2.5 w-2.5 fill-current" />
          {ad.badge}
        </span>
      )}

      {(dims.layout === "horizontal" || size === "inline") && (
        <>
          <AdIcon ad={ad} accent={accent} />
          <div className="min-w-0 flex-1 pt-2 sm:pt-0">
            <h4 className="truncate font-display text-sm font-bold text-foreground sm:text-base">
              {ad.title}
            </h4>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
              {ad.description}
            </p>
          </div>
          <AdCta ad={ad} accent={accent} />
        </>
      )}

      {dims.layout === "square" && (
        <>
          <div className="flex w-full items-center justify-between pt-5">
            <AdIcon ad={ad} accent={accent} />
            <AdCta ad={ad} accent={accent} />
          </div>
          <div className="flex-1">
            <h4 className="font-display text-base font-bold leading-snug text-foreground">
              {ad.title}
            </h4>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {ad.description}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3" style={{ color: accent }} />
            <span>پیشنهاد ویژه</span>
          </div>
        </>
      )}

      {dims.layout === "sidebar" && (
        <div className="flex h-full flex-col gap-5 pt-6">
          <AdIcon ad={ad} accent={accent} size="lg" />
          <div className="flex-1">
            <h4 className="font-display text-lg font-bold leading-snug text-foreground">
              {ad.title}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {ad.description}
            </p>
          </div>
          <div className="space-y-3">
            <AdCta ad={ad} accent={accent} size="lg" block />
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" style={{ color: accent }} />
              <span>پیشنهاد ویژه قاریان منافسه</span>
            </div>
          </div>
        </div>
      )}
    </a>
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
  const [imgErr, setImgErr] = useState(false);

  if (ad.imageUrl && !imgErr) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={ad.imageUrl}
        alt={ad.title}
        referrerPolicy="no-referrer"
        onError={() => setImgErr(true)}
        className={cn(
          "shrink-0 rounded-xl bg-muted object-cover",
          size === "lg" ? "h-20 w-20" : "h-12 w-12 sm:h-14 sm:w-14",
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-xl font-display font-bold text-white",
        size === "lg" ? "h-20 w-20 text-3xl" : "h-12 w-12 text-lg sm:h-14 sm:w-14 sm:text-xl",
      )}
      style={{ background: accent }}
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
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg font-semibold text-white transition-opacity group-hover:opacity-90",
        size === "lg" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs",
        block && "w-full justify-center",
      )}
      style={{ background: accent }}
    >
      {ad.cta}
      <ExternalLink className="h-3.5 w-3.5" />
    </span>
  );
}
