import { PrismaClient } from "@prisma/client";
async function main() {
  const db = new PrismaClient();
  const activeAds = await db.ad.findMany({
    where: { active: true },
    select: { id: true, title: true, slot: true, size: true, active: true },
  });
  console.log("Active ads:", activeAds.length);
  activeAds.slice(0, 5).forEach((a) =>
    console.log("  -", a.title, "| slot:", a.slot, "| size:", a.size),
  );
  const enabledSlots = await db.adSlot.findMany({
    where: { enabled: true },
    select: { id: true, assignedAdId: true },
  });
  console.log("Enabled slots:", enabledSlots.length);
  await db.$disconnect();
}
main().catch(console.error);
