import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/profile/[id] — پروفایل عمومی هر کاربر (بدون نیاز به لاگین)
// فقط اطلاعات عمومی؛ تلفن/ایمیل/اطلاعات بانکی هرگز برنمی‌گردند.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const u = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        avatarColor: true,
        gender: true,
        bio: true,
        city: true,
        province: true,
        education: true,
        honors: true,
        socialLinks: true,
        gallery: true,
        recitationType: true,
        favoriteReciter: true,
        recitationSkills: true,
        interests: true,
        qariRank: true,
        verificationStatus: true,
        verifiedAt: true,
        noorPoints: true,
        sessionsAttended: true,
        streak: true,
        isOfferingPrivateSessions: true,
        privateSessionPrice: true,
        lastVisit: true,
        createdAt: true,
      },
    });

    if (!u) {
      return NextResponse.json({ ok: false, error: "کاربر پیدا نشد" }, { status: 404 });
    }

    // مدارج تأییدشده از درخواست‌های approved
    const approvedRanks = await db.verificationRequest.findMany({
      where: { userId: id, status: "approved" },
      select: {
        requestType: true,
        competitionId: true,
        competitionYear: true,
        reviewedAt: true,
      },
      orderBy: { reviewedAt: "desc" },
    });

    const online = Date.now() - u.lastVisit.getTime() < 5 * 60 * 1000;

    let social: Record<string, string> = {};
    try {
      social = u.socialLinks ? JSON.parse(u.socialLinks) : {};
    } catch {}
    let gallery: { url: string; thumb: string }[] = [];
    try {
      gallery = u.gallery ? JSON.parse(u.gallery) : [];
    } catch {}
    let skills: string[] = [];
    try {
      skills = u.recitationSkills ? JSON.parse(u.recitationSkills) : [];
    } catch {}
    let interests: string[] = [];
    try {
      interests = u.interests ? JSON.parse(u.interests) : [];
    } catch {}

    return NextResponse.json({
      ok: true,
      profile: {
        id: u.id,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        avatarColor: u.avatarColor,
        gender: u.gender,
        bio: u.bio,
        city: u.city,
        province: u.province,
        education: u.education,
        honors: u.honors,
        recitationType: u.recitationType,
        favoriteReciter: u.favoriteReciter,
        social,
        gallery,
        skills,
        interests,
        qariRank: u.qariRank,
        verified: u.verificationStatus === "approved",
        verifiedAt: u.verifiedAt?.getTime() ?? null,
        online,
        stats: {
          noorPoints: u.noorPoints,
          sessionsAttended: u.sessionsAttended,
          streak: u.streak,
        },
        privateSession: u.isOfferingPrivateSessions
          ? { price: u.privateSessionPrice }
          : null,
        memberSince: u.createdAt.getTime(),
        ranks: approvedRanks,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}
