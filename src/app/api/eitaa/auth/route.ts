import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateEitaaInitData } from "@/lib/eitaa/validate";

// ============================================================
// POST /api/eitaa/auth — ورود یکپارچه با حساب ایتا
// کلاینت initData را از SDK می‌گیرد و می‌فرستد؛ سرور امضای hash
// را با توکن برنامه بررسی می‌کند و اگر کاربر به حساب منافسه متصل
// بود، نشست می‌سازد. در غیر این صورت کلاینت اتصال حساب را پیش می‌برد.
// ============================================================

function generateToken(userId: string): string {
  const payload = `${userId}.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return Buffer.from(payload).toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const initData = String(body?.initData ?? "");
    const botToken = process.env.BOT_TOKEN ?? "";

    if (!botToken) {
      return NextResponse.json(
        { ok: false, error: "توکن برنامه ایتا روی سرور تنظیم نشده است" },
        { status: 501 },
      );
    }

    const result = validateEitaaInitData(initData, botToken);
    if (!result.ok || !result.user) {
      return NextResponse.json(
        { ok: false, error: result.reason ?? "داده ایتا نامعتبر است" },
        { status: 401 },
      );
    }

    const eitaaUser = result.user;

    const dbUser = await db.user.findUnique({
      where: { eitaaId: eitaaUser.id },
    });

    if (!dbUser) {
      // حساب ایتا به هیچ حساب منافسه‌ای متصل نیست
      return NextResponse.json({
        ok: true,
        linked: false,
        eitaaUser: {
          id: eitaaUser.id,
          firstName: eitaaUser.firstName,
          lastName: eitaaUser.lastName,
        },
      });
    }

    // ورود موفق — ساخت نشست ۳۰ روزه (همان سازوکار login)
    await db.user.update({
      where: { id: dbUser.id },
      data: { lastVisit: new Date() },
    });
    const token = generateToken(dbUser.id);
    await db.session.create({
      data: {
        sessionToken: token,
        userId: dbUser.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const badges = await db.userBadge.findMany({
      where: { userId: dbUser.id },
      include: { badge: true },
    });

    const fullUser = {
      id: dbUser.id,
      fullName: dbUser.fullName,
      email: dbUser.email,
      role: dbUser.role,
      age: dbUser.age,
      gender: dbUser.gender,
      province: dbUser.province,
      city: dbUser.city,
      phone: dbUser.phone,
      telegramId: dbUser.telegramId,
      avatarUrl: dbUser.avatarUrl,
      avatarColor: dbUser.avatarColor,
      bio: dbUser.bio,
      education: dbUser.education,
      referredBy: dbUser.referredBy,
      recitationType: dbUser.recitationType,
      reciterNationality: dbUser.reciterNationality,
      favoriteReciter: dbUser.favoriteReciter,
      recitationSkills: dbUser.recitationSkills
        ? JSON.parse(dbUser.recitationSkills)
        : [],
      interests: dbUser.interests ? JSON.parse(dbUser.interests) : [],
      stats: {
        noorPoints: dbUser.noorPoints,
        sessionsAttended: dbUser.sessionsAttended,
        profileCompletion: dbUser.profileCompletion,
        streak: dbUser.streak,
        badges: badges.map((ub) => ({
          id: ub.badge.id,
          title: ub.badge.title,
          description: ub.badge.description,
          icon: ub.badge.icon,
          color: ub.badge.color,
          earnedAt: ub.earnedAt.getTime(),
        })),
      },
      joinedAt: dbUser.createdAt.getTime(),
    };

    const response = NextResponse.json({
      ok: true,
      linked: true,
      user: fullUser,
    });
    response.cookies.set("monafaseh-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("[Eitaa] auth error:", error);
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}
