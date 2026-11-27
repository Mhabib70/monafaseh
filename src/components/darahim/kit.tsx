"use client";

// ============================================================
// Darahim UI Kit — اجزای پایه رابط اپلیکیشن منافسه
// الهام دقیق از کیت iOS کیف پول Darahim:
//   کارت‌های حاشیه‌ضخیم جوهری · سایه سخت ۳px · برچسب استیکری
//   کاشی‌های رنگی · جداکننده نقطه‌چین · دکمه‌های کپسولی
// ============================================================

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NoorAvatar } from "@/components/noorcraft/noor-avatar";

/* ─────────────────────────── کارت ─────────────────────────── */

type DCardTone = "white" | "lime" | "pink" | "mint" | "lav" | "sky" | "lemon" | "ink";

const toneClass: Record<DCardTone, string> = {
  white: "d-card",
  lime: "d-card-lime",
  pink: "d-card-pink",
  mint: "d-card-mint",
  lav: "d-card-lav",
  sky: "d-card-sky",
  lemon: "d-card-lemon",
  ink: "d-card-ink",
};

export function DCard({
  tone = "white",
  className,
  children,
  ...rest
}: {
  tone?: DCardTone;
  className?: string;
  children?: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(toneClass[tone], "p-4", className)} {...rest}>
      {children}
    </div>
  );
}

/* ─────────────────────────── دکمه ─────────────────────────── */

type DBtnVariant = "ink" | "lime" | "white" | "coral";
type DBtnSize = "sm" | "md" | "lg";

const variantClass: Record<DBtnVariant, string> = {
  ink: "d-btn-ink",
  lime: "d-btn-lime",
  white: "d-btn-white",
  coral: "d-btn-coral",
};

const sizeClass: Record<DBtnSize, string> = {
  sm: "h-8 px-3.5 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

export const DButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: DBtnVariant;
    size?: DBtnSize;
    loading?: boolean;
  }
>(function DButton(
  { variant = "ink", size = "md", loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn("d-btn", variantClass[variant], sizeClass[size], className)}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
});

/* ──────────────────────── برچسب استیکری ──────────────────────── */

type DBadgeTone =
  | "lime" | "coral" | "lemon" | "pink" | "mint" | "lav" | "sky" | "ink";

export function DBadge({
  tone = "lime",
  className,
  children,
}: {
  tone?: DBadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("d-badge", `d-badge-${tone}`, className)}>{children}</span>
  );
}

/* ───────────────────── کاشی اکشن چهارگانه ───────────────────── */

export interface DTileAction {
  label: string;
  bg: string;
  iconColor: string;
  icon: ReactNode;
  onClick?: () => void;
}

export function DTile({ label, bg, iconColor, icon, onClick }: DTileAction) {
  return (
    <button onClick={onClick} className="d-tile" aria-label={label}>
      <span className="d-tile-box" style={{ background: bg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </span>
      <span className="d-tile-label">{label}</span>
    </button>
  );
}

/* ────────────────────── سرتیتر بخش‌ها ────────────────────── */

export function DSectionHeader({
  title,
  actionLabel,
  onAction,
  className,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between px-1", className)}>
      <h3 className="d-section-title">{title}</h3>
      {actionLabel && (
        <button
          onClick={onAction}
          className="text-xs font-bold text-muted-foreground transition hover:text-foreground"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────── آواتار حاشیه‌دار ─────────────────────── */

export function DAvatar({
  name,
  avatarUrl,
  avatarColor,
  gender,
  size = 44,
  ring = true,
  online,
  onClick,
  rank,
  verified,
}: {
  name: string;
  avatarUrl?: string | null;
  avatarColor?: string;
  gender?: string | null;
  size?: number;
  ring?: boolean;
  online?: boolean;
  onClick?: () => void;
  rank?: string | null;
  verified?: boolean;
}) {
  const noorSize = size >= 90 ? "xl" : size >= 60 ? "lg" : size >= 44 ? "md" : "sm";
  return (
    <div className="relative shrink-0" style={{ width: size }}>
      <div
        className={cn(
          "rounded-2xl overflow-hidden",
          ring && "border-2 border-ink shadow-[0_2px_0_0_#1D1D1B]",
        )}
      >
        <NoorAvatar
          name={name}
          avatarUrl={avatarUrl ?? undefined}
          color={avatarColor ?? "#CDF138"}
          gender={gender ?? undefined}
          size={noorSize}
          rank={rank ?? undefined}
          verified={verified}
        />
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-background bg-[#35C76A]" />
      )}
      {onClick && <button className="absolute inset-0" onClick={onClick} aria-label="پروفایل" />}
    </div>
  );
}

/* ───────────────── جداکننده نقطه‌چین افقی ───────────────── */

export function DDash({ soft = false, className }: { soft?: boolean; className?: string }) {
  return <div className={cn(soft ? "d-dashed-soft" : "d-dashed", "w-full", className)} />;
}

/* ───────────── ردیف آواتار «ارسال سریع» / «آنلاین‌ها» ───────────── */

export function DQuickRow({
  onAdd,
  addLabel = "جدید",
  items,
}: {
  onAdd?: () => void;
  addLabel?: string;
  items: Array<{
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    avatarColor?: string;
    onClick?: () => void;
  }>;
}) {
  return (
    <div className="flex items-start gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {onAdd && (
        <button onClick={onAdd} className="d-tile w-14 shrink-0" aria-label={addLabel}>
          <span
            className="d-tile-box"
            style={{ background: "transparent", borderStyle: "dashed" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D1D1B" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
          </span>
          <span className="d-tile-label">{addLabel}</span>
        </button>
      )}
      {items.map((it) => (
        <button
          key={it.id}
          onClick={it.onClick}
          className="d-tile w-14 shrink-0"
          aria-label={it.fullName}
        >
          <DAvatar
            name={it.fullName}
            avatarUrl={it.avatarUrl}
            avatarColor={it.avatarColor}
            size={56}
            ring={false}
          />
          <span className="d-tile-label line-clamp-1 w-14 text-center">
            {it.fullName.split(" ")[0]}
          </span>
        </button>
      ))}
    </div>
  );
}
