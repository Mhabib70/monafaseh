// ============================================================
// فهرست مرجع مسابقات و رویدادهای معتبر قرآنی جمهوری اسلامی
// برای احراز رنک قاریان — هر مسابقه = یک سطح تیک
//   🔵 gold      = مسابقات بین‌المللی (رتبه اول تا سوم)
//   🟢 silver    = مسابقات کشوری (رتبه اول تا سوم)
//   🔴 bronze    = مسابقات استانی/منطقه‌ای (رتبه اول تا سوم)
// ⚠️ جایگاه اول تا سوم ملاک است؛ رتبه‌های تشویقی سطح نمی‌گیرند.
// اضافه/کم کردن مسابقات فقط از این فایل انجام شود.
// ============================================================

export interface TrustedCompetition {
  id: string;
  name: string;
  organizer: string;
  tier: "gold" | "silver" | "bronze";
}

export const TRUSTED_COMPETITIONS: TrustedCompetition[] = [
  // ═══ 🔵 سطح طلایی — بین‌المللی ═══
  {
    id: "intl-oghaf",
    name: "مسابقات بین‌المللی قرآن کریم جمهوری اسلامی ایران",
    organizer: "سازمان اوقاف و امور خیریه",
    tier: "gold",
  },
  {
    id: "intl-razavi",
    name: "مسابقات بین‌المللی قرآن کریم رضوی (آستان قدس رضوی)",
    organizer: "آستان قدس رضوی",
    tier: "gold",
  },
  {
    id: "intl-moqavemat",
    name: "جشنواره قرآنی مقاومت (شهدا و گروه‌های مقاومت)",
    organizer: "بنیاد شهید و امور ایثارگران",
    tier: "gold",
  },
  {
    id: "intl-maarefi",
    name: "مسابقات معارفی قرآن، نهج‌البلاغه و صحیفه سجادیه",
    organizer: "سازمان اوقاف / حوزه علمیه قم",
    tier: "gold",
  },
  {
    id: "intl-ecro",
    name: "مسابقات قرآن سازمان فرهنگ و ارتباطات اسلامی (ایکرو)",
    organizer: "سازمان فرهنگ و ارتباطات اسلامی",
    tier: "gold",
  },
  {
    id: "intl-basij",
    name: "مسابقات بین‌المللی قرآن و عترت بصیرت (بسیج)",
    organizer: "سازمان بسیج مستضعفین",
    tier: "gold",
  },

  // ═══ 🟢 سطح نقره‌ای — کشوری ═══
  {
    id: "nat-oghaf",
    name: "مسابقات سراسری قرآن کریم (مرحله کشوری اوقاف)",
    organizer: "سازمان اوقاف و امور خیریه",
    tier: "silver",
  },
  {
    id: "nat-shohada",
    name: "مسابقات قرآن ویژه خانواده شهدا و ایثارگران (مرحله کشوری)",
    organizer: "بنیاد شهید و امور ایثارگران",
    tier: "silver",
  },
  {
    id: "nat-darolhafez",
    name: "مسابقات دارالحافظین کلام وحی",
    organizer: "حوزه‌های دارالحافظین",
    tier: "silver",
  },
  {
    id: "nat-azadi",
    name: "مسابقات سراسری قرآن آزادگان",
    organizer: "بنیاد آزادگان",
    tier: "silver",
  },
  {
    id: "nat-entekhab",
    name: "آزمون سراسری حفظ و مفاهیم قرآن (مؤسسه آفرینش)",
    organizer: "مؤسسه آفرینش",
    tier: "silver",
  },
  {
    id: "nat-razavi-local",
    name: "مسابقات قرآن خراسان رضوی / تحفیظ رضوی (مرحله نهایی)",
    organizer: "آستان قدس رضوی",
    tier: "silver",
  },

  // ═══ 🔴 سطح برنزی — استانی و منطقه‌ای ═══
  {
    id: "prov-oghaf",
    name: "مسابقات استانی قرآن کریم (مرحله استانی اوقاف)",
    organizer: "سازمان اوقاف — ادارات کل استانی",
    tier: "bronze",
  },
  {
    id: "prov-shohada",
    name: "مسابقات قرآن شهدای خدمت / خانواده شهدا (مرحله استانی)",
    organizer: "بنیاد شهید — ادارات کل استانی",
    tier: "bronze",
  },
  {
    id: "prov-basij",
    name: "مسابقات قرآن و عترت بصیرت (مرحله استانی بسیج)",
    organizer: "سازمان بسیج — استانی",
    tier: "bronze",
  },
  {
    id: "prov-darolhafez",
    name: "مسابقات دارالحافظین (مرحله استانی)",
    organizer: "حوزه‌های دارالحافظین — استانی",
    tier: "bronze",
  },
  {
    id: "prov-motagheddim",
    name: "مسابقات قرآن مقتدران / رویدادهای منطقه‌ای معتبر",
    organizer: "مراکز قرآنی منطقه‌ای معتبر",
    tier: "bronze",
  },
];

// پیدا کردن سطح بر اساس شناسه مسابقه
export function tierById(id: string): TrustedCompetition | null {
  return TRUSTED_COMPETITIONS.find((c) => c.id === id) ?? null;
}

// فهرست مرتب‌شده برای نمایش (طلایی → نقره‌ای → برنزی)
export const TRUSTED_BY_TIER = ["gold", "silver", "bronze"].map((tier) => ({
  tier,
  items: TRUSTED_COMPETITIONS.filter((c) => c.tier === tier),
}));
