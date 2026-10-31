import { PrismaClient } from "@prisma/client";
async function main() {
  const db = new PrismaClient();
  const count = await db.adSlot.count();
  console.log("AdSlot count:", count);
  await db.$disconnect();
}
main().catch(console.error);
