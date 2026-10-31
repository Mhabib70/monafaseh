import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { db } from "@/lib/db";

// GET /api/admin/ads/analytics?days=30
// بازگشت داده‌های نمودار برای پنل تحلیلی.
// شامل:
//   • trend: آرایه‌ای از { date, impressions, clicks } برای هر روز در بازه.
//   • perAd: آرایه‌ای از { adId, title, impressions, clicks, ctr } برای هر تبلیغ.
//   • perSlot: آرایه‌ای از { slot, impressions, clicks } برای هر جایگاه.
//   • topPerformers: ۵ تبلیغ با بالاترین CTR.
//   • summary: آمار کلی بازه.
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "دسترسی فقط برای ادمین" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const clampedDays = Math.max(1, Math.min(365, days));

    const now = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (clampedDays - 1));
    start.setHours(0, 0, 0, 0);

    // Fetch daily stats in range
    const dailyStats = await db.adDailyStat.findMany({
      where: { date: { gte: start, lte: now } },
      include: {
        ad: {
          select: { id: true, title: true, slot: true, theme: true, active: true },
        },
      },
      orderBy: { date: "asc" },
    });

    // === Trend: aggregate by date ===
    const trendMap = new Map<string, { impressions: number; clicks: number }>();
    // Pre-fill all dates in range (even those with zero data) for a continuous chart.
    for (let i = 0; i < clampedDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      trendMap.set(key, { impressions: 0, clicks: 0 });
    }
    for (const s of dailyStats) {
      const key = s.date.toISOString().slice(0, 10);
      const existing = trendMap.get(key);
      if (existing) {
        existing.impressions += s.impressions;
        existing.clicks += s.clicks;
      }
    }
    const trend = Array.from(trendMap.entries()).map(([date, v]) => ({
      date,
      impressions: v.impressions,
      clicks: v.clicks,
      ctr:
        v.impressions > 0
          ? parseFloat(((v.clicks / v.impressions) * 100).toFixed(2))
          : 0,
    }));

    // === Per-ad: aggregate by ad ===
    const perAdMap = new Map<
      string,
      { adId: string; title: string; impressions: number; clicks: number }
    >();
    for (const s of dailyStats) {
      const key = s.adId;
      const existing = perAdMap.get(key);
      if (existing) {
        existing.impressions += s.impressions;
        existing.clicks += s.clicks;
      } else {
        perAdMap.set(key, {
          adId: s.adId,
          title: s.ad.title,
          impressions: s.impressions,
          clicks: s.clicks,
        });
      }
    }
    const perAd = Array.from(perAdMap.values())
      .map((a) => ({
        ...a,
        ctr:
          a.impressions > 0
            ? parseFloat(((a.clicks / a.impressions) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.impressions - a.impressions);

    // === Per-slot: aggregate by slot ===
    const perSlotMap = new Map<
      string,
      { slot: string; impressions: number; clicks: number }
    >();
    for (const s of dailyStats) {
      const slot = s.ad.slot || "general";
      const existing = perSlotMap.get(slot);
      if (existing) {
        existing.impressions += s.impressions;
        existing.clicks += s.clicks;
      } else {
        perSlotMap.set(slot, { slot, impressions: s.impressions, clicks: s.clicks });
      }
    }
    const perSlot = Array.from(perSlotMap.values()).sort(
      (a, b) => b.impressions - a.impressions,
    );

    // === Top performers by CTR (with at least 10 impressions) ===
    const topPerformers = perAd
      .filter((a) => a.impressions >= 10)
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 5);

    // === Summary ===
    const totalImpressions = trend.reduce((s, t) => s + t.impressions, 0);
    const totalClicks = trend.reduce((s, t) => s + t.clicks, 0);
    const avgCtr =
      totalImpressions > 0
        ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2))
        : 0;
    // Best day
    const bestDay = [...trend].sort((a, b) => b.clicks - a.clicks)[0];

    return NextResponse.json({
      ok: true,
      range: { days: clampedDays, start: start.toISOString(), end: now.toISOString() },
      trend,
      perAd,
      perSlot,
      topPerformers,
      summary: {
        totalImpressions,
        totalClicks,
        avgCtr,
        bestDay: bestDay
          ? { date: bestDay.date, clicks: bestDay.clicks, impressions: bestDay.impressions }
          : null,
      },
    });
  } catch (error) {
    console.error("Ad analytics error:", error);
    return NextResponse.json(
      { ok: false, error: "خطا در دریافت آمار" },
      { status: 500 },
    );
  }
}
