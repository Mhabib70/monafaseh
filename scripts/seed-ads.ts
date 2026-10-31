/* Seed Ads into the database from the static inventory.
 * Run with: bunx tsx scripts/seed-ads.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const SEED_ADS = [
  {
    title: "اپلیکیشن قرآن حافظ",
    description: "حفظ قرآن با تکنیک علمی — ۱۴ روز رایگان",
    cta: "دانلود اپ",
    url: "https://qha.ir",
    theme: "yellow",
    badge: "تخفیف ۵۰٪",
    size: "leaderboard",
    active: true,
    priority: 9,
  },
  {
    title: "کتابفروشی نور",
    description: "ترجمه‌ی قرآن، تفاسیر، و کتب حدیث — ارسال رایگان",
    cta: "مشاهده فروشگاه",
    url: "https://noorbooks.ir",
    theme: "coral",
    badge: "ارسال رایگان",
    size: "leaderboard",
    active: true,
    priority: 8,
  },
  {
    title: "دوره‌ی تجوید آنلاین",
    description: "آموزش تجوید با اساتید بنام — ثبت‌نام زمستانه",
    cta: "ثبت‌نام",
    url: "https://tajweed.online",
    theme: "sky",
    badge: "جدید",
    size: "rectangle",
    active: true,
    priority: 7,
  },
  {
    title: "تلاوت‌های MP3 قاریان بزرگ",
    description: "آرشیو کامل تلاوت‌های عبدالباسط، الحصری، المنشاوی",
    cta: "شنیدن رایگان",
    url: "https://everyayah.com",
    theme: "green",
    badge: "رایگان",
    size: "rectangle",
    active: true,
    priority: 8,
  },
  {
    title: "بازار محجبه",
    description: "پوشاک اسلامی باکیفیت — تنوع ۵۰۰+ مدل",
    cta: "خرید",
    url: "https://mahjube.ir",
    theme: "coral",
    badge: "تخفیف ویژه",
    size: "rectangle",
    active: true,
    priority: 6,
  },
  {
    title: "تقویم رمضان ۱۴۴۶",
    description: "ابراز زمان‌سنجی افطار و سحر برای ۱۰۰ شهر ایران",
    cta: "دریافت تقویم",
    url: "https://ramadan.ir",
    theme: "yellow",
    badge: "جدید",
    size: "leaderboard",
    active: true,
    priority: 5,
  },
  {
    title: "پادکست «روایت نور»",
    description: "هر هفته داستان‌هایی از قرآن و سیره‌ی اهل‌بیت",
    cta: "شنیدن پادکست",
    url: "https://revayat-noor.ir",
    theme: "navy",
    badge: "هر شنبه",
    size: "rectangle",
    active: true,
    priority: 6,
  },
  {
    title: "سفر حلال — تورهای عمره",
    description: "بسته‌های عمره و زیارت با صفر بهره",
    cta: "رزرو تور",
    url: "https://safarhalal.ir",
    theme: "green",
    badge: "تور پاییزه",
    size: "billboard",
    active: true,
    priority: 7,
  },
  {
    title: "آکادمی حفاظ نور",
    description: "حفظ کامل قرآن در ۳ سال — پذیرش سال جدید",
    cta: "ثبت‌نام آزمون",
    url: "https://huffaz-noor.ir",
    theme: "rainbow",
    badge: "آزمون ورودی",
    size: "billboard",
    active: true,
    priority: 8,
  },
  {
    title: "قرض‌الحسنه نور",
    description: "وام‌های قرض‌الحسنه بدون کارمزد — تا ۵۰ میلیون",
    cta: "درخواست وام",
    url: "https://qarz-hasane-noor.ir",
    theme: "sky",
    badge: "بدون کارمزد",
    size: "rectangle",
    active: true,
    priority: 5,
  },
  {
    title: "اپلیکیشن اوقات شرعی",
    description: "اذان‌گو، قبله‌نما، و تقویم اسلامی — برای همه شهرها",
    cta: "نصب رایگان",
    url: "https://owghat.app",
    theme: "green",
    badge: "رایگان",
    size: "leaderboard",
    active: true,
    priority: 7,
  },
  {
    title: "آموزش عربی قرآنی",
    description: "ترجمه و درک مطلب قرآن در ۶ ماه — ضمانت بازگشت وجه",
    cta: "شروع رایگان",
    url: "https://arabi-quran.ir",
    theme: "coral",
    badge: "۶ ماه",
    size: "rectangle",
    active: true,
    priority: 6,
  },
];

async function main() {
  console.log("Seeding ads...");
  // Clear existing
  await db.ad.deleteMany({});
  console.log(`Cleared existing ads.`);

  for (const ad of SEED_ADS) {
    await db.ad.create({ data: ad });
  }
  console.log(`✓ Seeded ${SEED_ADS.length} ads.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
