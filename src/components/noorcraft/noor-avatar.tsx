"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { VerifiedBadge } from "./verified-badge";
import { qariBadgeColor, qariBadgeLabel } from "@/lib/noorcraft/constants";

interface NoorAvatarProps {
  name: string;
  color?: string;
  avatarUrl?: string | null;
  gender?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  ring?: "none" | "active" | "muted" | "good";
  /** احراز قاری — کادر رنگی رنک + تیک روی آواتار */
  verified?: boolean;
  /** رنک قاری — provincial | national | international | null (خاکستری) */
  rank?: string | null;
  className?: string;
}

const sizeMap = {
  sm: "h-9 w-9 text-xs rounded-lg",
  md: "h-12 w-12 text-sm rounded-xl",
  lg: "h-16 w-16 text-base rounded-2xl",
  xl: "h-24 w-24 text-2xl rounded-3xl",
};

const ringMap = {
  none: "ring-2 ring-white dark:ring-background",
  active: "ring-4 ring-noor-yellow ring-offset-2 ring-offset-background",
  muted: "ring-2 ring-muted-foreground/30",
  good: "ring-4 ring-noor-green ring-offset-2 ring-offset-background",
};

// کادر آبی احراز — فقط برای کاربران تأییدشده (مثل استوری اینستاگرام)
const verifiedRingMap = {
  sm: "ring-2",
  md: "ring-2",
  lg: "ring-[3px]",
  xl: "ring-4",
};

const tickSizeMap = {
  sm: 13,
  md: 17,
  lg: 22,
  xl: 30,
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return "؟";
  return parts.map((p) => p.charAt(0)).join("");
}

// Religious character avatars — Muslim Quran readers
const MALE_AVATARS = [
  "/avatars/male-qari-1.jpg",
  "/avatars/male-qari-2.jpg",
  "/avatars/male-qari-3.jpg",
  "/avatars/male-qari-4.jpg",
];

const FEMALE_AVATARS = [
  "/avatars/female-qaria-1.jpg",
  "/avatars/female-qaria-2.jpg",
  "/avatars/female-qaria-4.jpg",
];

function getCharacterAvatar(name: string, gender?: string | null): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  const pool = gender === "female" ? FEMALE_AVATARS : MALE_AVATARS;
  return pool[Math.abs(hash) % pool.length];
}

export function NoorAvatar({
  name,
  color = "#87CEEB",
  avatarUrl,
  gender,
  size = "md",
  ring = "none",
  verified = false,
  rank,
  className,
}: NoorAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const effectiveAvatarUrl = avatarUrl || getCharacterAvatar(name, gender);

  return (
    <div
      className={cn(
        // مربع با گوشه‌های گرد + حاشیه‌ی سفید
        "relative grid place-items-center overflow-visible rounded-xl font-bold text-white shadow-md select-none",
        sizeMap[size],
        verified ? "" : ringMap[ring],
        className,
      )}
      style={{
        ...(imgError
          ? { background: `linear-gradient(135deg, ${color}, ${shade(color, -20)})` }
          : {}),
        // کادر رنگی رنک برای قاریان تأییدشده (قرمز/سبز/آبی/خاکستری)
        ...(verified
          ? rank === undefined
            ? { outline: "none", boxShadow: `0 0 0 2px #1D9BF0` }
            : { outline: "none", boxShadow: `0 0 0 2px ${qariBadgeColor(rank)}` }
          : {}),
      }}
      aria-label={name}
      title={name}
    >
      <div className="grid h-full w-full place-items-center overflow-hidden rounded-[inherit]">
        {effectiveAvatarUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={effectiveAvatarUrl}
            alt={name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
            {initials(name)}
          </span>
        )}
      </div>

      {/* تیک آبی روی آواتار */}
      {verified && (
        <span
          className="absolute -bottom-1 -left-1 grid place-items-center rounded-full bg-card shadow"
          style={{ padding: 1.5 }}
        >
          <VerifiedBadge size={tickSizeMap[size]} rank={rank === undefined ? undefined : rank} title={`${name} — ${rank === undefined ? "قاری تأییدشده" : qariBadgeLabel(rank)}`} />
        </span>
      )}
    </div>
  );
}

function shade(hex: string, percent: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const adjust = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + (c * percent) / 100)));
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}
