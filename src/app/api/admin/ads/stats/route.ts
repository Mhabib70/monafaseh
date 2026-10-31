import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/admin/ads/stats — آمار کلی تبلیغات
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "دسترسی فقط برای ادمین" },
        { status: 403 },
      );
    }

    const allAds = await db.ad.findMany({
      select: {
        id: true,
        title: true,
        active: true,
        priority: true,
        impressions: true,
        clicks: true,
        createdAt: true,
        slot: true,
        theme: true,
      },
    });

    const totalAds = allAds.length;
    const activeAds = allAds.filter((a) => a.active).length;
    const totalImpressions = allAds.reduce((s, a) => s + a.impressions, 0);
    const totalClicks = allAds.reduce((s, a) => s + a.clicks, 0);
    const avgCtr =
      totalImpressions > 0
        ? ((totalClicks / totalImpressions) * 100).toFixed(2)
        : "0.00";

    // Top performing ads by CTR
    const withCtr = allAds.map((a) => ({
      ...a,
      ctr:
        a.impressions > 0
          ? parseFloat(((a.clicks / a.impressions) * 100).toFixed(2))
          : 0,
    }));
    const topByCtr = [...withCtr]
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 5);

    // Top by impressions
    const topByImpressions = [...allAds]
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5);

    return NextResponse.json({
      ok: true,
      stats: {
        totalAds,
        activeAds,
        pausedAds: totalAds - activeAds,
        totalImpressions,
        totalClicks,
        avgCtr: parseFloat(avgCtr),
      },
      topByCtr,
      topByImpressions,
      allAds: withCtr,
    });
  } catch (error) {
    console.error("Ad stats error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت آمار" },
      { status: 500 },
    );
  }
}
