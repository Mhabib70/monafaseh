import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/users/online — کاربران آنلاین (برای همه کاربران لاگین‌شده)
// این endpoint برای دعوت کاربران به محافل استفاده می‌شود
// برخلاف /api/admin/online، نیاز به ادمین بودن ندارد
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "ابتدا وارد شوید" },
        { status: 401 },
      );
    }

    // Users active in last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = await db.user.findMany({
      where: {
        lastVisit: { gte: fiveMinAgo },
        id: { not: user.id }, // Exclude self
      },
      select: {
        id: true,
        fullName: true,
        avatarColor: true,
        avatarUrl: true,
        gender: true,
        city: true,
        recitationType: true,
        noorPoints: true,
        lastVisit: true,
      },
      orderBy: { lastVisit: "desc" },
      take: 30, // Limit to 30 most recent
    });

    return NextResponse.json({
      ok: true,
      online: onlineUsers.map((u) => ({
        ...u,
        lastVisit: u.lastVisit.getTime(),
      })),
      totalOnline: onlineUsers.length,
    });
  } catch (error) {
    console.error("Online users fetch error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت کاربران آنلاین" },
      { status: 500 },
    );
  }
}
