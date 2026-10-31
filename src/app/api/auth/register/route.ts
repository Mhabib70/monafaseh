import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

function generateToken(userId: string): string {
  const payload = `${userId}.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  return Buffer.from(payload).toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      fullName,
      age,
      gender,
      province,
      city,
      phone,
      email,
      password,
      telegramId,
      education,
      bio,
      referredBy,
      recitationType,
      reciterNationality,
      favoriteReciter,
      recitationSkills,
      interests,
      avatarUrl,
    } = body;

    if (!fullName || !email || !password || !phone) {
      return NextResponse.json(
        { ok: false, error: "نام، ایمیل، رمز عبور و شماره تماس الزامی هستند" },
        { status: 400 },
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "این ایمیل قبلاً ثبت شده است" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Calculate profile completion
    const fields = [
      { value: fullName, weight: 10 },
      { value: age, weight: 5 },
      { value: gender, weight: 5 },
      { value: province, weight: 5 },
      { value: city, weight: 5 },
      { value: email, weight: 8 },
      { value: phone, weight: 10 },
      { value: avatarUrl, weight: 12 },
      { value: recitationType, weight: 7 },
      { value: reciterNationality, weight: 5 },
      { value: favoriteReciter, weight: 5 },
      { value: recitationSkills?.length, weight: 8 },
      { value: interests?.length, weight: 5 },
      { value: bio, weight: 3 },
      { value: education, weight: 3 },
      { value: telegramId, weight: 2 },
      { value: referredBy, weight: 2 },
    ];

    let profileCompletion = 0;
    for (const f of fields) {
      if (f.value !== null && f.value !== undefined && f.value !== "" && f.value !== 0) {
        profileCompletion += f.weight;
      }
    }
    profileCompletion = Math.min(100, profileCompletion);

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        province: province || null,
        city: city || null,
        phone,
        telegramId: telegramId || null,
        education: education || null,
        bio: bio || null,
        referredBy: referredBy || null,
        recitationType: recitationType || null,
        reciterNationality: reciterNationality || null,
        favoriteReciter: favoriteReciter || null,
        recitationSkills: recitationSkills ? JSON.stringify(recitationSkills) : null,
        interests: interests ? JSON.stringify(interests) : null,
        avatarUrl: avatarUrl || null,
        avatarColor: ["#87CEEB", "#FFD700", "#FF7F7F", "#7CFC00", "#9d4edd", "#ff8c42", "#06d6a0"][
          Math.floor(Math.random() * 7)
        ],
        noorPoints: 25,
        profileCompletion,
      },
    });

    // Create first badge
    const firstBadge = await db.badge.upsert({
      where: { id: "first-step" },
      update: {},
      create: {
        id: "first-step",
        title: "گام نخست",
        description: "اولین ورود به منافسه",
        icon: "sparkles",
        color: "#FFD700",
      },
    });

    await db.userBadge.create({
      data: { userId: user.id, badgeId: firstBadge.id },
    });

    // Update site stats
    await db.siteStats.upsert({
      where: { id: "main" },
      update: { totalUsers: { increment: 1 } },
      create: { id: "main", totalUsers: 1 },
    });

    // Auto-login: create session
    const token = generateToken(user.id);
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
      recitationSkills: user.recitationSkills ? JSON.parse(user.recitationSkills) : [],
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

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در ثبت‌نام: " + (error as Error).message },
      { status: 500 },
    );
  }
}
