import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/admin/online — کاربران آنلاین
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  // Users active in last 5 minutes
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const onlineUsers = await db.user.findMany({
    where: {
      lastVisit: { gte: fiveMinAgo },
    },
    select: {
      id: true, fullName: true, avatarColor: true, avatarUrl: true,
      gender: true, city: true, recitationType: true, noorPoints: true,
      lastVisit: true, verificationStatus: true, qariRank: true,
    },
    orderBy: { lastVisit: "desc" },
  });

  // Online lounge members
  const onlineLoungeMembers = await db.loungeMember.count({
    where: { isOnline: true },
  });

  return NextResponse.json({
    ok: true,
    online: onlineUsers.map((u) => ({
      ...u,
      lastVisit: u.lastVisit.getTime(),
    })),
    totalOnline: onlineUsers.length,
    onlineInLounges: onlineLoungeMembers,
  });
}
