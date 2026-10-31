// تنظیم مشخصات ورود ادمین: نام کاربری (phone) + رمز عبور
// اجرا:  node scripts/set-admin-credentials.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const ADMIN_USERNAME = "47662244";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error("متغیر محیطی ADMIN_PASSWORD ست نشده است. مثال: ADMIN_PASSWORD=رمز node scripts/<script>");
  process.exit(1);
}

async function main() {
  // اگر کاربری با این نام کاربری هست از همان استفاده کن، وگرنه ادمین اصلی
  const byUsername = await db.user.findFirst({
    where: { OR: [{ phone: ADMIN_USERNAME }, { telegramId: ADMIN_USERNAME }] },
  });
  const target =
    byUsername ??
    (await db.user.findUnique({ where: { email: "admin@monafaseh.ir" } }));

  if (!target) {
    console.error("❌ کاربر ادمین پیدا نشد؛ اول seed-admin.mjs را اجرا کنید.");
    process.exit(1);
  }

  await db.user.update({
    where: { id: target.id },
    data: {
      phone: ADMIN_USERNAME,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
    },
  });

  console.log("✓ مشخصات ادمین تنظیم شد:");
  console.log("  نام کاربری:", ADMIN_USERNAME);
  console.log("  رمز عبور:", ADMIN_PASSWORD);
  console.log("  (ایمیل قبلی همچنان هم کار می‌کند:", target.email + ")");
}

main()
  .catch((e) => {
    console.error("❌ خطا:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
