// بازنشانی کامل کاربران:
//   ۱) حذف همه داده‌های وابسته به کاربر (محفل‌ها، نشست‌ها، تراکنش‌ها، ...)
//   ۲) حذف همه کاربران
//   ۳) ساخت یک حساب ادمین واحد که با نام کاربری/رمز مشترک وارد می‌شود
// اجرا:  node scripts/reset-admin.mjs
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
  console.log("🧹 حذف داده‌های وابسته به کاربران...");

  // محفل‌ها اول (رابطه host بدون Cascade است) — بقیه با حذف کاربران پاک می‌شوند
  await db.recitationSession.deleteMany({});

  await db.user.deleteMany({});
  console.log("✓ همه کاربران و داده‌های وابسته حذف شدند");

  console.log("👑 ساخت حساب ادمین واحد...");
  await db.user.create({
    data: {
      email: ADMIN_USERNAME, // ورود مستقیم با نام کاربری
      phone: ADMIN_USERNAME, // پشتیبانی از ورود با «ایمیل یا موبایل»
      telegramId: ADMIN_USERNAME,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      fullName: "مدیر منافسه",
      role: "admin",
      province: "تهران",
      city: "تهران",
      recitationType: "ترتیل",
      reciterNationality: "iranian",
      avatarColor: "#FFD700",
    },
  });

  console.log("✓ حساب ادمین ساخته شد:");
  console.log("  نام کاربری:", ADMIN_USERNAME);
  console.log("  رمز عبور: ", ADMIN_PASSWORD);
  console.log("  نقش: admin");
  console.log("  (این حساب مشترک است — همه با همین مشخصات وارد می‌شوند)");
}

main()
  .catch((e) => {
    console.error("❌ خطا:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
