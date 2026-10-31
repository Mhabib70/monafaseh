import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/stats — آمار واقعی سایت
export async function GET() {
  try {
    const [
      totalUsers,
      activeSessions,
      totalRecitations,
      totalTahmeeds,
      totalLounges,
      onlineUsers,
    ] = await Promise.all([
      db.user.count(),

      db.recitationSession.count({
        where: { status: "live" },
      }),

      db.recitationEntry.count({
        where: { passed: false },
      }),

      db.tahmeed.count(),

      db.lounge.count(),

      db.loungeMember.count({
        where: { isOnline: true },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers,
        activeSessions,
        totalRecitations,
        totalTahmeeds,
        totalLounges,
        onlineUsers,
      },
    });
  } catch (error) {
    console.error("Stats fetch error:", error);

    // Return fallback stats if database is empty
    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers: 0,
        activeSessions: 0,
        totalRecitations: 0,
        totalTahmeeds: 0,
        totalLounges: 0,
        onlineUsers: 0,
      },
    });
  }
}
