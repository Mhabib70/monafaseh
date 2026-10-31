import { PrismaClient } from "@prisma/client";
async function main() {
  const db = new PrismaClient();
  const admin = await db.user.findFirst({
    where: { role: "admin" },
    select: { id: true, email: true, fullName: true },
  });
  console.log("Admin user:", admin);
  await db.$disconnect();
}
main().catch(console.error);
