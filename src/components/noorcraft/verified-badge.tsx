"use client";

// ============================================================
// نشان احراز قاری — تیک رنگی بر اساس رنک رسمی
// قرمز=قاری استانی · سبز=قاری کشوری · آبی=قاری بین‌المللی
// خاکستری=قاری تأییدشده (بدون رنک مسابقه‌ای)
// ============================================================

import { qariBadgeColor, qariBadgeLabel } from "@/lib/noorcraft/constants";

export const VERIFIED_BLUE = "#1D9BF0";

export function VerifiedBadge({
  size = 16,
  className,
  title,
  rank,
}: {
  size?: number;
  className?: string;
  title?: string;
  /** رنک قاری — provincial | national | international | null (خاکستری) */
  rank?: string | null;
}) {
  const color = rank === undefined ? VERIFIED_BLUE : qariBadgeColor(rank);
  const label = title ?? (rank === undefined ? "قاری تأییدشده" : qariBadgeLabel(rank));
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={label}
      title={label}
      style={{ flexShrink: 0, display: "inline-block" }}
    >
      <path
        fill={color}
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"
      />
      <path
        fill="#FFFFFF"
        d="M10.54 16.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"
      />
    </svg>
  );
}

// نام کاربر + نشان رنک‌دار کنار نام
export function VerifiedName({
  name,
  verified,
  rank,
  size = 16,
  className,
  onClick,
}: {
  name: string;
  verified?: boolean;
  rank?: string | null;
  size?: number;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${onClick ? "cursor-pointer" : ""} ${className ?? ""}`}
      onClick={onClick}
    >
      <span>{name}</span>
      {verified && <VerifiedBadge size={size} rank={rank} />}
    </span>
  );
}
