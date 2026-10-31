"use client";

// ============================================================
// جعبه‌ابزار یکپارچه فیلترها — ظاهر منسجم برای جستجو و فیلترها
// استفاده در: محافل زنده، تالار گفتگو، بلاگ و صفحات آینده
// ============================================================

import { ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

// فیلد جستجو — آیکون داخل کادر + دکمه پاک‌کردن
export function FilterSearch({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-input bg-background pr-9 pl-9 text-sm shadow-sm transition focus:border-noor-sky focus:outline-none focus:ring-2 focus:ring-noor-sky/30"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute left-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-muted text-muted-foreground transition hover:bg-noor-coral/20 hover:text-noor-coral"
          aria-label="پاک کردن جستجو"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// برچسب + محتوای فیلد — برای یکدستی لیبل‌ها
export function FilterField({
  label,
  icon,
  children,
  className,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

// دکمه باز/بستن فیلترهای پیشرفته — با شمارنده فیلترهای فعال
export function FilterAdvancedToggle({
  open,
  count,
  onClick,
}: {
  open: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition",
        open || count > 0
          ? "border-noor-sky/50 bg-noor-sky/10 text-noor-navy dark:text-sky-200"
          : "border-input bg-background text-muted-foreground hover:border-noor-sky/40",
      )}
    >
      <SlidersHorizontal className="h-3.5 w-3.5" />
      فیلترهای پیشرفته
      {count > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-noor-sky px-1 text-[10px] font-black text-white">
          {count.toLocaleString("fa-IR")}
        </span>
      )}
      <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
    </button>
  );
}

// دکمه حذف همه فیلترها
export function FilterResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-8 items-center justify-center gap-1.5 rounded-full border border-input bg-background px-3 text-[11px] font-bold text-muted-foreground transition hover:border-noor-coral/40 hover:text-noor-coral"
    >
      <RotateCcw className="h-3 w-3" />
      حذف فیلترها
    </button>
  );
}

// چیپ فیلتر فعال — با دکمه حذف تکی
export function FilterChip({
  label,
  value,
  onClear,
}: {
  label: string;
  value: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-noor-sky/15 px-2.5 py-1 text-[11px] font-bold text-noor-navy dark:text-sky-200">
      {label}: {value}
      <button
        onClick={onClear}
        className="grid h-4 w-4 place-items-center rounded-full transition hover:bg-noor-coral/25 hover:text-noor-coral"
        aria-label={`حذف فیلتر ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
