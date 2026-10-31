import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/auth/me — دریافت کاربر فعلی از cookie
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("monafaseh-token")?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "ورود نکرده‌اید" },
        { status: 401 },
      );
    }

    // Find session
    const session = await db.session.findUnique({
      where: { sessionToken: token },
      include: {
        user: {
          include: {
            badges: { include: { badge: true } },
          },
        },
      },
    });

    if (!session || session.expires < new Date()) {
      return NextResponse.json(
        { ok: false, error: "نشست منقضی شده" },
        { status: 401 },
      );
    }

    const user = session.user;

    // Refresh lastVisit so the user is counted as "online" by /api/admin/online
    // (which uses lastVisit within the last 5 minutes). Without this, a user
    // who reloads the page (auto-restore from cookie) wouldn't be online.
    await db.user.update({
      where: { id: user.id },
      data: { lastVisit: new Date() },
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
      // تیک آبی + امتیاز
      verificationStatus: user.verificationStatus ?? "none",
      qariRank: user.qariRank ?? null,
      creditBalance: user.creditBalance,
      stats: {
        noorPoints: user.noorPoints,
        sessionsAttended: user.sessionsAttended,
        profileCompletion: user.profileCompletion,
        streak: user.streak,
        badges: user.badges.map((ub: any) => ({
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

    return NextResponse.json({ ok: true, user: fullUser });
  } catch (error) {
    console.error("[Auth] Me error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت اطلاعات کاربر" },
      { status: 500 },
    );
  }
}
