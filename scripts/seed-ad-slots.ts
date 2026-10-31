/* Seed all 12 ad slots with page/position/size/dimensions metadata.
 * Run with: bunx tsx scripts/seed-ad-slots.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const SLOTS = [
  // === صفحه اصلی (Landing) — 4 slots ===
  {
    id: "landing-top",
    page: "landing",
    pageLabel: "صفحه اصلی",
    position: "بالای صفحه — بین هرو و آمار",
    size: "leaderboard",
    width: 728,
    height: 90,
    enabled: true,
  },
  {
    id: "landing-mid-1",
    page: "landing",
    pageLabel: "صفحه اصلی",
    position: "وسط ۱ — بین آمار و دسترسی سریع",
    size: "rectangle",
    width: 300,
    height: 250,
    enabled: true,
  },
  {
    id: "landing-mid-2",
    page: "landing",
    pageLabel: "صفحه اصلی",
    position: "وسط ۲ — بین دسترسی سریع و آیه قرآن",
    size: "inline",
    width: 1000,
    height: 100,
    enabled: true,
  },
  {
    id: "landing-bottom",
    page: "landing",
    pageLabel: "صفحه اصلی",
    position: "پایین صفحه — بنر بزرگ",
    size: "billboard",
    width: 970,
    height: 250,
    enabled: true,
  },

  // === محافل زنده (Sessions) — 2 slots ===
  {
    id: "sessions-top",
    page: "sessions",
    pageLabel: "محافل زنده",
    position: "بالای لیست محافل",
    size: "leaderboard",
    width: 728,
    height: 90,
    enabled: true,
  },
  {
    id: "sessions-mid",
    page: "sessions",
    pageLabel: "محافل زنده",
    position: "بین لیست محافل و کاربران آنلاین",
    size: "rectangle",
    width: 300,
    height: 250,
    enabled: true,
  },

  // === چالش رقابت (Challenge) — 2 slots ===
  {
    id: "challenge-top",
    page: "challenge",
    pageLabel: "چالش رقابت",
    position: "بالای صفحه",
    size: "leaderboard",
    width: 728,
    height: 90,
    enabled: true,
  },
  {
    id: "challenge-mid",
    page: "challenge",
    pageLabel: "چالش رقابت",
    position: "بین «چطور کار می‌کند» و کاربران آنلاین",
    size: "rectangle",
    width: 300,
    height: 250,
    enabled: true,
  },

  // === تشکیل محفل (Create Session) — 1 slot ===
  {
    id: "create-session-side",
    page: "create-session",
    pageLabel: "تشکیل محفل",
    position: "ستون کناری — زیر کاربران آنلاین",
    size: "rectangle",
    width: 300,
    height: 250,
    enabled: true,
  },

  // === بلاگ (Blog) — 2 slots ===
  {
    id: "blog-top",
    page: "blog",
    pageLabel: "بلاگ",
    position: "بالای لیست پست‌ها",
    size: "leaderboard",
    width: 728,
    height: 90,
    enabled: true,
  },
  {
    id: "blog-mid",
    page: "blog",
    pageLabel: "بلاگ",
    position: "پایین لیست پست‌ها",
    size: "rectangle",
    width: 300,
    height: 250,
    enabled: true,
  },

  // === داشبورد (Dashboard) — 1 slot ===
  {
    id: "dashboard-bottom",
    page: "dashboard",
    pageLabel: "داشبورد",
    position: "پایین داشبورد",
    size: "rectangle",
    width: 300,
    height: 250,
    enabled: true,
  },
];

async function main() {
  console.log("Seeding ad slots...");
  // Clear existing
  await db.adSlot.deleteMany({});
  console.log(`Cleared existing slots.`);

  for (const slot of SLOTS) {
    await db.adSlot.create({ data: slot });
  }
  console.log(`✓ Seeded ${SLOTS.length} slots across 6 pages.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
