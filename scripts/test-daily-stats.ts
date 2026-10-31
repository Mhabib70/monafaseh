import { PrismaClient } from "@prisma/client";
async function main() {
  const db = new PrismaClient();
  // Test AdDailyStat table
  const statCount = await db.adDailyStat.count();
  console.log("AdDailyStat count:", statCount);
  // Try creating one
  const firstAd = await db.ad.findFirst();
  if (firstAd) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const stat = await db.adDailyStat.upsert({
        where: { adId_date: { adId: firstAd.id, date: today } },
        create: { adId: firstAd.id, date: today, impressions: 1, clicks: 0 },
        update: { impressions: { increment: 1 } },
      });
      console.log("✓ AdDailyStat upsert works. Impressions:", stat.impressions);
    } catch (err: any) {
      console.log("✗ AdDailyStat error:", err.message);
    }
  }
  await db.$disconnect();
}
main().catch(console.error);
