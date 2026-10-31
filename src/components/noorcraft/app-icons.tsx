"use client";

// ============================================================
// آیکون‌های اختصاصی منافسه — SVG برداری باکیفیت
// شبکه ۲۴×۲۴ · ضخامت خط ۱.۸ · سرهای گرد
// ============================================================

type P = { size?: number; className?: string; strokeWidth?: number };

const base = (size = 24, className?: string, sw = 1.8) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: sw,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true,
});

export function IconHome({ size, className, strokeWidth }: P) {
  return (
    <svg {...base(size, className, strokeWidth)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

export function IconMic({ size, className, strokeWidth }: P) {
  return (
    <svg {...base(size, className, strokeWidth)}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3.5" />
      <path d="M8.5 21.5h7" />
    </svg>
  );
}

export function IconPlus({ size, className, strokeWidth }: P) {
  return (
    <svg {...base(size, className, strokeWidth ?? 2.4)}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconSwords({ size, className, strokeWidth }: P) {
  return (
    <svg {...base(size, className, strokeWidth)}>
      <path d="M14.5 14.5 20 5l-2-2-9.5 5.5" />
      <path d="m5.5 14.5-2 2L7 20l2-2" />
      <path d="m9.5 14.5 5.5 5.5 2.5-2.5L12 12" />
      <path d="M3 21l3-3" />
      <path d="M14.5 4 20 9.5" />
    </svg>
  );
}

export function IconUser({ size, className, strokeWidth }: P) {
  return (
    <svg {...base(size, className, strokeWidth)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </svg>
  );
}

// پنل کاربری — چهارکادر شبیه داشبورد
export function IconDashboard({ size, className, strokeWidth }: P) {
  return (
    <svg {...base(size, className, strokeWidth)}>
      <rect x="3.5" y="3.5" width="7" height="7.5" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.6" />
      <rect x="3.5" y="14" width="7" height="6.5" rx="1.6" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.6" />
    </svg>
  );
}

export function IconBellN({ size, className, strokeWidth }: P) {
  return (
    <svg {...base(size, className, strokeWidth)}>
      <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9" />
      <path d="M10 20a2.2 2.2 0 0 0 4 0" />
    </svg>
  );
}
