// بازسازی حساب ادمین پس از ریست سندباکس
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const pass1 = await bcrypt.hash("Mhf#1370$Habib", 12);
  const pass2 = await bcrypt.hash("2610045761", 12);

  await db.user.upsert({
    where: { email: "mhf13701013@gmail.com" },
    update: { passwordHash: pass1, role: "admin" },
    create: {
      id: "admin-mhabib",
      email: "mhf13701013@gmail.com",
      phone: "09105912852",
      passwordHash: pass1,
      role: "admin",
      fullName: "محمد حبیب زاده فرد",
      age: 30,
      province: "تهران",
      city: "تهران",
      recitationType: "تحقیق",
      reciterNationality: "iranian",
      favoriteReciter: "مصطفی اسماعیل",
      recitationSkills: "",
      interests: "",
      verificationStatus: "verified",
      avatarColor: "#CDF138",
      creditBalance: 250,
      bio: "مدیر منافسه",
    },
  });

  await db.user.upsert({
    where: { email: "admin@monafaseh.ir" },
    update: { passwordHash: pass2, role: "admin" },
    create: {
      id: "admin-2",
      email: "admin@monafaseh.ir",
      phone: "09120000000",
      passwordHash: pass2,
      role: "admin",
      fullName: "مدیر منافسه",
      age: 30,
      province: "تهران",
      city: "تهران",
      recitationType: "ترتیل",
      reciterNationality: "iranian",
      favoriteReciter: "عبدالباسط",
      recitationSkills: "",
      interests: "",
      verificationStatus: "verified",
      avatarColor: "#FF6B4A",
      creditBalance: 250,
    },
  });

  console.log("✅ admin accounts ready");
}

main().finally(() => db.$disconnect());
