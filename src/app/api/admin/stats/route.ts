import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/get-current-user";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const [
      totalUsers, adminCount, activeSessions, totalSessions,
      totalLounges, totalMessages, totalRecitations, totalTahmeeds, recentUsers,
      sessionsByType,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "admin" } }),
      db.recitationSession.count({ where: { status: "live" } }),
      db.recitationSession.count(),
      db.lounge.count(),
      db.loungeMessage.count(),
      db.recitationEntry.count(),
      db.tahmeed.count(),
      db.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      db.recitationSession.groupBy({ by: ["recitationType"], _count: true }),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers, adminCount, activeSessions, totalSessions, totalLounges,
        totalMessages, totalRecitations, totalTahmeeds, recentUsers,
        sessionsByType: sessionsByType.map((s) => ({ type: s.recitationType, count: s._count })),
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "خطا در دریافت آمار" }, { status: 500 });
  }
}
