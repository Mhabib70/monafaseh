import { PrismaClient } from "@prisma/client";
async function main() {
  const db = new PrismaClient();
  const count = await db.ad.count();
  console.log("Ad count:", count);
  const first = await db.ad.findFirst();
  console.log("First ad title:", first?.title);
  await db.$disconnect();
}
main().catch(console.error);
