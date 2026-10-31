import { db } from "../src/lib/db";

async function seed() {
  console.log("🌱 شروع seed دیتابیس...\n");

  // 1. ایجاد نشان‌ها
  console.log("📌 ایجاد نشان‌ها...");
  const badges = [
    { id: "first-step", title: "گام نخست", description: "اولین ورود به منافسه", icon: "sparkles", color: "#FFD700" },
    { id: "noor-seeker", title: "جویای نور", description: "شرکت در ۵ جلسه تلاوت", icon: "moon", color: "#87CEEB" },
    { id: "reciter", title: "تلاوت‌گر", description: "تلاوت در ۳ محفل عمومی", icon: "mic", color: "#FF7F7F" },
    { id: "moonlight", title: "نور مهتابی", description: "کسب ۱۰۰ امتیاز نور", icon: "star", color: "#7CFC00" },
    { id: "profile-complete", title: "پروفایل کامل", description: "تکمیل ۱۰۰٪ پروفایل", icon: "check", color: "#7CFC00" },
  ];

  for (const badge of badges) {
    await db.badge.upsert({
      where: { id: badge.id },
      update: {},
      create: badge,
    });
  }
  console.log(`  ✓ ${badges.length} نشان ایجاد شد\n`);

  // 2. ایجاد تالارهای گفتگو
  console.log("💬 ایجاد تالارهای گفتگو...");
  const lounges = [
    { name: "انجمن غلوش‌خوان‌ها", description: "تالار هواداران استاد راغب مصطفی غلوش. گفتگو درباره سبک، تقلید لحن، تبادل تجربه و دعوت به محافل تقلیدی.", category: "reciter-fans", icon: "mic", color: "#FFD700", tags: ["تقلید لحن", "تحقیق", "غیرایرانی", "غلوش"], relatedReciter: "راغب مصطفی غلوش" },
    { name: "مقلدان عبدالباسط", description: "عاشقان سبک استاد عبدالباسط عبدالصمد. تحلیل تلاوت‌ها، آموزش تقلید و برگزاری محافل ویژه.", category: "reciter-fans", icon: "mic", color: "#FF7F7F", tags: ["عبدالباسط", "تحقیق", "غیرایرانی", "تقلید"], relatedReciter: "عبدالباسط محمد عبدالصمد" },
    { name: "هواداران حاجی حسنی کارگر", description: "تالار طرفداران استاد محسن حاجی حسنی کارگر. بحث درباره تلاوت‌های منافسه‌ای، سبک و لحن مخصوص ایشان.", category: "reciter-fans", icon: "mic", color: "#7CFC00", tags: ["حاجی حسنی", "ایرانی", "تحقیق", "منافسه"], relatedReciter: "محسن حاجی حسنی کارگر" },
    { name: "مقلدان منشاوی", description: "عاشقان سبک استاد محمد صدیق منشاوی. آموزش، تقلید و تحلیل تلاوت‌های ایشان.", category: "reciter-fans", icon: "mic", color: "#9d4edd", tags: ["منشاوی", "تحقیق", "غیرایرانی", "تقلید"], relatedReciter: "محمد صدیق منشاوی" },
    { name: "تقلید مصطفی اسماعیل", description: "تالار مقلدان سبک استاد مصطفی اسماعیل. آموزش لحن، تمرین و تبادل تجربه.", category: "reciter-fans", icon: "mic", color: "#06d6a0", tags: ["مصطفی اسماعیل", "تحقیق", "غیرایرانی"], relatedReciter: "مصطفی اسماعیل" },
    { name: "اهل مقام حجاز", description: "عاشقان مقام حجاز. گفتگو درباره ریزه‌کاری‌های مقام، آموزش و تبادل تمرین.", category: "maqam-lovers", icon: "music", color: "#FFD700", tags: ["مقام حجاز", "لحن", "آموزش"], relatedMaqam: "hijaz" },
    { name: "مقام‌خوانان صبا", description: "تالار علاقمندان مقام صبا. تحلیل حال و هوای حزین، آموزش و تمرین.", category: "maqam-lovers", icon: "music", color: "#87CEEB", tags: ["مقام صبا", "لحن", "حزین"], relatedMaqam: "saba" },
    { name: "اهل نهاوند", description: "عاشقان مقام نهاوند. گفتگو درباره لطف و نرمی این مقام و آموزش آن.", category: "maqam-lovers", icon: "music", color: "#FF7F7F", tags: ["مقام نهاوند", "لحن", "نرم"], relatedMaqam: "nahawand" },
    { name: "قاریان تهران", description: "تالار قاریان شهر تهران. هماهنگی برای محافل حضوری، تبادل اطلاعات و دعوت به جلسات.", category: "city-group", icon: "map-pin", color: "#87CEEB", tags: ["تهران", "شهری", "محافل حضوری"], relatedCity: "تهران" },
    { name: "قاریان مشهد", description: "تالار قاریان شهر مشهد. هماهنگی برای محافل، آموزش و تبادل تجربه.", category: "city-group", icon: "map-pin", color: "#7CFC00", tags: ["مشهد", "شهری", "خراسان"], relatedCity: "مشهد" },
    { name: "حفاظ قرآن", description: "تالار حافظان قرآن. تبادل روش‌های حفظ، مرور، تثبیت و تجربه‌های موفق.", category: "skill-group", icon: "brain", color: "#9d4edd", tags: ["حفظ", "مرور", "تثبیت"] },
    { name: "آموزش تجوید", description: "تالار آموزش و یادگیری تجوید. سؤالات، پاسخ‌ها، تمرین و تبادل تجربه.", category: "skill-group", icon: "book-open", color: "#06d6a0", tags: ["تجوید", "آموزش", "مخارج"] },
    { name: "قاریان جوان", description: "تالار قاریان زیر ۲۵ سال. فضایی صمیمی برای جوانان، آموزش و رقابت دوستانه.", category: "age-group", icon: "users", color: "#7CFC00", tags: ["جوان", "زیر ۲۵", "آموزش"] },
    { name: "تالار عمومی منافسه", description: "تالار عمومی همه کاربران. اطلاعیه‌ها، پیشنهادها، گفتگوی آزاد و آشنایی.", category: "general", icon: "message-circle", color: "#FFD700", tags: ["عمومی", "اطلاعیه", "گفتگوی آزاد"] },
  ];

  for (const lounge of lounges) {
    await db.lounge.create({
      data: {
        ...lounge,
        tags: JSON.stringify(lounge.tags),
      },
    });
  }
  console.log(`  ✓ ${lounges.length} تالار ایجاد شد\n`);

  // 3. ایجاد آمار اولیه
  console.log("📊 ایجاد آمار اولیه...");
  await db.siteStats.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      totalUsers: 0,
      activeSessions: 0,
      totalRecitations: 0,
      totalTahmeeds: 0,
      onlineUsers: 0,
    },
  });
  console.log("  ✓ آمار اولیه ایجاد شد\n");

  console.log("✅ seed با موفقیت انجام شد!\n");
}

seed()
  .catch((e) => {
    console.error("❌ خطا در seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
