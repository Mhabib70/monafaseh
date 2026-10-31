// Create a session for admin user and print the cookie
import { PrismaClient } from "@prisma/client";
async function main() {
  const db = new PrismaClient();
  const admin = await db.user.findFirst({ where: { role: "admin" } });
  if (!admin) {
    console.log("No admin user");
    return;
  }
  const sessionToken = "test-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  await db.session.create({
    data: { sessionToken, userId: admin.id, expires },
  });
  console.log(sessionToken);
  await db.$disconnect();
}
main().catch(console.error);
