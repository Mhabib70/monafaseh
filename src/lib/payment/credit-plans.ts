// Public pricing shared by the UI and server; no gateway configuration here.
export const CREDIT_VALUE_TOMAN = 50000;
export const PLATFORM_FEE_PERCENT = 15;
export const MIN_SETTLEMENT_AMOUNT = 100000;
export const CREDIT_PLANS = [
  { id: "trial", label: "تجربی", credits: 1, discountPercent: 0, description: "برای آشنایی با سیستم" },
  { id: "basic", label: "پایه", credits: 10, discountPercent: 5, description: "۱۰ جلسه خصوصی" },
  { id: "pro", label: "حرفه‌ای", credits: 25, discountPercent: 10, description: "۲۵ جلسه خصوصی" },
  { id: "special", label: "ویژه", credits: 50, discountPercent: 15, description: "۵۰ جلسه خصوصی" },
  { id: "org", label: "سازمانی", credits: 100, discountPercent: 20, description: "۱۰۰ جلسه خصوصی" },
] as const;
export type CreditPlan = (typeof CREDIT_PLANS)[number];
export function getPlan(planId: string): CreditPlan | null {
  return CREDIT_PLANS.find((plan) => plan.id === planId) ?? null;
}
export function planPriceToman(plan: CreditPlan): number {
  return Math.round(plan.credits * CREDIT_VALUE_TOMAN * (100 - plan.discountPercent) / 100);
}
export function planPriceRial(plan: CreditPlan): number { return planPriceToman(plan) * 10; }

// ── خرید تعداد دلخواه امتیاز ────────────────────────────────
// خرید معطوف به نیاز واقعی است: شاگرد همان تعداد امتیازی را می‌خرد که
// استاد انتخابی‌اش برای جلسه تعیین کرده است. تخفیف پلکانی برای
// مبالغ بزرگ‌تر حفظ می‌شود.
export const MAX_BUY_CREDITS = 100;

export function creditsDiscountPercent(credits: number): number {
  if (credits >= 50) return 20;
  if (credits >= 25) return 15;
  if (credits >= 10) return 10;
  if (credits >= 5) return 5;
  return 0;
}

export function creditsPriceToman(credits: number): number {
  return Math.round(credits * CREDIT_VALUE_TOMAN * (100 - creditsDiscountPercent(credits)) / 100);
}

export function creditsPriceRial(credits: number): number {
  return creditsPriceToman(credits) * 10;
}

// ── حمایت مالی (کمک به رشد و توسعه منافسه) ──────────────────
export const MIN_DONATE_TOMAN = 10000;
export const MAX_DONATE_TOMAN = 50000000;
