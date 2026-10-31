import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Generate a simple token
function generateToken(userId: string): string {
  const payload = `${userId}.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return Buffer.from(payload).toString("base64");
}

// ============================================================
// نرمال‌سازی نام کاربری/ایمیل ورودی
// کیبورد موبایل اغلب فاصله انتهایی، نیم‌فاصله (ZWNJ)، علامت‌های
// RTL یا ارقام فارسی/عربی اضافه می‌کند — همه پاک می‌شوند.
// ============================================================
function normalizeIdentifier(raw: string): string {
  return raw
    .trim()
    // نیم‌فاصله و کاراکترهای نامرئی جهت متن
    .replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, "")
    // ارقام فارسی → لاتین
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    // ارقام عربی → لاتین
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = normalizeIdentifier(String(body?.email ?? ""));
    const password = String(body?.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json(
        { ok: false, error: "ایمیل و رمز عبور الزامی است" },
        { status: 400 },
      );
    }

    console.log("[Auth] Login attempt for:", identifier);

    // ورود با ایمیل یا نام کاربری (شماره موبایل/تلگرام)
    let user = await db.user.findUnique({
      where: { email: identifier },
    });
    if (!user) {
      user = await db.user.findFirst({
        where: {
          OR: [{ phone: identifier }, { telegramId: identifier }],
        },
      });
    }

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { ok: false, error: "ایمیل یا رمز عبور اشتباه است" },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "ایمیل یا رمز عبور اشتباه است" },
        { status: 401 },
      );
    }

    // Update last visit
    await db.user.update({
      where: { id: user.id },
      data: { lastVisit: new Date() },
    });

    // Generate token
    const token = generateToken(user.id);

    // Store session in database
    await db.session.create({
      data: {
        sessionToken: token,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Get badges
    const badges = await db.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
    });

    const fullUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      age: user.age,
      gender: user.gender,
      province: user.province,
      city: user.city,
      phone: user.phone,
      telegramId: user.telegramId,
      avatarUrl: user.avatarUrl,
      avatarColor: user.avatarColor,
      bio: user.bio,
      education: user.education,
      referredBy: user.referredBy,
      recitationType: user.recitationType,
      reciterNationality: user.reciterNationality,
      favoriteReciter: user.favoriteReciter,
      recitationSkills: user.recitationSkills
        ? JSON.parse(user.recitationSkills)
        : [],
      interests: user.interests ? JSON.parse(user.interests) : [],
      stats: {
        noorPoints: user.noorPoints,
        sessionsAttended: user.sessionsAttended,
        profileCompletion: user.profileCompletion,
        streak: user.streak,
        badges: badges.map((ub) => ({
          id: ub.badge.id,
          title: ub.badge.title,
          description: ub.badge.description,
          icon: ub.badge.icon,
          color: ub.badge.color,
          earnedAt: ub.earnedAt.getTime(),
        })),
      },
      joinedAt: user.createdAt.getTime(),
    };

    const response = NextResponse.json({
      ok: true,
      user: fullUser,
    });

    response.cookies.set("monafaseh-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    console.log("[Auth] Login successful for:", user.fullName);
    return response;
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در ورود" },
      { status: 500 },
    );
  }
}
