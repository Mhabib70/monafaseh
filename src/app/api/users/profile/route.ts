import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/users/profile
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "ابتدا وارد شوید" },
        { status: 401 },
      );
    }

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: { badges: { include: { badge: true } } },
    });

    if (!fullUser) {
      return NextResponse.json(
        { ok: false, error: "کاربر پیدا نشد" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: fullUser.id,
        fullName: fullUser.fullName,
        email: fullUser.email,
        role: fullUser.role,
        age: fullUser.age,
        gender: fullUser.gender,
        province: fullUser.province,
        city: fullUser.city,
        phone: fullUser.phone,
        telegramId: fullUser.telegramId,
        avatarUrl: fullUser.avatarUrl,
        avatarColor: fullUser.avatarColor,
        bio: fullUser.bio,
        education: fullUser.education,
        referredBy: fullUser.referredBy,
        recitationType: fullUser.recitationType,
        reciterNationality: fullUser.reciterNationality,
        favoriteReciter: fullUser.favoriteReciter,
        recitationSkills: fullUser.recitationSkills ? JSON.parse(fullUser.recitationSkills) : [],
        interests: fullUser.interests ? JSON.parse(fullUser.interests) : [],
        stats: {
          noorPoints: fullUser.noorPoints,
          sessionsAttended: fullUser.sessionsAttended,
          profileCompletion: fullUser.profileCompletion,
          streak: fullUser.streak,
          badges: fullUser.badges.map((ub) => ({
            id: ub.badge.id,
            title: ub.badge.title,
            description: ub.badge.description,
            icon: ub.badge.icon,
            color: ub.badge.color,
            earnedAt: ub.earnedAt.getTime(),
          })),
        },
        joinedAt: fullUser.createdAt.getTime(),
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت پروفایل" },
      { status: 500 },
    );
  }
}
