import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/admin/ranking — رنکینگ کاربران بر اساس فعالیت
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const users = await db.user.findMany({
    select: {
      id: true, fullName: true, avatarColor: true, avatarUrl: true,
      gender: true, city: true, province: true,
      noorPoints: true, sessionsAttended: true, profileCompletion: true,
      streak: true, createdAt: true, lastVisit: true,
      _count: {
        select: {
          hostedSessions: true,
          loungeMessages: true,
          loungeMemberships: true,
        },
      },
    },
    orderBy: { noorPoints: "desc" },
    take: 100,
  });

  // Calculate activity score
  const ranked = users.map((u, idx) => {
    const activityScore =
      u.noorPoints * 2 +
      u.sessionsAttended * 10 +
      u._count.hostedSessions * 15 +
      u._count.loungeMessages * 3 +
      u._count.loungeMemberships * 5 +
      u.streak * 5 +
      u.profileCompletion;

    return {
      rank: idx + 1,
      id: u.id,
      fullName: u.fullName,
      avatarColor: u.avatarColor,
      avatarUrl: u.avatarUrl,
      gender: u.gender,
      city: u.city,
      province: u.province,
      noorPoints: u.noorPoints,
      sessionsAttended: u.sessionsAttended,
      hostedSessions: u._count.hostedSessions,
      loungeMessages: u._count.loungeMessages,
      loungeMemberships: u._count.loungeMemberships,
      streak: u.streak,
      profileCompletion: u.profileCompletion,
      activityScore,
      lastVisit: u.lastVisit.getTime(),
      createdAt: u.createdAt.getTime(),
    };
  });

  // Sort by activity score
  ranked.sort((a, b) => b.activityScore - a.activityScore);
  ranked.forEach((r, i) => (r.rank = i + 1));

  return NextResponse.json({ ok: true, ranking: ranked });
}
