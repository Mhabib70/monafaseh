/* ============================================================
   Ad Inventory — بنرهای تبلیغاتی محصولات و سایت‌های قرآنی
   ───────────────────────────────────────────────────────────
   این فایل منبع واحد تبلیغات است. برای افزودن/حذف تبلیغ،
   فقط این آرایه را ویرایش کنید — همه‌ی صفحات به‌صورت خودکار
   به‌روز می‌شوند.

   هر تبلیغ شامل:
   • id — شناسه‌ی یکتا
   • title — عنوان کوتاه
   • description — توضیح یک‌خطی
   • cta — متن دکمه (مثل «مشاهده سایت»)
   • url — لینک مقصد (https://...)
   • imageUrl — تصویر بنر (اختیاری؛ اگر نباشد، گرادیان نمایش داده می‌شود)
   • theme — رنگ تم (yellow | coral | sky | green | rainbow | navy)
   • badge — متن بَج بالای بنر (مثل «تخفیف» یا «جدید»)
   • active — آیا نمایش داده شود؟
   • priority — اولویت نمایش (بالاتر = بیشتر نمایش داده می‌شود در حالت random)
   ============================================================ */

export type AdTheme =
  | "yellow"
  | "coral"
  | "sky"
  | "green"
  | "rainbow"
  | "navy";

export interface AdItem {
  id: string;
  title: string;
  description: string;
  cta: string;
  url: string;
  imageUrl?: string | null;
  theme: AdTheme;
  badge?: string;
  active: boolean;
  priority: number; // 1-10
}

export const AD_INVENTORY: AdItem[] = [
  {
    id: "quran-app-pro",
    title: "اپلیکیشن قرآن حافظ",
    description: "حفظ قرآن با تکنیک علمی — ۱۴ روز رایگان",
    cta: "دانلود اپ",
    url: "https://qha.ir",
    theme: "yellow",
    badge: "تخفیف ۵۰٪",
    active: true,
    priority: 9,
  },
  {
    id: "islamic-books-store",
    title: "کتابفروشی نور",
    description: "ترجمه‌ی قرآن، تفاسیر، و کتب حدیث — ارسال رایگان",
    cta: "مشاهده فروشگاه",
    url: "https://noorbooks.ir",
    theme: "coral",
    badge: "ارسال رایگان",
    active: true,
    priority: 8,
  },
  {
    id: "tajweed-course",
    title: "دوره‌ی تجوید آنلاین",
    description: "آموزش تجوید با اساتید بنام — ثبت‌نام زمستانه",
    cta: "ثبت‌نام",
    url: "https://tajweed.online",
    theme: "sky",
    badge: "جدید",
    active: true,
    priority: 7,
  },
  {
    id: "quran-audio-stream",
    title: "تلاوت‌های MP3 قاریان بزرگ",
    description: "آرشیو کامل تلاوت‌های عبدالباسط، الحصری، المنشاوی",
    cta: "شنیدن رایگان",
    url: "https://everyayah.com",
    theme: "green",
    badge: "رایگان",
    active: true,
    priority: 8,
  },
  {
    id: "hijab-shop",
    title: "بازار محجبه",
    description: "پوشاک اسلامی باکیفیت — تنوع ۵۰۰+ مدل",
    cta: "خرید",
    url: "https://mahjube.ir",
    theme: "coral",
    badge: "تخفیف ویژه",
    active: true,
    priority: 6,
  },
  {
    id: "ramadan-calendar",
    title: "تقویم رمضان ۱۴۴۶",
    description: "ابراز زمان‌سنجی افطار و سحر برای ۱۰۰ شهر ایران",
    cta: "دریافت تقویم",
    url: "https://ramadan.ir",
    theme: "yellow",
    badge: "جدید",
    active: true,
    priority: 5,
  },
  {
    id: "islamic-podcast",
    title: "پادکست «روایت نور»",
    description: "هر هفته داستان‌هایی از قرآن و سیره‌ی اهل‌بیت",
    cta: "شنیدن پادکست",
    url: "https://revayat-noor.ir",
    theme: "navy",
    badge: "هر شنبه",
    active: true,
    priority: 6,
  },
  {
    id: "halal-travel",
    title: "سفر حلال — تورهای عمره",
    description: "بسته‌های عمره و زیارت با صفر بهره",
    cta: "رزرو تور",
    url: "https://safarhalal.ir",
    theme: "green",
    badge: "تور پاییزه",
    active: true,
    priority: 7,
  },
  {
    id: "quran-memorization",
    title: "آکادمی حفاظ نور",
    description: "حفظ کامل قرآن در ۳ سال — پذیرش سال جدید",
    cta: "ثبت‌نام آزمون",
    url: "https://huffaz-noor.ir",
    theme: "rainbow",
    badge: "آزمون ورودی",
    active: true,
    priority: 8,
  },
  {
    id: "islamic-finance",
    title: "قرض‌الحسنه نور",
    description: "وام‌های قرض‌الحسنه بدون کارمزد — تا ۵۰ میلیون",
    cta: "درخواست وام",
    url: "https://qarz-hasane-noor.ir",
    theme: "sky",
    badge: "بدون کارمزد",
    active: true,
    priority: 5,
  },
  {
    id: "prayer-times-app",
    title: "اپلیکیشن اوقات شرعی",
    description: "اذان‌گو، قبله‌نما، و تقویم اسلامی — برای همه شهرها",
    cta: "نصب رایگان",
    url: "https://owghat.app",
    theme: "green",
    badge: "رایگان",
    active: true,
    priority: 7,
  },
  {
    id: "arabic-learning",
    title: "آموزش عربی قرآنی",
    description: "ترجمه و درک مطلب قرآن در ۶ ماه — ضمانت بازگشت وجه",
    cta: "شروع رایگان",
    url: "https://arabi-quran.ir",
    theme: "coral",
    badge: "۶ ماه",
    active: true,
    priority: 6,
  },
];

