// افزودن کاربر ادمین جدید: mhf13701013@gmail.com
// اجرا:  node scripts/add-admin.mjs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const ADMIN_EMAIL = "mhf13701013@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error("متغیر محیطی ADMIN_PASSWORD ست نشده است. مثال: ADMIN_PASSWORD=رمز node scripts/<script>");
  process.exit(1);
}

async function main() {
  const existing = await db.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    await db.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
        role: "admin",
      },
    });
    console.log("✓ کاربر موجود بود؛ رمز و نقش ادمین بازنشانی شد:", ADMIN_EMAIL);
  } else {
    await db.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
        fullName: "محمدحسین فلاح",
        role: "admin",
        province: "تهران",
        city: "تهران",
        recitationType: "ترتیل",
        reciterNationality: "iranian",
        avatarColor: "#FFD700",
      },
    });
    console.log("✓ ادمین جدید ایجاد شد:");
  }

  console.log("  ایمیل:", ADMIN_EMAIL);
  console.log("  رمز عبور:", ADMIN_PASSWORD);
  console.log("  نقش: admin");
}

main()
  .catch((e) => {
    console.error("❌ خطا:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
