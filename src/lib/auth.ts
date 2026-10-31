import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  // Prisma adapter requires a PostgreSQL/MySQL database for full functionality,
  // but we can use credentials provider with SQLite
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "ایمیل", type: "email" },
        password: { label: "رمز عبور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth] Missing credentials");
          return null;
        }

        // نرمال‌سازی: حذف فاصله/نیم‌فاصله/علامت‌های نامرئی و تبدیل ارقام فارسی
        const identifier = credentials.email
          .trim()
          .replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, "")
          .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
          .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

        console.log("[Auth] Attempting login for:", identifier);

        // ورود با ایمیل یا نام کاربری (شماره موبایل/تلگرام)
        let user = await db.user.findUnique({
          where: { email: identifier },
        });
        if (!user) {
          user = await db.user.findFirst({
            where: {
              OR: [
                { phone: identifier },
                { telegramId: identifier },
              ],
            },
          });
        }

        if (!user || !user.passwordHash) {
          console.log("[Auth] User not found or no password");
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        console.log("[Auth] Password valid:", isValid);

        if (!isValid) {
          return null;
        }

        // Update last visit
        await db.user.update({
          where: { id: user.id },
          data: { lastVisit: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id;

        // Fetch full user data from database
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatarUrl: true,
            avatarColor: true,
            age: true,
            gender: true,
            province: true,
            city: true,
            phone: true,
            telegramId: true,
            bio: true,
            education: true,
            referredBy: true,
            recitationType: true,
            reciterNationality: true,
            favoriteReciter: true,
            recitationSkills: true,
            interests: true,
            noorPoints: true,
            sessionsAttended: true,
            profileCompletion: true,
            streak: true,
          },
        });

        if (dbUser) {
          (session.user as any).dbUser = dbUser;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
};