/* ============================================================
   انتخاب تبلیغ بر اساس slot (جایگاه)
   ───────────────────────────────────────────────────────────
   هر جایگاه بنر در صفحه یک slotId دارد. این تابع یک تبلیغ
   فعال را به‌صورت وزنی (priority-based) انتخاب می‌کند و از
   تکرار تبلیغ قبلی در همان session جلوگیری می‌کند.

   الگوریتم:
   ۱. فیلتر: فقط active=true
   ۲. وزن‌دهی: هر آیتم N بار کپی می‌شود که N = priority
   ۳. انتخاب تصادفی از آرایه‌ی وزنی
   ۴. در صورت وجود excludeIds، آن‌ها حذف می‌شوند
   ============================================================ */

export function pickAd(slotId: string, excludeIds: string[] = []): AdItem | null {
  const eligible = AD_INVENTORY.filter(
    (a) => a.active && !excludeIds.includes(a.id),
  );
  if (eligible.length === 0) return null;

  // Build weighted array
  const weighted: AdItem[] = [];
  for (const ad of eligible) {
    for (let i = 0; i < ad.priority; i++) {
      weighted.push(ad);
    }
  }

  // Use slotId as a seed so the same slot shows the same ad per session
  // (stable per session — better UX than flickering on every render).
  // We combine slotId with Date.now() at day granularity for daily rotation.
  const dayBucket = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const seed = hashString(`${slotId}-${dayBucket}`);
  const idx = seed % weighted.length;
  return weighted[idx];
}

// Pick N distinct ads for a page (so they don't repeat on the same page).
export function pickAds(
  slots: Array<{ slotId: string }>,
): Array<{ slotId: string; ad: AdItem | null }> {
  const usedIds: string[] = [];
  return slots.map(({ slotId }) => {
    const ad = pickAd(slotId, usedIds);
    if (ad) usedIds.push(ad.id);
    return { slotId, ad };
  });
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
